import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Settings, Power, PowerOff, Zap } from 'lucide-react';
import { quickTaskConfigAPI } from '../services/api';
import { useAuth } from './AuthContext';
import ConfirmDialog from './ConfirmDialog';
import QuickTaskConfigModal from './QuickTaskConfigModal';

function ConfigManagement() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // 任务类型映射
  const todoTypes = {
    'record': { label: '记录', color: 'bg-blue-100 text-blue-800' },
    'requirement': { label: '需求', color: 'bg-green-100 text-green-800' },
    'task': { label: '任务', color: 'bg-yellow-100 text-yellow-800' },
    'issue': { label: '故障', color: 'bg-red-100 text-red-800' }
  };

  // 优先级映射
  const priorities = {
    'high': { label: '高', color: 'bg-red-100 text-red-800' },
    'medium': { label: '中', color: 'bg-yellow-100 text-yellow-800' },
    'low': { label: '低', color: 'bg-green-100 text-green-800' },
    'none': { label: '无', color: 'bg-gray-100 text-gray-800' }
  };

  // 加载配置列表
  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await quickTaskConfigAPI.getConfigs();
      setConfigs(response.data.results || response.data);
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除配置
  const handleDelete = async (config) => {
    try {
      await quickTaskConfigAPI.deleteConfig(config.id);
      setSuccessMessage(`配置\"${config.name}\"已删除`);
      loadConfigs();
    } catch (error) {
      console.error('删除配置失败:', error);
      setSuccessMessage('删除失败，请重试');
    }
    setDeleteConfirm(null);
  };

  // 切换配置状态
  const toggleConfigStatus = async (config) => {
    try {
      await quickTaskConfigAPI.updateConfig(config.id, {
        ...config,
        is_active: !config.is_active
      });
      setSuccessMessage(`配置\"${config.name}\"已${config.is_active ? '禁用' : '启用'}`);
      loadConfigs();
    } catch (error) {
      console.error('切换状态失败:', error);
      setSuccessMessage('操作失败，请重试');
    }
  };

  // 处理配置保存
  const handleConfigSave = () => {
    loadConfigs();
    setShowModal(false);
    setEditingConfig(null);
    setSuccessMessage(editingConfig ? '配置已更新' : '配置已创建');
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // 成功消息自动消失
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-16 flex-shrink-0 px-6 border-b border-gray-200 flex items-center">
        <div className="flex items-center">
          <div className="p-1.5 rounded-lg bg-purple-500 text-white mr-3">
            <Settings size={20} />
          </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">配置管理</h1>
              <span className="text-gray-500">•</span>
              <p className="text-gray-600">系统配置和个性化设置</p>
            </div>
        </div>
      </div>

      {/* 成功消息 */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-macos"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {/* 快捷按钮配置容器 */}
        <div className="macos-card p-6">
          {/* 快捷按钮配置标题和操作 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">快捷按钮配置</h2>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingConfig(null);
                setShowModal(true);
              }}
              className="macos-button-primary flex items-center gap-2"
            >
              <Plus size={18} />
              新建配置
            </button>
          </div>

          {/* 配置列表 */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12">
              <Zap size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无快捷按钮配置</h3>
              <p className="text-gray-500 mb-4">创建您的第一个快捷任务配置</p>
              <button
                onClick={() => {
                  setEditingConfig(null);
                  setShowModal(true);
                }}
                className="macos-button-primary"
              >
                新建配置
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {configs.map((config) => (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-200 rounded-macos p-4 hover:shadow-lg transition-shadow"
                >
                  {/* 配置头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{config.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          todoTypes[config.todo_type]?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {todoTypes[config.todo_type]?.label || config.todo_type}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          priorities[config.priority]?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {priorities[config.priority]?.label || config.priority}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleConfigStatus(config)}
                      className={`p-1 rounded-lg transition-colors ${
                        config.is_active 
                          ? 'text-green-600 hover:bg-green-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={config.is_active ? '点击禁用' : '点击启用'}
                    >
                      {config.is_active ? <Power size={16} /> : <PowerOff size={16} />}
                    </button>
                  </div>

                  {/* 配置内容 */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">标题：</span>{config.title}
                    </p>
                    {config.description && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">描述：</span>
                        {config.description.length > 50 
                          ? `${config.description.substring(0, 50)}...` 
                          : config.description
                        }
                      </p>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(config.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingConfig(config);
                          setShowModal(true);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="编辑"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(config)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 配置弹窗 */}
      {showModal && (
        <QuickTaskConfigModal
          config={editingConfig}
          onSave={handleConfigSave}
          onCancel={() => {
            setShowModal(false);
            setEditingConfig(null);
          }}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirm && (
        <ConfirmDialog
          isOpen={!!deleteConfirm}
          title="删除配置"
          message={`确定要删除配置\"${deleteConfirm.name}\"吗？此操作不可撤销。`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          confirmText="删除"
          type="error"
        />
      )}
    </div>
  );
}

export default ConfigManagement;