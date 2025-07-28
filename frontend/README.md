# سامانه ثبت ورود و خروج کارمندان - فرانت‌اند

این بخش سمت کلاینت سامانه ثبت ورود و خروج کارمندان است که با React و TypeScript پیاده‌سازی شده است.

## ویژگی‌ها

- قابلیت Progressive Web App (PWA)
- ذخیره‌سازی آفلاین با IndexedDB
- رابط کاربری ریسپانسیو با Material UI
- همگام‌سازی خودکار رکوردهای ذخیره شده آفلاین
- پشتیبانی کامل از زبان فارسی و RTL

## راه‌اندازی

### پیش‌نیازها

- Node.js 16 یا بالاتر

### نصب وابستگی‌ها

```bash
# نصب کتابخانه‌ها
npm install
```

### اجرای پروژه

```bash
# اجرای سرور توسعه
npm run dev
```

سرور در آدرس `http://localhost:5173` در دسترس خواهد بود.

## ساختار پروژه

- `src/` - کد اصلی برنامه
  - `components/` - کامپوننت‌های React
  - `db/` - پیکربندی IndexedDB
  - `services/` - سرویس‌های برنامه
  - `hooks/` - هوک‌های سفارشی React
  - `contexts/` - کانتکست‌های React
  - `App.tsx` - کامپوننت اصلی برنامه
- `public/` - فایل‌های استاتیک
- `index.html` - صفحه اصلی

## ساخت نسخه تولید

```bash
# ساخت نسخه بهینه‌سازی شده
npm run build
```

فایل‌های ساخته شده در پوشه `dist` قرار می‌گیرند.

## تست

```bash
# اجرای تست‌ها
npm run test
```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
