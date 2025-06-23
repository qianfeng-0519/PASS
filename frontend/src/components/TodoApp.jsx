import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Check, Trash2, RotateCcw } from 'lucide-react';
import { todoAPI } from '../services/api';

// 在 TodoApp 组件开头添加认证支持
import { useAuth } from './AuthContext';

// 在组件内部使用认证信息
function TodoApp() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.error('获取 todos 失败:', error);
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
      await todoAPI.createTodo({ title: newTodo.trim() });
      setNewTodo('');
      fetchTodos();
    } catch (error) {
      console.error('添加 todo 失败:', error);
    }
  };

  // 切换 todo 完成状态
  const handleToggleTodo = async (id) => {
    try {
      await todoAPI.toggleTodo(id);
      fetchTodos();
    } catch (error) {
      console.error('切换 todo 状态失败:', error);
    }
  };

  // 删除 todo
  const handleDeleteTodo = async (id) => {
    try {
      await todoAPI.deleteTodo(id);
      fetchTodos();
    } catch (error) {
      console.error('删除 todo 失败:', error);
    }
  };

  // 清除已完成的 todos
  const handleClearCompleted = async () => {
    try {
      await todoAPI.clearCompleted();
      fetchTodos();
    } catch (error) {
      console.error('清除已完成 todos 失败:', error);
    }
  };

  // 标记所有为完成
  const handleMarkAllCompleted = async () => {
    try {
      await todoAPI.markAllCompleted();
      fetchTodos();
    } catch (error) {
      console.error('标记所有完成失败:', error);
    }
  };

  // 添加还原todo的处理函数
  const handleRestoreTodo = async (id) => {
    try {
      await todoAPI.restoreTodo(id);
      await fetchTodos(); // 重新获取数据
    } catch (error) {
      console.error('还原任务失败:', error);
      alert('还原任务失败，请重试');
    }
  };

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
                        onClick={() => handleDeleteTodo(todo.id)}
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
      </div>
    </div>
  );
};

export default TodoApp;