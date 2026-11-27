
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.reservation import Reservation, EstadoReservation
from app.models.product import Product, EstadoProducto
from app.models.auction import Auction, EstadoAuction
from app.security import get_current_admin


router = APIRouter(
    dependencies=[Depends(get_current_admin)]
)


@router.get("/reservas")
def get_reservas(db: Session = Depends(get_db)):
    reservas = (
        db.query(Reservation)
        .order_by(Reservation.creado_en.desc())
        .all()
    )

    return [
        {
            "id": reserva.id,
            "user_id": reserva.user_id,
            "usuario": (
                f"{reserva.user.nombre} {reserva.user.apellido}"
            ),
            "product_id": reserva.product_id,
            "producto": reserva.product.nombre,
            "precio_total": reserva.precio_total,
            "monto_senia": reserva.monto_senia,
            "saldo_restante": round(
                reserva.precio_total - reserva.monto_senia, 2
            ),
            "senia_pagada": reserva.senia_pagada,
            "saldo_pagado": reserva.saldo_pagado,
            "estado": reserva.estado.value,
            "comprobante_url": reserva.comprobante_url,
            "comprobante_saldo_url": reserva.comprobante_saldo_url,
            "creado_en": reserva.creado_en
        }
        for reserva in reservas
    ]

@router.put("/reservas/{id}/estado")
def update_estado_reserva(
    id: int,
    estado: str,
    db: Session = Depends(get_db)
):
    reserva = db.query(Reservation).filter(
        Reservation.id == id
    ).with_for_update().first()

    if not reserva:
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada"
        )

    try:
        nuevo_estado = EstadoReservation(estado)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Estado no válido"
        )

    estado_anterior = reserva.estado

    if estado_anterior == nuevo_estado:
        return {
            "mensaje": "La reserva ya tiene ese estado",
            "id": reserva.id,
            "estado": reserva.estado.value
        }

    transiciones_validas = {
        EstadoReservation.pendiente: [
            EstadoReservation.cancelada
        ],
        EstadoReservation.confirmada: [
            EstadoReservation.solicitada
        ],
        EstadoReservation.solicitada: [
            EstadoReservation.recibida
        ],
        EstadoReservation.recibida: [
            EstadoReservation.enviada
        ],
        EstadoReservation.enviada: [
            EstadoReservation.entregada
        ],
        EstadoReservation.entregada: [],
        EstadoReservation.cancelada: []
    }

    if nuevo_estado not in transiciones_validas.get(
        estado_anterior, []
    ):
        raise HTTPException(
            status_code=400,
            detail="No se permite ese cambio de estado"
        )

    if nuevo_estado == EstadoReservation.enviada:
        if not reserva.senia_pagada or not reserva.saldo_pagado:
            raise HTTPException(
                status_code=400,
                detail="No se puede enviar un producto sin confirmar todos los pagos"
            )

    if nuevo_estado == EstadoReservation.cancelada:
        if reserva.senia_pagada or reserva.saldo_pagado:
            raise HTTPException(
                status_code=400,
                detail="No se puede cancelar una reserva con pagos confirmados"
            )

    try:
        producto = db.query(Product).filter(
            Product.id == reserva.product_id
        ).with_for_update().first()

        reserva.estado = nuevo_estado

        if nuevo_estado == EstadoReservation.cancelada and producto:

            subasta_bloqueante = db.query(Auction).filter(
                Auction.product_id == producto.id,
                (
                    (Auction.estado == EstadoAuction.activa)
                    | (
                        (Auction.estado == EstadoAuction.finalizada)
                        & (Auction.ganador_id.isnot(None))
                    )
                )
            ).first()

            otra_reserva = db.query(Reservation).filter(
                Reservation.product_id == producto.id,
                Reservation.id != reserva.id,
                Reservation.estado.in_([
                    EstadoReservation.pendiente,
                    EstadoReservation.confirmada,
                    EstadoReservation.solicitada,
                    EstadoReservation.recibida,
                    EstadoReservation.enviada
                ])
            ).first()

            if (
                producto.estado == EstadoProducto.reservado
                and not subasta_bloqueante
                and not otra_reserva
            ):
                producto.estado = EstadoProducto.disponible

        if nuevo_estado == EstadoReservation.enviada and producto:
            producto.estado = EstadoProducto.vendido
            producto.stock = 0

        db.commit()
        db.refresh(reserva)

        return {
            "mensaje": "Estado de reserva actualizado correctamente",
            "id": reserva.id,
            "estado": reserva.estado.value
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar el estado de la reserva"
        )
