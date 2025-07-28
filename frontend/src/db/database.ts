import Dexie from 'dexie';

// تعریف انواع برای ذخیره‌سازی آفلاین
export interface AttendanceRecord {
  id?: number;
  employeeId: number;
  recordType: 'ورود' | 'خروج';
  timestamp: Date;
  synced: boolean;
}

export interface Employee {
  id?: number;
  name: string;
  employeeId: string;
  position: string;
  isActive: boolean;
  avatar?: string; // URL یا Base64 تصویر کارمند
}

// کلاس دیتابیس
class AttendanceDatabase extends Dexie {
  // جداول
  attendanceRecords: Dexie.Table<AttendanceRecord, number>;
  employees: Dexie.Table<Employee, number>;
  
  constructor() {
    super('attendanceDB');
    this.version(2).stores({
      attendanceRecords: '++id, employeeId, recordType, timestamp, synced',
      employees: '++id, employeeId, name, position, isActive, avatar'
    });
    
    this.attendanceRecords = this.table('attendanceRecords');
    this.employees = this.table('employees');
  }
  
  // تابع برای ذخیره رکورد ورود/خروج
  async addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>) {
    try {
      const id = await this.attendanceRecords.add(record);
      return { success: true, id };
    } catch (error) {
      console.error('خطا در ذخیره رکورد:', error);
      return { success: false, error };
    }
  }
  
  // تابع برای دریافت رکوردهای همگام‌نشده
  async getUnsyncedRecords() {
    return await this.attendanceRecords.where('synced').equals(0).toArray();
  }
  
  // تابع برای به‌روزرسانی وضعیت همگام‌سازی
  async markAsSynced(id: number) {
    return await this.attendanceRecords.update(id, { synced: true });
  }
  
  // تابع برای دریافت لیست کارمندان
  async getEmployees() {
    return await this.employees.where('isActive').equals(1).toArray();
  }
}

// ایجاد نمونه از دیتابیس
export const db = new AttendanceDatabase(); 