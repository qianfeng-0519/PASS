import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { Users, Search, MoreVertical, Shield, ShieldOff, Trash2, BarChart3, Key, UserCog } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // 添加 ConfirmDialog 状态管理
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    showCancelButton: true,
    onConfirm: () => {},
    onClose: () => {}
  });

  // 显示通知消息的函数
  const showNotification = (title, message, type = 'info') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      showCancelButton: false,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      onClose: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 显示确认对话框的函数
  const showConfirmDialog = (title, message, onConfirm, type = 'warning') => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      type,
      showCancelButton: true,
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onClose: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 获取用户统计
  const fetchStats = async () => {
    try {
      const response = await authAPI.getUserStats();
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  // 获取用户列表
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        search: searchTerm,
        is_active: filterStatus === 'all' ? undefined : filterStatus === 'active'
      };
      
      const response = await authAPI.getUsers(params);
      setUsers(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10));
      setCurrentPage(page);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换用户状态
  const toggleUserStatus = async (userId) => {
    try {
      await authAPI.toggleUserStatus(userId);
      fetchUsers(currentPage); // 刷新列表
    } catch (error) {
      console.error('切换用户状态失败:', error);
      showNotification('操作失败', '操作失败，请重试', 'error');
    }
  };

  // 添加下拉菜单状态
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  // 删除用户函数（修复）
  const deleteUser = async (userId) => {
    const performDelete = async () => {
      try {
        await authAPI.deleteUser(userId);
        // 删除成功后刷新列表
        await fetchUsers(currentPage);
        await fetchStats();
        showNotification('删除成功', '用户删除成功', 'success');
        setOpenDropdown(null); // 关闭下拉菜单
      } catch (error) {
        console.error('删除用户失败:', error);
        showNotification('删除失败', '删除失败：' + (error.response?.data?.error || '请重试'), 'error');
      }
    };
    
    showConfirmDialog(
      '确认删除',
      '确定要删除这个用户吗？此操作不可恢复。',
      performDelete,
      'warning'
    );
  };

  // 修改重置密码函数
const resetUserPassword = async () => {
    try {
      await authAPI.resetUserPassword(selectedUser.id);
      showNotification('重置成功', '密码已重置为：Pwd123456', 'success');
      setShowPasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('重置密码失败:', error);
      showNotification('重置失败', '重置密码失败：' + (error.response?.data?.error || '请重试'), 'error');
    }
  };
  
  // 更新角色函数（修复）
  const updateUserRole = async () => {
    try {
      await authAPI.updateUserRole(selectedUser.id, {
        is_staff: selectedRole === 'admin',
        is_superuser: selectedRole === 'superuser'
      });
      showNotification('更新成功', '角色更新成功', 'success');
      setShowRoleModal(false);
      setSelectedUser(null);
      setSelectedRole('');
      await fetchUsers(currentPage);
      await fetchStats();
    } catch (error) {
      console.error('更新角色失败:', error);
      showNotification('更新失败', '更新角色失败：' + (error.response?.data?.error || '请重试'), 'error');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterStatus]);

  // 在useEffect中添加
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('.relative')) {
        setOpenDropdown(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">管理员仪表板</h1>
        <p className="text-gray-600">管理用户账户和查看系统统计</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">总用户数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">活跃用户</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_users}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ShieldOff className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">非活跃用户</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive_users}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">管理员</p>
                <p className="text-2xl font-bold text-gray-900">{stats.admin_users}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 用户管理 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">用户管理</h2>
        </div>
        
        {/* 搜索和过滤 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="搜索用户名或邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">所有用户</option>
              <option value="active">活跃用户</option>
              <option value="inactive">非活跃用户</option>
            </select>
          </div>
        </div>

        {/* 用户列表 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  权限
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效Todo数量
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后登录
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    没有找到用户
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? '活跃' : '非活跃'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_staff 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_staff ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.todos_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login_time ? new Date(user.last_login_time).toLocaleDateString('zh-CN') : '从未登录'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {openDropdown === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  toggleUserStatus(user.id);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                {user.is_active ? (
                                  <><ShieldOff className="h-4 w-4 mr-2" />禁用用户</>
                                ) : (
                                  <><Shield className="h-4 w-4 mr-2" />启用用户</>
                                )}
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowPasswordModal(true);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Key className="h-4 w-4 mr-2" />
                                重置密码
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.is_superuser ? 'superuser' : user.is_staff ? 'admin' : 'user');
                                  setShowRoleModal(true);
                                  setOpenDropdown(null);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <UserCog className="h-4 w-4 mr-2" />
                                设置角色
                              </button>
                              
                              <div className="border-t border-gray-100"></div>
                              
                              <button
                                onClick={() => {
                                  deleteUser(user.id);
                                }}
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除用户
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                          {/* 密码重置模态框 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                重置密码 - {selectedUser?.username}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                确定要重置该用户的密码吗？密码将被重置为：Pwd123456
              </p>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  取消
                </button>
                <button
                  onClick={resetUserPassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
                    
                    {/* 角色设置模态框 */}
                    {showRoleModal && (
                      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                          <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                              设置用户角色 - {selectedUser?.username}
                            </h3>
                            <div className="space-y-3">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="role"
                                  value="user"
                                  checked={selectedRole === 'user'}
                                  onChange={(e) => setSelectedRole(e.target.value)}
                                  className="mr-2"
                                />
                                <span>普通用户</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="role"
                                  value="admin"
                                  checked={selectedRole === 'admin'}
                                  onChange={(e) => setSelectedRole(e.target.value)}
                                  className="mr-2"
                                />
                                <span>管理员</span>
                              </label>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                              <button
                                onClick={() => {
                                  setShowRoleModal(false);
                                  setSelectedUser(null);
                                  setSelectedRole('');
                                }}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                              >
                                取消
                              </button>
                              <button
                                onClick={updateUserRole}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                              >
                                确认设置
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchUsers(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => fetchUsers(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 添加 ConfirmDialog 组件 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={confirmDialog.onClose}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        showCancelButton={confirmDialog.showCancelButton}
      />
    </div>
  );
}


export default AdminDashboard;
