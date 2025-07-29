// تنظیمات مرکزی API
export const API_CONFIG = {
  // آدرس سرور API
  BASE_URL: import.meta.env.DEV 
    ? 'http://192.168.100.2:8000'  // آدرس اصلی شبکه
    : '/api', // آدرس تولید
  
  // آدرس‌های مختلف API
  ENDPOINTS: {
    EMPLOYEES: '/api/employees',
    ATTENDANCE: '/api/attendance',
    TEST: '/test'
  },
  
  // تنظیمات درخواست
  REQUEST_CONFIG: {
    timeout: 10000, // 10 ثانیه
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

// تابع برای ساخت آدرس کامل API
export const buildApiUrl = (endpoint: string, ...params: (number | string)[]): string => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  for (const param of params) {
    url += `/${param}`;
  }
  return url;
};

// تابع برای بررسی اتصال به سرور
export const testServerConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.TEST));
    return response.ok;
  } catch (error) {
    console.error('خطا در تست اتصال به سرور:', error);
    return false;
  }
};