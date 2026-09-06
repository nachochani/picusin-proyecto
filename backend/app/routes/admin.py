from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product, EstadoProducto
from app.models.order import Order

router = APIRouter()

@router.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    productos = db.query(Product).filter(
        Product.activo == True,
    ).all()
    return productos