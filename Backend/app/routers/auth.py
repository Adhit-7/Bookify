from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core import security, database
from app.models.user import User
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import secrets

router = APIRouter()

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    """
    Password reset request endpoint.
    Generates a reset token and saves it to the database.
    In production, this should send an email with the reset link.
    """
    user = db.query(User).filter(User.email == request.email).first()
    
    
    
    if user:
        
        reset_token = secrets.token_urlsafe(32)
        
        
        user.reset_token = reset_token
        user.reset_token_expire = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        
        
        reset_link = f"http://localhost:8080/reset-password?token={reset_token}"
        print(f"\n{'='*80}")
        print(f"PASSWORD RESET REQUESTED FOR: {user.email}")
        print(f"Reset Link: {reset_link}")
        print(f"Token expires in 1 hour")
        print(f"{'='*80}\n")
    
    else:
        print(f"\n{'!'*80}")
        print(f"DEBUG: Password reset requested for {request.email}, but user was NOT FOUND in database.")
        print(f"{'!'*80}\n")
    
    return {"message": "If the email exists, password reset instructions have been sent"}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(database.get_db)):
    """
    Reset password endpoint.
    Verifies the token and updates the user's password.
    """
    
    user = db.query(User).filter(User.reset_token == request.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    
    if not user.reset_token_expire or user.reset_token_expire < datetime.utcnow():
        
        user.reset_token = None
        user.reset_token_expire = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    
    user.hashed_password = security.get_password_hash(request.new_password)
    
    
    user.reset_token = None
    user.reset_token_expire = None
    
    db.commit()
    
    print(f"\n✓ Password successfully reset for: {user.email}\n")
    
    return {"message": "Password successfully reset"}

