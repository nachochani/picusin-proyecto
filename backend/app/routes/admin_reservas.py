
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
    reservas = db.query(Reservation).all()
    return reservas


@router.put("/reservas/{id}/estado")
def update_estado_reserva(
    id: int,
    estado: str,
    db: Session = Depends(get_db)
):
    reserva = db.query(Reservation).filter(
        Reservation.id == id
    ).first()

    if not reserva:
        raise HTTPException(
            status_code=404,
            detail="Reserva no encontrada"
        )

    estados_validos = [
        EstadoReservation.pendiente.value,
        EstadoReservation.confirmada.value,
        EstadoReservation.cancelada.value
    ]

    if estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail="Estado no válido"
        )

    estado_anterior = (
        reserva.estado.value
        if hasattr(reserva.estado, "value")
        else reserva.estado
    )

    if estado_anterior == EstadoReservation.cancelada.value:
        if estado != EstadoReservation.cancelada.value:
            raise HTTPException(
                status_code=400,
                detail="No se puede reactivar una reserva cancelada"
            )

        return {
            "mensaje": "La reserva ya estaba cancelada",
            "id": reserva.id,
            "estado": estado_anterior
        }

    try:
        producto = db.query(Product).filter(
            Product.id == reserva.product_id
        ).with_for_update().first()

        reserva.estado = EstadoReservation(estado)

        if estado == EstadoReservation.cancelada.value and producto:
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
                    EstadoReservation.confirmada
                ])
            ).first()

            if (
                producto.estado == EstadoProducto.reservado
                and not subasta_bloqueante
                and not otra_reserva
            ):
                producto.estado = EstadoProducto.disponible

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
