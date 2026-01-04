from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


class ProgressBase(BaseModel):
    last_timestamp: float
    is_completed: bool = False

class ProgressUpdate(ProgressBase):
    pass

class Progress(ProgressBase):
    id: int
    user_id: int
    book_id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True


class BookmarkBase(BaseModel):
    page_number: int
    progress_percentage: float = 0.0

class BookmarkCreate(BookmarkBase):
    book_id: int

class Bookmark(BookmarkBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BookBase(BaseModel):
    title: str
    author: str
    description: Optional[str] = None

class BookCreate(BookBase):
    pass 

class Book(BookBase):
    id: int
    genre: Optional[str] = None
    cover_image: Optional[str] = None
    file_path: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

