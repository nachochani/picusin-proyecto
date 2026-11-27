from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reservation import Reservation, EstadoReservation
from app.models.product import Product, EstadoProducto
from app.models.user import User
from app.security import get_current_user
from app.models.auction import Auction, EstadoAuction

router = APIRouter()


@router.post("/reservation")
def crear_reserva(
    product_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user)
):
    producto_existente = db.query(Product).filter(
        Product.id == product_id
    ).with_for_update().first()

    if not producto_existente:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    if not producto_existente.activo:
        raise HTTPException(
            status_code=400,
            detail="El producto no está activo"
        )

    if not producto_existente.es_novedad:
        raise HTTPException(
            status_code=400,
            detail="Este producto no admite reservas"
        )

    subasta_bloqueante = db.query(Auction).filter(
        Auction.product_id == product_id,
        (
            (Auction.estado == EstadoAuction.activa)
            | (
                (Auction.estado == EstadoAuction.finalizada)
                & (Auction.ganador_id.isnot(None))
            )
        )
    ).first()

    if subasta_bloqueante:
        raise HTTPException(
            status_code=400,
            detail="El producto está bloqueado por una subasta"
        )

    if producto_existente.estado != EstadoProducto.disponible:
        raise HTTPException(
            status_code=400,
            detail="El producto no está disponible"
        )

    if producto_existente.stock != 0:
        raise HTTPException(
            status_code=400,
            detail="El stock del producto no corresponde a una novedad disponible"
        )

    reserva_activa = db.query(Reservation).filter(
        Reservation.product_id == product_id,
        Reservation.estado.in_([
            EstadoReservation.pendiente,
            EstadoReservation.confirmada,
            EstadoReservation.solicitada,
            EstadoReservation.recibida,
            EstadoReservation.enviada
        ])
    ).first()

    if reserva_activa:
        raise HTTPException(
            status_code=400,
            detail="El producto ya tiene una reserva vigente"
        )

    precio_total = round(producto_existente.precio, 2)
    monto_senia = round(precio_total * 0.10, 2)
    saldo_restante = round(precio_total - monto_senia, 2)

    try:
        nueva_reserva = Reservation(
            user_id=usuario.id,
            product_id=product_id,
            precio_total=precio_total,
            monto_senia=monto_senia,
            senia_pagada=False,
            saldo_pagado=False,
            estado=EstadoReservation.pendiente
        )

        producto_existente.estado = EstadoProducto.reservado

        db.add(nueva_reserva)
        db.commit()
        db.refresh(nueva_reserva)

        return {
            "mensaje": "Reserva creada correctamente",
            "id": nueva_reserva.id,
            "precio_total": precio_total,
            "monto_senia": monto_senia,
            "saldo_restante": saldo_restante,
            "estado": nueva_reserva.estado.value
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo crear la reserva"
        )


@router.get("/mis-reservas")
def obtener_mis_reservas(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user)
):
    reservas = (
        db.query(Reservation)
        .filter(Reservation.user_id == usuario.id)
        .order_by(Reservation.creado_en.desc())
        .all()
    )

    return [
        {
            "id": reserva.id,
            "product_id": reserva.product_id,
            "producto": reserva.product.nombre,
            "imagen": reserva.product.imagen,
            "precio": reserva.precio_total,
            "precio_total": reserva.precio_total,
            "monto_senia": reserva.monto_senia,
            "saldo_restante": round(
                reserva.precio_total - reserva.monto_senia, 2
            ),
            "senia_pagada": reserva.senia_pagada,
            "saldo_pagado": reserva.saldo_pagado,
            "comprobante_url": reserva.comprobante_url,
            "comprobante_saldo_url": reserva.comprobante_saldo_url,
            "estado": reserva.estado.value,
            "estado_producto": reserva.product.estado.value,
            "puede_pagar_saldo": (
                reserva.estado == EstadoReservation.recibida
                and reserva.senia_pagada
                and not reserva.saldo_pagado
            ),
            "creado_en": reserva.creado_en
        }
        for reserva in reservas
    ]
