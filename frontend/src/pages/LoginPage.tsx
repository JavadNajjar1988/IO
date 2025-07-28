import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography,
  InputAdornment,
  IconButton,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // بررسی اطلاعات ورود (در حالت واقعی باید با سرور چک شود)
    if (username === 'admin' && password === 'admin123') {
      // ذخیره اطلاعات ورود در localStorage
      localStorage.setItem('adminLoggedIn', 'true');
      // هدایت به صفحه مدیریت
      navigate('/admin');
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است');
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        backgroundImage: 'linear-gradient(135deg, #f5f5f5 25%, #e8e8e8 25%, #e8e8e8 50%, #f5f5f5 50%, #f5f5f5 75%, #e8e8e8 75%, #e8e8e8 100%)',
        backgroundSize: '20px 20px'
      }}
    >
      <Container maxWidth="xs" sx={{ py: 4 }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            borderRadius: 3,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box 
            sx={{ 
              bgcolor: 'primary.main', 
              p: 2, 
              borderRadius: '50%',
              mb: 2
            }}
          >
            <LockOutlined sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          
          <Typography variant="h5" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
            ورود به پنل مدیریت
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="نام کاربری"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="رمز عبور"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ 
                mt: 2, 
                mb: 2, 
                borderRadius: 2,
                py: 1.2,
                fontWeight: 'bold'
              }}
            >
              ورود
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              onClick={() => navigate('/')}
              sx={{ 
                borderRadius: 2,
                fontWeight: 'medium'
              }}
            >
              بازگشت به صفحه اصلی
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
} 