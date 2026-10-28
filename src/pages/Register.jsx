import React from 'react';
import { Auth } from './Auth';

export const Register = ({ onNavigateLogin, onSuccess }) => {
  return <Auth initialMode="register" onSuccess={onSuccess} />;
};
