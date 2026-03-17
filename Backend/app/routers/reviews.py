from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.core import database, deps
from app.models.review import Review as ReviewModel
from app.models.book import Book as BookModel
from app.models.user import User as UserModel
from app.schemas.review import Review as ReviewSchema, ReviewCreate, ReviewStats

router = APIRouter()

@router.post("/", response_model=ReviewSchema)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(database.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
):
    # Check if book exists
    book = db.query(BookModel).filter(BookModel.id == payload.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Check if user already reviewed this book
    existing_review = db.query(ReviewModel).filter(
        ReviewModel.user_id == current_user.id,
        ReviewModel.book_id == payload.book_id
    ).first()

    if existing_review:
        # Update existing review
        existing_review.rating = payload.rating
        existing_review.comment = payload.comment
        db.commit()
        db.refresh(existing_review)
        
        # Manually attach username for the response
        review_dict = ReviewSchema.model_validate(existing_review)
        review_dict.username = current_user.username or current_user.email
        return review_dict

    # Create new review
    db_review = ReviewModel(
        user_id=current_user.id,
        book_id=payload.book_id,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    # Attach username for the response
    review_dict = ReviewSchema.model_validate(db_review)
    review_dict.username = current_user.username or current_user.email
    return review_dict

@router.get("/book/{book_id}", response_model=List[ReviewSchema])
def get_book_reviews(
    book_id: int,
    db: Session = Depends(database.get_db)
):
    reviews = db.query(ReviewModel).filter(ReviewModel.book_id == book_id).order_by(ReviewModel.created_at.desc()).all()
    
    result = []
    for r in reviews:
        review_dict = ReviewSchema.model_validate(r)
        # Fetch username manually to avoid complex join logic in schema
        user = db.query(UserModel).filter(UserModel.id == r.user_id).first()
        review_dict.username = user.username or user.email if user else "Unknown User"
        result.append(review_dict)
        
    return result

@router.get("/stats/{book_id}", response_model=ReviewStats)
def get_review_stats(
    book_id: int,
    db: Session = Depends(database.get_db)
):
    stats = db.query(
        func.avg(ReviewModel.rating).label("average"),
        func.count(ReviewModel.id).label("total")
    ).filter(ReviewModel.book_id == book_id).first()

    return {
        "average_rating": float(stats.average) if stats.average else 0.0,
        "total_reviews": stats.total if stats.total else 0
    }
