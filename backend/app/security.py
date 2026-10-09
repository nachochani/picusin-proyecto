
import os

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

oauth2_scheme = HTTPBearer()


def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    
    if not SECRET_KEY:
        raise HTTPException(
            status_code=500,
            detail="Falta configurar SECRET_KEY"
        )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = int(payload.get("sub"))

    except (JWTError, TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    usuario = db.query(User).filter(User.id == user_id).first()

    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail="Usuario no encontrado",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not usuario.es_admin:
        raise HTTPException(
            status_code=403,
            detail="No tenés permisos de administrador"
        )

    return usuario
