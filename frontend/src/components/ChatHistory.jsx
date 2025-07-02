import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';

function ChatHistory({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  onNewConversation, 
  onDeleteConversation,
  isVisible 
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-64 bg-white border-r border-gray-200 flex flex-col"
    >
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">对话历史</h3>
          <button
            onClick={onNewConversation}
            className="p-1 hover:bg-gray-100 rounded-macos transition-colors"
            title="新建对话"
          >
            <Plus size={16} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group ${
                currentConversationId === conversation.id ? 'bg-blue-50 border-l-4 border-l-macos-blue' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start gap-2">
                <MessageSquare size={16} className="text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {conversation.display_title || '新对话'}
                  </div>
                  {conversation.last_message && (
                    <div className="text-xs text-gray-500 truncate mt-1">
                      {conversation.last_message.content}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    {conversation.message_count} 条消息
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  title="删除对话"
                >
                  <Trash2 size={12} className="text-red-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {conversations.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            暂无对话记录
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ChatHistory;