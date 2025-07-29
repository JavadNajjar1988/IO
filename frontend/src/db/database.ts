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

// تایپ برای عملیات‌های آفلاین کارمندان
export interface EmployeeOperation {
  id?: number;
  type: 'create' | 'update' | 'delete';
  employeeId?: number;
  employeeData?: Employee;
  timestamp: Date;
  synced: boolean;
}

// کلاس دیتابیس
class AttendanceDatabase extends Dexie {
  // جداول
  attendanceRecords: Dexie.Table<AttendanceRecord, number>;
  employees: Dexie.Table<Employee, number>;
  employeeOperations: Dexie.Table<EmployeeOperation, number>;
  
  constructor() {
    super('attendanceDB');
    this.version(3).stores({
      attendanceRecords: '++id, employeeId, recordType, timestamp, synced',
      employees: '++id, employeeId, name, position, isActive, avatar',
      employeeOperations: '++id, type, employeeId, timestamp, synced'
    });
    
    this.attendanceRecords = this.table('attendanceRecords');
    this.employees = this.table('employees');
    this.employeeOperations = this.table('employeeOperations');
  }
  
  // تابع برای ذخیره رکورد ورود/خروج
  async addAttendanceRecord(record: Omit<AttendanceRecord, 'id'>) {
    try {
      const id = await this.attendanceRecords.add(record);
      return { success: true, id: id as number };
    } catch (error) {
      console.error('خطا در ذخیره رکورد:', error);
      return { success: false, error };
    }
  }
  
  // تابع برای دریافت رکوردهای همگام‌نشده
  async getUnsyncedRecords() {
    const allRecords = await this.attendanceRecords.toArray();
    return allRecords.filter(record => !record.synced);
  }
  
  // تابع برای به‌روزرسانی وضعیت همگام‌سازی
  async markAsSynced(id: number) {
    return await this.attendanceRecords.update(id, { synced: true });
  }
  
  // تابع برای دریافت لیست کارمندان
  async getEmployees() {
    const allEmployees = await this.employees.toArray();
    return allEmployees.filter(emp => emp.isActive);
  }
  
  // تابع برای دریافت همه کارمندان (فعال و غیرفعال)
  async getAllEmployees() {
    return await this.employees.toArray();
  }
  
  // تابع برای ذخیره عملیات آفلاین کارمند
  async addEmployeeOperation(operation: Omit<EmployeeOperation, 'id'>) {
    try {
      const id = await this.employeeOperations.add(operation);
      return { success: true, id: id as number };
    } catch (error) {
      console.error('خطا در ذخیره عملیات کارمند:', error);
      return { success: false, error };
    }
  }
  
  // تابع برای دریافت عملیات‌های همگام‌نشده
  async getUnsyncedEmployeeOperations() {
    const allOperations = await this.employeeOperations.toArray();
    return allOperations.filter(operation => !operation.synced);
  }
  
  // تابع برای به‌روزرسانی وضعیت همگام‌سازی عملیات
  async markEmployeeOperationAsSynced(id: number) {
    return await this.employeeOperations.update(id, { synced: true });
  }
  
  // تابع برای حذف عملیات‌های همگام‌شده قدیمی
  async cleanupSyncedOperations() {
    const syncedOperations = await this.employeeOperations
      .where('synced')
      .equals(1) // استفاده از 1 به جای true
      .toArray();
    
    // حذف عملیات‌های همگام‌شده که بیش از 7 روز قدیمی هستند
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    for (const operation of syncedOperations) {
      if (operation.timestamp < weekAgo) {
        await this.employeeOperations.delete(operation.id as number);
      }
    }
  }
}

// ایجاد نمونه از دیتابیس
export const db = new AttendanceDatabase(); 