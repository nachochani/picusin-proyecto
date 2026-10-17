
from datetime import datetime, time, timedelta

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.auction import Auction, EstadoAuction
from app.models.auction_bid import Auction_bid
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import EstadoProducto


def finalizar_subastas_vencidas():
    db: Session = SessionLocal()

    try:
        ahora = datetime.now()

        subastas = db.query(Auction).filter(
            Auction.estado == EstadoAuction.activa
        ).with_for_update().all()

        for subasta in subastas:
            fecha_fin = subasta.fecha_fin

            if isinstance(fecha_fin, datetime):
                fecha_fin = fecha_fin.date()

            # La subasta vence al comenzar el día siguiente.
            fecha_vencimiento = datetime.combine(
                fecha_fin + timedelta(days=1),
                time.min
            )

            if ahora < fecha_vencimiento:
                continue

            puja_ganadora = (
                db.query(Auction_bid)
                .filter(
                    Auction_bid.auction_id == subasta.id
                )
                .order_by(
                    Auction_bid.monto.desc(),
                    Auction_bid.creado_en.asc(),
                    Auction_bid.id.asc()
                )
                .first()
            )

            producto = subasta.producto

            if puja_ganadora is None:
                # Sin pujas: liberar el producto.
                subasta.ganador_id = None
                subasta.estado = EstadoAuction.finalizada

                if producto:
                    producto.estado = EstadoProducto.disponible

                continue

            # Con ganador: crear un pedido pendiente.
            # La adjudicación no significa que el pago esté confirmado.
            pedido = Order(
                user_id=puja_ganadora.user_id,
                total=puja_ganadora.monto,
                codigo_descuento=None,
                monto_descuento=0,
                estado=OrderStatus.pendiente
            )

            db.add(pedido)
            db.flush()

            db.add(
                OrderItem(
                    order_id=pedido.id,
                    product_id=subasta.product_id,
                    cantidad=1,
                    precio_unitario=puja_ganadora.monto
                )
            )

            subasta.ganador_id = puja_ganadora.user_id
            subasta.estado = EstadoAuction.finalizada

            # Impide la compra y reserva normal mientras se coordina
            # el pago del pedido adjudicado.
            if producto:
                producto.estado = EstadoProducto.reservado

        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
