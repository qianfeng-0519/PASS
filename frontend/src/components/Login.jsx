import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { MacosInput } from './ui';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const response = await authAPI.login(formData);
      // authAPI.login已经保存了token和用户信息，只需要更新AuthContext状态
      login(response.data.user);  // ✅ 只传递用户数据，不传递tokens
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到您的账户
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
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
                className="w-full"
              />
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
                className="w-full"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-indigo-600 hover:text-indigo-500">
              还没有账户？点击注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;