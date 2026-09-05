from fastapi import FastAPI
from app.database import engine, Base
from app.models import user, product, order, weeklyCatalog, catalogProducts, reservation, discount_code, auction, auction_bid
from app.routes import auth

Base.metadata.create_all(bind = engine)

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/")
def root():
    return {"mensaje": "Backend funcionando"}