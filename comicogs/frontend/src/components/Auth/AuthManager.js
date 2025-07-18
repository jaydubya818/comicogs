import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthManager = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);

  const handleLogin = (token) => {
    onAuthSuccess(token);
  };

  const handleRegister = (token) => {
    onAuthSuccess(token);
  };

  const switchToRegister = () => {
    setIsLogin(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <>
      {isLogin ? (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={switchToRegister}
        />
      ) : (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={switchToLogin}
        />
      )}
    </>
  );
};

export default AuthManager; 