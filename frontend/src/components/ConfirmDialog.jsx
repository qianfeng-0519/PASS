import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, CheckCircle, XCircle, Info } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "确认", 
  cancelText = "取消",
  showCancelButton = true,  // 新增：控制是否显示取消按钮
  type = "warning"  // 新增：消息类型 warning/success/error/info
}) => {
  if (!isOpen) return null;

  // 根据类型选择图标和颜色
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          buttonColor: 'bg-green-500 hover:bg-green-600'
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-500 hover:bg-red-600'
        };
      case 'info':
        return {
          icon: Info,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonColor: 'bg-blue-500 hover:bg-blue-600'
        };
      default: // warning
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          buttonColor: 'bg-red-500 hover:bg-red-600'
        };
    }
  };

  const { icon: Icon, bgColor, iconColor, buttonColor } = getIconAndColor();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={showCancelButton ? onClose : undefined}  // 只有显示取消按钮时才允许点击背景关闭
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-macos shadow-macos p-6 max-w-md w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-macos-gray-800">{title}</h3>
            </div>
            {showCancelButton && (
              <button
                onClick={onClose}
                className="text-macos-gray-400 hover:text-macos-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <p className="text-macos-gray-600 mb-6">{message}</p>
          
          <div className="flex gap-3 justify-end">
            {showCancelButton && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-macos-gray-600 hover:text-macos-gray-800 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-white rounded-macos transition-colors ${buttonColor}`}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;