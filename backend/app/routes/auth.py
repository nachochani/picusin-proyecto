from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

router = APIRouter()
pwd_context = CryptContext(schemes = ["bcrypt"], deprecated = "auto")

@router.post("/register")
def register(nombre: str, apellido:str, email: str, password: str, db: Session = Depends(get_db)):

    usuario_existente = db.query(User).filter(User.email == email).first()
    if usuario_existente:
        raise HTTPException(status_code = 400, detail = "El mail ya esta registrado")

    password_encriptado = pwd_context.hash(password)

    nuevo_usuario = User(
        nombre = nombre,
        apellido = apellido,
        email = email,
        password = password_encriptado,
        es_admin = False
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return {f"mensaje: Usuario registrado correctamente, id: {nuevo_usuario.id}"}   


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    usuario = db.query(User).filter(User.email == email).first()
    if not usuario:
        raise HTTPException(status_code = 400, detail = "Email o contraseña incorrectos")
    if not pwd_context.verify(password, usuario.password):
        raise HTTPException(status_code = 400, detail = "Email o contraseña incorrectos")

    datos = {"sub": str(usuario.id), "es_admin": usuario.es_admin}
    expiracion = datetime.utcnow() + timedelta(hours = 24)
    datos["exp"] = expiracion
    token = jwt.encode(datos, SECRET_KEY, algorithm=ALGORITHM)

    return {"access_token": token, "token_type": "bearer", "es_admin": usuario.es_admin}