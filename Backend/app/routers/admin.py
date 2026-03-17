from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core import database, deps
from app.models.user import User
from app.models.book import Book, Bookmark, UserProgress
from app.models.payment import Payment
from app.models.review import Review
from app.schemas.user import User as UserSchema

router = APIRouter()

def check_admin(current_user: User = Depends(deps.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not an authorized admin")
    return current_user

@router.get("/stats")
def get_admin_stats(db: Session = Depends(database.get_db), current_user: User = Depends(check_admin)):
    total_users = db.query(User).count()
    total_books = db.query(Book).count()
    total_reads = db.query(UserProgress).filter(UserProgress.is_completed == True).count()
    
    
    
    active_users = db.query(User).filter(User.is_active == True).count()
    
    return [
        {"label": "Total Users", "value": total_users, "icon": "Users", "change": "+12%"},
        {"label": "Total Books", "value": total_books, "icon": "BookOpen", "change": "+4%"},
        {"label": "Active Readers", "value": active_users, "icon": "Headphones", "change": "+8%"},
        {"label": "Books Completed", "value": total_reads, "icon": "TrendingUp", "change": "+24%"}
    ]

@router.get("/recent-activity")
def get_recent_activity(db: Session = Depends(database.get_db), current_user: User = Depends(check_admin)):
    """Get recent user activity (progress updates)"""
    recent_progress = db.query(UserProgress).order_by(UserProgress.updated_at.desc()).limit(5).all()
    
    activity_list = []
    for progress in recent_progress:
        user = db.query(User).filter(User.id == progress.user_id).first()
        book = db.query(Book).filter(Book.id == progress.book_id).first()
        
        if user and book:
            action = "completed" if progress.is_completed else "read"
            activity_list.append({
                "action": f"{action} {book.title}",
                "user": user.full_name or user.email,
                "time": progress.updated_at.strftime("%Y-%m-%d %H:%M")
            })
            
    return activity_list

@router.get("/users")
def get_all_users(db: Session = Depends(database.get_db), current_user: User = Depends(check_admin)):
    users = db.query(User).all()
    
    result = []
    for u in users:
        books_read = db.query(UserProgress).filter(UserProgress.user_id == u.id, UserProgress.is_completed == True).count()
        result.append({
            "id": u.id,
            "name": u.full_name or "Unknown",
            "email": u.email,
            "role": u.role,
            "lastActive": u.last_listen_date.strftime("%Y-%m-%d") if u.last_listen_date else "Never",
            "booksRead": books_read,
            "joinedAt": u.created_at.strftime("%Y-%m-%d") if u.created_at else "N/A",
            "profile_picture": u.profile_picture
        })
    return result

@router.post("/users/{user_id}/toggle_status")
def toggle_user_status(user_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(check_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot ban yourself")
        
    user.is_active = not user.is_active
    db.commit()
    return {"message": "User status updated", "status": "active" if user.is_active else "banned"}

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(check_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")
         
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


from fastapi import UploadFile, File, Form
import shutil
import os
import uuid
from app.services.pdf_service import extract_text_from_pdf, extract_first_page_as_image

UPLOAD_DIR = "data/books"

@router.post("/books")
async def upload_book_admin(
    title: str = Form(...),
    author: str = Form(...),
    genre: str = Form(...),
    file: UploadFile = File(...),
    cover: UploadFile = File(None),  
    db: Session = Depends(database.get_db),
    current_user: User = Depends(check_admin)
):
    """Admin-only endpoint to upload books"""
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    os.makedirs("data/covers", exist_ok=True)
    
    
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    
    cover_image_path = None
    if cover and cover.filename:
        
        cover_extension = os.path.splitext(cover.filename)[1]
        cover_filename = f"{file_id}_cover{cover_extension}"
        cover_image_path = os.path.join("data/covers", cover_filename)
        
        with open(cover_image_path, "wb") as cover_buffer:
            shutil.copyfileobj(cover.file, cover_buffer)
    else:
        
        cover_image_path = extract_first_page_as_image(file_path)
    
    
    extracted_text = extract_text_from_pdf(file_path)
    
    
    db_book = Book(
        title=title,
        author=author,
        genre=genre,
        file_path=file_path,
        cover_image=cover_image_path if cover_image_path else None,
        extracted_text=extracted_text,
        owner_id=current_user.id  
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    
    return {
        "id": db_book.id,
        "title": db_book.title,
        "author": db_book.author,
        "genre": db_book.genre,
        "cover_image": db_book.cover_image,
        "status": "published",
        "uploaded_at": db_book.created_at.strftime("%Y-%m-%d")
    }

@router.get("/books")
def get_all_books_admin(db: Session = Depends(database.get_db), current_user: User = Depends(check_admin)):
    """Admin endpoint to get all books"""
    books = db.query(Book).all()
    return [{
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "genre": book.genre,
        "cover_image": book.cover_image,
        "status": "published",
        "uploaded_at": book.created_at.strftime("%Y-%m-%d") if book.created_at else "N/A"
    } for book in books]

@router.put("/books/{book_id}")
async def update_book_admin(
    book_id: int,
    title: str = Form(None),
    author: str = Form(None),
    genre: str = Form(None),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(check_admin)
):
    """Admin endpoint to update book details"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if title:
        book.title = title
    if author:
        book.author = author
    if genre:
        book.genre = genre
        
    db.commit()
    db.refresh(book)
    
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "genre": book.genre,
        "cover_image": book.cover_image,
        "status": "published",
        "uploaded_at": book.created_at.strftime("%Y-%m-%d") if book.created_at else "N/A"
    }

@router.delete("/books/{book_id}")
def delete_book_admin(book_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(check_admin)):
    """Admin endpoint to delete a book"""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Try to clean up local files
    try:
        if os.path.exists(book.file_path):
            os.remove(book.file_path)
            
        if book.cover_image and os.path.exists(book.cover_image):
            os.remove(book.cover_image)
            
        # Clean up all audio and alignment files
        import glob
        basename = os.path.basename(book.file_path)
        pattern = os.path.join(UPLOAD_DIR, f"{basename}*")
        for f in glob.glob(pattern):
            try:
                os.remove(f)
            except:
                pass
    except Exception as e:
        print(f"Error during file cleanup for book {book_id}: {e}")

    # SQLAlchemy will handle deleting associated records due to cascade="all, delete-orphan"
    db.delete(book)
    db.commit()
    return {"message": "Book deleted successfully"}

