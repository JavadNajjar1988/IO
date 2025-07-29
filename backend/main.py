import uvicorn
from app.main import app
from app.database import engine, Base

# ایجاد جداول دیتابیس در اولین اجرا
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",  # اجازه دسترسی از همه IP ها
        port=8000,
        reload=True
    ) 