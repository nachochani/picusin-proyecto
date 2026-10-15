from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reservation import Reservation
from app.models.product import Product, EstadoProducto
from app.models.user import User
from app.security import get_current_user

router = APIRouter()



@router.post("/reservation")
def crear_reserva(
    product_id: int,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user)
):
    producto_existente = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not producto_existente:
        raise HTTPException(
            status_code=400,
            detail="Producto no encontrado"
        )

    if producto_existente.estado != EstadoProducto.disponible:
        raise HTTPException(
            status_code=400,
            detail="El producto no está disponible"
        )

    monto_senia = producto_existente.precio * 0.10

    try:
        nueva_reserva = Reservation(
            user_id=usuario.id,
            product_id=product_id,
            monto_senia=monto_senia
        )

        producto_existente.estado = EstadoProducto.reservado

        db.add(nueva_reserva)
        db.commit()
        db.refresh(nueva_reserva)

        return {
            "mensaje": "Reserva creada correctamente",
            "id": nueva_reserva.id
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo crear la reserva"
        )


@router.get("/reservaciones/{user_id}")
def get_reservaciones(user_id: int, db: Session = Depends(get_db)):
    reservaciones = db.query(Reservation).filter(Reservation.user_id == user_id).all()
    if not reservaciones:
        raise HTTPException(status_code=404, detail="No se encontraron reservaciones para este usuario")
    return reservaciones

