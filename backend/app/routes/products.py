from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product

router = APIRouter()

@router.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    productos = db.query(Product).filter(Product.activo == True).all()
    return productos

@router.get("/productos/{id}")
def get_producto(id: int, db: Session = Depends(get_db)):
    producto= db.query(Product).filter(Product.id == id).first()
    if not producto:
        raise HTTPException(status_code = 404, detail= "Producto no encontrado")
    return producto
