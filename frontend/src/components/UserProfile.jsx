import React, { useState, useEffect } from 'react';
import { authAPI, authUtils } from '../services/api';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
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
        username: response.data.username,
        email: response.data.email,
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || ''
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

    try {
      const response = await authAPI.updateProfile(formData);
      setUser(response.data);
      setEditing(false);
      setSuccess('个人信息更新成功');
    } catch (err) {
      setError(err.response?.data?.detail || '更新失败');
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
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
            >
              编辑
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            登出
          </button>
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">用户名</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">姓</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">名</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
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
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
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
            <label className="block text-sm font-medium text-gray-700">邮箱</label>
            <p className="mt-1 text-sm text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">姓名</label>
            <p className="mt-1 text-sm text-gray-900">
              {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : '未设置'}
            </p>
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
              {new Date(user.date_joined).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;