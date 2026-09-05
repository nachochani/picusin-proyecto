from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.sql import func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key = True, index = True )
    nombre = Column(String(100), nullable = False)
    descripcion = Column(Text, nullable = False)
    precio = Column(Float, nullable = False)
    stock = Column(Integer, default = 0)
    imagen = Column(String(500), nullable = True)
    es_novedad = Column(Boolean, default = False)
    es_preventa = Column(Boolean, default = False)
    activo = Column(Boolean, default = True)
    creado_en = Column(DateTime, default = func.now())
