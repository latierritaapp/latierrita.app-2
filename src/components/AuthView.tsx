import React, { useState } from 'react';
import { LoginView } from './LoginView';
import { RegisterView } from './RegisterView';

export const AuthView: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');

  if (currentPage === 'register') {
    return <RegisterView onGoToLogin={() => setCurrentPage('login')} />;
  }

  return <LoginView onGoToRegister={() => setCurrentPage('register')} />;
};
