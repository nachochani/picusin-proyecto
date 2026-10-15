from fastapi import APIRouter, Depends
from app.security import get_current_admin
from app.routes import (
    admin_productos,
    admin_reservas,
    admin_descuentos,
)


router = APIRouter(
    dependencies=[Depends(get_current_admin)]
)

router.include_router(admin_productos.router)
router.include_router(admin_reservas.router)
router.include_router(admin_descuentos.router)
