import React, { useState, useEffect } from 'react';
import { todoAPI } from '../../services/api';

const TodoReferenceMenu = ({ isVisible, onClose, onSelectTodos, selectedTodos }) => {
  const [groupedTodos, setGroupedTodos] = useState({
    record: [],
    requirement: [],
    task: [],
    bug: []
  });
  const [loading, setLoading] = useState(false);
  const [tempSelectedTodos, setTempSelectedTodos] = useState(selectedTodos);

  // Todo类型配置
  const todoTypeConfig = {
    record: { label: '记录', color: 'bg-blue-100 text-blue-800' },
    requirement: { label: '需求', color: 'bg-green-100 text-green-800' },
    task: { label: '任务', color: 'bg-yellow-100 text-yellow-800' },
    bug: { label: '故障', color: 'bg-red-100 text-red-800' }
  };

  // 优先级配置
  const priorityConfig = {
    high: { label: '高', color: 'text-red-600' },
    medium: { label: '中', color: 'text-yellow-600' },
    low: { label: '低', color: 'text-green-600' },
    none: { label: '无', color: 'text-gray-400' }
  };

  useEffect(() => {
    if (isVisible) {
      fetchReferenceableTodos();
      setTempSelectedTodos(selectedTodos);
    }
  }, [isVisible, selectedTodos]);

  const fetchReferenceableTodos = async () => {
    setLoading(true);
    try {
      const response = await todoAPI.getReferenceableTodos();
      setGroupedTodos(response.data.grouped_todos);
    } catch (error) {
      console.error('获取可引用todos失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTodoToggle = (todo) => {
    const isSelected = tempSelectedTodos.some(t => t.id === todo.id);
    
    if (isSelected) {
      setTempSelectedTodos(tempSelectedTodos.filter(t => t.id !== todo.id));
    } else {
      // 检查是否超过10个限制
      if (tempSelectedTodos.length >= 10) {
        alert('最多只能引用10个todo');
        return;
      }
      setTempSelectedTodos([...tempSelectedTodos, todo]);
    }
  };

  const handleConfirm = () => {
    onSelectTodos(tempSelectedTodos);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedTodos(selectedTodos);
    onClose();
  };

  // 删除这个函数
  // const truncateTitle = (title) => {
  //   return title.length > 15 ? title.substring(0, 15) + '...' : title;
  // };

  if (!isVisible) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-900">选择要引用的Todo</h3>
          <span className="text-xs text-gray-500">{tempSelectedTodos.length}/10</span>
        </div>
        
        {loading ? (
          <div className="text-center py-4 text-gray-500">加载中...</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {Object.entries(todoTypeConfig).map(([type, config]) => {
              const todos = groupedTodos[type] || [];
              if (todos.length === 0) return null;
              
              return (
                <div key={type} className="mb-4">
                  <div className={`text-xs px-2 py-1 rounded-full inline-block mb-2 ${config.color}`}>
                    {config.label} ({todos.length})
                  </div>
                  <div className="space-y-1">
                    {todos.map((todo) => {
                      const isSelected = tempSelectedTodos.some(t => t.id === todo.id);
                      return (
                        <div
                          key={todo.id}
                          className={`p-2 rounded cursor-pointer border transition-colors ${
                            isSelected 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'hover:bg-gray-50 border-transparent'
                          }`}
                          onClick={() => handleTodoToggle(todo)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 text-left">
                                {todo.title}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-2">
                              <span className={`text-xs ${priorityConfig[todo.priority]?.color}`}>
                                {priorityConfig[todo.priority]?.label}
                              </span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleTodoToggle(todo)}
                                className="rounded border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-4 pt-3 border-t">
          <button
            onClick={handleCancel}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            确认 ({tempSelectedTodos.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoReferenceMenu;