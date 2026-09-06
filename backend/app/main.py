from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import user, product, order, weekly_catalog, catalog_product, reservation, discount_code, auction, auction_bid
from app.routes import auth, products, reservations

Base.metadata.create_all(bind=engine)

app = FastAPI()

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

@app.get("/")
def root():
    return {"mensaje": "Backend funcionando ✅"}