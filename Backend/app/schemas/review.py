from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    book_id: int

class ReviewUpdate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int
    user_id: int
    book_id: int
    created_at: datetime
    username: Optional[str] = None

    class Config:
        from_attributes = True

class ReviewStats(BaseModel):
    average_rating: float
    total_reviews: int
