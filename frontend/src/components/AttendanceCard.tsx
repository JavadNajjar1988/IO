import { useState } from 'react';
import { 
  Card, 
  CardContent,
  Typography, 
  Button, 
  Avatar, 
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Badge,
  Tooltip,
  alpha
} from '@mui/material';
import { green, red } from '@mui/material/colors';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Employee } from '../db/database';
import { attendanceService } from '../services/attendanceService';

interface AttendanceCardProps {
  employee: Employee;
  onRecordComplete?: () => void;
  backgroundColor?: string;
}

export default function AttendanceCard({ employee, onRecordComplete, backgroundColor = 'rgba(69, 88, 190, 0.08)' }: AttendanceCardProps) {
  const [loading, setLoading] = useState<'ورود' | 'خروج' | null>(null);
  const [lastAction, setLastAction] = useState<'ورود' | 'خروج' | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; type: 'success' | 'error'}>({
    open: false,
    message: '',
    type: 'success'
  });
  
  // ثبت ورود یا خروج
  const handleAttendance = async (recordType: 'ورود' | 'خروج') => {
    setLoading(recordType);
    
    try {
      const result = await attendanceService.recordAttendance(
        employee.id as number, 
        recordType
      );
      
      // ذخیره آخرین عملیات موفق
      if (result.success) {
        setLastAction(recordType);
      }
      
      // نمایش نتیجه
      setSnackbar({
        open: true,
        message: result.message,
        type: result.success ? 'success' : 'error'
      });
      
      // فراخوانی رویداد کامل شدن
      if (result.success && onRecordComplete) {
        onRecordComplete();
      }
    } catch (error) {
      console.error('خطا در ثبت ورود/خروج:', error);
      setSnackbar({
        open: true,
        message: 'خطا در ثبت. لطفاً مجدداً تلاش کنید.',
        type: 'error'
      });
    } finally {
      setLoading(null);
    }
  };
  
  // بستن پیام
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // رنگ پس‌زمینه آواتار بر اساس حرف اول نام
  const getAvatarColor = (name: string) => {
    const colors = [
      '#3f51b5', '#f50057', '#00bfa5', '#ff3d00', '#ffab00', 
      '#2196f3', '#512da8', '#d500f9', '#9c27b0', '#00796b'
    ];
    
    // محاسبه ایندکس رنگ بر اساس حرف اول
    const charCode = name.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    
    return colors[colorIndex];
  };
  
  // محاسبه رنگ پس‌زمینه بر اساس نوع کارت
  const getBackgroundColor = () => {
    return backgroundColor;
  };
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        height: '100%',
        backgroundColor: getBackgroundColor(),
        borderRadius: 4,
        overflow: 'visible',
        transition: 'transform 0.3s, box-shadow 0.3s',
        border: '1px solid',
        borderColor: backgroundColor,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.03)',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: backgroundColor 
            ? '0 20px 40px rgba(0, 0, 0, 0.03)' 
            : '0 20px 40px rgba(242, 192, 120, 0.15)',
        }
      }}
    >
      {/* نشانگر وضعیت فعلی */}
      {lastAction && (
        <Tooltip 
          title={lastAction === 'ورود' ? 'وارد شده' : 'خارج شده'}
          placement="top"
          arrow
        >
          <Box
            sx={{
              position: 'absolute',
              top: -10,
              right: 20,
              zIndex: 1,
            }}
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              badgeContent={
                <CheckCircleIcon 
                  sx={{ 
                    color: lastAction === 'ورود' ? green[500] : red[500],
                    bgcolor: 'white',
                    borderRadius: '50%',
                    fontSize: 24,
                  }} 
                />
              }
            >
              <Avatar 
                sx={{ 
                  bgcolor: lastAction === 'ورود' ? green[500] : red[500],
                  width: 28,
                  height: 28,
                }}
              >
                {lastAction === 'ورود' ? <LoginIcon fontSize="small" /> : <LogoutIcon fontSize="small" />}
              </Avatar>
            </Badge>
          </Box>
        </Tooltip>
      )}
      
      <CardContent sx={{ p: 3, pb: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2.5
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {employee.name}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: alpha(backgroundColor, 0.1),
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                fontSize: '0.75rem'
              }}
            >
              {employee.position}
            </Typography>
          </Box>
          
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              fontSize: 26, 
              fontWeight: 'bold',
              bgcolor: getAvatarColor(employee.name),
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            }}
            src={employee.avatar}
          >
            {employee.name.charAt(0)}
          </Avatar>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3,
          color: 'text.secondary',
          bgcolor: alpha(backgroundColor, 0.07),
          borderRadius: 2,
          p: 1,
          fontSize: '0.85rem'
        }}>
          <Typography 
            variant="body2" 
            component="span"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              fontFamily: 'monospace',
              fontWeight: 'medium',
              letterSpacing: 0.5,
              color: 'text.primary',
              direction: 'ltr',
            }}
          >
            کد پرسنلی: {employee.employeeId}
          </Typography>
        </Box>
        
        <Box sx={{ mt: 'auto' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 1.5,
              width: '100%'
            }}
          >
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading === 'ورود'}
              onClick={() => handleAttendance('ورود')}
              startIcon={loading === 'ورود' ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                py: 1.2,
                gap: 1.5,
                borderRadius: 3,
                fontWeight: 'bold',
                boxShadow: '0 6px 15px rgba(63, 81, 181, 0.15)',
                backgroundColor: '#4558BE',
                '&:hover': {
                  backgroundColor: '#3949AB',
                  boxShadow: '0 8px 20px rgba(63, 81, 181, 0.25)',
                }
              }}
            >
               ورود
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              disabled={loading === 'خروج'}
              onClick={() => handleAttendance('خروج')}
              startIcon={loading === 'خروج' ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon />}
              sx={{
                py: 1.2,
                gap: 1.5,
                borderRadius: 3,
                fontWeight: 'bold',
                boxShadow: '0 6px 15px rgba(244, 67, 54, 0.15)',
                backgroundColor: '#f50057',
                '&:hover': {
                  backgroundColor: '#e41249',
                  boxShadow: '0 8px 20px rgba(244, 67, 54, 0.25)',
                }
              }}
            >
               خروج
            </Button>
          </Box>
          
          {lastAction && (
            <Box sx={{ 
              mt: 2, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <Chip 
                icon={<AccessTimeIcon sx={{ fontSize: 16 }} />} 
                label={lastAction === 'ورود' ? 'ورود با موفقیت ثبت شد' : 'خروج با موفقیت ثبت شد'} 
                color={lastAction === 'ورود' ? 'success' : 'info'}
                size="small"
                sx={{ 
                  borderRadius: 2,
                  fontWeight: 'medium',
                  fontSize: '0.75rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  px: 0.5
                }}
              />
            </Box>
          )}
        </Box>
      </CardContent>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.type} 
          variant="filled"
          sx={{ width: '100%', direction: 'rtl', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
} 