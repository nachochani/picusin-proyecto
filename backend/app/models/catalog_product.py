from sqlalchemy import Column, Integer, ForeignKey
from app.database import Base

class CatalogProduct(Base):
    __tablename__ = "catalog_products"

    id = Column(Integer, primary_key=True, index=True)
    catalog_id = Column(Integer, ForeignKey("weekly_catalogs.id"))
    product_id = Column(Integer, ForeignKey("products.id"))