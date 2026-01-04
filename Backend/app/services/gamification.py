from sqlalchemy.orm import Session
from app.models.user import User, Achievement, UserAchievement
from app.models.book import UserProgress

def check_and_award_achievements(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
        
    new_achievements = []
    
    
    def award(name, desc, icon):
        ach = db.query(Achievement).filter(Achievement.name == name).first()
        if not ach:
            ach = Achievement(name=name, description=desc, icon=icon)
            db.add(ach)
            db.commit()
            db.refresh(ach)
            
        
        has_it = db.query(UserAchievement).filter(
            UserAchievement.user_id == user.id, 
            UserAchievement.achievement_id == ach.id
        ).first()
        
        if not has_it:
            ua = UserAchievement(user_id=user.id, achievement_id=ach.id)
            db.add(ua)
            db.commit()
            new_achievements.append(ach)

    
    award("Newcomer", "Joined Bookify", "User")

    
    if user.current_streak >= 1:
        award("Streak Started", "Started a listening streak", "Zap")

    
    if user.current_streak >= 3:
        award("Dedicated", "Reached a 3-day streak", "Flame")
        
    
    
    long_listen = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.last_timestamp >= 180
    ).first()
    
    if long_listen:
        award("Listener", "Listened for 3 minutes", "Headphones")

    
    
    if user.used_voices and isinstance(user.used_voices, list):
        if len(user.used_voices) > 1:
            award("Explorer", "Listened with multiple AI voices", "Globe")

    
    completed_book = db.query(UserProgress).filter(
        UserProgress.user_id == user.id,
        UserProgress.is_completed == True
    ).first()
    
    if completed_book:
        award("First Journey", "Completed your first book", "BookOpen")

    
    
    
    
    
    
        
    return new_achievements

def award_quiz_master(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user: return
    
    
    def award(name, desc, icon):
        ach = db.query(Achievement).filter(Achievement.name == name).first()
        if not ach:
            ach = Achievement(name=name, description=desc, icon=icon)
            db.add(ach)
            db.commit()
            db.refresh(ach) 
        has_it = db.query(UserAchievement).filter(UserAchievement.user_id == user.id, UserAchievement.achievement_id == ach.id).first()
        if not has_it:
            ua = UserAchievement(user_id=user.id, achievement_id=ach.id)
            db.add(ua)
            db.commit()
            return ach
    return award("Quiz Master", "Scored 5/5 on a quiz", "Star")

