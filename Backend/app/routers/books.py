from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Header
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
import uuid
from app.core import database, deps
from app.models.book import Book, Bookmark, UserProgress
from app.schemas.book import Book as BookSchema, BookmarkCreate, Bookmark as BookmarkSchema, ProgressUpdate, Progress as ProgressSchema
from app.models.user import User
from app.services.pdf_service import extract_text_from_pdf
from app.services.tts import generate_audio_from_text
from app.services.nlp_service import NLPService
from app.services.gamification import check_and_award_achievements, award_quiz_master
from fastapi.responses import FileResponse
from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel
import json

router = APIRouter()
UPLOAD_DIR = "data/books"


class AudioGenerationRequest(BaseModel):
    voice: Optional[str] = "voice1"

class BookmarkCreate(BaseModel):
    label: str
    timestamp: float 

class BookmarkResponse(BaseModel):
    id: int
    label: str
    timestamp: float
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", response_model=BookSchema)
async def upload_book(
    title: str = Form(...), 
    author: str = Form(...), 
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    
    db_book = Book(
        title=title,
        author=author,
        file_path=file_path,
        owner_id=current_user.id
    )
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    
    return db_book

from sqlalchemy import or_

@router.get("/", response_model=List[BookSchema])
def read_books(skip: int = 0, limit: int = 100, q: str = None, db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    
    query = db.query(Book)
    
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Book.title.ilike(search),
                Book.author.ilike(search)
            )
        )
        
    books = query.offset(skip).limit(limit).all()
    return books

@router.get("/{book_id}", response_model=BookSchema)
def read_book(book_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if book is None:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.get("/now-playing", response_model=Optional[BookSchema])
def get_now_playing(db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id
    ).order_by(UserProgress.updated_at.desc()).first()
    
    if not progress:
        return None
        
    book = db.query(Book).filter(Book.id == progress.book_id).first()
    return book

@router.get("/recommendations/list", response_model=List[BookSchema])
def get_recommendations(
    limit: int = 4, 
    genre: Optional[str] = None,
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    
    
    
    

    if genre and genre != "All" and genre != "Unknown":
        
        
        candidates = db.query(Book).filter(Book.genre == genre).all()
        import random
        if not candidates:
             return []
        
        if len(candidates) > limit:
            return random.sample(candidates, limit)
        return candidates

    
    in_progress_entries = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.is_completed == False,
        UserProgress.last_timestamp > 0
    ).order_by(UserProgress.updated_at.desc()).limit(limit).all()
    
    if in_progress_entries:
        book_ids = [entry.book_id for entry in in_progress_entries]
        books = db.query(Book).filter(Book.id.in_(book_ids)).all()
        return books
        
    
    import random
    
    
    candidates = db.query(Book).order_by(Book.created_at.desc()).limit(20).all()
    if len(candidates) > limit:
        books = random.sample(candidates, limit)
    else:
        books = candidates
    return books




@router.post("/{book_id}/audio")
async def generate_book_audio(
    book_id: int, 
    request: AudioGenerationRequest = AudioGenerationRequest(), 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    
    if book.extracted_text:
        text = book.extracted_text
    else:
        text = extract_text_from_pdf(book.file_path)
        if not text:
             raise HTTPException(status_code=400, detail="Could not extract text from book")
        book.extracted_text = text
        db.commit()
    
    
    
    audio_filename = f"{os.path.basename(book.file_path)}_{request.voice}.mp3"
    audio_path = os.path.join(UPLOAD_DIR, audio_filename)
    
    
    
    alignment_path = os.path.join(UPLOAD_DIR, f"{audio_filename}.json")
    if os.path.exists(audio_path) and os.path.exists(alignment_path):
         try:
             with open(alignment_path, "r") as f:
                 data = json.load(f)
                 
                 
                 
                 
                 
                 
                 has_sentences = any(" " in item.get("text", "").strip() for item in data)
                 if data and (has_sentences or len(data) < 50): 
                     return {"message": "Audio available", "audio_url": f"/api/v1/books/{book_id}/audio?voice={request.voice}"}
         except:
             pass 
         
    
    
    success = await generate_audio_from_text(text[:5000], audio_path, request.voice) 
    
    
    if request.voice:
        
        current_voices = current_user.used_voices or []
        if isinstance(current_voices, str):
             import json
             try: current_voices = json.loads(current_voices)
             except: current_voices = []
             
        if request.voice not in current_voices:
            
            new_voices = list(current_voices)
            new_voices.append(request.voice)
            current_user.used_voices = new_voices
            db.commit()
            
            
            check_and_award_achievements(current_user.id, db)

    if not success:
        raise HTTPException(status_code=500, detail="Audio generation failed")
    
    
    
    
    return {"message": "Audio generated successfully", "audio_url": f"/api/v1/books/{book_id}/audio?voice={request.voice}"}

@router.get("/{book_id}/alignment")
def get_book_alignment(
    book_id: int, 
    voice: str = "voice1",
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    audio_filename = f"{os.path.basename(book.file_path)}_{voice}.mp3"
    alignment_path = os.path.join(UPLOAD_DIR, audio_filename + ".json")
    
    if not os.path.exists(alignment_path):
        
        
        return []
        
    with open(alignment_path, "r") as f:
        data = json.load(f)
        return data

@router.get("/{book_id}/audio")
def get_book_audio(
    book_id: int,
    voice: str = "voice1",
    db: Session = Depends(database.get_db), 
    token: Optional[str] = None,
    authorization: Optional[str] = Header(None)
):
    

    actual_token = token
    if not actual_token and authorization:
        if authorization.startswith("Bearer "):
            actual_token = authorization.split(" ")[1]

    user = None
    if actual_token:
        try:
            user = deps.get_current_user_from_token(actual_token, db)
        except Exception:
            user = None
    
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    audio_filename = f"{os.path.basename(book.file_path)}_{voice}.mp3"
    audio_path = os.path.join(UPLOAD_DIR, audio_filename)
    
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found. Please generate it first.")
        
    return FileResponse(audio_path, media_type="audio/mpeg", filename=audio_filename)


@router.post("/{book_id}/progress", response_model=ProgressSchema)
def update_progress(
    book_id: int, 
    progress: ProgressUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    db_progress = db.query(UserProgress).filter(
        UserProgress.book_id == book_id, 
        UserProgress.user_id == current_user.id
    ).first()
    
    if db_progress:
        db_progress.last_timestamp = progress.last_timestamp
        
        
        if progress.is_completed:
            db_progress.is_completed = True
    else:
        db_progress = UserProgress(
            user_id=current_user.id,
            book_id=book_id,
            last_timestamp=progress.last_timestamp,
            is_completed=progress.is_completed
        )
        db.add(db_progress)
        
    
    today = datetime.now().date()
    if current_user.last_listen_date:
        
        last_date = current_user.last_listen_date.replace(tzinfo=None).date() if current_user.last_listen_date.tzinfo else current_user.last_listen_date.date()
        if last_date == today - timedelta(days=1):
            current_user.current_streak += 1
        elif last_date < today - timedelta(days=1):
            current_user.current_streak = 1 
        
    else:
        current_user.current_streak = 1
        
    current_user.last_listen_date = datetime.now()
        
        
    db.commit()
    db.refresh(db_progress)
    
    
    check_and_award_achievements(current_user.id, db)
    
    return db_progress

@router.get("/{book_id}/progress", response_model=ProgressSchema)
def get_progress(
    book_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    db_progress = db.query(UserProgress).filter(
        UserProgress.book_id == book_id, 
        UserProgress.user_id == current_user.id
    ).first()
    
    if not db_progress:
        
        now = datetime.now(timezone.utc)
        return {
            "id": 0,
            "user_id": current_user.id, 
            "book_id": book_id, 
            "last_timestamp": 0.0, 
            "is_completed": False,
            "created_at": now,
            "updated_at": now
        }
        
    return db_progress


@router.get("/{book_id}/quiz")
def get_book_quiz(book_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    
    text = extract_text_from_pdf(book.file_path)
    if not text:
         raise HTTPException(status_code=400, detail="Could not extract text to generate quiz")
    
    questions = NLPService.generate_quiz(text)
    return questions

class QuizResult(BaseModel):
    score: int
    total: int

@router.post("/{book_id}/quiz/result")
def submit_quiz_result(
    book_id: int, 
    result: QuizResult,
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    if result.score == 5:
        
        award_quiz_master(current_user.id, db)
    return {"status": "recorded"}

@router.get("/{book_id}/summary")
def get_book_summary(book_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    text = extract_text_from_pdf(book.file_path)
    if not text:
         raise HTTPException(status_code=400, detail="Could not extract text")
         
    summary = NLPService.generate_summary(text)
    return {"summary": summary}

@router.get("/{book_id}/text")
def get_book_text(book_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    if book.extracted_text:
        return {"text": book.extracted_text}

    text = extract_text_from_pdf(book.file_path)
    if not text:
         raise HTTPException(status_code=400, detail="Could not extract text")
    
    book.extracted_text = text
    db.commit()
         
    return {"text": text}


@router.delete("/{book_id}", status_code=204)
def delete_book(book_id: int, db: Session = Depends(database.get_db), current_user: User = Depends(deps.get_current_user)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    
    if os.path.exists(book.file_path):
        os.remove(book.file_path)
    
    
    import glob
    basename = os.path.basename(book.file_path)
    
    
    
    
    pattern = os.path.join(UPLOAD_DIR, f"{basename}*")
    for f in glob.glob(pattern):
        try:
            os.remove(f)
        except:
            pass
        
    
    legacy_audio = os.path.join(UPLOAD_DIR, f"{basename}.mp3")
    if os.path.exists(legacy_audio):
        os.remove(legacy_audio)
        
    db.delete(book)
    db.commit()
    return None



@router.post("/{book_id}/bookmarks", response_model=BookmarkResponse)
def create_book_bookmark(
    book_id: int, 
    bookmark: BookmarkCreate, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    new_bookmark = Bookmark(
        user_id=current_user.id,
        book_id=book_id,
        label=bookmark.label,
        timestamp=bookmark.timestamp
    )
    db.add(new_bookmark)
    
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.book_id == book_id
    ).first()
    
    if progress:
        progress.last_timestamp = bookmark.timestamp
    else:
        progress = UserProgress(
            user_id=current_user.id,
            book_id=book_id,
            last_timestamp=bookmark.timestamp
        )
        db.add(progress)
        
    db.commit()
    db.refresh(new_bookmark)
    
    return BookmarkResponse(
        id=new_bookmark.id,
        label=new_bookmark.label or f"Bookmark at {int(new_bookmark.timestamp)}s",
        timestamp=new_bookmark.timestamp,
        created_at=new_bookmark.created_at.isoformat()
    )

@router.get("/{book_id}/bookmarks", response_model=List[BookmarkResponse])
def get_book_bookmarks(
    book_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_user)
):
    bookmarks = db.query(Bookmark).filter(
        Bookmark.book_id == book_id,
        Bookmark.user_id == current_user.id
    ).order_by(Bookmark.timestamp.asc()).all()
    
    return [
        BookmarkResponse(
            id=b.id,
            label=b.label or f"Bookmark at {int(b.timestamp or 0)}s",
            timestamp=b.timestamp or 0.0,
            created_at=b.created_at.isoformat() if b.created_at else ""
        ) for b in bookmarks
    ]

@router.delete("/{book_id}/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(
    book_id: int,
    bookmark_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    bookmark = db.query(Bookmark).filter(
        Bookmark.id == bookmark_id,
        Bookmark.book_id == book_id,
        Bookmark.user_id == current_user.id
    ).first()
    
    if not bookmark:
         raise HTTPException(status_code=404, detail="Bookmark not found")
         
    db.delete(bookmark)
    db.commit()
    return None
