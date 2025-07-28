from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# برای محیط توسعه از SQLite استفاده می‌کنیم
SQLALCHEMY_DATABASE_URL = "sqlite:///./attendance.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# تابع برای دریافت جلسه دیتابیس
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 