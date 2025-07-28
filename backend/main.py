import uvicorn
from app.main import app
from app.database import engine, Base

# ایجاد جداول دیتابیس در اولین اجرا
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 