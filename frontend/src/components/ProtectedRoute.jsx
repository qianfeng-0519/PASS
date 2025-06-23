import React from 'react';
import { Navigate } from 'react-router-dom';
import { authUtils } from '../services/api';

const ProtectedRoute = ({ children, requireAuth = true, requireAdmin = false }) => {
  const isAuthenticated = authUtils.isAuthenticated();
  const isAdmin = authUtils.isAdmin();

  // 需要登录但未登录 - 直接重定向到登录页面
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 需要管理员权限但不是管理员
  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">权限不足</h2>
          <p className="text-gray-600 mb-4">您没有访问此页面的权限</p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;