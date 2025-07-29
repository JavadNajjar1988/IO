import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  AppBar, 
  Toolbar, 
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Stack,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Avatar,
  Snackbar
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { db } from '../db/database';
import type { Employee, AttendanceRecord } from '../db/database';
import { ATTENDANCE_EVENT } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';

// رابط برای تب‌ها
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// کامپوننت پنل تب
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// دریافت ویژگی‌های تب
function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

// ایجاد کامپوننت برای نوتیفیکیشن‌ها
interface ActivityNotification {
  id: number;
  message: string;
  time: Date;
  type: 'entry' | 'exit';
  employeeName: string;
}

export default function AdminPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  // استیت‌ها
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employeeDialog, setEmployeeDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error' | 'info' | 'warning', message: string} | null>(null);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{open: boolean, employeeId: number | null, employeeName: string}>({
    open: false,
    employeeId: null,
    employeeName: ''
  });
  
  // بررسی وضعیت ورود مدیر
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [navigate]);
  
  // بارگذاری داده‌ها
  useEffect(() => {
    loadData();
    
    // ایجاد یک فاصله زمانی برای بررسی رکوردهای جدید هر 30 ثانیه
    const intervalId = setInterval(() => {
      checkNewRecords();
    }, 30000);
    
    // گوش دادن به رویدادهای ثبت حضور جدید
    const handleAttendanceEvent = async (event: CustomEvent) => {
      const { employeeId, recordType, timestamp } = event.detail;
      
      // یافتن اطلاعات کارمند
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        const newNotification: ActivityNotification = {
          id: Date.now() + Math.random(),
          message: `${employee.name} ${recordType === 'ورود' ? 'وارد شد' : 'خارج شد'}`,
          time: new Date(timestamp),
          type: recordType === 'ورود' ? 'entry' : 'exit',
          employeeName: employee.name
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 10));
        setNotificationOpen(true);
        
        // بارگذاری مجدد رکوردها
        loadData();
      }
    };
    
    window.addEventListener(ATTENDANCE_EVENT, handleAttendanceEvent as unknown as EventListener);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener(ATTENDANCE_EVENT, handleAttendanceEvent as unknown as EventListener);
    };
  }, [employees]);
  
  // بارگذاری داده‌ها از دیتابیس
  const loadData = async () => {
    try {
      console.log('شروع بارگذاری داده‌ها...');
      
      // ابتدا تلاش برای بارگذاری از سرور
      let serverEmployees: Employee[] = [];
      try {
        serverEmployees = await employeeService.getEmployees();
        console.log('تلاش برای دریافت از سرور انجام شد');
      } catch (serverError) {
        console.log('خطا در اتصال به سرور:', serverError);
      }
      
      if (serverEmployees && serverEmployees.length > 0) {
        console.log(`${serverEmployees.length} کارمند از سرور بارگذاری شد`);
        setEmployees(serverEmployees);
        setAlertMessage(null); // پاک کردن پیام‌های خطای قبلی
      } else {
        // اگر سرور در دسترس نباشد یا کارمندی نداشته باشد، از دیتابیس محلی استفاده می‌کنیم
        const dbEmployees = await db.employees.toArray();
        
        if (dbEmployees && dbEmployees.length > 0) {
          console.log(`${dbEmployees.length} کارمند از دیتابیس محلی بارگذاری شد`);
          setEmployees(dbEmployees);
          setAlertMessage({
            type: 'info',
            message: 'کارمندان از دیتابیس محلی بارگذاری شدند. برای دریافت آخرین تغییرات، دکمه بروزرسانی را بزنید.'
          });
        } else {
          console.log('هیچ کارمندی در سرور یا دیتابیس محلی یافت نشد');
          setEmployees([]);
          
          // نمایش پیام به کاربر
          setAlertMessage({
            type: 'warning',
            message: 'هیچ کارمندی یافت نشد. لطفاً ابتدا کارمندان را اضافه کنید یا دکمه بروزرسانی را بزنید.'
          });
        }
      }
      
      // بارگذاری رکوردها
      const dbRecords = await db.attendanceRecords.toArray();
      setRecords(dbRecords);
      
    } catch (error) {
      console.error('خطا در بارگذاری داده‌ها:', error);
      setAlertMessage({
        type: 'error',
        message: 'خطا در بارگذاری داده‌ها. لطفاً صفحه را رفرش کنید یا دکمه بروزرسانی را بزنید.'
      });
    }
  };

  // همگام‌سازی کامل داده‌ها با سرور
  const syncData = async () => {
    try {
      console.log('شروع همگام‌سازی داده‌ها...');
      setAlertMessage({
        type: 'info',
        message: 'در حال بروزرسانی داده‌ها از سرور...'
      });
      
      // همگام‌سازی کارمندان
      const serverEmployees = await employeeService.getEmployees();
      if (serverEmployees && serverEmployees.length > 0) {
        setEmployees(serverEmployees);
        console.log(`${serverEmployees.length} کارمند از سرور بارگذاری شد`);
      } else {
        console.log('هیچ کارمندی در سرور یافت نشد');
        setAlertMessage({
          type: 'warning',
          message: 'هیچ کارمندی در سرور یافت نشد. لطفاً ابتدا کارمندان را در سرور اضافه کنید.'
        });
        return;
      }
      
      // همگام‌سازی رکوردهای حضور و غیاب
      const syncResult = await attendanceService.syncAll();
      if (syncResult.success) {
        console.log('رکوردهای حضور و غیاب همگام‌سازی شدند');
      }
      
      // همگام‌سازی عملیات‌های آفلاین کارمندان
      const offlineSyncResult = await employeeService.syncOfflineOperations();
      if (offlineSyncResult.success) {
        console.log(`عملیات آفلاین همگام‌سازی شد: ${offlineSyncResult.message}`);
      }
      
      // بارگذاری مجدد رکوردها از دیتابیس محلی
      const dbRecords = await db.attendanceRecords.toArray();
      setRecords(dbRecords);
      
      // بارگذاری مجدد کارمندان برای نمایش تغییرات
      const updatedEmployees = await employeeService.getEmployees();
      setEmployees(updatedEmployees);
      
      setAlertMessage({
        type: 'success',
        message: `داده‌ها با موفقیت بروزرسانی شدند. ${updatedEmployees.length} کارمند بارگذاری شد. ${offlineSyncResult.syncedCount > 0 ? `و ${offlineSyncResult.syncedCount} عملیات آفلاین همگام‌سازی شد.` : ''}`
      });
      
      console.log('همگام‌سازی کامل شد');
    } catch (error) {
      console.error('خطا در همگام‌سازی داده‌ها:', error);
      setAlertMessage({
        type: 'error',
        message: 'خطا در بروزرسانی داده‌ها. لطفاً اتصال اینترنت را بررسی کنید و مجدداً تلاش کنید.'
      });
    }
  };
  
  // بررسی رکوردهای جدید
  const checkNewRecords = async () => {
    try {
      // بارگذاری رکوردهای جدید
      const newRecords = await db.attendanceRecords.toArray();
      
      // فیلتر کردن رکوردهای جدید از زمان آخرین بررسی
      const lastCheckedTime = localStorage.getItem('lastCheckedTime') 
        ? new Date(localStorage.getItem('lastCheckedTime') as string) 
        : new Date(0);
      
      const recentRecords = newRecords.filter(record => 
        new Date(record.timestamp) > lastCheckedTime
      );
      
      // اگر رکورد جدیدی وجود داشت، نوتیفیکیشن نشان داده شود
      if (recentRecords.length > 0) {
        const newNotifications: ActivityNotification[] = [];
        
        for (const record of recentRecords) {
          // یافتن نام کارمند
          const employee = employees.find(emp => emp.id === record.employeeId);
          if (employee) {
            newNotifications.push({
              id: Date.now() + Math.random(),
              message: `${employee.name} ${record.recordType === 'ورود' ? 'وارد شد' : 'خارج شد'}`,
              time: new Date(record.timestamp),
              type: record.recordType === 'ورود' ? 'entry' : 'exit',
              employeeName: employee.name
            });
          }
        }
        
        if (newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev].slice(0, 10));
          setNotificationOpen(true);
        }
      }
      
      // به‌روزرسانی زمان آخرین بررسی
      localStorage.setItem('lastCheckedTime', new Date().toISOString());
      
      // به‌روزرسانی لیست رکوردها
      setRecords(newRecords);
    } catch (error) {
      console.error('خطا در بررسی رکوردهای جدید:', error);
    }
  };
  
  // تغییر تب
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // باز کردن دیالوگ افزودن/ویرایش کارمند
  const handleOpenEmployeeDialog = (employee: Employee | null = null) => {
    setCurrentEmployee(employee || {
      name: '',
      employeeId: '',
      position: '',
      isActive: true
    } as Employee);
    
    setEmployeeDialog(true);
  };
  
  // بستن دیالوگ
  const handleCloseEmployeeDialog = () => {
    setCurrentEmployee(null);
    setEmployeeDialog(false);
  };
  
  // ذخیره کارمند
  const handleSaveEmployee = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!currentEmployee) return;
    
    try {
      if (currentEmployee.id) {
        // ویرایش کارمند موجود با استفاده از سرویس
        const result = await employeeService.updateEmployee(currentEmployee);
        
        if (result.success) {
          setAlertMessage({
            type: 'success',
            message: result.message
          });
        } else {
          setAlertMessage({
            type: 'error',
            message: result.message
          });
        }
      } else {
        // افزودن کارمند جدید با استفاده از سرویس
        const result = await employeeService.createEmployee(currentEmployee);
        
        if (result.success) {
          setAlertMessage({
            type: 'success',
            message: result.message
          });
        } else {
          setAlertMessage({
            type: 'error',
            message: result.message
          });
        }
      }
      
      // بارگذاری مجدد کارمندان
      loadData();
      
      // بستن دیالوگ
      handleCloseEmployeeDialog();
    } catch (error) {
      console.error('خطا در ذخیره کارمند:', error);
      setAlertMessage({
        type: 'error',
        message: 'خطا در ذخیره اطلاعات کارمند. لطفاً مجدداً تلاش کنید.'
      });
    }
  };
  
  // حذف کارمند
  const handleDeleteEmployee = async (employeeId: number) => {
    try {
      console.log('در حال حذف کارمند با شناسه:', employeeId);
      
      // حذف کارمند با استفاده از سرویس
      const result = await employeeService.deleteEmployee(employeeId);
      
      if (result.success) {
        setAlertMessage({
          type: 'success',
          message: result.message
        });
        
        // بارگذاری مجدد کارمندان
        await loadData();
      } else {
        setAlertMessage({
          type: 'error',
          message: result.message
        });
      }
    } catch (error) {
      console.error('خطا در حذف کارمند:', error);
      setAlertMessage({
        type: 'error',
        message: 'خطا در حذف کارمند. لطفاً مجدداً تلاش کنید.'
      });
    }
  };
  
  // باز کردن دیالوگ تاییدیه حذف
  const handleOpenDeleteDialog = (employeeId: number, employeeName: string) => {
    setDeleteConfirmDialog({
      open: true,
      employeeId,
      employeeName
    });
  };
  
  // بستن دیالوگ تاییدیه حذف
  const handleCloseDeleteDialog = () => {
    setDeleteConfirmDialog({
      open: false,
      employeeId: null,
      employeeName: ''
    });
  };
  
  // تایید حذف کارمند
  const handleConfirmDelete = async () => {
    if (deleteConfirmDialog.employeeId) {
      console.log('شروع فرآیند حذف کارمند:', deleteConfirmDialog.employeeId);
      
      // تست اتصال به سرور قبل از حذف
      const connectionTest = await employeeService.testConnection();
      console.log('نتیجه تست اتصال:', connectionTest);
      
      if (!connectionTest.success) {
        setAlertMessage({
          type: 'warning',
          message: 'اتصال به سرور برقرار نیست. کارمند فقط از دیتابیس محلی حذف خواهد شد.'
        });
      }
      
      await handleDeleteEmployee(deleteConfirmDialog.employeeId);
      handleCloseDeleteDialog();
    }
  };
  
  // تبدیل تاریخ به فرمت فارسی
  const formatPersianDate = (date: string | Date) => {
    const d = new Date(date);
    
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(d);
  };
  
  // محاسبه وضعیت روزانه
  const calculateDailyStatus = () => {
    const present = employees.filter(emp => {
      const empRecords = records.filter(r => r.employeeId === emp.id);
      const entries = empRecords.filter(r => r.recordType === 'ورود');
      return entries.length > 0;
    }).length;
    
    const absent = employees.length - present;
    
    return { present, absent };
  };
  
  // کارت‌های آمار
  const dailyStatus = calculateDailyStatus();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      bgcolor: 'background.default'
    }}>
      <AppBar position="fixed" color="primary" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssessmentIcon sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              پنل مدیریت سامانه حضور و غیاب
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => syncData()}
              startIcon={<RefreshIcon />}
              sx={{ 
                borderRadius: 20, 
                '& .MuiButton-startIcon': {
                  marginRight: 1
                }
              }}
            >
              بروزرسانی
            </Button>
            
            <Button 
              variant="outlined" 
              color="info" 
              onClick={async () => {
                const result = await employeeService.testConnection();
                setAlertMessage({
                  type: result.success ? 'success' : 'error',
                  message: result.message
                });
              }}
              sx={{ 
                borderRadius: 20, 
                '& .MuiButton-startIcon': {
                  marginRight: 1
                }
              }}
            >
              تست اتصال
            </Button>
            
            <Button 
              variant="outlined" 
              color="warning" 
              onClick={async () => {
                const result = await employeeService.syncOfflineOperations();
                setAlertMessage({
                  type: result.success ? 'success' : 'warning',
                  message: result.message
                });
                if (result.success) {
                  // بارگذاری مجدد کارمندان
                  await loadData();
                }
              }}
              sx={{ 
                borderRadius: 20, 
                '& .MuiButton-startIcon': {
                  marginRight: 1
                }
              }}
            >
              همگام‌سازی آفلاین
            </Button>
            
            <Button
              component={Link}
              to="/"
              variant="outlined"
              color="inherit"
              sx={{ 
                fontWeight: 'bold',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.3)'
              }}
            >
              بازگشت به صفحه اصلی
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Toolbar /> {/* فضای خالی برای AppBar */}
      
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {alertMessage && (
          <Alert 
            severity={alertMessage.type} 
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setAlertMessage(null)}
          >
            {alertMessage.message}
          </Alert>
        )}
        
        {/* خلاصه وضعیت */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <Card sx={{ 
              bgcolor: 'rgba(10, 186, 181, 0.08)', 
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(10, 186, 181, 0.15)'
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  تعداد کل کارمندان
                </Typography>
                <Typography variant="h3" component="div" color="primary.dark" sx={{ fontWeight: 'bold' }}>
                  {employees.length}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                  کارمندان فعال در سیستم
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <Card sx={{ 
              bgcolor: 'rgba(10, 186, 181, 0.08)', 
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(10, 186, 181, 0.15)'
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  کارمندان حاضر امروز
                </Typography>
                <Typography variant="h3" component="div" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {dailyStatus.present}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {dailyStatus.present > 0 ? (
                    <span>{Math.round((dailyStatus.present / employees.length) * 100)}% حضور</span>
                  ) : (
                    <span>هیچ کارمندی وارد نشده است</span>
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <Card sx={{ 
              bgcolor: 'rgba(242, 192, 120, 0.12)', 
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(242, 192, 120, 0.2)'
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  کارمندان غایب امروز
                </Typography>
                <Typography variant="h3" component="div" color="warning.dark" sx={{ fontWeight: 'bold' }}>
                  {dailyStatus.absent}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {dailyStatus.absent > 0 ? (
                    <span>{Math.round((dailyStatus.absent / employees.length) * 100)}% غیبت</span>
                  ) : (
                    <span>همه کارمندان حاضر هستند</span>
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* تب‌ها */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              textColor="primary"
              indicatorColor="primary"
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              sx={{ 
                '.MuiTab-root': {
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                  minHeight: 64
                }
              }}
            >
              <Tab label="مدیریت کارمندان" icon={<PersonIcon />} iconPosition="start" {...a11yProps(0)} />
              <Tab label="گزارش حضور و غیاب" icon={<AssessmentIcon />} iconPosition="start" {...a11yProps(1)} />
            </Tabs>
          </Box>
          
          {/* تب مدیریت کارمندان */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  لیست کارمندان
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {employees.length === 0 && (
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<RefreshIcon />}
                      onClick={() => syncData()}
                      sx={{ borderRadius: 2 }}
                    >
                      بارگذاری از سرور
                    </Button>
                  )}
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenEmployeeDialog()}
                    sx={{ 
                      borderRadius: 2,
                      '& .MuiButton-startIcon': {
                        marginRight: 1
                      }
                    }}
                  >
                    افزودن کارمند جدید
                  </Button>
                </Box>
              </Box>
              
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>شناسه</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>نام کارمند</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>کد پرسنلی</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>سمت</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>وضعیت</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>عملیات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              هیچ کارمندی یافت نشد
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              برای شروع، کارمندان را از سرور بارگذاری کنید یا کارمند جدیدی اضافه کنید
                            </Typography>
                            <Stack direction="row" spacing={2} justifyContent="center">
                              <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<RefreshIcon />}
                                onClick={() => syncData()}
                                sx={{ borderRadius: 2 }}
                              >
                                بارگذاری از سرور
                              </Button>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                onClick={() => handleOpenEmployeeDialog()}
                                sx={{ borderRadius: 2 }}
                              >
                                افزودن کارمند جدید
                              </Button>
                            </Stack>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell align="center">{employee.id}</TableCell>
                          <TableCell align="right">{employee.name}</TableCell>
                          <TableCell align="right">{employee.employeeId}</TableCell>
                          <TableCell align="right">{employee.position}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={employee.isActive ? 'فعال' : 'غیرفعال'} 
                              color={employee.isActive ? 'success' : 'error'}
                              size="small"
                              sx={{ borderRadius: 1 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton 
                                color="primary" 
                                size="small"
                                onClick={() => handleOpenEmployeeDialog(employee)}
                                title="ویرایش کارمند"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                color="error" 
                                size="small"
                                onClick={() => {
                                  if (employee.id) {
                                    handleOpenDeleteDialog(employee.id, employee.name);
                                  } else {
                                    setAlertMessage({
                                      type: 'error',
                                      message: 'شناسه کارمند نامعتبر است'
                                    });
                                  }
                                }}
                                title="حذف کارمند"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
          
          {/* تب گزارش حضور و غیاب */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  گزارش حضور و غیاب
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="تاریخ"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    sx={{ width: 200 }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<FilterListIcon />}
                    sx={{ 
                      borderRadius: 2,
                      '& .MuiButton-startIcon': {
                        marginRight: 1
                      }
                    }}
                  >
                    فیلتر
                  </Button>
                </Box>
              </Box>
              
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>نام کارمند</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>کد پرسنلی</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>اولین ورود</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>آخرین خروج</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>ساعات کارکرد</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>وضعیت</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              هیچ کارمندی یافت نشد
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              برای مشاهده گزارش حضور و غیاب، ابتدا کارمندان را بارگذاری کنید
                            </Typography>
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<RefreshIcon />}
                              onClick={() => syncData()}
                              sx={{ borderRadius: 2 }}
                            >
                              بارگذاری از سرور
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee) => {
                        // یافتن رکوردهای کارمند
                        const empRecords = records.filter(r => r.employeeId === employee.id);
                        
                        // تعیین اولین ورود و آخرین خروج برای تاریخ فیلتر شده
                        const filteredRecords = empRecords.filter(r => 
                          new Date(r.timestamp).toISOString().split('T')[0] === filterDate
                        );
                        
                        const entries = filteredRecords.filter(r => r.recordType === 'ورود');
                        const exits = filteredRecords.filter(r => r.recordType === 'خروج');
                        
                        const firstEntry = entries.length > 0 
                          ? entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0].timestamp
                          : null;
                          
                        const lastExit = exits.length > 0 
                          ? exits.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
                          : null;
                        
                        // محاسبه وضعیت
                        const hasEntry = Boolean(firstEntry);
                        const hasExit = Boolean(lastExit);
                        let status = 'غایب';
                        
                        if (hasEntry && hasExit) {
                          status = 'خارج شده';
                        } else if (hasEntry) {
                          status = 'حاضر';
                        }
                        
                        // محاسبه ساعات کارکرد
                        let workHours = '0:00';
                        if (hasEntry && hasExit && firstEntry && lastExit) {
                          const entryTime = new Date(firstEntry);
                          const exitTime = new Date(lastExit);
                          const diffMs = exitTime.getTime() - entryTime.getTime();
                          const diffMinutes = Math.floor(diffMs / (1000 * 60));
                          const hours = Math.floor(diffMinutes / 60);
                          const minutes = diffMinutes % 60;
                          workHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
                        }
                        
                        return (
                          <TableRow key={employee.id}>
                            <TableCell align="right">{employee.name}</TableCell>
                            <TableCell align="center">{employee.employeeId}</TableCell>
                            <TableCell align="center">
                              {firstEntry ? formatPersianDate(firstEntry) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              {lastExit ? formatPersianDate(lastExit) : '-'}
                            </TableCell>
                            <TableCell align="center">
                              {workHours}
                            </TableCell>
                            <TableCell align="center">
                              <Chip 
                                label={status} 
                                color={
                                  status === 'حاضر' ? 'success' : 
                                  status === 'خارج شده' ? 'info' : 'error'
                                }
                                size="small"
                                sx={{ borderRadius: 1 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        </Paper>
      </Container>
      
      {/* دیالوگ افزودن/ویرایش کارمند */}
      <Dialog 
        open={employeeDialog} 
        onClose={handleCloseEmployeeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {currentEmployee && currentEmployee.id ? 'ویرایش کارمند' : 'افزودن کارمند جدید'}
        </DialogTitle>
        <form onSubmit={handleSaveEmployee}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="نام و نام خانوادگی"
                fullWidth
                required
                value={currentEmployee?.name || ''}
                onChange={(e) => setCurrentEmployee(prev => prev ? {...prev, name: e.target.value} : null)}
              />
              
              <TextField
                label="کد پرسنلی"
                fullWidth
                required
                value={currentEmployee?.employeeId || ''}
                onChange={(e) => setCurrentEmployee(prev => prev ? {...prev, employeeId: e.target.value} : null)}
              />
              
              <TextField
                label="سمت"
                fullWidth
                required
                value={currentEmployee?.position || ''}
                onChange={(e) => setCurrentEmployee(prev => prev ? {...prev, position: e.target.value} : null)}
              />
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                border: '1px dashed #ccc',
                borderRadius: 2,
                p: 3,
                bgcolor: 'rgba(0,0,0,0.02)'
              }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  تصویر کارمند
                </Typography>
                
                {currentEmployee?.avatar ? (
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    <Avatar 
                      src={currentEmployee.avatar}
                      alt={currentEmployee.name}
                      sx={{ width: 100, height: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <IconButton 
                      size="small" 
                      sx={{ 
                        position: 'absolute', 
                        top: -8, 
                        right: -8, 
                        bgcolor: 'error.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'error.dark'
                        }
                      }}
                      onClick={() => setCurrentEmployee(prev => prev ? {...prev, avatar: undefined} : null)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ) : (
                  <Avatar 
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      mb: 2, 
                      bgcolor: 'primary.light',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                )}
                
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ 
                    borderRadius: 2,
                    '& .MuiButton-startIcon': {
                      marginRight: 1
                    }
                  }}
                >
                  انتخاب تصویر
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          setCurrentEmployee(prev => prev ? {...prev, avatar: base64} : null);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
              </Box>
              
              <FormControl fullWidth>
                <InputLabel>وضعیت</InputLabel>
                <Select
                  value={currentEmployee?.isActive === undefined ? true : currentEmployee.isActive}
                  label="وضعیت"
                  onChange={(e) => setCurrentEmployee(prev => prev ? {...prev, isActive: e.target.value === 'true'} : null)}
                >
                  <MenuItem value="true">فعال</MenuItem>
                  <MenuItem value="false">غیرفعال</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseEmployeeDialog} color="inherit">انصراف</Button>
            <Button type="submit" variant="contained" color="primary">ذخیره</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* دیالوگ تاییدیه حذف کارمند */}
      <Dialog
        open={deleteConfirmDialog.open}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 'bold' }}>
          تایید حذف کارمند
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            آیا مطمئن هستید که می‌خواهید کارمند "{deleteConfirmDialog.employeeName}" را حذف کنید؟ این عملیات قابل بازگشت نیست.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit">انصراف</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">حذف</Button>
        </DialogActions>
      </Dialog>
      
      {/* نوتیفیکیشن فعالیت کارمندان */}
      <Snackbar
        open={notificationOpen}
        autoHideDuration={6000}
        onClose={() => setNotificationOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          variant="filled"
          onClose={() => setNotificationOpen(false)}
          sx={{ width: '100%', direction: 'rtl' }}
        >
          {notifications.length > 0 && (
            <Stack direction="column" spacing={1}>
              <Typography variant="subtitle2" fontWeight="bold">
                فعالیت جدید کارمندان
              </Typography>
              <Typography variant="body2">
                {notifications[0].message} - {new Intl.DateTimeFormat('fa-IR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }).format(notifications[0].time)}
              </Typography>
              {notifications.length > 1 && (
                <Typography variant="caption" color="InactiveCaptionText">
                  و {notifications.length - 1} فعالیت دیگر
                </Typography>
              )}
            </Stack>
          )}
        </Alert>
      </Snackbar>
    </Box>
  );
} 