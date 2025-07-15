import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, ChevronUp, ChevronDown, Rocket, Zap } from 'lucide-react';
import { todoAPI, quickTaskConfigAPI } from '../services/api';
import { useAuth } from './AuthContext';
import ChatBox from './ChatBox';
import { MacosSelect, MacosInput } from './ui';

function Bridge() {
  const { user } = useAuth();
  const [newTodo, setNewTodo] = useState('');
  const [newTodoType, setNewTodoType] = useState('record');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [quickConfigs, setQuickConfigs] = useState([]);
  const [quickTaskLoading, setQuickTaskLoading] = useState({});
  const inputRef = useRef(null);
  
  // 定义类型选项
  const todoTypes = [
    { value: 'record', label: '记录', color: 'bg-blue-100 text-blue-800' },
    { value: 'requirement', label: '需求', color: 'bg-green-100 text-green-800' },
    { value: 'task', label: '任务', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'issue', label: '故障', color: 'bg-red-100 text-red-800' }
  ];

  // 加载快捷任务配置
  const loadQuickConfigs = async () => {
    try {
      const response = await quickTaskConfigAPI.getActiveConfigs();
      setQuickConfigs(response.data);
    } catch (error) {
      console.error('加载快捷任务配置失败:', error);
    }
  };

  // 执行快捷任务
  const handleQuickTask = async (config) => {
    setQuickTaskLoading(prev => ({ ...prev, [config.id]: true }));
    try {
      const response = await quickTaskConfigAPI.generateTodo(config.id);
      const todo = response.data.todo; // 修改这里：访问嵌套的todo对象
      
      // 显示成功消息
      const typeLabel = todoTypes.find(t => t.value === todo.todo_type)?.label || '任务';
      setSuccessMessage(`快捷${typeLabel}"${todo.title}"已成功创建`);
      
    } catch (error) {
      console.error('创建快捷任务失败:', error);
      setSuccessMessage('创建快捷任务失败，请重试');
    } finally {
      setQuickTaskLoading(prev => ({ ...prev, [config.id]: false }));
    }
  };

  // 组件加载时获取快捷配置
  useEffect(() => {
    loadQuickConfigs();
  }, []);

  // 添加新 todo
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setLoading(true);
    try {
      await todoAPI.createTodo({ 
        title: newTodo.trim(),
        todo_type: newTodoType
      });
      
      // 显示成功消息
      const typeLabel = todoTypes.find(t => t.value === newTodoType)?.label || '任务';
      setSuccessMessage(`${typeLabel}"${newTodo.trim()}"已成功录入`);
      
      // 清空表单
      setNewTodo('');
      setNewTodoType('record');
      
      // 重新聚焦到输入框
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
    } catch (error) {
      console.error('添加 todo 失败:', error);
      setSuccessMessage('录入失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 成功消息3秒后淡出
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 添加任务区域 */}
      <AnimatePresence>
        {!isChatExpanded && (
          <motion.div
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="py-8 px-4 flex-shrink-0"
          >
            <div className="max-w-2xl mx-auto">
              {/* 页面标题 */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-lg bg-gray-500 text-white mr-3">
                    <Rocket size={32} />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800">舰桥</h1>
                </div>
                <p className="text-gray-600">快速录入系统</p>
              </motion.div>

              {/* 主卡片 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="macos-card p-6"
              >
                {/* 录入表单 */}
                <form onSubmit={handleAddTodo} className="mb-4">
                  <div className="flex gap-3">
                    <MacosInput
                      ref={inputRef}
                      type="text"
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      placeholder="添加新任务..."
                      className="flex-1"
                      disabled={loading}
                      autoFocus
                    />
                    <MacosSelect
                      value={newTodoType}
                      onChange={(e) => setNewTodoType(e.target.value)}
                      options={todoTypes}
                      className="w-24 text-sm"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !newTodo.trim()}
                      className={`macos-button-primary flex items-center gap-2 ${
                        loading || !newTodo.trim() 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Plus size={18} />
                      )}
                      {loading ? '录入中...' : '添加'}
                    </button>
                  </div>
                </form>

                {/* 快捷任务按钮区域 - 移动到这里 */}
                {quickConfigs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {quickConfigs.map((config) => (
                        <button
                          key={config.id}
                          onClick={() => handleQuickTask(config)}
                          disabled={quickTaskLoading[config.id]}
                          className={`px-3 py-2 text-sm rounded-macos border transition-colors ${
                            quickTaskLoading[config.id]
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                          }`}
                          title={config.description || config.title}
                        >
                          {quickTaskLoading[config.id] ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                              <span>创建中...</span>
                            </div>
                          ) : (
                            config.name
                          )}
                        </button>
                      ))}
                    </div>
                )}

                {/* 成功消息 */}
                <AnimatePresence>
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`p-3 rounded-macos text-sm ${
                        successMessage.includes('失败') 
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}
                    >
                      {successMessage}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ChatBox 切换按钮 */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-macos hover:bg-gray-50 transition-colors"
          >
            <MessageSquare size={20} className="text-macos-blue" />
            <span className="font-medium text-gray-700">
              {isChatExpanded ? '收起AI对话' : '展开AI对话'}
            </span>
            {isChatExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
      </div>

      {/* AI 对话区域 */}
      <AnimatePresence>
        {isChatExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 px-4 pb-4 min-h-0"
          >
            <div className="max-w-6xl mx-auto h-full">
              <ChatBox />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Bridge;