import { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  CssBaseline,
  ThemeProvider,
  createTheme,
  Alert,
  Button,
  useMediaQuery,
  Fab,
  Grid
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttendanceCard from './components/AttendanceCard';
import { db } from './db/database';
import type { Employee } from './db/database';
import { attendanceService } from './services/attendanceService';
import { employeeService } from './services/employeeService';

// تم مدرن با رنگ‌های جذاب
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Vazirmatn, Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    }
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#4558BE', // آبی سیر (ایندیگو)
      light: '#757de8',
      dark: '#002984',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057', // صورتی
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#EFF1F9',
      paper: '#ffffff',
    },
    success: {
      main: '#00bfa5', // سبز فیروزه‌ای
    },
    error: {
      main: '#ff3d00', // نارنجی قرمز
    },
    warning: {
      main: '#ffab00', // زرد کهربایی
    },
    info: {
      main: '#2196f3', // آبی روشن
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
          padding: '10px 20px',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 6px 20px rgba(63, 81, 181, 0.4)',
          },
        },
        containedSecondary: {
          '&:hover': {
            boxShadow: '0 6px 20px rgba(245, 0, 87, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          overflow: 'visible',
          transition: 'transform 0.3s, box-shadow 0.3s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// داده‌های نمونه برای محیط توسعه
const mockEmployees: Employee[] = [
  {
    id: 1,
    name: 'علی محمدی',
    employeeId: '10001',
    position: 'برنامه‌نویس ارشد',
    isActive: true,
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg'
  },
  {
    id: 2,
    name: 'سارا احمدی',
    employeeId: '10002',
    position: 'طراح رابط کاربری',
    isActive: true,
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg'
  },
  {
    id: 3,
    name: 'حسین کریمی',
    employeeId: '10003',
    position: 'مدیر محصول',
    isActive: true,
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg'
  },
  {
    id: 4,
    name: 'مریم رضایی',
    employeeId: '10004',
    position: 'متخصص بازاریابی',
    isActive: true,
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg'
  },
  {
    id: 5,
    name: 'محمد جعفری',
    employeeId: '10005',
    position: 'توسعه‌دهنده موبایل',
    isActive: true,
    avatar: 'https://randomuser.me/api/portraits/men/5.jpg'
  },
  {
    id: 6,
    name: 'زهرا حسینی',
    employeeId: '10006',
    position: 'مدیر پروژه',
    isActive: true,
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg'
  },
  {
    id: 7,
    name: 'امیر عباسی',
    employeeId: '10007',
    position: 'تحلیلگر داده',
    isActive: true,
    avatar: 'https://randomuser.me/api/portraits/men/7.jpg'
  }
];

function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<{syncing: boolean, lastSync: Date | null}>({
    syncing: false,
    lastSync: null
  });
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // بارگذاری کارمندان
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        // تلاش برای دریافت کارمندان از سرور
        const serverEmployees = await employeeService.getEmployees();
        
        if (serverEmployees && serverEmployees.length > 0) {
          setEmployees(serverEmployees);
        } else {
          // اگر کارمندی در سرور نباشد یا ارتباط برقرار نباشد، از داده‌های محلی استفاده می‌کنیم
          const localEmployees = await db.getEmployees();
          
          if (localEmployees && localEmployees.length > 0) {
            setEmployees(localEmployees);
          } else {
            // اگر هیچ داده‌ای موجود نباشد، از داده‌های نمونه استفاده می‌کنیم
            for (const emp of mockEmployees) {
              await db.employees.put(emp);
            }
            setEmployees(mockEmployees);
          }
        }
      } catch (error) {
        console.error('خطا در بارگذاری کارمندان:', error);
        
        // در صورت بروز خطا، از داده‌های نمونه استفاده می‌کنیم
        const localEmployees = await db.getEmployees();
        if (localEmployees && localEmployees.length > 0) {
          setEmployees(localEmployees);
        } else {
          for (const emp of mockEmployees) {
            await db.employees.put(emp);
          }
          setEmployees(mockEmployees);
        }
      }
    };
    
    loadEmployees();
    
    // رویداد ATTENDANCE_EVENT برای به‌روزرسانی در هنگام ثبت ورود/خروج
    const handleAttendanceEvent = () => {
      // در اینجا می‌توانیم در صورت نیاز داده‌ها را به‌روزرسانی کنیم
      // فعلاً کاری نداریم زیرا وضعیت در کارت‌ها نشان داده می‌شود
    };
    
    window.addEventListener('attendance-recorded', handleAttendanceEvent);
    
    return () => {
      window.removeEventListener('attendance-recorded', handleAttendanceEvent);
    };
  }, []);
  
  // نظارت بر وضعیت شبکه
  useEffect(() => {
    // استفاده از event listener برای بررسی وضعیت اتصال
    const handleOnline = () => {
      setNetworkStatus(true);
      // وقتی اتصال برقرار می‌شود، همگام‌سازی اتوماتیک انجام می‌دهیم
      syncAttendanceRecords();
    };
    
    const handleOffline = () => {
      setNetworkStatus(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // همگام‌سازی رکوردهای ثبت‌نشده
  const syncAttendanceRecords = async () => {
    if (!navigator.onLine) {
      return;
    }
    
    setSyncStatus({...syncStatus, syncing: true});
    
    try {
      const result = await attendanceService.syncAll();
      
      if (result.success) {
        setSyncStatus({
          syncing: false,
          lastSync: new Date()
        });
      }
    } catch (error) {
      console.error('خطا در همگام‌سازی:', error);
    } finally {
      setSyncStatus({...syncStatus, syncing: false});
    }
  };

  // تقسیم کارمندان به دو ردیف (۳ تا بالا و ۴ تا پایین)
  const firstRowEmployees = employees.slice(0, 3);
  const secondRowEmployees = employees.slice(3, 7);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <AppBar position="fixed" color="primary" elevation={0}>
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AccessTimeIcon sx={{ mr: 1, fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                سامانه ثبت ورود و خروج
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<SyncIcon />}
                onClick={syncAttendanceRecords}
                disabled={syncStatus.syncing || !networkStatus}
                sx={{ 
                  borderRadius: 20, 
                  px: 2,
                  py: 0.5,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                  },
                  '& .MuiButton-startIcon': {
                    marginRight: 1.5
                  }
                }}
              >
                همگام‌سازی
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  size="small"
                  sx={{ 
                    fontWeight: 'bold',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                    }
                  }}
                >
                  فارسی
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  sx={{ 
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                    }
                  }}
                >
                  English
                </Button>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* فضای خالی برای AppBar */}
        <Toolbar />
        
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            py: 4,
            px: isMobile ? 2 : 4,
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(69,88,190,0.05) 0%, rgba(69,88,190,0.1) 100%)',
          }}
        >
          {!networkStatus && (
            <Alert 
              severity="warning" 
              variant="filled"
              sx={{ 
                mb: 3, 
                direction: 'rtl',
                borderRadius: 2,
                width: '100%',
                maxWidth: 1200,
                boxShadow: '0 4px 12px rgba(255, 171, 0, 0.2)'
              }}
            >
              شما در حالت آفلاین هستید. رکوردها در دستگاه شما ذخیره شده و پس از اتصال به اینترنت همگام‌سازی خواهند شد.
            </Alert>
          )}
          
          <Box sx={{ 
            textAlign: 'center', 
            mb: 4, 
            px: 2,
            maxWidth: 600,
          }}>
            <Typography 
              variant="h4" 
              component="h1"
              color="primary.dark"
              sx={{ 
                mb: 2, 
                fontWeight: 'bold',
                textShadow: '1px 1px 0px rgba(255,255,255,1)'
              }}
            >
              ثبت حضور کارمندان
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}
            >
              برای ثبت ورود یا خروج، کارت خود را انتخاب کرده و دکمه مربوطه را بزنید.
            </Typography>
          </Box>
          
          <Container maxWidth="lg" sx={{ width: '100%' }}>
            {/* ردیف اول - 3 کارت */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
              {firstRowEmployees.map((employee) => (
                <Box 
                  key={employee.id}
                  sx={{ 
                    width: { xs: '100%', sm: '47%', md: '30%' },
                    mx: { xs: 0, sm: 1, md: 1.5 },
                    mb: 3
                  }}
                >
                  <AttendanceCard
                    employee={employee}
                    onRecordComplete={syncAttendanceRecords}
                    backgroundClass="primary"
                  />
                </Box>
              ))}
            </Box>
            
            {/* ردیف دوم - 4 کارت */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {secondRowEmployees.map((employee) => (
                <Box 
                  key={employee.id}
                  sx={{ 
                    width: { xs: '100%', sm: '47%', md: '22%' },
                    mx: { xs: 0, sm: 1, md: 1.5 },
                    mb: 3
                  }}
                >
                  <AttendanceCard
                    employee={employee}
                    onRecordComplete={syncAttendanceRecords}
                    backgroundClass="secondary"
                  />
                </Box>
              ))}
            </Box>
          </Container>
          
          {/* دکمه همگام‌سازی شناور برای موبایل */}
          {isMobile && (
            <Fab 
              color="secondary" 
              aria-label="همگام‌سازی"
              onClick={syncAttendanceRecords}
              disabled={syncStatus.syncing || !networkStatus}
              sx={{ 
                position: 'fixed', 
                bottom: 20, 
                right: 20,
                zIndex: 1000,
                boxShadow: '0 4px 20px rgba(245, 0, 87, 0.4)'
              }}
            >
              <SyncIcon />
            </Fab>
          )}
        </Box>
        
        <Box 
          component="footer" 
          sx={{ 
            py: 2, 
            textAlign: 'center',
            bgcolor: 'rgba(69,88,190,0.03)',
            borderTop: '1px solid rgba(69,88,190,0.1)'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            سامانه ثبت ورود و خروج کارمندان | طراحی شده با ❤️
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
