import React, { useState } from 'react';
import { Send } from 'lucide-react';

function ChatInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || disabled || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);

    try {
      await onSendMessage(messageText);
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
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-gray-200">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="输入消息..."
        className="flex-1 macos-input resize-none"
        rows={1}
        disabled={disabled || isLoading}
        style={{
          minHeight: '40px',
          maxHeight: '120px',
          height: 'auto'
        }}
        onInput={(e) => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
      />
      <button
        type="submit"
        disabled={!message.trim() || disabled || isLoading}
        className={`macos-button-primary flex items-center gap-2 px-4 ${
          (!message.trim() || disabled || isLoading)
            ? 'opacity-50 cursor-not-allowed'
            : ''
        }`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Send size={16} />
        )}
      </button>
    </form>
  );
}

export default ChatInput;