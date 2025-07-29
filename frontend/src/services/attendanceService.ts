import { db } from '../db/database';
import type { AttendanceRecord } from '../db/database';
import { API_CONFIG, buildApiUrl } from '../config/api';

// رویداد سفارشی برای ثبت ورود/خروج
export const ATTENDANCE_EVENT = 'attendance-recorded';

// تابع تست اتصال به سرور
async function testServerConnection(): Promise<boolean> {
  try {
    console.log(`تست اتصال به سرور: ${buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES)}`);
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`وضعیت پاسخ سرور: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`تعداد کارمندان دریافت شده: ${data.length}`);
      return true;
    } else {
      console.error(`خطای سرور: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('خطا در اتصال به سرور:', error);
    return false;
  }
}

// تابع تست endpoint attendance
async function testAttendanceEndpoint(employeeId: number): Promise<boolean> {
  try {
    console.log(`تست endpoint attendance برای کارمند ${employeeId}`);
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employee_id: employeeId,
        record_type: 'ورود',
      }),
    });
    
    console.log(`وضعیت پاسخ attendance: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('پاسخ attendance:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`خطای attendance: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('خطا در تست attendance endpoint:', error);
    return false;
  }
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
      
      console.log(`ثبت ${recordType} برای کارمند با ID: ${employeeId}`);
      
      // تست اتصال به سرور
      const serverConnected = await testServerConnection();
      
      // ذخیره در IndexedDB با وضعیت همگام‌سازی
      const synced = serverConnected;
      
      const record: Omit<AttendanceRecord, 'id'> = {
        employeeId,
        recordType,
        timestamp,
        synced
      };
      
      const result = await db.addAttendanceRecord(record);
      
      // انتشار رویداد ثبت حضور جدید
      this.dispatchAttendanceEvent(employeeId, recordType, timestamp);
      
      // اگر سرور در دسترس باشد، مستقیماً با سرور همگام‌سازی می‌کنیم
      if (synced) {
        try {
          // تست endpoint attendance
          const attendanceTest = await testAttendanceEndpoint(employeeId);
          if (!attendanceTest) {
            throw new Error('endpoint attendance کار نمی‌کند');
          }
          
          await this.syncRecord({
            ...record,
            id: result.id !== undefined && result.id !== null ? result.id as number : undefined
          });
        } catch (error) {
          // اگر همگام‌سازی با خطا مواجه شود، وضعیت رکورد را به همگام‌نشده تغییر می‌دهیم
          if (result.id !== undefined && result.id !== null && result.id > 0) {
            await db.attendanceRecords.update(result.id as number, { synced: false });
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
        message: `${recordType} با موفقیت ثبت شد${!synced ? ' (حالت آفلاین)' : ''}.` 
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
      console.log(`در حال ارسال درخواست به ${buildApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE)}`);
      console.log('داده‌های ارسالی:', {
        employee_id: record.employeeId,
        record_type: record.recordType,
      });
      
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.ATTENDANCE), {
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
        const errorText = await response.text();
        console.error('پاسخ سرور:', errorText);
        throw new Error(`خطای سرور: ${response.status} - ${errorText}`);
      }
      
      const responseData = await response.json();
      console.log('پاسخ سرور:', responseData);
      
      // به‌روزرسانی وضعیت همگام‌سازی در دیتابیس محلی
      if (record.id !== undefined && record.id !== null && record.id > 0) {
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
      const serverConnected = await testServerConnection();
      if (!serverConnected) {
        return { success: false, syncedCount: 0 };
      }
      
      const unsyncedRecords = await db.getUnsyncedRecords();
      let syncedCount = 0;
      
      for (const record of unsyncedRecords) {
        try {
          await this.syncRecord(record);
          syncedCount++;
        } catch (error) {
          console.error(`خطا در همگام‌سازی رکورد ${record.id || 'نامشخص'}:`, error);
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
      const serverConnected = await testServerConnection();
      if (serverConnected) {
        // دریافت از سرور
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, employeeId, 'last-record'));
        if (response.ok) {
          return await response.json() as LastRecordResponse;
        }
      }
      
      // اگر سرور در دسترس نباشد یا خطایی رخ داده، از دیتابیس محلی استفاده می‌کنیم
      const records = await db.attendanceRecords
        .where('employeeId')
        .equals(employeeId)
        .toArray();
      
      if (records.length > 0) {
        // مرتب‌سازی بر اساس timestamp و انتخاب آخرین رکورد
        const sortedRecords = records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return { 
          message: 'آخرین رکورد از دیتابیس محلی', 
          last_record: sortedRecords[sortedRecords.length - 1] 
        };
      }
      
      return { message: 'هیچ رکوردی یافت نشد', last_record: null };
    } catch (error) {
      console.error('خطا در دریافت آخرین رکورد:', error);
      return { message: 'خطا در دریافت اطلاعات', last_record: null };
    }
  }
}; 