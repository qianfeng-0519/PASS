import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, History, X } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';
import { chatAPI } from '../services/api';

function ChatBox() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState('DefaultAssistant'); // 新增AI人格状态
  const messagesEndRef = useRef(null);
  const isCreatingConversation = useRef(false); // 防止重复创建

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 加载对话列表
  const loadConversations = useCallback(async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.results || []);
    } catch (error) {
      console.error('加载对话列表失败:', error);
    }
  }, []);

  // 加载消息
  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建新对话（防重复调用）
  const handleNewConversation = useCallback(async () => {
    if (isCreatingConversation.current) {
      console.log('正在创建对话，跳过重复请求');
      return;
    }
    
    try {
      isCreatingConversation.current = true;
      const response = await chatAPI.createConversation();
      const newConversation = response.data;
      setCurrentConversation(newConversation);
      setMessages([]);
      setConversations(prev => [newConversation, ...prev]);
      setShowHistory(false);
    } catch (error) {
      console.error('创建对话失败:', error);
    } finally {
      isCreatingConversation.current = false;
    }
  }, []);

  // 选择对话
  const handleSelectConversation = async (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      await loadMessages(conversationId);
      setShowHistory(false);
    }
  };

  // 删除对话
  const handleDeleteConversation = async (conversationId) => {
    if (window.confirm('确定要删除这个对话吗？')) {
      try {
        await chatAPI.deleteConversation(conversationId);
        // 删除成功后更新本地状态
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        console.log('对话删除成功');
      } catch (error) {
        console.error('删除对话失败:', error);
        // 显示错误提示给用户
        alert('删除失败，请重试');
        // 重新加载对话列表以确保数据一致性
        loadConversations();
      }
    }
  };

  // 发送消息（修改以支持persona参数和referenced_todos）
  const handleSendMessage = async (messageText, persona = selectedPersona, referencedTodos = []) => {
    let conversationToUse = currentConversation;
    
    // 如果没有当前对话，先创建一个
    if (!conversationToUse) {
      if (isCreatingConversation.current) {
        console.log('正在创建对话，请稍候...');
        return;
      }
      
      try {
        isCreatingConversation.current = true;
        const response = await chatAPI.createConversation();
        const newConversation = response.data;
        setCurrentConversation(newConversation);
        setMessages([]);
        setConversations(prev => [newConversation, ...prev]);
        conversationToUse = newConversation;
      } catch (error) {
        console.error('创建对话失败:', error);
        return;
      } finally {
        isCreatingConversation.current = false;
      }
    }

    // 添加用户消息到界面
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      setIsStreaming(true);
      setStreamingMessage('');
      
      // 传递persona参数和referenced_todos参数
      const response = await chatAPI.sendMessage(conversationToUse.id, messageText, persona, referencedTodos);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk' && data.content) {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              } else if (data.type === 'done') {
                // 添加完整的AI回复到消息列表
                const aiMessage = {
                  id: data.message_id || Date.now() + 1,
                  role: 'assistant',
                  content: fullResponse,
                  created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, aiMessage]);
                setStreamingMessage('');
                setIsStreaming(false);
                
                // 刷新对话列表
                loadConversations();
                return;
              } else if (data.type === 'error') {
                console.error('AI回复错误:', data.error);
                setIsStreaming(false);
                setStreamingMessage('');
                return;
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  // 初始化（只执行一次）
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return (
    <div className="h-full flex bg-gray-50 rounded-macos overflow-hidden border border-gray-200">
      {/* 对话历史侧边栏 */}
      <AnimatePresence>
        <ChatHistory
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          isVisible={showHistory}
        />
      </AnimatePresence>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 头部工具栏 */}
        <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-macos-blue" />
            <h2 className="font-semibold text-gray-800">
              {currentConversation?.title || 'AI 对话'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-macos transition-colors ${
                showHistory ? 'bg-macos-blue text-white' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="对话历史"
            >
              {showHistory ? <X size={16} /> : <History size={16} />}
            </button>
          </div>
        </div>

        {/* 消息区域 - 修改：移除固定高度，使用纯flex布局 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-macos-blue"></div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                />
              ))}
              
              {/* AI正在思考的状态提示 */}
              {isStreaming && !streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 mb-4 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-macos-blue rounded-full flex items-center justify-center">
                    <MessageSquare size={16} className="text-white" />
                  </div>
                  <div className="max-w-[70%] px-4 py-2 rounded-macos bg-white border border-gray-200">
                    <div className="text-sm text-gray-500 italic">AI正在思考...</div>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-macos-blue rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-macos-blue rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-macos-blue rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* 流式消息显示 */}
              {isStreaming && streamingMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 mb-4 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-macos-blue rounded-full flex items-center justify-center">
                    <MessageSquare size={16} className="text-white" />
                  </div>
                  <div className="max-w-[70%] px-4 py-2 rounded-macos bg-white border border-gray-200">
                    <div className="text-sm whitespace-pre-wrap text-left">{streamingMessage}</div>
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 bg-macos-blue rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-macos-blue rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-macos-blue rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {messages.length === 0 && !isStreaming && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <MessageSquare size={48} className="mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">开始新的对话</p>
                  <p className="text-sm">输入消息开始与AI助手对话</p>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isStreaming}
            selectedPersona={selectedPersona}
            onPersonaChange={setSelectedPersona}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatBox;