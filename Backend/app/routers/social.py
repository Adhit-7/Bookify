from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List
from app.core import database, deps
from app.models.social import Friendship as FriendshipModel, Message as MessageModel
from app.models.user import User as UserModel
from app.schemas.social import (
    UserBasic, Friendship as FriendshipSchema, 
    Message as MessageSchema, MessageCreate, ChatThread,
    UserProfile, UserActivity
)

router = APIRouter()

@router.get("/search", response_model=List[UserBasic])
def search_users(
    q: str = Query(..., min_length=2),
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    users = db.query(UserModel).filter(
        and_(
            UserModel.id != current_user.id,
            or_(
                UserModel.username.ilike(f"%{q}%"),
                UserModel.email.ilike(f"%{q}%"),
                UserModel.full_name.ilike(f"%{q}%")
            )
        )
    ).limit(10).all()
    return users

@router.post("/request/{friend_id}", response_model=FriendshipSchema)
def send_friend_request(
    friend_id: int,
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    if friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if friend exists
    friend = db.query(UserModel).filter(UserModel.id == friend_id).first()
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already friends or request exists
    existing = db.query(FriendshipModel).filter(
        or_(
            and_(FriendshipModel.user_id == current_user.id, FriendshipModel.friend_id == friend_id),
            and_(FriendshipModel.user_id == friend_id, FriendshipModel.friend_id == current_user.id)
        )
    ).first()

    if existing:
        return existing

    new_request = FriendshipModel(user_id=current_user.id, friend_id=friend_id, status="pending")
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request

@router.get("/requests", response_model=List[FriendshipSchema])
def get_friend_requests(
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    requests = db.query(FriendshipModel).filter(
        FriendshipModel.friend_id == current_user.id,
        FriendshipModel.status == "pending"
    ).all()
    
    # Attach info of requester
    for req in requests:
        user = db.query(UserModel).filter(UserModel.id == req.user_id).first()
        req.friend_info = user
    return requests

@router.post("/accept/{request_id}", response_model=FriendshipSchema)
def accept_friend_request(
    request_id: int,
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    request = db.query(FriendshipModel).filter(
        and_(
            FriendshipModel.id == request_id,
            FriendshipModel.friend_id == current_user.id
        )
    ).first()

    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    request.status = "accepted"
    db.commit()
    db.refresh(request)
    return request

@router.get("/friends", response_model=List[UserBasic])
def get_friends(
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    friendships = db.query(FriendshipModel).filter(
        and_(
            or_(FriendshipModel.user_id == current_user.id, FriendshipModel.friend_id == current_user.id),
            FriendshipModel.status == "accepted"
        )
    ).all()
    
    friend_ids = []
    for f in friendships:
        if f.user_id == current_user.id:
            friend_ids.append(f.friend_id)
        else:
            friend_ids.append(f.user_id)
            
    friends = db.query(UserModel).filter(UserModel.id.in_(friend_ids)).all()
    return friends

@router.get("/chat/{friend_id}", response_model=List[MessageSchema])
def get_chat_history(
    friend_id: int,
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    messages = db.query(MessageModel).filter(
        or_(
            and_(MessageModel.sender_id == current_user.id, MessageModel.receiver_id == friend_id),
            and_(MessageModel.sender_id == friend_id, MessageModel.receiver_id == current_user.id)
        )
    ).order_by(MessageModel.created_at.asc()).all()
    
    # Mark as read
    db.query(MessageModel).filter(
        and_(
            MessageModel.receiver_id == current_user.id,
            MessageModel.sender_id == friend_id,
            MessageModel.is_read == False
        )
    ).update({"is_read": True})
    db.commit()
    
    return messages

@router.post("/chat/send", response_model=MessageSchema)
def send_message(
    payload: MessageCreate,
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    # Verify friendship exists
    friendship = db.query(FriendshipModel).filter(
        and_(
            or_(
                and_(FriendshipModel.user_id == current_user.id, FriendshipModel.friend_id == payload.receiver_id),
                and_(FriendshipModel.user_id == payload.receiver_id, FriendshipModel.friend_id == current_user.id)
            ),
            FriendshipModel.status == "accepted"
        )
    ).first()

    if not friendship:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You must be friends to chat")

    message = MessageModel(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        content=payload.content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message

@router.delete("/friends/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
def unfriend(
    friend_id: int,
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    friendship = db.query(FriendshipModel).filter(
        and_(
            or_(
                and_(FriendshipModel.user_id == current_user.id, FriendshipModel.friend_id == friend_id),
                and_(FriendshipModel.user_id == friend_id, FriendshipModel.friend_id == current_user.id)
            ),
            FriendshipModel.status == "accepted"
        )
    ).first()

    if not friendship:
        raise HTTPException(status_code=404, detail="Friendship not found")

    db.delete(friendship)
    db.commit()
    return None

@router.get("/profile/{user_id}", response_model=UserProfile)
def get_user_profile(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    from app.models.review import Review as ReviewModel
    from app.models.book import Book as BookModel, UserProgress as ProgressModel

    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check friendship status
    friendship = db.query(FriendshipModel).filter(
        or_(
            and_(FriendshipModel.user_id == current_user.id, FriendshipModel.friend_id == user_id),
            and_(FriendshipModel.user_id == user_id, FriendshipModel.friend_id == current_user.id)
        )
    ).first()

    status = "none"
    if friendship:
        status = friendship.status

    # Gather activity
    activity = []

    # Reviews
    reviews = db.query(ReviewModel, BookModel.title).join(BookModel).filter(
        ReviewModel.user_id == user_id
    ).order_by(ReviewModel.created_at.desc()).limit(5).all()
    
    for r, title in reviews:
        activity.append(UserActivity(
            book_id=r.book_id,
            book_title=title,
            type="review",
            rating=r.rating,
            comment=r.comment,
            timestamp=r.created_at
        ))

    # Completions
    completions = db.query(ProgressModel, BookModel.title).join(BookModel).filter(
        ProgressModel.user_id == user_id,
        ProgressModel.is_completed == True
    ).order_by(ProgressModel.updated_at.desc()).limit(5).all()

    for p, title in completions:
        activity.append(UserActivity(
            book_id=p.book_id,
            book_title=title,
            type="completion",
            timestamp=p.updated_at
        ))

    # Sort activity by timestamp
    activity.sort(key=lambda x: x.timestamp, reverse=True)

    # Stats
    books_finished = db.query(ProgressModel).filter(
        ProgressModel.user_id == user_id,
        ProgressModel.is_completed == True
    ).count()
    
    total_reviews = db.query(ReviewModel).filter(ReviewModel.user_id == user_id).count()

    return UserProfile(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        profile_picture=user.profile_picture,
        joined_at=user.created_at or datetime.now(),
        books_finished=books_finished,
        total_reviews=total_reviews,
        recent_activity=activity[:10],
        is_friend=(status == "accepted"),
        friendship_status=status
    )
