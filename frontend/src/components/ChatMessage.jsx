import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';

function ChatMessage({ message, isUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-macos-blue rounded-full flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
      )}
      
      <div
        className={`max-w-[70%] px-4 py-2 rounded-macos ${
          isUser
            ? 'bg-macos-blue text-white'
            : 'bg-white border border-gray-200'
        }`}
      >
        <div className={`text-sm whitespace-pre-wrap ${
          isUser ? 'text-right' : 'text-left'
        }`}>{message.content}</div>
        <div className={`text-xs mt-1 opacity-70 ${
          isUser ? 'text-blue-100 text-right' : 'text-gray-500 text-left'
        }`}>
          {new Date(message.created_at).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
          <User size={16} className="text-white" />
        </div>
      )}
    </motion.div>
  );
}

export default ChatMessage;