from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.auction import Auction, EstadoAuction
from app.models.auction_bid import Auction_bid


def finalizar_subastas_vencidas():
    db: Session = SessionLocal()

    try:
        ahora = datetime.now()
        hoy = ahora.date()

        subastas = db.query(Auction).filter(
            Auction.estado == EstadoAuction.activa
        ).all()

        for subasta in subastas:
            fecha_fin = subasta.fecha_fin

            if isinstance(fecha_fin, datetime):
                fecha_fin = fecha_fin.date()

            # La subasta vence al comenzar el día siguiente
            fecha_vencimiento = datetime.combine(
                fecha_fin + timedelta(days=1),
                time.min
            )

            if ahora >= fecha_vencimiento:
                puja_ganadora = (
                    db.query(Auction_bid)
                    .filter(Auction_bid.auction_id == subasta.id)
                    .order_by(Auction_bid.monto.desc())
                    .first()
                )

                subasta.ganador_id = (
                    puja_ganadora.user_id
                    if puja_ganadora
                    else None
                )

                subasta.estado = EstadoAuction.finalizada

        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()