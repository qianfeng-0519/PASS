import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Check, Trash2, RotateCcw } from 'lucide-react';
import { todoAPI } from '../services/api';
import ConfirmDialog from './ConfirmDialog';

// 在 TodoApp 组件开头添加认证支持
import { useAuth } from './AuthContext';

// 在组件内部使用认证信息
function TodoApp() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  // 添加新的状态来管理选中的类型
  const [newTodoType, setNewTodoType] = useState('record');
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  
  // 定义类型选项
  const todoTypes = [
    { value: 'record', label: '记录', color: 'bg-blue-100 text-blue-800' },
    { value: 'requirement', label: '需求', color: 'bg-green-100 text-green-800' },
    { value: 'task', label: '任务', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'issue', label: '故障', color: 'bg-red-100 text-red-800' }
  ];
  
  // 添加确认弹框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    todoId: null,
    todoTitle: ''
  });

  // 获取 todos
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await todoAPI.getTodos({
        search: searchTerm,
        completed: filter === 'completed' ? 'true' : filter === 'active' ? 'false' : undefined,
      });
      setTodos(response.data.results || response.data);
    } catch (error) {
      console.error('获取 todos 失败:', error); // Keep console.error for debugging, but also show user notification
      showNotification('加载失败', error.response?.data?.detail || '获取任务列表失败，请稍后重试。', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [filter, searchTerm]);

  // 添加新 todo
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      await todoAPI.createTodo({ 
        title: newTodo.trim(),
        todo_type: newTodoType
      });
      setNewTodo('');
      setNewTodoType('record'); // 重置为默认值
      fetchTodos();
      showNotification('操作成功', '新任务已添加。', 'success');
    } catch (error) {
      console.error('添加 todo 失败:', error);
      showNotification('操作失败', error.response?.data?.detail || '添加任务失败，请重试。', 'error');
    }
  };

  // 切换 todo 完成状态
  const handleToggleTodo = async (id) => {
    try {
      await todoAPI.toggleTodo(id);
      fetchTodos();
      // Notification for toggle might be too noisy, consider if needed
      // showNotification('操作成功', '任务状态已更新。', 'success');
    } catch (error) {
      console.error('切换 todo 状态失败:', error);
      showNotification('操作失败', error.response?.data?.detail || '更新任务状态失败，请重试。', 'error');
    }
  };

  // 删除 todo
  const handleDeleteTodo = async (id) => {
    try {
      await todoAPI.deleteTodo(id);
      fetchTodos();
      showNotification('操作成功', '任务已删除。', 'success');
    } catch (error) {
      console.error('删除 todo 失败:', error);
      showNotification('操作失败', error.response?.data?.detail || '删除任务失败，请重试。', 'error');
    }
  };

  // 清除已完成的 todos
  const handleClearCompleted = async () => {
    try {
      const response = await todoAPI.clearCompleted();
      fetchTodos();
      showNotification('操作成功', response.data?.message || '已完成任务已清除。', 'success');
    } catch (error) {
      console.error('清除已完成 todos 失败:', error);
      showNotification('操作失败', error.response?.data?.detail || '清除已完成任务失败，请重试。', 'error');
    }
  };

  // 标记所有为完成
  const handleMarkAllCompleted = async () => {
    try {
      const response = await todoAPI.markAllCompleted();
      fetchTodos();
      showNotification('操作成功', response.data?.message ||'所有任务已标记为完成。', 'success');
    } catch (error) {
      console.error('标记所有完成失败:', error);
      showNotification('操作失败', error.response?.data?.detail || '标记所有任务为完成失败，请重试。', 'error');
    }
  };

  // 添加还原todo的处理函数
  // 在现有的 confirmDialog 状态管理函数后添加
  
  // 显示通知消息（替换 alert）
  // This function sets the state for the ConfirmDialog to show a notification.
  const showNotification = (title, message, type = 'error') => {
    setConfirmDialog({
      isOpen: true,
      title: title,
      message: message,
      type: type, // 'error', 'success', 'info', 'warning'
      confirmText: '知道了', // Or 'OK'
      showCancelButton: false,
      onConfirm: () => setConfirmDialog({ isOpen: false, todoId: null, todoTitle: '' }), // Reset all relevant fields
      onClose: () => setConfirmDialog({ isOpen: false, todoId: null, todoTitle: '' }),   // Reset all relevant fields
      isNotification: true // Flag to differentiate from delete confirmation
    });
  };
  
  // 修改 handleRestoreTodo 函数中的 alert 调用
  const handleRestoreTodo = async (id) => {
    try {
      await todoAPI.restoreTodo(id);
      fetchTodos();
      showNotification('操作成功', '任务已成功还原。', 'success');
    } catch (error) {
      console.error('还原任务失败:', error);
      showNotification('操作失败', error.response?.data?.error || '还原任务失败，请重试。', 'error');
    }
  };
  
  // This ConfirmDialog instance will now handle both notifications and delete confirmations.
  // The properties will be dynamically set by showNotification or showDeleteConfirm.
  
  // 添加显示删除确认弹框的函数
  const showDeleteConfirm = (todo) => {
    setConfirmDialog({
      isOpen: true,
      title: '确认删除任务',
      message: `确定要删除任务 "${todo.title}" 吗？删除后管理员才能恢复。`,
      type: 'warning',
      confirmText: '删除',
      cancelText: '取消',
      showCancelButton: true,
      onConfirm: () => {
        if (todo.id) { // Ensure todo.id is available
          handleDeleteTodo(todo.id);
        }
        setConfirmDialog({ isOpen: false, todoId: null, todoTitle: '' }); // Close and reset
      },
      onClose: () => setConfirmDialog({ isOpen: false, todoId: null, todoTitle: '' }), // Close and reset
      todoId: todo.id, // Keep for potential direct use if needed, though onConfirm now handles it
      todoTitle: todo.title, // Keep for potential direct use
      isNotification: false
    });
  };

  // closeDeleteConfirm is now handled by onClose in setConfirmDialog for delete, or by onConfirm/onClose for notifications
  // confirmDelete is now handled by onConfirm in setConfirmDialog for delete

  // No longer explicitly needed as separate functions if ConfirmDialog state is managed well.
  // const closeDeleteConfirm = () => { ... };
  // const confirmDelete = () => { ... };


  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* 主卡片 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="macos-card p-6"
        >
          {/* 添加新 todo */}
          <form onSubmit={handleAddTodo} className="mb-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="添加新任务..."
                className="macos-input flex-1"
              />
              {/* 新增类型选择下拉框 */}
              <select
                value={newTodoType}
                onChange={(e) => setNewTodoType(e.target.value)}
                className="macos-input w-24 text-sm"
              >
                {todoTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="macos-button-primary flex items-center gap-2"
              >
                <Plus size={18} />
                添加
              </button>
            </div>
          </form>

          {/* 搜索和过滤 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-macos-gray-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索任务..."
                className="macos-input pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'completed'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-macos text-sm font-medium transition-all ${
                    filter === filterType
                      ? 'bg-macos-blue text-white'
                      : 'bg-macos-gray-100 text-macos-gray-600 hover:bg-macos-gray-200'
                  }`}
                >
                  {filterType === 'all' ? '全部' : filterType === 'active' ? '进行中' : '已完成'}
                </button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          {todos.length > 0 && (
            <div className="flex gap-2 mb-6">
              <button
                onClick={handleMarkAllCompleted}
                className="macos-button-secondary flex items-center gap-2 text-sm"
              >
                <Check size={16} />
                全部完成
              </button>
              {completedCount > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="macos-button-secondary flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} />
                  清除已完成
                </button>
              )}
            </div>
          )}

          {/* Todo 列表 */}
          <div className="space-y-2">
            <AnimatePresence>
              {loading ? (
                <div className="text-center py-8 text-macos-gray-500">
                  加载中...
                </div>
              ) : todos.length === 0 ? (
                <div className="text-center py-8 text-macos-gray-500">
                  {searchTerm ? '没有找到匹配的任务' : '还没有任务，添加一个开始吧！'}
                </div>
              ) : (
                todos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`flex items-center gap-3 p-4 rounded-macos border transition-all ${
                      todo.completed
                        ? 'bg-macos-gray-50 border-macos-gray-200'
                        : 'bg-white border-macos-gray-200 hover:border-macos-blue'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTodo(todo.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        todo.completed
                          ? 'bg-macos-blue border-macos-blue'
                          : 'border-macos-gray-300 hover:border-macos-blue'
                      }`}
                    >
                      {todo.completed && <Check size={12} className="text-white" />}
                    </button>
                    <span
                      className={`flex-1 transition-all ${
                        todo.is_deleted
                          ? 'text-red-500' + (todo.completed ? ' line-through' : '')
                          : todo.completed
                          ? 'text-macos-gray-500 line-through'
                          : 'text-macos-gray-800'
                      }`}
                    >
                      {todo.title}
                    </span>
                    
                    {/* 类型标签 */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        todoTypes.find(type => type.value === (todo.todo_type || 'record'))?.color || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {todoTypes.find(type => type.value === (todo.todo_type || 'record'))?.label || '记录'}
                    </span>
                    
                    {/* 动态图标：根据删除状态显示不同图标 */}
                    {todo.is_deleted ? (
                      <button
                        onClick={() => handleRestoreTodo(todo.id)}
                        className="text-macos-gray-400 hover:text-green-500 transition-colors"
                        title="还原任务"
                      >
                        <RotateCcw size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => showDeleteConfirm(todo)}
                        className="text-macos-gray-400 hover:text-red-500 transition-colors"
                        title="删除任务"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* 统计信息 */}
          {todos.length > 0 && (
            <div className="mt-6 pt-4 border-t border-macos-gray-200 text-sm text-macos-gray-500 text-center">
              总共 {todos.length} 个任务，{activeCount} 个进行中，{completedCount} 个已完成
            </div>
          )}
        </motion.div>
        
        {/* 添加确认弹框 */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={confirmDialog.onClose || (() => setConfirmDialog({ isOpen: false }))} // Default onClose if not provided
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title || "提示"}
          message={confirmDialog.message || ""}
          type={confirmDialog.type || 'info'}
          confirmText={confirmDialog.confirmText || "确定"}
          cancelText={confirmDialog.cancelText || "取消"}
          showCancelButton={confirmDialog.showCancelButton !== false} // Default to true if not specified
        />
      </div>
    </div>
  );
};

export default TodoApp;