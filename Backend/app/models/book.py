from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    author = Column(String, index=True)
    genre = Column(String, nullable=True) 
    cover_image = Column(String, nullable=True) 
    file_path = Column(String, nullable=False) 
    extracted_text = Column(String, nullable=True) 
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", backref="books")
    bookmarks = relationship("Bookmark", back_populates="book", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan")
    progress = relationship("UserProgress", back_populates="book", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="book", cascade="all, delete-orphan")


class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))
    page_number = Column(Integer, default=1)
    progress_percentage = Column(Float, default=0.0)
    
    
    timestamp = Column(Float, nullable=True) 
    label = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    book = relationship("Book", back_populates="bookmarks")
    user = relationship("User", backref="bookmarks")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"))
    last_timestamp = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    book = relationship("Book", back_populates="progress")
    user = relationship("User", backref="progress")
