# سامانه ثبت ورود و خروج کارمندان - بک‌اند

این بخش سمت سرور سامانه ثبت ورود و خروج کارمندان است که با FastAPI پیاده‌سازی شده است.

## راه‌اندازی

### پیش‌نیازها

- پایتون 3.8 یا بالاتر

### نصب وابستگی‌ها

```bash
# فعال‌سازی محیط مجازی
.\venv\Scripts\activate

# نصب کتابخانه‌ها
pip install -r requirements.txt
```

### اجرای پروژه

```bash
# اجرای سرور توسعه
python main.py
```

سرور در آدرس `http://localhost:8000` در دسترس خواهد بود.
مستندات API در آدرس `http://localhost:8000/docs` قابل مشاهده است.

## تنظیمات محیطی

برای تنظیمات محیطی یک فایل `.env` با محتوای زیر ایجاد کنید:

```
DATABASE_URL=sqlite:///./attendance.db
SECRET_KEY=your_secret_key_here
ADMIN_PASSWORD=admin123
ENVIRONMENT=development
```

## ساختار پروژه

- `app/` - پکیج اصلی برنامه
  - `models/` - مدل‌های دیتابیس
  - `routers/` - روترهای API
  - `schemas/` - طرح‌های Pydantic
  - `database.py` - پیکربندی دیتابیس
  - `main.py` - تنظیمات اصلی FastAPI
- `main.py` - نقطه ورودی برنامه 