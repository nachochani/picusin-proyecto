from sqlalchemy import Column, Integer, Float, Enum, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class EstadoAuction(str, enum.Enum):
    activa = 'activa'
    finalizada = 'finalizada'
    cancelada = 'cancelada'

class auction(Base):
    __tablename__ = 'auctions'
    id = Column(Integer, primary_key = True, index = True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    precio_base = Column(Float, nullable = False)
    precio_actual = Column(Float, nullable = False)
    fecha_inicio = Column(Date, nullable = False)
    fecha_fin = Column(Date, nullable = False)
    estado = Column(Enum(EstadoAuction), default =EstadoAuction.activa)
    ganador_id = Column(Integer, ForeignKey("users.id"), nullable = True)
    creado_en = Column(DateTime, default = func.now())

    ganador = relationship("User", foreign_keys = [ganador_id], backref = "auctions_ganadas")
    producto = relationship("Product", foreign_keys = [product_id], backref = "auctions")