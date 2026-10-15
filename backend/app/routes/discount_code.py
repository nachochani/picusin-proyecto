
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.discount_code import Discount_code
from app.security import get_current_user


router = APIRouter()


@router.get("/validar/{codigo}")
def validar_codigo_descuento(
    codigo: str,
    db: Session = Depends(get_db),
    usuario=Depends(get_current_user)
):
    codigo = codigo.strip().upper()

    descuento = db.query(Discount_code).filter(
        Discount_code.codigo == codigo
    ).first()

    if not descuento:
        raise HTTPException(
            status_code=404,
            detail="El código de descuento no existe"
        )

    if not descuento.activo:
        raise HTTPException(
            status_code=400,
            detail="Este código de descuento está desactivado"
        )

    return {
        "codigo": descuento.codigo,
        "porcentaje": descuento.porcentaje,
        "mensaje": "Código de descuento aplicado correctamente"
    }
