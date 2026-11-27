import os
from uuid import uuid4
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.payment import (
    Payment,
    TipoPago,
    EstadoPago,
    MetodoPago
)

from app.models.reservation import (
    Reservation,
    EstadoReservation
)


def verificar_modo_demo():
    if os.getenv("MODO_PAGO", "").strip().lower() != "demo":
        raise HTTPException(
            status_code=403,
            detail="Los pagos simulados están deshabilitados"
        )


def convertir_monto(monto):
    return Decimal(str(monto)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP
    )

def registrar_pago_pedido(
    db: Session,
    user_id: int,
    order_id: int,
    monto,
    tipo: TipoPago
):
    verificar_modo_demo()

    if tipo not in (TipoPago.compra, TipoPago.subasta):
        raise HTTPException(
            status_code=400,
            detail="Tipo de pago no válido para un pedido"
        )

    monto = convertir_monto(monto)

    if monto < 0:
        raise HTTPException(
            status_code=400,
            detail="El importe del pago no es válido"
        )

    pago_existente = db.query(Payment).filter(
        Payment.order_id == order_id,
        Payment.estado == EstadoPago.aprobado
    ).first()

    if pago_existente:
        raise HTTPException(
            status_code=400,
            detail="Este pedido ya fue abonado"
        )

    nuevo_pago = Payment(
        user_id=user_id,
        order_id=order_id,
        tipo=tipo,
        monto=monto,
        estado=EstadoPago.aprobado,
        metodo=MetodoPago.demo,
        referencia_externa=f"DEMO-{uuid4().hex}",
        aprobado_en=datetime.now()
    )

    db.add(nuevo_pago)
    db.flush()

    return nuevo_pago

def procesar_pago_reserva(
    db: Session,
    user_id: int,
    reservation_id: int,
    tipo: TipoPago
):
    verificar_modo_demo()

    if tipo not in (TipoPago.senia, TipoPago.saldo):
        raise HTTPException(
            status_code=400,
            detail="Tipo de pago no válido para una reserva"
        )

    try:
        reserva = (
            db.query(Reservation)
            .filter(
                Reservation.id == reservation_id,
                Reservation.user_id == user_id
            )
            .with_for_update()
            .first()
        )

        if not reserva:
            raise HTTPException(
                status_code=404,
                detail="Reserva no encontrada"
            )

        if reserva.estado == EstadoReservation.cancelada:
            raise HTTPException(
                status_code=400,
                detail="La reserva está cancelada"
            )

        pago_existente = db.query(Payment).filter(
            Payment.reservation_id == reserva.id,
            Payment.tipo == tipo,
            Payment.estado == EstadoPago.aprobado
        ).first()

        if pago_existente:
            raise HTTPException(
                status_code=400,
                detail="Este pago ya fue realizado"
            )

        # PAGO DE SEÑA
        if tipo == TipoPago.senia:

            if reserva.senia_pagada:
                raise HTTPException(
                    status_code=400,
                    detail="La seña ya fue abonada"
                )

            if reserva.estado != EstadoReservation.pendiente:
                raise HTTPException(
                    status_code=400,
                    detail="La reserva no está pendiente de pago"
                )

            monto = convertir_monto(
                reserva.monto_senia
            )

        # PAGO DE SALDO
        else:

            if reserva.saldo_pagado:
                raise HTTPException(
                    status_code=400,
                    detail="El saldo ya fue abonado"
                )

            if not reserva.senia_pagada:
                raise HTTPException(
                    status_code=400,
                    detail="Primero debe abonarse la seña"
                )

            if reserva.estado != EstadoReservation.recibida:
                raise HTTPException(
                    status_code=400,
                    detail="El producto todavía no está listo para el pago del saldo"
                )

            monto = (
                convertir_monto(reserva.precio_total)
                - convertir_monto(reserva.monto_senia)
            )

        if monto < 0:
            raise HTTPException(
                status_code=400,
                detail="El importe del pago no es válido"
            )

        # Registrar el pago simulado
        nuevo_pago = Payment(
            user_id=user_id,
            reservation_id=reserva.id,
            tipo=tipo,
            monto=monto,
            estado=EstadoPago.aprobado,
            metodo=MetodoPago.demo,
            referencia_externa=f"DEMO-{uuid4().hex}",
            aprobado_en=datetime.now()
        )

        db.add(nuevo_pago)

        # Actualizar automáticamente la reserva
        if tipo == TipoPago.senia:
            reserva.senia_pagada = True
            reserva.estado = EstadoReservation.confirmada

        elif tipo == TipoPago.saldo:
            reserva.saldo_pagado = True

        db.flush()

        respuesta = {
            "mensaje": "Pago simulado aprobado correctamente",
            "pago_id": nuevo_pago.id,
            "reserva_id": reserva.id,
            "tipo": nuevo_pago.tipo.value,
            "monto": float(nuevo_pago.monto),
            "estado_pago": nuevo_pago.estado.value,
            "referencia": nuevo_pago.referencia_externa,
            "estado_reserva": reserva.estado.value,
            "senia_pagada": reserva.senia_pagada,
            "saldo_pagado": reserva.saldo_pagado
        }

        db.commit()

        return respuesta

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo procesar el pago"
        )