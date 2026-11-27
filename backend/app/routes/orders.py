
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product, EstadoProducto
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.security import get_current_user
from app.models.discount_code import Discount_code
from app.models.auction import Auction, EstadoAuction
from app.models.payment import TipoPago

from app.services.payment_service import (
    verificar_modo_demo,
    registrar_pago_pedido,
    convertir_monto
)

router = APIRouter()


class ItemCompra(BaseModel):
    product_id: int
    cantidad: int = Field(gt=0)


class CompraDemo(BaseModel):
    items: list[ItemCompra]
    codigo_descuento: str | None = None
    importe_esperado: float | None = Field(default=None, ge=0)


@router.post("/pedidos/demo")
def comprar_carrito_demo(
    compra: CompraDemo,
    db: Session = Depends(get_db),
    usuario: User = Depends(get_current_user)
):
    # Verificar que los pagos de prueba estén habilitados
    verificar_modo_demo()

    if not compra.items:
        raise HTTPException(
            status_code=400,
            detail="El carrito está vacío"
        )

    cantidades = {}

    for item in compra.items:
        cantidades[item.product_id] = (
            cantidades.get(item.product_id, 0) + item.cantidad
        )

    try:
        productos = {}

        # Validar disponibilidad de los productos
        for product_id, cantidad in sorted(cantidades.items()):
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

            # Verificar si el producto está bloqueado por una subasta
            subasta_bloqueante = db.query(Auction).filter(
                Auction.product_id == product_id,
                (
                    (Auction.estado == EstadoAuction.activa)
                    | (
                        (Auction.estado == EstadoAuction.finalizada)
                        & (Auction.ganador_id.isnot(None))
                    )
                )
            ).first()

            if subasta_bloqueante:
                raise HTTPException(
                    status_code=400,
                    detail=f"{producto.nombre} está bloqueado por una subasta"
                )

            # Las novedades y preventas deben reservarse
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

        # Calcular subtotal
        subtotal = sum(
            productos[product_id].precio * cantidad
            for product_id, cantidad in cantidades.items()
        )

        codigo_descuento = None
        monto_descuento = 0.0

        # Validar y aplicar código de descuento
        if compra.codigo_descuento and compra.codigo_descuento.strip():
            codigo = compra.codigo_descuento.strip().upper()

            descuento = db.query(Discount_code).filter(
                Discount_code.codigo == codigo
            ).first()

            if not descuento:
                raise HTTPException(
                    status_code=400,
                    detail="El código de descuento no existe"
                )

            if not descuento.activo:
                raise HTTPException(
                    status_code=400,
                    detail="El código de descuento está desactivado"
                )

            codigo_descuento = descuento.codigo

            monto_descuento = round(
                subtotal * descuento.porcentaje / 100,
                2
            )

        # Calcular importe final
        total = round(subtotal - monto_descuento, 2)

        if total < 0:
            raise HTTPException(
                status_code=400,
                detail="El importe de la compra no es válido"
            )

        # Verificar que el importe coincida con el mostrado al cliente
        if compra.importe_esperado is not None:
            if convertir_monto(compra.importe_esperado) != convertir_monto(total):
                raise HTTPException(
                    status_code=409,
                    detail="El importe de la compra cambió. Revisá tu carrito antes de continuar."
                )

        # Crear pedido
        nuevo_pedido = Order(
            user_id=usuario.id,
            total=total,
            codigo_descuento=codigo_descuento,
            monto_descuento=monto_descuento,
            estado=OrderStatus.pagado
        )

        db.add(nuevo_pedido)
        db.flush()

        # Crear artículos del pedido y actualizar stock
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

        # Registrar el pago asociado al pedido
        nuevo_pago = registrar_pago_pedido(
            db=db,
            user_id=usuario.id,
            order_id=nuevo_pedido.id,
            monto=total,
            tipo=TipoPago.compra
        )

        # Preparar respuesta
        respuesta = {
            "mensaje": "Compra realizada correctamente",
            "pedido_id": nuevo_pedido.id,
            "pago_id": nuevo_pago.id,
            "referencia_pago": nuevo_pago.referencia_externa,
            "subtotal": subtotal,
            "codigo_descuento": codigo_descuento,
            "monto_descuento": monto_descuento,
            "total": total,
            "estado": nuevo_pedido.estado.value,
            "estado_pago": nuevo_pago.estado.value
        }

        # Confirmar todas las operaciones
        db.commit()

        return respuesta

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo completar la compra"
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
            "subtotal": round(
                sum(
                    item.cantidad * item.precio_unitario
                    for item in pedido.items
                ),
                2
            ),
            "codigo_descuento": pedido.codigo_descuento,
            "monto_descuento": pedido.monto_descuento,
            "total": pedido.total,
            "estado": pedido.estado.value,
            "creado_en": pedido.creado_en,
            "items": [
                {
                    "product_id": item.product_id,
                    "nombre": item.product.nombre,
                    "cantidad": item.cantidad,
                    "precio_unitario": item.precio_unitario,
                    "subtotal": round(
                        item.cantidad * item.precio_unitario, 2
                    )
                }
                for item in pedido.items
            ]
        }
        for pedido in pedidos
    ]
