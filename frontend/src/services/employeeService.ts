import { db } from '../db/database';
import type { Employee } from '../db/database';

// آدرس API
const API_URL = import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';

// تابع بررسی اتصال اینترنت
function isOnline(): boolean {
  return navigator.onLine;
}

// سرویس مدیریت کارمندان
export const employeeService = {
  // دریافت لیست کارمندان
  async getEmployees(): Promise<Employee[]> {
    try {
      if (isOnline()) {
        // دریافت از سرور
        try {
          console.log(`در حال دریافت لیست کارمندان از ${API_URL}/employees/`);
          const response = await fetch(`${API_URL}/employees/`);
          
          if (response.ok) {
            const serverEmployeesRaw = await response.json();
            
            // تبدیل snake_case به camelCase
            const serverEmployees = serverEmployeesRaw.map((emp: any) => ({
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
      return await db.getEmployees();
    } catch (error) {
      console.error('خطا در دریافت لیست کارمندان:', error);
      return [];
    }
  },
  
  // به‌روزرسانی یک کارمند در دیتابیس محلی
  async updateLocalEmployee(employee: Employee): Promise<void> {
    // بررسی وجود کارمند در دیتابیس محلی
    const existingEmployee = await db.employees
      .where('id')
      .equals(employee.id as number)
      .first();
    
    if (existingEmployee) {
      // به‌روزرسانی کارمند موجود
      await db.employees.update(employee.id as number, {
        name: employee.name,
        employeeId: employee.employeeId,
        position: employee.position,
        isActive: employee.isActive,
        avatar: employee.avatar
      });
    } else {
      // افزودن کارمند جدید
      await db.employees.add({
        id: employee.id as number,
        name: employee.name,
        employeeId: employee.employeeId,
        position: employee.position,
        isActive: employee.isActive,
        avatar: employee.avatar
      });
    }
  },
  
  // ویرایش کارمند (هم در سرور و هم در دیتابیس محلی)
  async updateEmployee(employee: Employee): Promise<{ success: boolean; message: string }> {
    try {
      if (isOnline()) {
        // ارسال به سرور
        const response = await fetch(`${API_URL}/employees/${employee.id}`, {
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
        
        return { 
          success: true, 
          message: 'اطلاعات کارمند با موفقیت به‌روزرسانی شد'
        };
      } else {
        // ذخیره در دیتابیس محلی
        await this.updateLocalEmployee(employee);
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
        const response = await fetch(`${API_URL}/employees/${employeeId}`);
        if (!response.ok) {
          throw new Error('کارمند یافت نشد');
        }
        
        const empRaw = await response.json();
        
        // به‌روزرسانی تصویر کارمند
        const updateResponse = await fetch(`${API_URL}/employees/${employeeId}`, {
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
  
  // دریافت یک کارمند با شناسه
  async getEmployee(employeeId: number): Promise<Employee | null> {
    try {
      if (isOnline()) {
        // دریافت از سرور
        try {
          const response = await fetch(`${API_URL}/employees/${employeeId}`);
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
      return await db.employees.get(employeeId);
    } catch (error) {
      console.error('خطا در دریافت کارمند:', error);
      return null;
    }
  }
}; 