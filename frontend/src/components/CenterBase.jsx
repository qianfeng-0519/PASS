import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, RefreshCw, Check, Trash2, RotateCcw, Edit3, Save, X, Plus, Calendar, User, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { todoAPI } from '../services/api';
import { useAuth } from './AuthContext';
import PriorityTag from './PriorityTag';
import StatusTag from './StatusTag';
// 导入新的统一组件
import { MacosSelect, MacosInput, MacosTextarea } from './ui';

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
  const [filter, setFilter] = useState('active'); // 从 'all' 改为 'active'
  
  // 新增状态：选中的todo和详情卡片相关状态
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'none', status: '' });
  const [showNewSubTodoModal, setShowNewSubTodoModal] = useState(false); // 弹出框状态
  const [newSubTodoForm, setNewSubTodoForm] = useState({ title: '', description: '', todo_type: 'record', priority: 'none' });

  // 新增：统计数据状态
  const [statistics, setStatistics] = useState({
    newTodosLast7Days: 12,
    completedTodosLast7Days: 8,
    pendingTodos: 0
  });

  // 定义类型选项
  const todoTypes = [
    { value: 'record', label: '记录', color: 'bg-blue-100 text-blue-800' },
    { value: 'requirement', label: '需求', color: 'bg-green-100 text-green-800' },
    { value: 'task', label: '任务', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'issue', label: '故障', color: 'bg-red-100 text-red-800' }
  ];

  // 优先级选项
  const priorityOptions = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
    { value: 'none', label: '无' }
  ];

  // 添加状态配置 - 与后端保持同步
  const statusConfig = {
    record: [
      { value: 'pending', label: '待阅' },
      { value: 'archived', label: '归档' }
    ],
    requirement: [
      { value: 'pending_evaluation', label: '待评估' },
      { value: 'decomposed', label: '已拆解' },
      { value: 'rejected', label: '已拒绝' }
    ],
    task: [
      { value: 'todo', label: '待办' },
      { value: 'on_hold', label: '搁置' },
      { value: 'cancelled', label: '取消' },
      { value: 'completed', label: '完成' }
    ],
    issue: [
      { value: 'reported', label: '报告' },
      { value: 'reproduced', label: '复现' },
      { value: 'fixing', label: '修复' },
      { value: 'resolved', label: '解决' },
      { value: 'closed', label: '关闭' }
    ]
  };

  // 创建状态映射表用于快速查找显示名称
  const allStatusMap = {};
  Object.values(statusConfig).forEach(statuses => {
    statuses.forEach(status => {
      allStatusMap[status.value] = status.label;
    });
  });

  // 获取状态显示名称的辅助函数
  const getStatusDisplay = (statusValue) => {
    return allStatusMap[statusValue] || statusValue;
  };
  
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

  // 新增：计算统计数据的函数
  const calculateStatistics = (todos) => {
    const pendingCount = todos.filter(todo => !todo.completed && !todo.is_deleted).length;
    
    setStatistics({
      newTodosLast7Days: 12, // 固定测试值
      completedTodosLast7Days: 8, // 固定测试值
      pendingTodos: pendingCount // 使用真实的待完成数量
    });
  };

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
      let todoList = [];
      if (Array.isArray(data)) {
        todoList = data;
      } else if (data.results) {
        todoList = data.results;
      }
      
      setTodos(todoList);
      calculateStatistics(todoList); // 计算统计数据
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

  // 修改：选择todo的逻辑，支持取消选中
  const handleSelectTodo = (todo) => {
    // 只有未完成且未删除的todo可以选择
    if (!todo.completed && !todo.is_deleted) {
      // 如果点击的是已选中的todo，则取消选中
      if (selectedTodo && selectedTodo.id === todo.id) {
        setSelectedTodo(null);
        setIsEditing(false);
      } else {
        // 选中新的todo
        setSelectedTodo(todo);
        setEditForm({ 
          title: todo.title, 
          description: todo.description || '',
          priority: todo.priority || 'none',
          status: todo.status || ''
        });
        setIsEditing(false);
      }
    }
  };

  // 新增：关闭详情的函数
  const handleCloseDetail = () => {
    setSelectedTodo(null);
    setIsEditing(false);
  };

    // 开始编辑
  const handleStartEdit = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({ 
      title: selectedTodo.title, 
      description: selectedTodo.description || '',
      priority: selectedTodo.priority || 'none',
      status: selectedTodo.status || ''
    });
  };
  
  // 修改 handleSaveEdit 函数
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        status: editForm.status
      };
      
      const response = await todoAPI.updateTodo(selectedTodo.id, updateData);
      
      // 使用API返回的完整数据更新selectedTodo，确保包含最新的status_display
      if (response.data) {
        setSelectedTodo(response.data);
      } else {
        // 如果API没有返回完整数据，手动更新并计算status_display
        const updatedTodo = { 
          ...selectedTodo, 
          ...updateData,
          status_display: getStatusDisplay(updateData.status)
        };
        setSelectedTodo(updatedTodo);
      }
      
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
      setNewSubTodoForm({ title: '', description: '', todo_type: 'record', priority: 'none' });
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
    setNewSubTodoForm({ title: '', description: '', todo_type: 'record', priority: 'none' });
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

    // 从后端数据获取可用状态选项
  // 修改 getAvailableStatuses 函数
  const getAvailableStatuses = (todoType) => {
  // 使用前端配置而不是从后端获取
  return statusConfig[todoType] || [];
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="max-w-7xl mx-auto flex flex-col h-full p-4 min-w-full ">
        {/* 页面头部 - 固定高度 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${theme.primary} text-white`}>
              <Icon size={20} />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
              <span className="text-gray-500">•</span>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>
        </motion.div>

        {/* 主要内容区域 - 左右分栏 */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* 左侧：Todo列表 - 固定50%宽度 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2 macos-card p-4 flex flex-col"
          >
            {/* 搜索和过滤 */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-macos-gray-400" size={16} />
                <MacosInput
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索任务..."
                  className="pl-9 py-2"
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
                          
                          <div className="flex-1 flex items-center gap-2">
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
                            <PriorityTag priority={todo.priority || 'none'} size="xs" />
                          </div>
                          
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

          {/* 右侧：详情卡片 - 固定50%宽度 */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-1/2 macos-card p-4 flex flex-col h-full"
          >
            {selectedTodo ? (
              <>
                {/* 修改：详情卡片头部 - 添加关闭按钮 */}
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
                        {/* 关闭按钮 */}
                        <button
                          onClick={handleCloseDetail}
                          className="p-2 rounded-macos bg-macos-gray-100 text-macos-gray-600 hover:bg-macos-gray-200 transition-all"
                          title="关闭详情"
                        >
                          <X size={16} />
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
                        <p className="text-macos-gray-800 bg-macos-gray-50 p-2 rounded-macos min-h-[60px] whitespace-pre-wrap text-left">
                          {selectedTodo.description || '暂无描述'}
                        </p>
                      )}
                    </div>

                    {/* 优先级 - 仅在编辑模式下显示 */}
                    {isEditing && (
                      <div>
                        <label className="block text-base font-bold text-macos-gray-800 mb-2 text-left">优先级：</label>
                        <MacosSelect
                          value={editForm.priority}
                          onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                          options={priorityOptions}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* 状态 - 仅在编辑模式下显示 */}
                    {isEditing && (
                      <div>
                        <label className="block text-base font-bold text-macos-gray-800 mb-2 text-left">状态：</label>
                        <MacosSelect
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          options={getAvailableStatuses(selectedTodo.todo_type)}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* 基本信息 */}
                    <div>
                      <label className="block text-base font-bold text-macos-gray-800 mb-2 text-left">基本信息：</label>
                      <div className="bg-macos-gray-50 p-3 rounded-macos">
                        <div className="flex items-center justify-between gap-4">
                          {/* 创建时间 */}
                          <div className="flex items-center gap-2 text-macos-gray-600">
                            <Calendar size={14} />
                            <span className="text-sm">{formatDate(selectedTodo.created_at)}</span>
                          </div>
                          
                          {/* 完成状态 */}
                          <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                            selectedTodo.completed ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              selectedTodo.completed ? 'bg-green-500' : 'bg-yellow-500'
                            }`}></div>
                            <span className="text-sm">{selectedTodo.completed ? '已完成' : '进行中'}</span>
                          </div>
                          
                          {/* 状态标签 */}
                          {selectedTodo.status && (
                            <div>
                              <StatusTag 
                                status={getStatusDisplay(selectedTodo.status)}
                                todoType={selectedTodo.todo_type} 
                                size="sm" 
                              />
                            </div>
                          )}
                          
                          {/* 优先级 */}
                          <div>
                            <PriorityTag priority={selectedTodo.priority || 'none'} size="sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* 修改：替换为统计数据背景板 */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md w-full">
                  <h3 className="text-xl font-semibold text-gray-800 mb-6">数据概览</h3>
                  
                  {/* 紧凑统计卡片 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="grid grid-cols-3 gap-6">
                      {/* 近7天新增 */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{statistics.newTodosLast7Days}</div>
                        <div className="text-sm text-gray-600">近7天新增</div>
                      </div>
                      
                      {/* 近7天完成 */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">{statistics.completedTodosLast7Days}</div>
                        <div className="text-sm text-gray-600">近7天完成</div>
                      </div>
                      
                      {/* 当前待完成 */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-1">{statistics.pendingTodos}</div>
                        <div className="text-sm text-gray-600">当前待完成</div>
                      </div>
                    </div>
                  </div>

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
                    <MacosInput
                      type="text"
                      value={newSubTodoForm.title}
                      onChange={(e) => setNewSubTodoForm({ ...newSubTodoForm, title: e.target.value })}
                      className="w-full"
                      placeholder="请输入关联任务标题"
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-macos-gray-700 mb-1">描述</label>
                    <MacosTextarea
                      value={newSubTodoForm.description}
                      onChange={(e) => setNewSubTodoForm({ ...newSubTodoForm, description: e.target.value })}
                      className="w-full h-20 resize-none"
                      placeholder="请输入关联任务描述（可选）"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-macos-gray-700 mb-1">类型</label>
                    <MacosSelect
                      value={newSubTodoForm.todo_type}
                      onChange={(e) => setNewSubTodoForm({ ...newSubTodoForm, todo_type: e.target.value })}
                      options={todoTypes}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-macos-gray-700 mb-1">优先级</label>
                    <MacosSelect
                      value={newSubTodoForm.priority}
                      onChange={(e) => setNewSubTodoForm({ ...newSubTodoForm, priority: e.target.value })}
                      options={priorityOptions}
                      className="w-full"
                    />
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