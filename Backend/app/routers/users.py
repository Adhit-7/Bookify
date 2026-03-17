from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core import database, security, deps
from app.models.user import User, UserAchievement, Achievement
from app.models.book import UserProgress
from app.schemas.user import UserCreate, User as UserSchema
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

@router.post("/", response_model=UserSchema)
def create_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user.password)
    db_user = User(email=user.email, full_name=user.full_name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

from app.services.gamification import check_and_award_achievements

@router.get("/me", response_model=UserSchema)
def read_users_me(db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    
    check_and_award_achievements(current_user.id, db)
    return current_user


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None 
    bio: Optional[str] = None

@router.put("/me", response_model=UserSchema)
def update_user_me(
    user_update: UserUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.username is not None:
        
        if user_update.username != current_user.username:
            existing = db.query(User).filter(User.username == user_update.username).first()
            if existing:
                raise HTTPException(status_code=400, detail="Username already taken")
            current_user.username = user_update.username
    if user_update.bio is not None:
        current_user.bio = user_update.bio
        
    db.commit()
    db.refresh(current_user)
    return current_user

from fastapi import UploadFile, File
import shutil
import os
import uuid

@router.post("/me/avatar", response_model=UserSchema)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    UPLOAD_DIR = "data/avatars"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    
    db_path = f"data/avatars/{file_id}{ext}"
    current_user.profile_picture = db_path
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/achievements")
def read_my_achievements(db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    
    return [{"name": a.achievement.name, "description": a.achievement.description, "icon": a.achievement.icon, "date": a.earned_at} for a in current_user.achievements]

@router.get("/me/stats")
def get_user_stats(db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    
    books_read = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.is_completed == True
    ).count()

    
    
    
    total_seconds = db.query(func.sum(UserProgress.last_timestamp)).filter(
        UserProgress.user_id == current_user.id
    ).scalar() or 0.0
    
    
    hours = int(total_seconds // 3600)
    minutes = int((total_seconds % 3600) // 60)
    total_listening_str = f"{hours}h {minutes}m"
    
    
    achievement_count = db.query(UserAchievement).filter(
        UserAchievement.user_id == current_user.id
    ).count()
    
    
    recent_raw = db.query(UserAchievement).filter(
        UserAchievement.user_id == current_user.id
    ).order_by(UserAchievement.earned_at.desc()).limit(3).all()
    
    recent_achievements = [
        {
            "name": ua.achievement.name,
            "description": ua.achievement.description,
            "icon": ua.achievement.icon,
            "date": ua.earned_at
        } 
        for ua in recent_raw
    ]

    return {
        "booksRead": books_read,
        "totalListening": total_listening_str,
        "achievements": achievement_count,
        "currentStreak": current_user.current_streak,
        "recentAchievements": recent_achievements,
        
        "dailyGoalCurrent": "0h 0m",
        "dailyGoalTarget": "1h", 
        "dailyGoalProgress": 0
    }
