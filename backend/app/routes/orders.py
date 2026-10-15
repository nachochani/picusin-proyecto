
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product, EstadoProducto
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.security import get_current_user

router = APIRouter()


class ItemCompra(BaseModel):
    product_id: int
    cantidad: int = Field(gt=0)


class CompraDemo(BaseModel):
    items: list[ItemCompra]


@router.post("/pedidos/demo")
def comprar_carrito_demo(
    compra: CompraDemo,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user)
):
    if not compra.items:
        raise HTTPException(
            status_code=400,
            detail="El carrito está vacío"
        )

    # Consolidar productos repetidos para validar y descontar stock correctamente.
    cantidades = {}
    for item in compra.items:
        cantidades[item.product_id] = (
            cantidades.get(item.product_id, 0) + item.cantidad
        )

    try:
        productos = {}

        # Validar todos los productos antes de crear el pedido.
        for product_id, cantidad in cantidades.items():
            producto = (
                db.query(Product)
                .filter(Product.id == product_id)
                .with_for_update()
                .first()
            )

            if not producto or not producto.activo:
                raise HTTPException(
                    status_code=404,
                    detail=f"El producto {product_id} no existe o está inactivo"
                )

            if producto.es_novedad or producto.es_preventa:
                raise HTTPException(
                    status_code=400,
                    detail=f"{producto.nombre} debe reservarse, no comprarse desde el catálogo"
                )

            if producto.estado != EstadoProducto.disponible:
                raise HTTPException(
                    status_code=400,
                    detail=f"{producto.nombre} ya no está disponible"
                )

            if producto.stock is None or producto.stock < cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"No hay stock suficiente de {producto.nombre}"
                )

            productos[product_id] = producto

        total = sum(
            productos[product_id].precio * cantidad
            for product_id, cantidad in cantidades.items()
        )

        # Un único pedido para todos los artículos.
        nuevo_pedido = Order(
            user_id=usuario.id,
            total=total,
            estado=OrderStatus.pagado
        )
        db.add(nuevo_pedido)
        db.flush()

        for product_id, cantidad in cantidades.items():
            producto = productos[product_id]

            db.add(OrderItem(
                order_id=nuevo_pedido.id,
                product_id=producto.id,
                cantidad=cantidad,
                precio_unitario=producto.precio
            ))

            producto.stock -= cantidad
            if producto.stock == 0:
                producto.estado = EstadoProducto.vendido

        db.commit()
        db.refresh(nuevo_pedido)

        return {
            "mensaje": "Compra demo realizada correctamente",
            "pedido_id": nuevo_pedido.id,
            "total": total,
            "estado": nuevo_pedido.estado.value
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo completar la compra demo"
        )


@router.get("/mis-pedidos")
def obtener_mis_pedidos(
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user)
):
    pedidos = (
        db.query(Order)
        .filter(Order.user_id == usuario.id)
        .order_by(Order.creado_en.desc())
        .all()
    )

    return [
        {
            "id": pedido.id,
            "total": pedido.total,
            "estado": pedido.estado.value,
            "creado_en": pedido.creado_en,
            "items": [
                {
                    "product_id": item.product_id,
                    "nombre": item.product.nombre,
                    "cantidad": item.cantidad,
                    "precio_unitario": item.precio_unitario,
                    "subtotal": item.cantidad * item.precio_unitario
                }
                for item in pedido.items
            ]
        }
        for pedido in pedidos
    ]
