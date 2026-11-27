
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.security import get_current_admin
from app.database import get_db

from app.models.product import Product, EstadoProducto
from app.models.reservation import Reservation, EstadoReservation
from app.models.auction import Auction, EstadoAuction

import math


router = APIRouter(
    dependencies=[Depends(get_current_admin)]
)


# Verificar si el producto tiene una reserva vigente
def tiene_reserva_activa(db: Session, product_id: int):
    return db.query(Reservation).filter(
        Reservation.product_id == product_id,
        Reservation.estado.in_([
            EstadoReservation.pendiente,
            EstadoReservation.confirmada,
            EstadoReservation.solicitada,
            EstadoReservation.recibida,
            EstadoReservation.enviada
        ])
    ).first() is not None


# Verificar si el producto está comprometido por una subasta
def tiene_subasta_bloqueante(db: Session, product_id: int):
    return db.query(Auction).filter(
        Auction.product_id == product_id,
        (
            (Auction.estado == EstadoAuction.activa)
            | (
                (Auction.estado == EstadoAuction.finalizada)
                & (Auction.ganador_id.isnot(None))
            )
        )
    ).first() is not None


# Verificar que el producto pueda modificarse comercialmente
def verificar_producto_disponible(
    db: Session,
    producto: Product
):
    if producto.estado != EstadoProducto.disponible:
        raise HTTPException(
            status_code=400,
            detail="El producto no está disponible"
        )

    if tiene_reserva_activa(db, producto.id):
        raise HTTPException(
            status_code=400,
            detail="El producto tiene una reserva vigente"
        )

    if tiene_subasta_bloqueante(db, producto.id):
        raise HTTPException(
            status_code=400,
            detail="El producto está comprometido por una subasta"
        )


# Obtener productos
@router.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    return db.query(Product).filter(
        Product.activo == True
    ).all()


# Crear producto
@router.post("/productos")
def crear_producto(
    nombre: str,
    descripcion: str,
    precio: float,
    categoria: str = None,
    imagen: str = None,
    es_novedad: bool = False,
    es_preventa: bool = False,
    db: Session = Depends(get_db)
):
    if not nombre.strip():
        raise HTTPException(
            status_code=400,
            detail="El nombre no puede estar vacío"
        )

    if not math.isfinite(precio) or precio <= 0:
        raise HTTPException(
            status_code=400,
            detail="El precio debe ser mayor a cero"
        )

    nuevo_producto = Product(
        nombre=nombre.strip(),
        descripcion=descripcion.strip(),
        categoria=categoria.strip() if categoria else None,
        precio=precio,
        stock=0 if es_novedad else 1,
        estado=EstadoProducto.disponible,
        es_novedad=es_novedad,
        es_preventa=es_novedad,
        imagen=imagen,
        activo=True
    )

    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)

    return nuevo_producto


# Actualizar datos de un producto
@router.put("/productos/{id}")
def update_product(
    id: int,
    nombre: str = None,
    descripcion: str = None,
    precio: float = None,
    categoria: str = None,
    estado: str = None,
    imagen: str = None,
    es_novedad: bool = None,
    es_preventa: bool = None,
    db: Session = Depends(get_db)
):
    producto = db.query(Product).filter(
        Product.id == id,
        Product.activo == True
    ).with_for_update().first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    # El estado depende de las operaciones comerciales
    if estado is not None:
        if estado != producto.estado.value:
            raise HTTPException(
                status_code=400,
                detail="El estado se modifica mediante compras, reservas y subastas"
            )

    # El cambio de tipo debe realizarse mediante
    # la acción específica de recepción
    if es_novedad is not None:
        if es_novedad != producto.es_novedad:
            raise HTTPException(
                status_code=400,
                detail="Utilizá la acción Pasar al catálogo para cambiar el tipo de producto"
            )

    if nombre is not None:
        if not nombre.strip():
            raise HTTPException(
                status_code=400,
                detail="El nombre no puede estar vacío"
            )

        producto.nombre = nombre.strip()

    if descripcion is not None:
        producto.descripcion = descripcion.strip()

    if categoria is not None:
        producto.categoria = categoria.strip() or None

    if precio is not None:
        if not math.isfinite(precio) or precio <= 0:
            raise HTTPException(
                status_code=400,
                detail="El precio debe ser mayor a cero"
            )

        if precio != producto.precio:
            verificar_producto_disponible(db, producto)

        producto.precio = precio

    if imagen is not None:
        producto.imagen = imagen

    # Mantener ambos atributos sincronizados
    producto.es_preventa = producto.es_novedad

    db.commit()
    db.refresh(producto)

    return producto


# Pasar una novedad al catálogo normal
@router.put("/productos/{id}/pasar-catalogo")
def pasar_al_catalogo(
    id: int,
    db: Session = Depends(get_db)
):
    producto = db.query(Product).filter(
        Product.id == id,
        Product.activo == True
    ).with_for_update().first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    if not producto.es_novedad:
        raise HTTPException(
            status_code=400,
            detail="El producto ya pertenece al catálogo"
        )

    verificar_producto_disponible(db, producto)

    producto.es_novedad = False
    producto.es_preventa = False
    producto.stock = 1
    producto.estado = EstadoProducto.disponible

    db.commit()
    db.refresh(producto)

    return {
        "mensaje": "Producto incorporado al catálogo correctamente",
        "producto": producto
    }


# Desactivar producto
@router.delete("/productos/{id}")
def delete_product(
    id: int,
    db: Session = Depends(get_db)
):
    producto = db.query(Product).filter(
        Product.id == id,
        Product.activo == True
    ).with_for_update().first()

    if not producto:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    if tiene_reserva_activa(db, producto.id):
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un producto con una reserva vigente"
        )

    if tiene_subasta_bloqueante(db, producto.id):
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un producto comprometido por una subasta"
        )

    if producto.estado == EstadoProducto.reservado:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un producto reservado"
        )

    producto.activo = False

    db.commit()
    db.refresh(producto)

    return producto
