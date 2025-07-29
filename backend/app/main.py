from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import attendance

app = FastAPI(
    title="سامانه ثبت ورود و خروج",
    description="API برای ثبت ورود و خروج کارمندان",
    version="0.1.0"
)

# تنظیم CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # اجازه دسترسی از همه آدرس‌ها
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# اضافه کردن روترها
app.include_router(attendance.router, prefix="/api", tags=["attendance"])

@app.get("/")
async def root():
    return {"message": "سامانه ثبت ورود و خروج کارمندان"}

@app.get("/test")
async def test():
    return {"message": "سرور کار می‌کند", "status": "ok"} 