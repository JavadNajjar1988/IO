import { db } from '../db/database';
import type { AttendanceRecord } from '../db/database';

// آدرس API
// برای محیط توسعه، از آدرس کامل استفاده می‌کنیم
const API_URL = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

// رویداد سفارشی برای ثبت ورود/خروج
export const ATTENDANCE_EVENT = 'attendance-recorded';

// تابع بررسی اتصال اینترنت
function isOnline(): boolean {
  return navigator.onLine;
}

// تایپ برای پاسخ API
interface LastRecordResponse {
  message: string;
  last_record: AttendanceRecord | null;
}

// سرویس ثبت ورود و خروج
export const attendanceService = {
  // ثبت ورود یا خروج
  async recordAttendance(employeeId: number, recordType: 'ورود' | 'خروج'): Promise<{ success: boolean; message: string }> {
    try {
      const timestamp = new Date();
      
      // ذخیره در IndexedDB با وضعیت همگام‌سازی
      const synced = isOnline() ? 1 : 0;
      
      const record: Omit<AttendanceRecord, 'id'> = {
        employeeId,
        recordType,
        timestamp,
        synced: synced === 1
      };
      
      const result = await db.addAttendanceRecord(record);
      
      // انتشار رویداد ثبت حضور جدید
      this.dispatchAttendanceEvent(employeeId, recordType, timestamp);
      
      // اگر آنلاین باشیم، مستقیماً با سرور همگام‌سازی می‌کنیم
      if (synced === 1) {
        try {
          await this.syncRecord({
            ...record,
            id: result.id as number
          });
        } catch (error) {
          // اگر همگام‌سازی با خطا مواجه شود، وضعیت رکورد را به همگام‌نشده تغییر می‌دهیم
          if (result.id) {
            await db.attendanceRecords.update(result.id, { synced: false });
          }
          
          console.error('خطا در همگام‌سازی با سرور:', error);
          return { 
            success: true, 
            message: 'ثبت با موفقیت انجام شد، اما به دلیل مشکل در اتصال با سرور همگام‌سازی نشد.' 
          };
        }
      }
      
      return { 
        success: true, 
        message: `${recordType} با موفقیت ثبت شد${synced === 0 ? ' (حالت آفلاین)' : ''}.` 
      };
    } catch (error) {
      console.error('خطا در ثبت ورود/خروج:', error);
      return { success: false, message: 'خطا در ثبت ورود/خروج. لطفاً مجدداً تلاش کنید.' };
    }
  },
  
  // انتشار رویداد ثبت حضور جدید
  dispatchAttendanceEvent(employeeId: number, recordType: 'ورود' | 'خروج', timestamp: Date) {
    const event = new CustomEvent(ATTENDANCE_EVENT, {
      detail: {
        employeeId,
        recordType,
        timestamp
      }
    });
    window.dispatchEvent(event);
  },
  
  // همگام‌سازی یک رکورد با سرور
  async syncRecord(record: AttendanceRecord): Promise<void> {
    try {
      console.log(`در حال ارسال درخواست به ${API_URL}/attendance/`);
      const response = await fetch(`${API_URL}/attendance/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: record.employeeId,
          record_type: record.recordType,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`خطای سرور: ${response.status}`);
      }
      
      // به‌روزرسانی وضعیت همگام‌سازی در دیتابیس محلی
      if (record.id) {
        await db.markAsSynced(record.id);
      }
    } catch (error) {
      console.error('خطا در همگام‌سازی با سرور:', error);
      throw error;
    }
  },
  
  // همگام‌سازی همه رکوردهای ناهمگام
  async syncAll(): Promise<{ success: boolean; syncedCount: number }> {
    try {
      if (!isOnline()) {
        return { success: false, syncedCount: 0 };
      }
      
      const unsyncedRecords = await db.getUnsyncedRecords();
      let syncedCount = 0;
      
      for (const record of unsyncedRecords) {
        try {
          await this.syncRecord(record);
          syncedCount++;
        } catch (error) {
          console.error(`خطا در همگام‌سازی رکورد ${record.id}:`, error);
        }
      }
      
      return { success: true, syncedCount };
    } catch (error) {
      console.error('خطا در همگام‌سازی رکوردها:', error);
      return { success: false, syncedCount: 0 };
    }
  },
  
  // دریافت آخرین وضعیت یک کارمند
  async getLastRecordForEmployee(employeeId: number): Promise<LastRecordResponse> {
    try {
      if (isOnline()) {
        // دریافت از سرور
        const response = await fetch(`${API_URL}/employees/${employeeId}/last-record`);
        if (response.ok) {
          return await response.json() as LastRecordResponse;
        }
      }
      
      // اگر آفلاین هستیم یا خطایی رخ داده، از دیتابیس محلی استفاده می‌کنیم
      const records = await db.attendanceRecords
        .where('employeeId')
        .equals(employeeId)
        .reverse()
        .sortBy('timestamp');
      
      if (records.length > 0) {
        return { 
          message: 'آخرین رکورد از دیتابیس محلی', 
          last_record: records[0] 
        };
      }
      
      return { message: 'هیچ رکوردی یافت نشد', last_record: null };
    } catch (error) {
      console.error('خطا در دریافت آخرین رکورد:', error);
      return { message: 'خطا در دریافت اطلاعات', last_record: null };
    }
  }
}; 