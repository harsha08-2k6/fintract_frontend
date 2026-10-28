import React from 'react';
import { Auth } from './Auth';

export const Login = ({ onNavigateRegister, onNavigateForgotPassword, onSuccess }) => {
  return <Auth initialMode="login" onSuccess={onSuccess} onNavigateForgotPassword={onNavigateForgotPassword} />;
};
