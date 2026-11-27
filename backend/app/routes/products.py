
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product, EstadoProducto
from app.models.auction import Auction, EstadoAuction

router = APIRouter()


def serializar_producto(producto, subastas):
    subasta_activa = next(
        (
            subasta for subasta in subastas
            if subasta.estado == EstadoAuction.activa
        ),
        None
    )

    subasta_con_ganador = any(
        subasta.estado == EstadoAuction.finalizada
        and subasta.ganador_id is not None
        for subasta in subastas
    )

    bloqueado_por_subasta = (
        subasta_activa is not None
        or subasta_con_ganador
    )

    disponible = (
        producto.activo
        and producto.estado == EstadoProducto.disponible
        and not bloqueado_por_subasta
    )

    puede_comprar = (
        disponible
        and not producto.es_novedad
        and not producto.es_preventa
        and (producto.stock or 0) > 0
    )

    puede_reservar = (
        disponible
        and producto.es_novedad
    )

    return {
        "id": producto.id,
        "nombre": producto.nombre,
        "descripcion": producto.descripcion,
        "precio": producto.precio,
        "stock": producto.stock,
        "imagen": producto.imagen,
        "categoria": producto.categoria,
        "es_novedad": producto.es_novedad,
        "es_preventa": producto.es_preventa,
        "estado": producto.estado.value,
        "activo": producto.activo,
        "creado_en": producto.creado_en,
        "en_subasta": subasta_activa is not None,
        "subasta_id": (
            subasta_activa.id
            if subasta_activa else None
        ),
        "bloqueado_por_subasta": bloqueado_por_subasta,
        "puede_comprar": puede_comprar,
        "puede_reservar": puede_reservar
    }


@router.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    productos = db.query(Product).filter(
        Product.activo == True
    ).all()

    subastas = db.query(Auction).filter(
        (
            (Auction.estado == EstadoAuction.activa)
            | (
                (Auction.estado == EstadoAuction.finalizada)
                & (Auction.ganador_id.isnot(None))
            )
        )
    ).all()

    subastas_por_producto = {}

    for subasta in subastas:
        subastas_por_producto.setdefault(
            subasta.product_id, []
        ).append(subasta)

    return [
        serializar_producto(
            producto,
            subastas_por_producto.get(producto.id, [])
        )
        for producto in productos
    ]


@router.get("/productos/{id}")
def get_producto(
    id: int,
    db: Session = Depends(get_db)
):
    producto = db.query(Product).filter(
        Product.id == id,
        Product.activo == True
    ).first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    subastas = db.query(Auction).filter(
        Auction.product_id == id,
        (
            (Auction.estado == EstadoAuction.activa)
            | (
                (Auction.estado == EstadoAuction.finalizada)
                & (Auction.ganador_id.isnot(None))
            )
        )
    ).all()

    return serializar_producto(producto, subastas)
