import React, { useState, useEffect } from 'react';
import { authAPI, authUtils } from '../services/api';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      setFormData({
        nickname: response.data.nickname || '',
        email: response.data.email,
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      });
    } catch (err) {
      setError('加载用户信息失败');
    }
  };

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
    setSuccess('');

    // Frontend validation for password fields
    const { current_password, new_password, confirm_new_password } = formData;
    const passwordFieldsFilled = current_password || new_password || confirm_new_password;

    if (passwordFieldsFilled) {
      if (!current_password || !new_password || !confirm_new_password) {
        setError('如需修改密码，请填写所有密码字段：当前密码、新密码和确认新密码。');
        setLoading(false);
        return;
      }
      if (new_password !== confirm_new_password) {
        setError('新密码和确认新密码不匹配。');
        setLoading(false);
        return;
      }
    }

    try {
      // Prepare payload: only send password fields if they are intended to be changed
      const payload = {
        nickname: formData.nickname,
        email: formData.email,
      };
      if (passwordFieldsFilled) {
        payload.current_password = current_password;
        payload.new_password = new_password;
        payload.confirm_new_password = confirm_new_password;
      }

      const response = await authAPI.updateProfile(payload);
      setUser(response.data);
      setEditing(false);
      setSuccess('个人信息更新成功');
      // Clear password fields from form data after successful submission
      setFormData(prevData => ({
        ...prevData,
        current_password: '',
        new_password: '',
        confirm_new_password: ''
      }));
    } catch (err) {
      // 改进错误处理，显示具体错误信息
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = [];
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              errorMessages.push(`${key}: ${errorData[key].join(', ')}`);
            } else {
              errorMessages.push(`${key}: ${errorData[key]}`);
            }
          });
          setError(errorMessages.join('; '));
        } else {
          setError(errorData.detail || errorData.message || '更新失败');
        }
      } else {
        setError('更新失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authUtils.logout();
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">个人信息</h2>
        <div className="space-x-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              编辑
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 w-16 flex-shrink-0">昵称</label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="请输入昵称"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 w-16 flex-shrink-0">邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <hr className="my-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">修改密码</h3>
          <p className="text-sm text-gray-500 mb-3">如不修改密码，请将以下三个输入框留空。</p>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">当前密码</label>
            <input
              type="password"
              name="current_password"
              value={formData.current_password}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入当前密码"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">新密码</label>
            <input
              type="password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="输入新密码"
            />
          </div>

          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">确认新密码</label>
            <input
              type="password"
              name="confirm_new_password"
              value={formData.confirm_new_password}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="再次输入新密码"
            />
          </div>
          
          <div className="flex space-x-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError('');
                setSuccess('');
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <p className="mt-1 text-sm text-gray-900">{user.username}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">昵称</label>
            <p className="mt-1 text-sm text-gray-900">{user.nickname || '未设置'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">邮箱</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">账户状态</label>
            <p className="mt-1 text-sm text-gray-900">
              {user.is_active ? '激活' : '未激活'}
              {user.is_staff && ' | 管理员'}
              {user.is_superuser && ' | 超级管理员'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">注册时间</label>
            <p className="mt-1 text-sm text-gray-900">
              {user.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '未知'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;