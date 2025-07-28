import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import AdminPage from './pages/AdminPage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'
import { createTheme } from '@mui/material/styles'
import rtlPlugin from 'stylis-plugin-rtl'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { prefixer } from 'stylis'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CssBaseline from '@mui/material/CssBaseline'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'

// ایجاد استایل‌های RTL
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
})

// تم اصلی با پشتیبانی از RTL
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: [
      'Vazirmatn',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Vazirmatn';
          font-style: normal;
          font-display: swap;
          font-weight: 400;
          src: url('/fonts/Vazirmatn-Regular.woff2') format('woff2');
          unicodeRange: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF;
        }
      `,
    },
  },
})

// تعریف مسیرها
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/admin',
    element: <AdminPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  }
])

// ثبت سرویس ورکر PWA
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('نسخه جدیدی از برنامه در دسترس است. آیا می‌خواهید بروزرسانی کنید؟')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('برنامه برای استفاده آفلاین آماده است.')
    // نمایش پیام به کاربر
    const offlineMsg = document.createElement('div')
    offlineMsg.style.position = 'fixed'
    offlineMsg.style.bottom = '20px'
    offlineMsg.style.right = '20px'
    offlineMsg.style.backgroundColor = '#4caf50'
    offlineMsg.style.color = 'white'
    offlineMsg.style.padding = '12px 16px'
    offlineMsg.style.borderRadius = '8px'
    offlineMsg.style.fontFamily = 'Vazirmatn, sans-serif'
    offlineMsg.style.zIndex = '9999'
    offlineMsg.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)'
    offlineMsg.textContent = 'برنامه برای استفاده آفلاین آماده است'
    document.body.appendChild(offlineMsg)
    
    // حذف پیام بعد از چند ثانیه
    setTimeout(() => {
      document.body.removeChild(offlineMsg)
    }, 5000)
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CacheProvider value={cacheRtl}>
      <CssVarsProvider theme={theme}>
        <CssBaseline />
        <RouterProvider router={router} />
      </CssVarsProvider>
    </CacheProvider>
  </React.StrictMode>,
)
