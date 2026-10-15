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
            "precio": reserva.product.precio,
            "monto_senia": reserva.monto_senia,
            "estado": reserva.estado.value,
            "estado_producto": reserva.product.estado.value,
            "creado_en": reserva.creado_en
        }
        for reserva in reservas
    ]


