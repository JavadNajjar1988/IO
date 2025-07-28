# سامانه ثبت ورود و خروج کارمندان

یک سامانه PWA آفلاین برای ثبت ورود و خروج کارمندان با استفاده از React + FastAPI

## 🚀 ویژگی‌ها

- ✅ ثبت ورود/خروج با یک کلیک
- ✅ قابلیت آفلاین (PWA)
- ✅ پنل مدیریت کارمندان
- ✅ آپلود تصویر کارمندان
- ✅ گزارش‌گیری از حضور و غیاب
- ✅ محاسبه ساعات کاری
- ✅ تقویم فارسی
- ✅ اعلان‌های لحظه‌ای برای مدیر

## 🛠️ تکنولوژی‌های استفاده شده

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- Vite
- Dexie.js (IndexedDB)
- React Router DOM

### Backend
- FastAPI
- SQLite
- SQLAlchemy
- Pydantic

## 📦 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js (نسخه 18 یا بالاتر)
- Python (نسخه 3.8 یا بالاتر)
- Git

### ۱. کلون کردن پروژه
```bash
git clone https://github.com/your-username/attendance-system.git
cd attendance-system
```

### ۲. راه‌اندازی Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python init_db.py
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### ۳. راه‌اندازی Frontend
```bash
cd frontend
npm install
npm run dev
```

### ۴. دسترسی به برنامه
- صفحه اصلی: http://localhost:5173
- پنل مدیریت: http://localhost:5173/admin
- صفحه ورود: http://localhost:5173/login

### اطلاعات ورود ادمین
- نام کاربری: `admin`
- کلمه عبور: `admin123`

## 🌐 Deploy

### Deploy روی Vercel (Frontend)
1. پروژه را در GitHub push کنید
2. در Vercel یک پروژه جدید بسازید
3. فولدر `frontend` را انتخاب کنید
4. متغیرهای محیطی زیر را تنظیم کنید:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

### Deploy روی Railway/Render (Backend)
1. فولدر `backend` را در یک repository جداگانه push کنید
2. در Railway/Render یک سرویس جدید بسازید
3. فایل `requirements.txt` را در root قرار دهید
4. متغیرهای محیطی زیر را تنظیم کنید:
   ```
   DATABASE_URL=sqlite:///./attendance.db
   ```

## 📁 ساختار پروژه

```
attendance-system/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/       # کامپوننت‌های React
│   │   ├── pages/           # صفحات اصلی
│   │   ├── services/        # سرویس‌های API
│   │   ├── db/              # دیتابیس محلی (IndexedDB)
│   │   └── main.tsx         # نقطه شروع برنامه
│   ├── public/              # فایل‌های استاتیک
│   └── package.json
├── backend/                  # FastAPI Backend
│   ├── app/
│   │   ├── models/          # مدل‌های دیتابیس
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   └── main.py          # نقطه شروع FastAPI
│   ├── requirements.txt
│   └── init_db.py           # اسکریپت راه‌اندازی دیتابیس
└── README.md
```

## 🔧 تنظیمات

### تغییر آدرس API
در فایل `frontend/src/services/attendanceService.ts`:
```typescript
const API_URL = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';
```

### تغییر تنظیمات دیتابیس
در فایل `backend/app/database.py`:
```python
DATABASE_URL = "sqlite:///./attendance.db"
```

## 📝 API Endpoints

### کارمندان
- `GET /api/employees/` - دریافت لیست کارمندان
- `GET /api/employees/{id}` - دریافت کارمند خاص
- `POST /api/employees/` - افزودن کارمند جدید
- `PUT /api/employees/{id}` - ویرایش کارمند

### حضور و غیاب
- `POST /api/attendance/` - ثبت ورود/خروج
- `GET /api/attendance/` - دریافت گزارش حضور و غیاب

## 🤝 مشارکت

1. Fork کنید
2. یک branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add some amazing feature'`)
4. به branch push کنید (`git push origin feature/amazing-feature`)
5. یک Pull Request باز کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

## 📞 پشتیبانی

برای سوالات و مشکلات، یک Issue در GitHub باز کنید. 