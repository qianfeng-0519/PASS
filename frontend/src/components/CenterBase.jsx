import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Check, Trash2, RotateCcw } from 'lucide-react';
import { todoAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CenterBase = ({ 
  title, 
  description, 
  todoType, 
  icon: Icon, 
  color = 'blue',
  children 
}) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, active, completed

  // 定义类型选项
  const todoTypes = [
    { value: 'record', label: '记录', color: 'bg-blue-100 text-blue-800' },
    { value: 'requirement', label: '需求', color: 'bg-green-100 text-green-800' },
    { value: 'task', label: '任务', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'issue', label: '故障', color: 'bg-red-100 text-red-800' }
  ];

  // 颜色主题配置
  const colorThemes = {
    blue: {
      primary: 'bg-blue-500',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-100'
    },
    green: {
      primary: 'bg-green-500',
      light: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:bg-green-100'
    },
    yellow: {
      primary: 'bg-yellow-500',
      light: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      hover: 'hover:bg-yellow-100'
    },
    red: {
      primary: 'bg-red-500',
      light: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      hover: 'hover:bg-red-100'
    }
  };

  const theme = colorThemes[color];

  // 获取数据
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const params = {
        todo_type: todoType,
        search: searchTerm
      };
      
      if (filter === 'completed') {
        params.completed = 'true';
      } else if (filter === 'active') {
        params.completed = 'false';
      }
      
      const response = await todoAPI.getTodos(params);
      const data = response.data;
      
      // 处理不同的API响应格式
      if (Array.isArray(data)) {
        setTodos(data);
      } else if (data.results) {
        setTodos(data.results);
      } else {
        setTodos([]);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [todoType, searchTerm, filter]);

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

  // 添加还原 todo 功能
  const handleRestoreTodo = async (id) => {
    try {
      await todoAPI.restoreTodo(id);
      fetchTodos();
    } catch (error) {
      console.error('还原任务失败:', error);
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="max-w-4xl mx-auto flex flex-col h-full p-4">
        {/* 页面头部 - 固定高度 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex-shrink-0"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${theme.primary} text-white`}>
              <Icon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{description}</p>
            </div>
          </div>
        </motion.div>

        {/* 主要内容卡片 - 可伸缩容器 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="macos-card p-4 flex flex-col flex-1 min-h-0"
        >
          {/* 搜索和过滤 - 固定高度 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-macos-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索任务..."
                className="macos-input pl-9 py-2"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'completed'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1.5 rounded-macos font-medium transition-all ${
                    filter === filterType
                      ? 'bg-macos-blue text-white'
                      : 'bg-macos-gray-100 text-macos-gray-600 hover:bg-macos-gray-200'
                  }`}
                >
                  {filterType === 'all' ? '全部' : filterType === 'active' ? '进行中' : '已完成'}
                </button>
              ))}
              
              {/* 刷新按钮 */}
              <button
                onClick={fetchTodos}
                disabled={loading}
                className={`px-2.5 py-1.5 rounded-macos bg-macos-gray-100 text-macos-gray-600 hover:bg-macos-gray-200 transition-all ${
                  loading ? 'opacity-50' : ''
                }`}
              >
                <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={14} />
              </button>
            </div>
          </div>

          {/* Todo 列表 - 可滚动容器 */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1 pr-2">
              <AnimatePresence>
                {loading ? (
                  <div className="text-center py-6 text-macos-gray-500">
                    加载中...
                  </div>
                ) : todos.length === 0 ? (
                  <div className="text-center py-6 text-macos-gray-500">
                    {searchTerm ? '没有找到匹配的任务' : `暂无${todoTypes.find(t => t.value === todoType)?.label || ''}数据`}
                  </div>
                ) : (
                  todos.map((todo) => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-macos border transition-all ${
                        todo.completed
                          ? 'bg-macos-gray-50 border-macos-gray-200'
                          : 'bg-white border-macos-gray-200 hover:border-macos-blue'
                      }`}
                    >
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                          todo.completed
                            ? 'bg-macos-blue border-macos-blue'
                            : 'border-macos-gray-300 hover:border-macos-blue'
                        }`}
                      >
                        {todo.completed && <Check size={10} className="text-white" />}
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
                        className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
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
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="text-macos-gray-400 hover:text-red-500 transition-colors"
                          title="删除任务"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CenterBase;