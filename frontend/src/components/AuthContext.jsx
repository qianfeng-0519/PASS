import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokenManager } from '../services/api';

// 创建 AuthContext
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中的用户信息
    const userInfo = tokenManager.getUserInfo();
    if (userInfo && tokenManager.isAuthenticated()) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const login = (userData, tokens = null) => {
    // 如果提供了tokens，保存到localStorage
    if (tokens) {
      tokenManager.setTokens(tokens.access, tokens.refresh);
      tokenManager.setUserInfo(userData);
    }
    // 更新状态
    setUser(userData);
  };

  const logout = () => {
    tokenManager.clearTokens();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    tokenManager.setUserInfo(userData);
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user && (user.is_staff || user.is_superuser),
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 导出 AuthContext
export { AuthContext };
