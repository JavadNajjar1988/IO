from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    employee_id = Column(String, unique=True, index=True)
    position = Column(String)
    is_active = Column(Boolean, default=True)
    avatar = Column(Text, nullable=True)  # ستون جدید برای ذخیره تصویر به صورت Base64
    
    # رابطه با جدول رکوردهای ورود و خروج
    attendance_records = relationship("AttendanceRecord", back_populates="employee")

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    timestamp = Column(DateTime, default=datetime.now)
    record_type = Column(String)  # "ورود" یا "خروج"
    
    # رابطه با جدول کارمندان
    employee = relationship("Employee", back_populates="attendance_records") 