from sqlalchemy import (
    Column, Integer, Numeric, String,
    DateTime, ForeignKey, Enum,
    CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class TipoPago(str, enum.Enum):
    senia = "senia"
    saldo = "saldo"
    compra = "compra"
    subasta = "subasta"


class EstadoPago(str, enum.Enum):
    pendiente = "pendiente"
    aprobado = "aprobado"
    rechazado = "rechazado"
    cancelado = "cancelado"


class MetodoPago(str, enum.Enum):
    demo = "demo"
    mercadopago = "mercadopago"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    reservation_id = Column(
        Integer, ForeignKey("reservations.id"),
        nullable=True
    )

    order_id = Column(
        Integer, ForeignKey("orders.id"),
        nullable=True
    )

    tipo = Column(
        Enum(TipoPago), nullable=False
    )

    monto = Column(
        Numeric(12, 2), nullable=False
    )

    estado = Column(
        Enum(EstadoPago),
        default=EstadoPago.pendiente,
        nullable=False
    )

    metodo = Column(
        Enum(MetodoPago), nullable=False
    )

    referencia_externa = Column(
        String(100), nullable=True, unique=True
    )

    creado_en = Column(
        DateTime, default=func.now(), nullable=False
    )

    aprobado_en = Column(
        DateTime, nullable=True
    )

    user = relationship("User", backref="payments")

    reservation = relationship(
        "Reservation", backref="payments"
    )

    order = relationship(
        "Order", backref="payments"
    )

    __table_args__ = (
        CheckConstraint(
            """
            (
                reservation_id IS NOT NULL
                AND order_id IS NULL
                AND tipo IN ('senia', 'saldo')
            )
            OR
            (
                reservation_id IS NULL
                AND order_id IS NOT NULL
                AND tipo IN ('compra', 'subasta')
            )
            """,
            name="ck_payment_operacion"
        ),
        CheckConstraint(
            "monto >= 0",
            name="ck_payment_monto"
        ),
    )