from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reservation import Reservation
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

    estados_validos = ["pendiente", "confirmada", "cancelada"]

    if estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail="Estado no valido"
        )

    reserva.estado = estado

    db.commit()
    db.refresh(reserva)

    return reserva
