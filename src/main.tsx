import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';

// /admin route — load admin dashboard, everything else loads the main app
const isAdminRoute = window.location.pathname.startsWith('/admin');

if (isAdminRoute) {
  import('../admin/AdminRoot.tsx').then(({ default: AdminRoot }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <AuthProvider>
          <AdminRoot />
        </AuthProvider>
      </StrictMode>,
    );
  });
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
}
