from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.routers import users, auth, books, admin
import os

from app.models import user, book


Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)


origins = [
    "http://localhost",
    "http://localhost:5173", 
    "http://localhost:8080", 
    "http://localhost:3000",
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Bookify API"}

