from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class discount_code(Base):
    __tablename__ = "discount_codes"
    id = Column(Integer, primary_key = True, index = True)
    codigo = Column(String(50), nullable = False)
    porcentaje = Column(Float, nullable = False)
    activo = Column(Boolean, default = True)
    creado_en = Column(DateTime, default = func.now())

