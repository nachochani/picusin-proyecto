from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.security import get_current_admin
from app.database import get_db
from app.models.product import Product, EstadoProducto
from app.models.order import Order
from app.models.reservation import Reservation
import openpyxl
import io

router = APIRouter(
    dependencies=[Depends(get_current_admin)]
)

@router.get("/productos")
def get_productos(db: Session = Depends(get_db)):
    productos = db.query(Product).filter(
        Product.activo == True,
    ).all()
    return productos

@router.post("/productos")
def crear_producto(
    nombre:str,
    precio: float,
    imagen:str = None,
    es_novedad: bool = False,
    es_preventa: bool = False,
    db: Session = Depends(get_db)
    ):
    nuevo_producto = Product(
        nombre=nombre.strip(),
        precio=precio,
        estado = EstadoProducto.disponible,
        es_preventa=es_preventa,
        es_novedad=es_novedad,
        imagen=imagen,
        activo=True
    )  
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)

    return nuevo_producto

@router.put("/productos/{id}")
def update_product(
    id: int,
    nombre: str = None,
    precio: float = None,
    estado: str = None,
    imagen: str = None,
    db: Session = Depends(get_db)):
    producto = db.query(Product).filter(Product.id == id).first()

    if not producto:
        raise HTTPException(status_code=404, detail = "Producto no encontrado")

    if nombre: producto.nombre = nombre
    if precio: producto.precio = precio
    if estado: producto.estado = estado
    if imagen: producto.imagen = imagen


    db.commit()
    db.refresh(producto)

    return producto

@router.delete("/productos/{id}")
def delete_product(id: int, db: Session = Depends(get_db)):
    producto = db.query(Product).filter(Product.id == id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    producto.activo = False

    db.commit()
    db.refresh(producto)

    return producto

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
                precio_str = str(precio).replace('$', '').replace(' ', '').strip()
                if ',' in precio_str and '.' in precio_str:
                    precio_str = precio_str.replace('.', '').replace(',', '.')
                elif ',' in precio_str:
                    precio_str = precio_str.replace(',', '.')
                elif '.' in precio_str:
                    # verificar si el punto es separador de miles (ej: 50.000)
                    partes = precio_str.split('.')
                    if len(partes[-1]) == 3:
                        precio_str = precio_str.replace('.', '')
                precio = float(precio_str)
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

@router.get("/reservas")
def get_reservas(db: Session = Depends(get_db)):
    reservas = db.query(Reservation).all()
    return reservas

@router.put("/reservas/{id}/estado")
def update_estado_reserva(id: int, estado: str, db: Session = Depends(get_db)):
    reserva = db.query(Reservation).filter(Reservation.id == id).first()

    if not reserva:
        raise HTTPException(status_code=404, detail = "Reserva no encontrada")
    estados_validos = ["pendiente", "confirmada", "cancelada"]

    if estado not in estados_validos:
        raise HTTPException(status_code=400, detail = "Estado no valido")
    reserva.estado = estado

    db.commit()
    db.refresh(reserva)

    return reserva