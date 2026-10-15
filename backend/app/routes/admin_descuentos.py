from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.discount_code import Discount_code
from app.security import get_current_admin


router = APIRouter(
    dependencies=[Depends(get_current_admin)]
)


@router.get("/descuentos")
def get_descuentos(db: Session = Depends(get_db)):
    descuentos = db.query(Discount_code).order_by(
        Discount_code.id.desc()
    ).all()

    return descuentos


@router.post("/descuentos")
def crear_descuento(
    codigo: str,
    porcentaje: float,
    db: Session = Depends(get_db)
):
    codigo = codigo.strip().upper()

    if not codigo:
        raise HTTPException(
            status_code=400,
            detail="El código no puede estar vacío"
        )

    if porcentaje <= 0 or porcentaje > 100:
        raise HTTPException(
            status_code=400,
            detail="El porcentaje debe ser mayor que 0 y menor o igual a 100"
        )

    existente = db.query(Discount_code).filter(
        Discount_code.codigo == codigo
    ).first()

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un código con ese nombre"
        )

    nuevo_descuento = Discount_code(
        codigo=codigo,
        porcentaje=porcentaje,
        activo=True
    )

    db.add(nuevo_descuento)
    db.commit()
    db.refresh(nuevo_descuento)

    return nuevo_descuento


@router.put("/descuentos/{id}")
def actualizar_descuento(
    id: int,
    codigo: str,
    porcentaje: float,
    db: Session = Depends(get_db)
):
    descuento = db.query(Discount_code).filter(
        Discount_code.id == id
    ).first()

    if not descuento:
        raise HTTPException(
            status_code=404,
            detail="Código de descuento no encontrado"
        )

    codigo = codigo.strip().upper()

    if not codigo:
        raise HTTPException(
            status_code=400,
            detail="El código no puede estar vacío"
        )

    if porcentaje <= 0 or porcentaje > 100:
        raise HTTPException(
            status_code=400,
            detail="El porcentaje debe ser mayor que 0 y menor o igual a 100"
        )

    existente = db.query(Discount_code).filter(
        Discount_code.codigo == codigo,
        Discount_code.id != id
    ).first()

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Ya existe otro código con ese nombre"
        )

    descuento.codigo = codigo
    descuento.porcentaje = porcentaje

    db.commit()
    db.refresh(descuento)

    return descuento


@router.put("/descuentos/{id}/estado")
def actualizar_estado_descuento(
    id: int,
    activo: bool,
    db: Session = Depends(get_db)
):
    descuento = db.query(Discount_code).filter(
        Discount_code.id == id
    ).first()

    if not descuento:
        raise HTTPException(
            status_code=404,
            detail="Código de descuento no encontrado"
        )

    descuento.activo = activo

    db.commit()
    db.refresh(descuento)

    return descuento


@router.delete("/descuentos/{id}")
def eliminar_descuento(
    id: int,
    db: Session = Depends(get_db)
):
    descuento = db.query(Discount_code).filter(
        Discount_code.id == id
    ).first()

    if not descuento:
        raise HTTPException(
            status_code=404,
            detail="Código de descuento no encontrado"
        )

    db.delete(descuento)
    db.commit()

    return {
        "mensaje": "Código de descuento eliminado correctamente"
    }
