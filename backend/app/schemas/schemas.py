from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# طرح‌های کارمند
class EmployeeBase(BaseModel):
    name: str
    employee_id: str
    position: str
    is_active: bool = True
    avatar: Optional[str] = None  # برای ذخیره تصویر به صورت Base64

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    
    class Config:
        from_attributes = True

# طرح‌های ثبت ورود و خروج
class AttendanceRecordBase(BaseModel):
    record_type: str  # "ورود" یا "خروج"

class AttendanceRecordCreate(AttendanceRecordBase):
    employee_id: int

class AttendanceRecord(AttendanceRecordBase):
    id: int
    employee_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# طرح‌های پاسخ
class AttendanceResponse(BaseModel):
    success: bool
    message: str
    record: Optional[AttendanceRecord] = None 