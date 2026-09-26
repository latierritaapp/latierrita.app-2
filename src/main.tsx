import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept password recovery tokens from URL before Supabase client strips the hash
if (typeof window !== 'undefined') {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const pathname = window.location.pathname || '';
  
  if (
    hash.includes('type=recovery') ||
    search.includes('type=recovery') ||
    pathname.includes('reset-password') ||
    (hash.includes('access_token') && (hash.includes('recovery') || hash.includes('type=recovery')))
  ) {
    try {
      sessionStorage.setItem('latierrita_is_password_recovery', 'true');
    } catch {}
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
