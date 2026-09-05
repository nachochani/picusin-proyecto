from sqlalchemy import Column, Integer, Float, String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class EstadoReservation(str, enum.Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    cancelada = "cancelada"

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    monto_senia = Column(Float, nullable=False)
    estado = Column(Enum(EstadoReservation), default=EstadoReservation.pendiente)
    comprobante_url = Column(String(500), nullable=True)
    creado_en = Column(DateTime, default=func.now())

    user = relationship("User", backref="reservations")
    product = relationship("Product", backref="reservations")