from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key = True, index = True )
    nombre = Column(String(100), nullable = False)
    apellido = Column(String(100), nullable = False)
    email = Column(String(100), unique = True, index = True, nullable = False)
    password = Column(String(255), nullable = False)
    es_admin = Column(Boolean, default = True)
    creado_en = Column(DateTime, default = func.now())
