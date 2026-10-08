from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.product import Product, EstadoProducto
from app.models.order import Order
import openpyxl
import io

router = APIRouter()

@router.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    productos = db.query(Product).filter(
        Product.activo == True,
    ).all()
    return productos

@router.post("/cargar-excel")
async def cargar_excel(archivo: UploadFile = File(...), db: Session = Depends(get_db)):

    contenido = await archivo.read()
    wb = openpyxl.load_workbook(io.BytesIO(contenido))

    productos_cargados = 0
    productos_omitidos = 0

    for idx, hoja in enumerate(wb.worksheets):
        es_novedad = True if idx == 0 else False
    
        for fila in hoja.iter_rows(min_row=2, values_only=False):
            nombre = fila[0].value
            precio = fila[1].value
            estado_excel = fila[2].value if len(fila) > 2 else None
            celda_imagen = fila[3] if len(fila) > 3 else None

            if not precio or not nombre:
                continue

            try:
                precio = float(str(precio).replace('$', '').replace('.', '').replace(',', '.'))
            except:
                productos_omitidos += 1
                continue

            if estado_excel and 'STOCK' in str(estado_excel).upper():
                estado = EstadoProducto.disponible
                es_preventa = False
            else:
                estado = EstadoProducto.disponible
                es_preventa = True

            imagen_url = None
            if celda_imagen and celda_imagen.hyperlink:
                imagen_url = celda_imagen.hyperlink.target
            elif celda_imagen and celda_imagen.value and str(celda_imagen.value).startswith('http'):
                imagen_url = celda_imagen.value

            nuevo_producto = Product(
                nombre=str(nombre).strip(),
                precio=precio,
                estado=estado,
                es_preventa=es_preventa,
                es_novedad=es_novedad,
                imagen=imagen_url,
                activo=True
            )
            db.add(nuevo_producto)
            productos_cargados += 1
    db.commit()

    return {
        "mensaje": f"Carga completada: {productos_cargados} productos cargados, {productos_omitidos} omitidos"
    }