from sqlalchemy import Boolean, Column, Integer, String, DateTime, JSON
from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True) 
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="user") 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    
    reset_token = Column(String, nullable=True)
    reset_token_expire = Column(DateTime(timezone=True), nullable=True)
    
    
    current_streak = Column(Integer, default=0)
    last_listen_date = Column(DateTime(timezone=True), nullable=True)
    used_voices = Column(JSON, default=list) 

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    icon = Column(String) 

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    achievement_id = Column(Integer, ForeignKey("achievements.id"))
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="achievements")
    achievement = relationship("Achievement")
