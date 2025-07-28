from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Employee, AttendanceRecord
from app.schemas.schemas import AttendanceRecordCreate, AttendanceResponse, AttendanceRecord as AttendanceRecordSchema
from app.schemas.schemas import EmployeeBase, Employee as EmployeeSchema, EmployeeCreate
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/attendance/", response_model=AttendanceResponse)
async def record_attendance(
    attendance: AttendanceRecordCreate,
    db: Session = Depends(get_db)
):
    # بررسی وجود کارمند
    employee = db.query(Employee).filter(Employee.id == attendance.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کارمند با این شناسه یافت نشد"
        )
    
    # ایجاد رکورد جدید
    new_record = AttendanceRecord(
        employee_id=attendance.employee_id,
        record_type=attendance.record_type,
        timestamp=datetime.now()
    )
    
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    
    # ساخت پاسخ
    message = f"{employee.name} با موفقیت {attendance.record_type} خود را ثبت کرد"
    
    return AttendanceResponse(
        success=True,
        message=message,
        record=new_record
    )

@router.get("/employees/{employee_id}/last-record")
async def get_last_record(employee_id: int, db: Session = Depends(get_db)):
    # بررسی وجود کارمند
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کارمند با این شناسه یافت نشد"
        )
    
    # دریافت آخرین رکورد
    last_record = db.query(AttendanceRecord)\
        .filter(AttendanceRecord.employee_id == employee_id)\
        .order_by(AttendanceRecord.timestamp.desc())\
        .first()
    
    if not last_record:
        return {"message": "هیچ رکوردی برای این کارمند یافت نشد", "last_record": None}
    
    return {"message": "آخرین رکورد کارمند", "last_record": last_record}

# اندپوینت‌های جدید مدیریت کارمندان

@router.get("/employees/", response_model=List[EmployeeSchema])
async def get_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    return employees

@router.get("/employees/{employee_id}", response_model=EmployeeSchema)
async def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کارمند با این شناسه یافت نشد"
        )
    return employee

@router.post("/employees/", response_model=EmployeeSchema)
async def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    # بررسی تکراری بودن کد پرسنلی
    existing_employee = db.query(Employee).filter(Employee.employee_id == employee.employee_id).first()
    if existing_employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="کارمندی با این کد پرسنلی قبلاً ثبت شده است"
        )
    
    # ایجاد کارمند جدید
    db_employee = Employee(
        name=employee.name,
        employee_id=employee.employee_id,
        position=employee.position,
        is_active=employee.is_active,
        avatar=employee.avatar
    )
    
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    return db_employee

@router.put("/employees/{employee_id}", response_model=EmployeeSchema)
async def update_employee(
    employee_id: int, 
    employee_data: EmployeeBase,
    db: Session = Depends(get_db)
):
    # بررسی وجود کارمند
    db_employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کارمند با این شناسه یافت نشد"
        )
    
    # به‌روزرسانی اطلاعات
    db_employee.name = employee_data.name
    db_employee.employee_id = employee_data.employee_id
    db_employee.position = employee_data.position
    db_employee.is_active = employee_data.is_active
    
    # به‌روزرسانی تصویر فقط اگر ارسال شده باشد
    if employee_data.avatar is not None:
        db_employee.avatar = employee_data.avatar
    
    db.commit()
    db.refresh(db_employee)
    
    return db_employee 