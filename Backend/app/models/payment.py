from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    amount = Column(Float, default=99.0)
    status = Column(String, default="pending")  # pending | success | failed
    transaction_id = Column(String, unique=True, index=True, nullable=False)
    esewa_id = Column(String, nullable=True)  # mock eSewa ID used
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="payments")
    book = relationship("Book", back_populates="payments")
