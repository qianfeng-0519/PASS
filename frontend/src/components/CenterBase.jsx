import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Check, Trash2, RotateCcw, Edit3, Save, X, Plus, Calendar, User } from 'lucide-react';
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
  
  // 新增状态：选中的todo和详情卡片相关状态
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [showNewSubTodoModal, setShowNewSubTodoModal] = useState(false); // 弹出框状态
  const [newSubTodoForm, setNewSubTodoForm] = useState({ title: '', description: '', todo_type: 'record' });

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
      // 如果当前选中的todo被切换，更新选中状态
      if (selectedTodo && selectedTodo.id === id) {
        const updatedTodo = todos.find(t => t.id === id);
        if (updatedTodo) {
          setSelectedTodo({ ...updatedTodo, completed: !updatedTodo.completed });
        }
      }
    } catch (error) {
      console.error('切换 todo 状态失败:', error);
    }
  };

  // 删除 todo
  const handleDeleteTodo = async (id) => {
    try {
      await todoAPI.deleteTodo(id);
      fetchTodos();
      // 如果删除的是当前选中的todo，清除选中状态
      if (selectedTodo && selectedTodo.id === id) {
        setSelectedTodo(null);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('删除 todo 失败:', error);
    }
  };

  // 还原 todo
  const handleRestoreTodo = async (id) => {
    try {
      await todoAPI.restoreTodo(id);
      fetchTodos();
    } catch (error) {
      console.error('还原任务失败:', error);
    }
  };

  // 选择todo
  const handleSelectTodo = (todo) => {
    // 只有未完成且未删除的todo可以选择
    if (!todo.completed && !todo.is_deleted) {
      setSelectedTodo(todo);
      setEditForm({ title: todo.title, description: todo.description || '' });
      setIsEditing(false);
    }
  };

  // 开始编辑
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ title: selectedTodo.title, description: selectedTodo.description || '' });
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description
      };
      
      await todoAPI.updateTodo(selectedTodo.id, updateData);
      
      // 更新本地状态
      const updatedTodo = { ...selectedTodo, ...updateData };
      setSelectedTodo(updatedTodo);
      setIsEditing(false);
      
      // 刷新列表
      fetchTodos();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  // 创建子todo
  const handleCreateSubTodo = async () => {
    try {
      const subTodoData = {
        ...newSubTodoForm,
        parent_todo_id: selectedTodo.id
      };
      
      await todoAPI.createTodo(subTodoData);
      
      // 重置表单并关闭弹出框
      setNewSubTodoForm({ title: '', description: '', todo_type: 'record' });
      setShowNewSubTodoModal(false);
      
      // 刷新列表
      fetchTodos();
    } catch (error) {
      console.error('创建关联任务失败:', error);
    }
  };

  // 取消创建子todo
  const handleCancelCreateSubTodo = () => {
    setShowNewSubTodoModal(false);
    setNewSubTodoForm({ title: '', description: '', todo_type: 'record' });
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="max-w-7xl mx-auto flex flex-col h-full p-4">
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

        {/* 主要内容区域 - 左右分栏 */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* 左侧：Todo列表 - 50%宽度 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2 macos-card p-4 flex flex-col"
          >
            {/* 搜索和过滤 */}
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

            {/* Todo 列表 */}
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
                    todos.map((todo) => {
                      const isClickable = !todo.completed && !todo.is_deleted;
                      const isSelected = selectedTodo && selectedTodo.id === todo.id;
                      
                      return (
                        <motion.div
                          key={todo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-macos border transition-all ${
                            isSelected
                              ? 'bg-macos-blue bg-opacity-10 border-macos-blue'
                              : todo.completed
                              ? 'bg-macos-gray-50 border-macos-gray-200'
                              : 'bg-white border-macos-gray-200 hover:border-macos-blue'
                          } ${
                            isClickable ? 'cursor-pointer' : 'cursor-default'
                          }`}
                          onClick={() => handleSelectTodo(todo)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleTodo(todo.id);
                            }}
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
                          {todo.is_deleted ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestoreTodo(todo.id);
                              }}
                              className="text-macos-gray-400 hover:text-green-500 transition-colors"
                              title="还原任务"
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTodo(todo.id);
                              }}
                              className="text-macos-gray-400 hover:text-red-500 transition-colors"
                              title="删除任务"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* 右侧：详情卡片 - 50%宽度 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2 macos-card p-4 flex flex-col h-full"
          >
            {selectedTodo ? (
              <>
                {/* 详情卡片头部 - 固定高度 */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-macos-gray-200 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-macos-gray-800">信息详情</h3>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={handleStartEdit}
                          className="p-2 rounded-macos bg-macos-gray-100 text-macos-gray-600 hover:bg-macos-gray-200 transition-all"
                          title="编辑任务"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => setShowNewSubTodoModal(true)}
                          className="p-2 rounded-macos bg-macos-gray-100 text-macos-gray-600 hover:bg-macos-gray-200 transition-all"
                          title="新建关联任务"
                        >
                          <Plus size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          className="p-2 rounded-macos bg-green-100 text-green-600 hover:bg-green-200 transition-all"
                          title="保存"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 rounded-macos bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                          title="取消"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* 详情内容 - 可滚动区域 */}
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="space-y-4">
                    {/* 标题 */}
                    <div>
                      <label className="block text-base font-bold text-macos-gray-800 mb-2 text-left">标题：</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="macos-input w-full"
                          placeholder="请输入任务标题"
                        />
                      ) : (
                        <p className="text-macos-gray-800 bg-macos-gray-50 p-2 rounded-macos">{selectedTodo.title}</p>
                      )}
                    </div>

                    {/* 描述 */}
                    <div>
                      <label className="block text-base font-bold text-macos-gray-800 mb-2 text-left">描述：</label>
                      {isEditing ? (
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="macos-input w-full h-24 resize-none"
                          placeholder="请输入任务描述"
                        />
                      ) : (
                        <p className="text-macos-gray-800 bg-macos-gray-50 p-2 rounded-macos min-h-[60px]">
                          {selectedTodo.description || '暂无描述'}
                        </p>
                      )}
                    </div>

                    {/* 基本信息 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-macos-gray-600 bg-macos-gray-50 p-2 rounded-macos">
                          <Calendar size={14} />
                          <span className="text-sm">{formatDate(selectedTodo.created_at)}</span>
                        </div>
                      </div>
                      <div>
                        <div className={`flex items-center gap-2 p-2 rounded-macos ${
                          selectedTodo.completed ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            selectedTodo.completed ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></div>
                          <span className="text-sm">{selectedTodo.completed ? '已完成' : '进行中'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* 未选中任何todo时的提示 */
              <div className="flex-1 flex items-center justify-center text-center">
                <div className="text-macos-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-macos-gray-100 rounded-full flex items-center justify-center">
                    <Icon size={24} className="text-macos-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">选择一个任务</p>
                  <p className="text-sm">点击左侧未完成的任务查看详情</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* 新建关联任务弹出框 */}
        <AnimatePresence>
          {showNewSubTodoModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={handleCancelCreateSubTodo}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-macos-gray-800">新建关联任务</h3>
                  <button
                    onClick={handleCancelCreateSubTodo}
                    className="p-1 rounded-macos text-macos-gray-400 hover:text-macos-gray-600 hover:bg-macos-gray-100 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-macos-gray-700 mb-1">标题 *</label>
                    <input
                      type="text"
                      value={newSubTodoForm.title}
                      onChange={(e) => setNewSubTodoForm({ ...newSubTodoForm, title: e.target.value })}
                      className="macos-input w-full"
                      placeholder="请输入关联任务标题"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-macos-gray-700 mb-1">描述</label>
                    <textarea
                      value={newSubTodoForm.description}
                      onChange={(e) => setNewSubTodoForm({ ...newSubTodoForm, description: e.target.value })}
                      className="macos-input w-full h-20 resize-none"
                      placeholder="请输入关联任务描述（可选）"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-macos-gray-700 mb-1">类型</label>
                    <select
                      value={newSubTodoForm.todo_type}
                      onChange={(e) => setNewSubTodoForm({ ...newSubTodoForm, todo_type: e.target.value })}
                      className="macos-input w-full"
                    >
                      {todoTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCreateSubTodo}
                    disabled={!newSubTodoForm.title.trim()}
                    className="flex-1 bg-macos-blue text-white py-2 px-4 rounded-macos hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    创建关联任务
                  </button>
                  <button
                    onClick={handleCancelCreateSubTodo}
                    className="px-4 py-2 border border-macos-gray-300 rounded-macos text-macos-gray-600 hover:bg-macos-gray-50 transition-all"
                  >
                    取消
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CenterBase;