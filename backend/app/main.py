from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import user, product, order, weekly_catalog, catalog_product, reservation, discount_code, auction, auction_bid
from app.routes import auth, products, reservations, admin, auctions
from app.auction_tasks import finalizar_subastas_vencidas
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

Base.metadata.create_all(bind=engine)

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        finalizar_subastas_vencidas,
        "interval",
        minutes=1,
        id="finalizar_subastas",
        replace_existing=True,
    )
    scheduler.start()

    # Revisar también al iniciar el backend
    finalizar_subastas_vencidas()

    yield

    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(reservations.router, prefix="/api", tags=["reservations"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(auctions.router, prefix="/api", tags=["auctions"])

@app.get("/")
def root():
    return {"mensaje": "Backend funcionando ✅"}