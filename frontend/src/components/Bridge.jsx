import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { todoAPI } from '../services/api';
import { useAuth } from './AuthContext';

function Bridge() {
  const { user } = useAuth();
  const [newTodo, setNewTodo] = useState('');
  const [newTodoType, setNewTodoType] = useState('record');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 定义类型选项
  const todoTypes = [
    { value: 'record', label: '记录', color: 'bg-blue-100 text-blue-800' },
    { value: 'requirement', label: '需求', color: 'bg-green-100 text-green-800' },
    { value: 'task', label: '任务', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'issue', label: '故障', color: 'bg-red-100 text-red-800' }
  ];

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
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* 页面标题 */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🚀 舰桥</h1>
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
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="添加新任务..."
                className="macos-input flex-1"
                disabled={loading}
                autoFocus
              />
              {/* 类型选择下拉框 */}
              <select
                value={newTodoType}
                onChange={(e) => setNewTodoType(e.target.value)}
                className="macos-input w-24 text-sm"
                disabled={loading}
              >
                {todoTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
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
    </div>
  );
}

export default Bridge;