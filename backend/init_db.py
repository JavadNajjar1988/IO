from app.database import get_db, Base, engine
from app.models.models import Employee, AttendanceRecord
from sqlalchemy.orm import Session

# ایجاد جداول
Base.metadata.create_all(bind=engine)

# آواتارهای پیش‌فرض (Base64 فرضی)
default_avatars = [
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNkN2Q0ZWY7Ii8+PHBhdGggZD0ibTE0Ny45NywyMy43NmMtNjAuMjcsNS0xMDcuNyw1Mi40My0xMTIuNywxMTIuN0w5My4wMywxNzguMjZsODUuMjEtNDEuOTNWMjMuNzZaIiBzdHlsZT0iZmlsbDojMzk0OWFiOyIvPjxjaXJjbGUgY3g9IjExNS41IiBjeT0iMTEyLjUiIHI9IjM2LjUiIHN0eWxlPSJmaWxsOiNmZmY7Ii8+PC9zdmc+',  
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNmYmQzZTk7Ii8+PHBhdGggZD0ibTE0Ny45NywyMy43NmMtNjAuMjcsNS0xMDcuNyw1Mi40My0xMTIuNywxMTIuN0w5My4wMywxNzguMjZsODUuMjEtNDEuOTNWMjMuNzZaIiBzdHlsZT0iZmlsbDojZjUwMDU3OyIvPjxjaXJjbGUgY3g9IjExNS41IiBjeT0iMTEyLjUiIHI9IjM2LjUiIHN0eWxlPSJmaWxsOiNmZmY7Ii8+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNkN2VmZDQ7Ii8+PHBhdGggZD0ibTE0Ny45NywyMy43NmMtNjAuMjcsNS0xMDcuNyw1Mi40My0xMTIuNywxMTIuN0w5My4wMywxNzguMjZsODUuMjEtNDEuOTNWMjMuNzZaIiBzdHlsZT0iZmlsbDojMDBiZmE1OyIvPjxjaXJjbGUgY3g9IjExNS41IiBjeT0iMTEyLjUiIHI9IjM2LjUiIHN0eWxlPSJmaWxsOiNmZmY7Ii8+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNlZmQ3ZDQ7Ii8+PHBhdGggZD0ibTE0Ny45NywyMy43NmMtNjAuMjcsNS0xMDcuNyw1Mi40My0xMTIuNywxMTIuN0w5My4wMywxNzguMjZsODUuMjEtNDEuOTNWMjMuNzZaIiBzdHlsZT0iZmlsbDojZmYzZDAwOyIvPjxjaXJjbGUgY3g9IjExNS41IiBjeT0iMTEyLjUiIHI9IjM2LjUiIHN0eWxlPSJmaWxsOiNmZmY7Ii8+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNkN2ViZWY7Ii8+PHBhdGggZD0ibTE0Ny45NywyMy43NmMtNjAuMjcsNS0xMDcuNyw1Mi40My0xMTIuNywxMTIuN0w5My4wMywxNzguMjZsODUuMjEtNDEuOTNWMjMuNzZaIiBzdHlsZT0iZmlsbDojMjE5NmYzOyIvPjxjaXJjbGUgY3g9IjExNS41IiBjeT0iMTEyLjUiIHI9IjM2LjUiIHN0eWxlPSJmaWxsOiNmZmY7Ii8+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNlZmVjZDc7Ii8+PHBhdGggZD0ibTE0Ny45NywyMy43NmMtNjAuMjcsNS0xMDcuNyw1Mi40My0xMTIuNywxMTIuN0w5My4wMywxNzguMjZsODUuMjEtNDEuOTNWMjMuNzZaIiBzdHlsZT0iZmlsbDojZmZhYjAwOyIvPjxjaXJjbGUgY3g9IjExNS41IiBjeT0iMTEyLjUiIHI9IjM2LjUiIHN0eWxlPSJmaWxsOiNmZmY7Ii8+PC9zdmc+',
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMzEgMjMxIj48cGF0aCBkPSJNMzMuODMsMzMuODNhMTE1LjUsMTE1LjUsMCwxLDEsMCwxNjMuMzQsMTE1LjQ5LDExNS40OSwwLDAsMSwwLTE2My4zNFoiIHN0eWxlPSJmaWxsOiNlN2Q3ZWY7Ii8+PHBhdGggZD0ibTE0Ny45NywyMy43NmMtNjAuMjcsNS0xMDcuNyw1Mi40My0xMTIuNywxMTIuN0w5My4wMywxNzguMjZsODUuMjEtNDEuOTNWMjMuNzZaIiBzdHlsZT0iZmlsbDojOWMyN2IwOyIvPjxjaXJjbGUgY3g9IjExNS41IiBjeT0iMTEyLjUiIHI9IjM2LjUiIHN0eWxlPSJmaWxsOiNmZmY7Ii8+PC9zdmc+'
]

# اضافه کردن داده‌های اولیه
def init_db():
    db = next(get_db())
    
    # حذف داده‌های موجود
    db.query(AttendanceRecord).delete()
    db.query(Employee).delete()
    
    # افزودن کارمندان
    employees = [
        Employee(
            name="علی محمدی",
            employee_id="10001",
            position="برنامه‌نویس ارشد",
            is_active=True,
            avatar=default_avatars[0]
        ),
        Employee(
            name="سارا احمدی",
            employee_id="10002",
            position="طراح رابط کاربری",
            is_active=True,
            avatar=default_avatars[1]
        ),
        Employee(
            name="حسین کریمی",
            employee_id="10003",
            position="مدیر محصول",
            is_active=True,
            avatar=default_avatars[2]
        ),
        Employee(
            name="مریم رضایی",
            employee_id="10004",
            position="متخصص بازاریابی",
            is_active=True,
            avatar=default_avatars[3]
        ),
        Employee(
            name="محمد جعفری",
            employee_id="10005",
            position="توسعه‌دهنده موبایل",
            is_active=True,
            avatar=default_avatars[4]
        ),
        Employee(
            name="زهرا حسینی",
            employee_id="10006",
            position="مدیر پروژه",
            is_active=True,
            avatar=default_avatars[5]
        ),
        Employee(
            name="امیر عباسی",
            employee_id="10007",
            position="تحلیلگر داده",
            is_active=True,
            avatar=default_avatars[6]
        )
    ]
    
    db.add_all(employees)
    db.commit()
    
    print("دیتابیس با موفقیت مقداردهی اولیه شد.")

if __name__ == "__main__":
    init_db() 