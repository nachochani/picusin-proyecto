
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.auction import Auction, EstadoAuction
from app.models.auction_bid import Auction_bid
from app.models.product import Product
from app.models.user import User
from app.security import get_current_admin, get_current_user

router = APIRouter()


@router.get("/subastas")
def listar_subastas(db: Session = Depends(get_db)):
    subastas = db.query(Auction).order_by(Auction.fecha_fin.asc()).all()

    return [
        {
            "id": subasta.id,
            "product_id": subasta.product_id,
            "producto": subasta.producto.nombre,
            "precio_base": subasta.precio_base,
            "precio_actual": subasta.precio_actual,
            "fecha_inicio": subasta.fecha_inicio.isoformat(),
            "fecha_fin": subasta.fecha_fin.isoformat(),
            "estado": subasta.estado.value,
            "ganador_id": subasta.ganador_id,
        }
        for subasta in subastas
    ]


@router.post("/subastas", dependencies=[Depends(get_current_admin)])
def crear_subasta(
    product_id: int,
    precio_base: float,
    fecha_inicio: date,
    fecha_fin: date,
    db: Session = Depends(get_db),
):
    if precio_base <= 0:
        raise HTTPException(
            status_code=400,
            detail="El precio base debe ser mayor que cero",
        )

    if fecha_fin < fecha_inicio:
        raise HTTPException(
            status_code=400,
            detail="La fecha de fin no puede ser anterior a la fecha de inicio",
        )

    producto = db.query(Product).filter(Product.id == product_id).first()

    if producto is None:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado",
        )

    nueva_subasta = Auction(
        product_id=product_id,
        precio_base=precio_base,
        precio_actual=precio_base,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        estado=EstadoAuction.activa,
    )

    db.add(nueva_subasta)
    db.commit()
    db.refresh(nueva_subasta)

    return {
        "mensaje": "Subasta creada correctamente",
        "id": nueva_subasta.id,
    }


@router.post("/subastas/{auction_id}/pujas")
def realizar_puja(
    auction_id: int,
    monto: float,
    usuario: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subasta = db.query(Auction).filter(
        Auction.id == auction_id
    ).with_for_update().first()

    if subasta is None:
        raise HTTPException(
            status_code=404,
            detail="Subasta no encontrada",
        )

    hoy = date.today()

    fecha_inicio = (
    subasta.fecha_inicio.date()
    if isinstance(subasta.fecha_inicio, datetime)
    else subasta.fecha_inicio
    )

    fecha_fin = (
        subasta.fecha_fin.date()
        if isinstance(subasta.fecha_fin, datetime)
        else subasta.fecha_fin
    )

    if subasta.estado != EstadoAuction.activa:
        raise HTTPException(
            status_code=400,
            detail="La subasta no está activa",
        )

    if hoy < fecha_inicio or hoy > fecha_fin:
        raise HTTPException(
            status_code=400,
            detail="La subasta está fuera de sus fechas permitidas",
        )

    puja_minima = subasta.precio_actual + 1000

    if monto < puja_minima:
        raise HTTPException(
            status_code=400,
            detail=f"La puja mínima es de ${puja_minima}"
        )

    nueva_puja = Auction_bid(
        auction_id=subasta.id,
        user_id=usuario.id,
        monto=monto,
    )

    subasta.precio_actual = monto

    try:
        db.add(nueva_puja)
        db.commit()
        db.refresh(nueva_puja)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo registrar la puja",
        )

    return {
        "mensaje": "Puja registrada correctamente",
        "puja_id": nueva_puja.id,
        "auction_id": subasta.id,
        "monto": nueva_puja.monto,
        "precio_actual": subasta.precio_actual,
        "usuario_id": usuario.id,
    }
