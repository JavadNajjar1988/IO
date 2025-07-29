import { db } from '../db/database';
import type { Employee } from '../db/database';
import { API_CONFIG, buildApiUrl } from '../config/api';

// تایپ برای داده‌های دریافتی از سرور
interface ServerEmployee {
  id: number;
  name: string;
  employee_id: string;
  position: string;
  is_active: boolean;
  avatar?: string;
}

// تابع تست اتصال به سرور
async function testServerConnection(): Promise<boolean> {
  try {
    console.log('تست اتصال به سرور:', buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES));
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('پاسخ تست اتصال:', response.status, response.statusText);
    return response.ok;
  } catch (error) {
    console.error('خطا در اتصال به سرور:', error);
    return false;
  }
}

// تابع بررسی اتصال اینترنت
function isOnline(): boolean {
  return navigator.onLine;
}

// سرویس مدیریت کارمندان
export const employeeService = {
  // دریافت لیست کارمندان
  async getEmployees(): Promise<Employee[]> {
    try {
      const serverConnected = await testServerConnection();
      if (serverConnected) {
        // دریافت از سرور
        try {
          console.log(`در حال دریافت لیست کارمندان از ${API_CONFIG.ENDPOINTS.EMPLOYEES}`);
          const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES));
          
          if (response.ok) {
            const serverEmployeesRaw = await response.json();
            
            // تبدیل snake_case به camelCase
            const serverEmployees = serverEmployeesRaw.map((emp: ServerEmployee) => ({
              id: emp.id,
              name: emp.name,
              employeeId: emp.employee_id, // تبدیل
              position: emp.position,
              isActive: emp.is_active, // تبدیل
              avatar: emp.avatar
            }));
            
            // به‌روزرسانی دیتابیس محلی
            for (const employee of serverEmployees) {
              await this.updateLocalEmployee(employee);
            }
            
            return serverEmployees;
          }
        } catch (error) {
          console.error('خطا در دریافت لیست کارمندان از سرور:', error);
        }
      }
      
      // استفاده از دیتابیس محلی
      return await db.getAllEmployees();
    } catch (error) {
      console.error('خطا در دریافت لیست کارمندان:', error);
      return [];
    }
  },
  
  // به‌روزرسانی یک کارمند در دیتابیس محلی
  async updateLocalEmployee(employee: Employee): Promise<void> {
    console.log('در حال به‌روزرسانی کارمند در دیتابیس محلی:', employee);
    
    // بررسی وجود کارمند در دیتابیس محلی
    const existingEmployee = await db.employees
      .where('id')
      .equals(employee.id as number)
      .first();
    
    if (existingEmployee) {
      console.log('کارمند موجود یافت شد، در حال به‌روزرسانی...');
      // به‌روزرسانی کارمند موجود
      await db.employees.update(employee.id as number, {
        name: employee.name,
        employeeId: employee.employeeId,
        position: employee.position,
        isActive: employee.isActive,
        avatar: employee.avatar // حتی اگر undefined باشد، ذخیره می‌شود
      });
      console.log('کارمند به‌روزرسانی شد');
    } else {
      console.log('کارمند جدید، در حال افزودن...');
      // افزودن کارمند جدید
      await db.employees.add({
        id: employee.id as number,
        name: employee.name,
        employeeId: employee.employeeId,
        position: employee.position,
        isActive: employee.isActive,
        avatar: employee.avatar // حتی اگر undefined باشد، ذخیره می‌شود
      });
      console.log('کارمند جدید افزوده شد');
    }
  },
  
  // ایجاد کارمند جدید
  async createEmployee(employee: Omit<Employee, 'id'>): Promise<{ success: boolean; message: string; employee?: Employee }> {
    try {
      if (isOnline()) {
        // ارسال به سرور
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: employee.name,
            employee_id: employee.employeeId,
            position: employee.position,
            is_active: employee.isActive,
            avatar: employee.avatar
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'خطا در ایجاد کارمند در سرور');
        }
        
        const empRaw = await response.json();
        
        // تبدیل snake_case به camelCase
        const newEmployee: Employee = {
          id: empRaw.id,
          name: empRaw.name,
          employeeId: empRaw.employee_id,
          position: empRaw.position,
          isActive: empRaw.is_active,
          avatar: empRaw.avatar
        };
        
        // به‌روزرسانی دیتابیس محلی
        await this.updateLocalEmployee(newEmployee);
        
        return { 
          success: true, 
          message: 'کارمند جدید با موفقیت ایجاد شد',
          employee: newEmployee
        };
      } else {
        // ذخیره در دیتابیس محلی با ID موقت
        const tempId = Date.now();
        const newEmployee: Employee = {
          ...employee,
          id: tempId
        };
        
        await this.updateLocalEmployee(newEmployee);
        
        // ذخیره عملیات آفلاین
        await db.addEmployeeOperation({
          type: 'create',
          employeeId: tempId,
          employeeData: newEmployee,
          timestamp: new Date(),
          synced: false
        });
        
        return { 
          success: true, 
          message: 'کارمند جدید در حالت آفلاین ذخیره شد و در اتصال بعدی با سرور همگام‌سازی خواهد شد',
          employee: newEmployee
        };
      }
    } catch (error) {
      console.error('خطا در ایجاد کارمند:', error);
      return { success: false, message: 'خطا در ایجاد کارمند جدید' };
    }
  },
  
  // ویرایش کارمند (هم در سرور و هم در دیتابیس محلی)
  async updateEmployee(employee: Employee): Promise<{ success: boolean; message: string }> {
    try {
      if (isOnline()) {
        // ارسال به سرور
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, employee.id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: employee.name,
            employee_id: employee.employeeId, // توجه: تبدیل نام فیلد از camelCase به snake_case
            position: employee.position,
            is_active: employee.isActive, // توجه: تبدیل نام فیلد از camelCase به snake_case
            avatar: employee.avatar
          }),
        });
        
        if (!response.ok) {
          throw new Error('خطا در به‌روزرسانی کارمند در سرور');
        }
        
        // به‌روزرسانی دیتابیس محلی
        await this.updateLocalEmployee(employee);
        
        // دیباگ برای بررسی ذخیره
        if (employee.id) {
          await this.debugEmployee(employee.id);
        }
        
        return { 
          success: true, 
          message: 'اطلاعات کارمند با موفقیت به‌روزرسانی شد'
        };
      } else {
        // ذخیره در دیتابیس محلی
        await this.updateLocalEmployee(employee);
        
        // ذخیره عملیات آفلاین
        await db.addEmployeeOperation({
          type: 'update',
          employeeId: employee.id as number,
          employeeData: employee,
          timestamp: new Date(),
          synced: false
        });
        
        return { 
          success: true, 
          message: 'اطلاعات کارمند در حالت آفلاین به‌روزرسانی شد و در اتصال بعدی با سرور همگام‌سازی خواهد شد'
        };
      }
    } catch (error) {
      console.error('خطا در به‌روزرسانی کارمند:', error);
      return { success: false, message: 'خطا در به‌روزرسانی اطلاعات کارمند' };
    }
  },
  
  // حذف کارمند
  async deleteEmployee(employeeId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log('شروع حذف کارمند با شناسه:', employeeId);
      console.log('آدرس API:', API_CONFIG.ENDPOINTS.EMPLOYEES);
      
      if (isOnline()) {
        console.log('حذف از سرور...');
        // حذف از سرور
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثانیه timeout
        
        try {
          const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, employeeId), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          console.log('پاسخ سرور:', response.status, response.statusText);
          
          if (!response.ok) {
            let errorMessage = 'خطا در حذف کارمند از سرور';
            try {
              const errorData = await response.json();
              errorMessage = errorData.detail || errorMessage;
            } catch (parseError) {
              console.error('خطا در پارس کردن پاسخ خطا:', parseError);
            }
            throw new Error(errorMessage);
          }
          
          console.log('کارمند از سرور حذف شد');
          
          // حذف از دیتابیس محلی
          try {
            await db.employees.delete(employeeId);
            console.log('کارمند از دیتابیس محلی حذف شد');
          } catch (dbError) {
            console.error('خطا در حذف از دیتابیس محلی:', dbError);
          }
          
          return { 
            success: true, 
            message: 'کارمند با موفقیت حذف شد'
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new Error('زمان اتصال به سرور به پایان رسید');
          }
          throw fetchError;
        }
      } else {
        console.log('حذف از دیتابیس محلی (حالت آفلاین)...');
        
        // دریافت اطلاعات کارمند قبل از حذف
        const employee = await db.employees.get(employeeId);
        
        // حذف از دیتابیس محلی
        await db.employees.delete(employeeId);
        
        // ذخیره عملیات آفلاین
        if (employee) {
          await db.addEmployeeOperation({
            type: 'delete',
            employeeId: employeeId,
            employeeData: employee,
            timestamp: new Date(),
            synced: false
          });
        }
        
        return { 
          success: true, 
          message: 'کارمند در حالت آفلاین حذف شد و در اتصال بعدی با سرور همگام‌سازی خواهد شد'
        };
      }
    } catch (error) {
      console.error('خطا در حذف کارمند:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'خطا در حذف کارمند'
      };
    }
  },
  
  // تبدیل فایل تصویر به Base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  },
  
  // آپلود تصویر کارمند
  async uploadEmployeeAvatar(employeeId: number, file: File): Promise<{ success: boolean; message: string }> {
    try {
      // تبدیل فایل به Base64
      const base64Image = await this.fileToBase64(file);
      
      if (isOnline()) {
        // دریافت اطلاعات کارمند
        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, employeeId));
        if (!response.ok) {
          throw new Error('کارمند یافت نشد');
        }
        
        const empRaw = await response.json();
        
        // به‌روزرسانی تصویر کارمند
        const updateResponse = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, employeeId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: empRaw.name,
            employee_id: empRaw.employee_id,
            position: empRaw.position,
            is_active: empRaw.is_active,
            avatar: base64Image
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error('خطا در به‌روزرسانی تصویر کارمند');
        }
        
        const updatedEmpRaw = await updateResponse.json();
        
        // تبدیل snake_case به camelCase
        const updatedEmployee: Employee = {
          id: updatedEmpRaw.id,
          name: updatedEmpRaw.name,
          employeeId: updatedEmpRaw.employee_id,
          position: updatedEmpRaw.position,
          isActive: updatedEmpRaw.is_active,
          avatar: updatedEmpRaw.avatar
        };
        
        // به‌روزرسانی دیتابیس محلی
        await this.updateLocalEmployee(updatedEmployee);
        
        return { success: true, message: 'تصویر کارمند با موفقیت به‌روزرسانی شد' };
      } else {
        // ذخیره در دیتابیس محلی
        await db.employees.update(employeeId, { avatar: base64Image });
        return { success: true, message: 'تصویر کارمند در حالت آفلاین ذخیره شد' };
      }
    } catch (error) {
      console.error('خطا در آپلود تصویر کارمند:', error);
      return { success: false, message: 'خطا در آپلود تصویر کارمند' };
    }
  },
  
  // تابع تست برای بررسی محتوای دیتابیس
  async debugEmployee(employeeId: number): Promise<void> {
    try {
      const employee = await db.employees.get(employeeId);
      console.log('کارمند در دیتابیس:', employee);
      console.log('avatar value:', employee?.avatar);
      console.log('avatar type:', typeof employee?.avatar);
    } catch (error) {
      console.error('خطا در دیباگ کارمند:', error);
    }
  },
  
  // تابع تست برای بررسی اتصال به سرور
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('تست اتصال به سرور...');
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TEST));
      
      if (response.ok) {
        const data = await response.json();
        console.log('پاسخ تست سرور:', data);
        return { success: true, message: 'اتصال به سرور برقرار است' };
      } else {
        return { success: false, message: `خطا در اتصال به سرور: ${response.status}` };
      }
    } catch (error) {
      console.error('خطا در تست اتصال:', error);
      return { success: false, message: 'خطا در اتصال به سرور' };
    }
  },
  
  // دریافت یک کارمند با شناسه
  async getEmployee(employeeId: number): Promise<Employee | null> {
    try {
      if (isOnline()) {
        // دریافت از سرور
        try {
          const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, employeeId));
          if (response.ok) {
            const empRaw = await response.json();
            
            // تبدیل snake_case به camelCase
            const employee: Employee = {
              id: empRaw.id,
              name: empRaw.name,
              employeeId: empRaw.employee_id, // تبدیل
              position: empRaw.position,
              isActive: empRaw.is_active, // تبدیل
              avatar: empRaw.avatar
            };
            
            // به‌روزرسانی دیتابیس محلی
            await this.updateLocalEmployee(employee);
            return employee;
          }
        } catch (error) {
          console.error('خطا در دریافت کارمند از سرور:', error);
        }
      }
      
      // استفاده از دیتابیس محلی
      return await db.employees.get(employeeId) || null;
    } catch (error) {
      console.error('خطا در دریافت کارمند:', error);
      return null;
    }
  },
  
  // همگام‌سازی عملیات‌های آفلاین
  async syncOfflineOperations(): Promise<{ success: boolean; syncedCount: number; message: string }> {
    try {
      console.log('شروع همگام‌سازی عملیات‌های آفلاین...');
      
      if (!isOnline()) {
        return { 
          success: false, 
          syncedCount: 0, 
          message: 'اتصال اینترنت برقرار نیست' 
        };
      }
      
      const unsyncedOperations = await db.getUnsyncedEmployeeOperations();
      console.log(`${unsyncedOperations.length} عملیات آفلاین برای همگام‌سازی یافت شد`);
      
      let syncedCount = 0;
      const errors: string[] = [];
      
      for (const operation of unsyncedOperations) {
        try {
          switch (operation.type) {
            case 'create':
              if (operation.employeeData) {
                const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: operation.employeeData.name,
                    employee_id: operation.employeeData.employeeId,
                    position: operation.employeeData.position,
                    is_active: operation.employeeData.isActive,
                    avatar: operation.employeeData.avatar
                  }),
                });
                
                if (response.ok) {
                  const newEmployee = await response.json();
                  // به‌روزرسانی ID موقت با ID واقعی سرور
                  await db.employees.update(operation.employeeId as number, { id: newEmployee.id });
                  await db.markEmployeeOperationAsSynced(operation.id as number);
                  syncedCount++;
                } else {
                  errors.push(`خطا در ایجاد کارمند: ${response.status}`);
                }
              }
              break;
              
            case 'update':
              if (operation.employeeData && operation.employeeId) {
                const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, operation.employeeId), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: operation.employeeData.name,
                    employee_id: operation.employeeData.employeeId,
                    position: operation.employeeData.position,
                    is_active: operation.employeeData.isActive,
                    avatar: operation.employeeData.avatar
                  }),
                });
                
                if (response.ok) {
                  await db.markEmployeeOperationAsSynced(operation.id as number);
                  syncedCount++;
                } else {
                  errors.push(`خطا در به‌روزرسانی کارمند: ${response.status}`);
                }
              }
              break;
              
            case 'delete':
              if (operation.employeeId) {
                const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.EMPLOYEES, operation.employeeId), {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                });
                
                if (response.ok) {
                  await db.markEmployeeOperationAsSynced(operation.id as number);
                  syncedCount++;
                } else {
                  errors.push(`خطا در حذف کارمند: ${response.status}`);
                }
              }
              break;
          }
        } catch (error) {
          console.error(`خطا در همگام‌سازی عملیات ${operation.type}:`, error);
          errors.push(`خطا در عملیات ${operation.type}: ${error}`);
        }
      }
      
      // پاکسازی عملیات‌های قدیمی
      await db.cleanupSyncedOperations();
      
      const message = errors.length > 0 
        ? `${syncedCount} عملیات همگام‌سازی شد. خطاها: ${errors.join(', ')}`
        : `${syncedCount} عملیات با موفقیت همگام‌سازی شد`;
      
      return { 
        success: syncedCount > 0, 
        syncedCount, 
        message 
      };
      
    } catch (error) {
      console.error('خطا در همگام‌سازی عملیات‌های آفلاین:', error);
      return { 
        success: false, 
        syncedCount: 0, 
        message: 'خطا در همگام‌سازی عملیات‌های آفلاین' 
      };
    }
  }
}; 