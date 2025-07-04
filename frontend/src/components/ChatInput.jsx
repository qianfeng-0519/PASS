import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import AIPersonaSelector from './AIPersonaSelector';
import TodoReferenceMenu from './chat/TodoReferenceMenu';
import TodoReferenceArea from './chat/TodoReferenceArea';

function ChatInput({ onSendMessage, disabled = false, selectedPersona, onPersonaChange }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referencedTodos, setReferencedTodos] = useState([]);
  const [showTodoMenu, setShowTodoMenu] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // 检测@符号
  const detectAtSymbol = (text, position) => {
    // 检查光标前的字符是否为@
    if (position > 0 && text[position - 1] === '@') {
      return true;
    }
    return false;
  };

  const handleInputChange = (e) => {
    const newMessage = e.target.value;
    const newPosition = e.target.selectionStart;
    
    setMessage(newMessage);
    setCursorPosition(newPosition);
    
    // 检测@符号
    if (detectAtSymbol(newMessage, newPosition)) {
      setShowTodoMenu(true);
    } else {
      setShowTodoMenu(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // ESC键关闭菜单
    if (e.key === 'Escape') {
      setShowTodoMenu(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || disabled || isLoading) return;
  
    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);
    
    // 重置输入框高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '40px'; // 重置为初始高度
    }
  
    try {
      // 传递引用的todos给父组件
      await onSendMessage(messageText, selectedPersona, referencedTodos);
      // 移除这行代码，不再自动清空引用
      // setReferencedTodos([]);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTodos = (selectedTodos) => {
    setReferencedTodos(selectedTodos);
    setShowTodoMenu(false);
    
    // 移除消息中的@符号
    const newMessage = message.replace(/@$/, '');
    setMessage(newMessage);
    
    // 重新聚焦到输入框
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleRemoveTodo = (todoId) => {
    setReferencedTodos(referencedTodos.filter(todo => todo.id !== todoId));
  };

  const handleCloseTodoMenu = () => {
    setShowTodoMenu(false);
    // 移除消息中的@符号
    const newMessage = message.replace(/@$/, '');
    setMessage(newMessage);
  };

  // 自动调整输入框高度
  const adjustTextareaHeight = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      {/* Todo引用展示区域 */}
      <TodoReferenceArea 
        referencedTodos={referencedTodos}
        onRemoveTodo={handleRemoveTodo}
      />
      
      {/* 消息输入区域 - 集成人格选择器 */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        {/* 输入框容器 */}
        <div className="flex-1 relative">
          {/* Todo引用菜单 */}
          <TodoReferenceMenu
            isVisible={showTodoMenu}
            onClose={handleCloseTodoMenu}
            onSelectTodos={handleSelectTodos}
            selectedTodos={referencedTodos}
          />
          
          {/* 人格选择器 - 左上角 */}
          <div className="absolute top-1.5 left-2 z-10">
            <AIPersonaSelector 
              selectedPersona={selectedPersona}
              onPersonaChange={onPersonaChange}
              compact={true}
            />
          </div>
          
          {/* 文本输入框 */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onInput={adjustTextareaHeight}
            placeholder="输入消息... (输入@可引用todo)"
            disabled={disabled || isLoading}
            className="w-full resize-none border border-gray-200 rounded-macos pl-32 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-macos-blue focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 overflow-hidden flex items-center"
            rows={1}
            style={{
              minHeight: '40px',
              maxHeight: '120px',
              height: 'auto',
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          />
        </div>
        
        {/* 发送按钮 */}
        <button
          type="submit"
          disabled={!message.trim() || disabled || isLoading}
          className="px-3 py-2 bg-macos-blue text-white rounded-macos hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          style={{
            height: '40px',
            minWidth: '40px'
          }}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
}

export default ChatInput;