
from sqlalchemy import (
    Column, Integer, Float, String, Enum,
    DateTime, ForeignKey, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class EstadoReservation(str, enum.Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    solicitada = "solicitada"
    recibida = "recibida"
    enviada = "enviada"
    entregada = "entregada"
    cancelada = "cancelada"


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer, ForeignKey("users.id"), nullable=False
    )

    product_id = Column(
        Integer, ForeignKey("products.id"), nullable=False
    )

    precio_total = Column(Float, nullable=False)
    monto_senia = Column(Float, nullable=False)

    senia_pagada = Column(
        Boolean, default=False, nullable=False
    )

    saldo_pagado = Column(
        Boolean, default=False, nullable=False
    )

    estado = Column(
        Enum(EstadoReservation),
        default=EstadoReservation.pendiente,
        nullable=False
    )

    comprobante_url = Column(String(500), nullable=True)

    comprobante_saldo_url = Column(
        String(500), nullable=True
    )

    creado_en = Column(DateTime, default=func.now())

    user = relationship("User", backref="reservations")
    product = relationship("Product", backref="reservations")
