from sqlalchemy import Column, Integer, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class auction_bid(Base):
    __tablename__ = "auction_bids"
    id = Column(Integer, primary_key = True, index = True)
    auction_id = Column(Integer, ForeignKey("auctions.id"), nullable = False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable = False)
    monto = Column(Float, nullable = False)
    creado_en = Column(DateTime, default = func.now())

    auction = relationship("Auction", foreign_keys = [auction_id], backref = "bids")
    user = relationship("User", foreign_keys = [user_id], backref="auction_bids")
