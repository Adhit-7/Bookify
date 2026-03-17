from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.schemas.review import Review

class UserBasic(BaseModel):
    id: int
    username: Optional[str] = None
    email: str
    full_name: Optional[str] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class FriendshipBase(BaseModel):
    status: str

class Friendship(FriendshipBase):
    id: int
    user_id: int
    friend_id: int
    created_at: datetime
    friend_info: Optional[UserBasic] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    receiver_id: int

class Message(MessageBase):
    id: int
    sender_id: int
    receiver_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChatThread(BaseModel):
    friend: UserBasic
    last_message: Optional[Message] = None
    unread_count: int

class UserActivity(BaseModel):
    book_id: int
    book_title: str
    type: str # "review" or "completion"
    rating: Optional[int] = None
    comment: Optional[str] = None
    timestamp: datetime

class UserProfile(UserBasic):
    bio: Optional[str] = None
    joined_at: datetime
    books_finished: int
    total_reviews: int
    recent_activity: List[UserActivity]
    is_friend: bool = False
    friendship_status: Optional[str] = None # "pending", "accepted", "none"

