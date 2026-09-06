from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reservation import Reservation
from app.models.product import Product, EstadoProducto

router = APIRouter()

@router.post("/reservation")
def crear_reserva(user_id: int, product_id: int, db: Session= Depends(get_db)):

    producto_existente = db.query(Product).filter(Product.id == product_id).first()
    if not producto_existente:
        raise HTTPException(status_code = 400, detail = "Producto no encontrado")

    if producto_existente.estado != EstadoProducto.disponible:
        raise HTTPException(status_code = 400, detail = "El producto no esta disponible")

    monto_senia = producto_existente.precio * 0.10

    producto_existente.estado = EstadoProducto.reservado
    db.commit()

    nueva_reserva = Reservation(
        user_id = user_id,
        product_id = product_id,
        monto_senia = monto_senia
    )

    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)

    return (f"Reserva creada correctamente, id: {nueva_reserva.id}")

@router.get("/reservaciones/{user_id}")
def get_reservaciones(user_id: int, db: Session = Depends(get_db)):
    reservaciones = db.query(Reservation).filter(Reservation.user_id == user_id).all()
    if not reservaciones:
        raise HTTPException(status_code=404, detail="No se encontraron reservaciones para este usuario")
    return reservaciones

