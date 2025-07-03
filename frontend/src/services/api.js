import axios from 'axios';

// Use environment variable for API base URL, with a fallback for local development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token 管理
const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },
  getUserInfo: () => {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
  },
  setUserInfo: (userInfo) => {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  },
  isAuthenticated: () => {
    return !!tokenManager.getAccessToken();
  },
  isAdmin: () => {
    const userInfo = tokenManager.getUserInfo();
    return userInfo && (userInfo.is_staff || userInfo.is_superuser);
  }
};

// 请求拦截器 - 自动添加认证头
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理 token 刷新
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 如果是 401 错误且不是刷新 token 的请求，尝试刷新 token
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/token/refresh/')) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          tokenManager.setTokens(access, refreshToken);
          
          // 重新发送原始请求
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // 刷新失败，清除 token 并跳转到登录页
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// 用户认证 API
// 在 authAPI 对象中添加以下方法
export const authAPI = {
  // 用户注册
  register: (userData) => api.post('/auth/register/', userData),
  
  // 用户登录
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const { user, tokens } = response.data;  // ✅ 正确：从response.data中解构
    const { access, refresh } = tokens;      // ✅ 正确：从tokens中解构access和refresh
    tokenManager.setTokens(access, refresh);
    tokenManager.setUserInfo(user);
    return response;
  },
  
  // 登出
  logout: () => {
    tokenManager.clearTokens();
    return Promise.resolve();
  },
  
  // 刷新 token
  refreshToken: async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/token/refresh/', {
      refresh: refreshToken
    });
    
    const { access } = response.data;
    tokenManager.setTokens(access, refreshToken);
    return response;
  },
  
  // 获取当前用户信息
  getCurrentUser: () => api.get('/auth/profile/'),
  
  // 更新用户资料
  updateProfile: (userData) => api.put('/auth/profile/', userData),
  
  // 修改密码
  changePassword: (passwordData) => api.post('/auth/change-password/', passwordData),
  
  // 管理员API - 获取用户统计
  getUserStats: () => api.get('/auth/admin/stats/'),
  
  // 管理员API - 获取用户列表
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value);
      }
    });
    return api.get(`/auth/admin/users/?${queryString}`);
  },
  
  // 管理员API - 获取用户详情
  getUserDetail: (userId) => api.get(`/auth/admin/users/${userId}/`),
  
  // 管理员API - 更新用户信息
  updateUser: (userId, userData) => api.put(`/auth/admin/users/${userId}/`, userData),
  
  // 管理员API - 切换用户状态
  toggleUserStatus: (userId) => api.post(`/auth/admin/users/${userId}/toggle-status/`),
  
  // 管理员API - 删除用户（保留这个，删除下面重复的）
  deleteUser: (userId) => api.delete(`/auth/admin/users/${userId}/delete/`),
  
  // 管理员API - 重置用户密码
  // Accepts userId and an object { new_password, confirm_password }
  resetUserPassword: (userId, passwordData) => api.post(`/auth/admin/users/${userId}/reset-password/`, passwordData),
  
  // 管理员API - 更新用户角色（移除超级管理员选项）
  updateUserRole: (userId, roleData) => api.post(`/auth/admin/users/${userId}/update-role/`, roleData),
};

// Note: adminAPI object was removed as it was redundant and used incorrect paths.
// All its functionalities are correctly implemented in authAPI.

// Todo API (保持原有功能)
export const todoAPI = {
  // 获取所有 todos
  getTodos: (params = {}) => api.get('/todos/', { params }),
  
  // 创建新 todo
  createTodo: (data) => api.post('/todos/', data),
  
  // 更新 todo
  updateTodo: (id, data) => api.put(`/todos/${id}/`, data),
  
  // 删除 todo
  deleteTodo: (id) => api.delete(`/todos/${id}/`),
  
  // 还原 todo
  restoreTodo: (id) => api.post(`/todos/${id}/restore/`),
  
  // 切换完成状态
  toggleTodo: (id) => api.post(`/todos/${id}/toggle_completed/`),
  
  // 标记所有为完成
  markAllCompleted: () => api.post('/todos/mark_all_completed/'),
  
  // 清除已完成的 todos
  clearCompleted: () => api.delete('/todos/clear_completed/'),
};

// 权限检查工具
export const authUtils = {
  // 检查是否已登录
  isAuthenticated: tokenManager.isAuthenticated,
  
  // 检查是否是管理员
  isAdmin: tokenManager.isAdmin,
  
  // 获取当前用户信息
  getCurrentUser: tokenManager.getUserInfo,
  
  // 检查是否有特定权限
  hasPermission: (permission) => {
    const userInfo = tokenManager.getUserInfo();
    if (!userInfo) return false;
    
    switch (permission) {
      case 'admin':
        return userInfo.is_staff || userInfo.is_superuser;
      case 'superuser':
        return userInfo.is_superuser;
      default:
        // Defaulting to false for unknown permissions is safer.
        // Consider if specific, named permissions are needed beyond admin/superuser.
        console.warn(`Unknown permission check: ${permission}`);
        return false;
    }
  },
  
  // 登出并清理
  logout: () => {
    tokenManager.clearTokens();
    window.location.href = '/login';
  }
};

// Chat API
export const chatAPI = {
  // 获取对话列表
  getConversations: (params = {}) => api.get('/chat/', { params }),
  
  // 创建新对话
  createConversation: () => api.post('/chat/create_conversation/'),
  
  // 获取对话详情
  getConversation: (id) => api.get(`/chat/${id}/`),
  
  // 获取对话消息
  getMessages: (conversationId) => api.get(`/chat/${conversationId}/messages/`),
  
  // 发送消息（流式响应）
  sendMessage: async (conversationId, message, persona = 'DefaultAssistant') => {
    const token = tokenManager.getAccessToken();
    const response = await fetch(`${API_BASE_URL}/chat/${conversationId}/send_message/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        message, 
        persona 
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  },
  
  // 删除对话
  deleteConversation: (id) => api.delete(`/chat/${id}/`),
  
  // 更新对话标题
  updateConversation: (id, data) => api.put(`/chat/${id}/`, data),
};

export { tokenManager };
export default api;