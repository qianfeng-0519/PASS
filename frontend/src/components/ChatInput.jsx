import React, { useState } from 'react';
import { Send } from 'lucide-react';
import AIPersonaSelector from './AIPersonaSelector';

function ChatInput({ onSendMessage, disabled = false, selectedPersona, onPersonaChange }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || disabled || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      await onSendMessage(messageText, selectedPersona);
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2">
      {/* 消息输入区域 - 集成人格选择器 */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        {/* 输入框容器 */}
        <div className="flex-1 relative">
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息..."
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
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
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