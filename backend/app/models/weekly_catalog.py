from sqlalchemy import Column, Integer, Boolean, DateTime, Date
from sqlalchemy.sql import func
from app.database import Base

class WeeklyCatalog(Base):
    __tablename__ = "weekly_catalog"

    id = Column(Integer, primary_key = True, index = True )
    fecha_inicio = Column(Date, nullable = False)
    fecha_cierre = Column(Date, nullable = False)
    activo = Column(Boolean, default = True)
    creado_en = Column(DateTime, default = func.now())