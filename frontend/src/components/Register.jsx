import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { MacosInput } from './ui';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nickname: '',  // 添加nickname字段
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // 清除对应字段的错误
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess(false);
  
    // 前端验证
    if (formData.password !== formData.confirm_password) {  // ✅ 更新字段名
      setErrors({ confirm_password: '两次输入的密码不一致' });  // ✅ 更新字段名
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Register error:', err);
      if (err.response?.data) {
        // 处理后端返回的字段错误
        const backendErrors = err.response.data;
        const formattedErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          if (Array.isArray(backendErrors[key])) {
            formattedErrors[key] = backendErrors[key][0];
          } else {
            formattedErrors[key] = backendErrors[key];
          }
        });
        
        setErrors(formattedErrors);
      } else {
        setErrors({ general: '注册失败，请稍后重试' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            <h3 className="text-lg font-medium">注册成功！</h3>
            <p>正在跳转到登录页面...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            创建新账户
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <MacosInput
                id="username"
                name="username"
                type="text"
                required
                placeholder="用户名"
                value={formData.username}
                onChange={handleChange}
                error={!!errors.username}
                className="w-full"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <MacosInput
                id="email"
                name="email"
                type="email"
                required
                placeholder="邮箱地址"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                className="w-full"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <MacosInput
                id="nickname"
                name="nickname"
                type="text"
                required
                placeholder="昵称"
                value={formData.nickname}
                onChange={handleChange}
                error={!!errors.nickname}
                className="w-full"
              />
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-600">{errors.nickname}</p>
              )}
            </div>

            <div>
              <MacosInput
                id="password"
                name="password"
                type="password"
                required
                placeholder="密码"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                className="w-full"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <MacosInput
                name="confirm_password"
                type="password"
                required
                placeholder="确认密码"
                value={formData.confirm_password}
                onChange={handleChange}
                error={!!errors.confirm_password}
                className="w-full"
              />
              {errors.confirm_password && (
                <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
              已有账户？点击登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;