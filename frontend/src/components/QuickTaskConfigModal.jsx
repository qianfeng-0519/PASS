import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, HelpCircle } from 'lucide-react';
import { quickTaskConfigAPI } from '../services/api';

function QuickTaskConfigModal({ config, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    todo_type: 'record',
    priority: 'medium',
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showHelp, setShowHelp] = useState(false);

  // 任务类型选项
  const todoTypes = [
    { value: 'record', label: '记录' },
    { value: 'requirement', label: '需求' },
    { value: 'task', label: '任务' },
    { value: 'issue', label: '故障' }
  ];

  // 优先级选项
  const priorities = [
    { value: 'high', label: '高' },
    { value: 'medium', label: '中' },
    { value: 'low', label: '低' },
    { value: 'none', label: '无' }
  ];

  // 模板变量说明
  const templateVariables = [
    { var: '{date}', desc: '当前日期 (YYYY-MM-DD)' },
    { var: '{time}', desc: '当前时间 (HH:MM)' }
  ];

  // 初始化表单数据
  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || '',
        title: config.title || '',
        description: config.description || '',
        todo_type: config.todo_type || 'record',
        priority: config.priority || 'medium',
        is_active: config.is_active !== undefined ? config.is_active : true
      });
    }
  }, [config]);

  // 处理输入变化
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '配置名称不能为空';
    } else if (formData.name.length > 50) {
      newErrors.name = '配置名称不能超过50个字符';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = '任务标题模板不能为空';
    } else if (formData.title.length > 200) {
      newErrors.title = '任务标题模板不能超过200个字符';
    }
    
    if (formData.description.length > 1000) {
      newErrors.description = '任务描述模板不能超过1000个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      if (config) {
        // 更新配置
        await quickTaskConfigAPI.updateConfig(config.id, formData);
      } else {
        // 创建新配置
        await quickTaskConfigAPI.createConfig(formData);
      }
      onSave();
    } catch (error) {
      console.error('保存配置失败:', error);
      if (error.response?.data) {
        const serverErrors = error.response.data;
        if (typeof serverErrors === 'object') {
          setErrors(serverErrors);
        } else {
          setErrors({ general: '保存失败，请重试' });
        }
      } else {
        setErrors({ general: '保存失败，请重试' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-macos shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* 弹窗头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {config ? '编辑配置' : '新建配置'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              title="模板变量帮助"
            >
              <HelpCircle size={20} />
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 帮助信息 */}
        {showHelp && (
          <div className="p-4 bg-blue-50 border-b border-gray-200">
            <h3 className="font-medium text-blue-900 mb-2">模板变量说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {templateVariables.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {item.var}
                  </code>
                  <span className="text-blue-700">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {/* 通用错误信息 */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-macos">
              {errors.general}
            </div>
          )}

          {/* 配置名称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              配置名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`macos-input w-full ${errors.name ? 'border-red-300' : ''}`}
              placeholder="输入配置名称（将作为按钮显示文字）"
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 任务标题模板 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务标题模板 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`macos-input w-full ${errors.title ? 'border-red-300' : ''}`}
              placeholder="例如：{date} 日报 - {user}"
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* 任务描述模板 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务描述模板
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`macos-input w-full h-18 resize-none ${errors.description ? 'border-red-300' : ''}`}
              placeholder="输入任务描述模板（可选）"
              maxLength={1000}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* 任务类型和优先级 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                任务类型
              </label>
              <select
                value={formData.todo_type}
                onChange={(e) => handleChange('todo_type', e.target.value)}
                className="macos-input flex-1"
              >
                {todoTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                优先级
              </label>
              <select
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="macos-input flex-1"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>


          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="macos-button-secondary"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="macos-button-primary flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={16} />
              )}
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default QuickTaskConfigModal;