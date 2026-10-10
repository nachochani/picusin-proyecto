
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
            "imagen": subasta.producto.imagen,
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

@router.put("/subastas/{auction_id}/extender",dependencies=[Depends(get_current_admin)],)
def extender_subasta(
    auction_id: int,
    fecha_fin: date,
    db: Session = Depends(get_db),
):
    subasta = db.query(Auction).filter(
        Auction.id == auction_id
    ).first()

    if subasta is None:
        raise HTTPException(
            status_code=404,
            detail="Subasta no encontrada",
        )

    if subasta.estado != EstadoAuction.activa:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden extender subastas activas",
        )

    fecha_fin_actual = (
        subasta.fecha_fin.date()
        if isinstance(subasta.fecha_fin, datetime)
        else subasta.fecha_fin
    )

    if fecha_fin <= fecha_fin_actual:
        raise HTTPException(
            status_code=400,
            detail="La nueva fecha debe ser posterior a la fecha de finalización actual",
        )

    if fecha_fin < date.today():
        raise HTTPException(
            status_code=400,
            detail="La nueva fecha no puede ser anterior a hoy",
        )

    subasta.fecha_fin = fecha_fin
    db.commit()

    return {
        "mensaje": "Fecha de finalización actualizada correctamente",
        "id": subasta.id,
        "fecha_fin": fecha_fin.isoformat(),
    }


@router.delete(
    "/subastas/{auction_id}",
    dependencies=[Depends(get_current_admin)],
)
def eliminar_subasta(
    auction_id: int,
    db: Session = Depends(get_db),
):
    subasta = db.query(Auction).filter(
        Auction.id == auction_id
    ).first()

    if subasta is None:
        raise HTTPException(
            status_code=404,
            detail="Subasta no encontrada",
        )

    try:
        # Primero eliminamos las pujas asociadas.
        db.query(Auction_bid).filter(
            Auction_bid.auction_id == auction_id
        ).delete(synchronize_session=False)

        # Después eliminamos la subasta.
        db.delete(subasta)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo eliminar la subasta",
        )

    return {
        "mensaje": "Subasta eliminada correctamente",
        "id": auction_id,
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

@router.get("/subastas/{auction_id}")
def obtener_subasta(
    auction_id: int,
    db: Session = Depends(get_db),
):
    subasta = db.query(Auction).filter(
        Auction.id == auction_id
    ).first()

    if subasta is None:
        raise HTTPException(
            status_code=404,
            detail="Subasta no encontrada",
        )

    pujas = (
        db.query(Auction_bid)
        .filter(Auction_bid.auction_id == auction_id)
        .order_by(
            Auction_bid.monto.desc(),
            Auction_bid.creado_en.desc(),
        )
        .all()
    )

    return {
        "id": subasta.id,
        "product_id": subasta.product_id,
        "producto": subasta.producto.nombre,
        "imagen": subasta.producto.imagen,
        "precio_base": subasta.precio_base,
        "precio_actual": subasta.precio_actual,
        "fecha_inicio": subasta.fecha_inicio,
        "fecha_fin": subasta.fecha_fin,
        "estado": subasta.estado.value,
        "ganador_id": subasta.ganador_id,
        "pujas": [
            {
                "id": puja.id,
                "usuario_id": puja.user_id,
                "monto": puja.monto,
                "creado_en": puja.creado_en,
            }
            for puja in pujas
        ],
    }