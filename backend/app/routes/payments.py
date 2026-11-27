from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.payment import TipoPago
from app.security import get_current_user

from app.services.payment_service import (
    procesar_pago_reserva
)


router = APIRouter()


@router.post("/pagos/demo/reserva/{reservation_id}")
def pagar_reserva_demo(
    reservation_id: int,
    tipo: TipoPago,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user)
):
    return procesar_pago_reserva(
        db=db,
        user_id=usuario.id,
        reservation_id=reservation_id,
        tipo=tipo
    )