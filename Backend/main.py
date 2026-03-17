from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import users, auth, books, admin, payments, reviews, social as social_router
import os

from app.models import user, book, payment, review, social


Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)


origins = [ 
    "http://localhost:8080", 
    # "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


os.makedirs("data/books", exist_ok=True)
os.makedirs("data/covers", exist_ok=True)


app.mount("/data", StaticFiles(directory="data"), name="data")


app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(books.router, prefix="/api/v1/books", tags=["books"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])
app.include_router(social_router.router, prefix="/api/v1/social", tags=["social"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Bookify API"}

