import React from 'react';

const StatusTag = ({ status, todoType, size = 'sm' }) => {
  // 根据todo类型和状态定义颜色配置
  const statusConfig = {
    record: {
      '待阅': { label: '待阅', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      '归档': { label: '归档', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    },
    requirement: {
      '待评估': { label: '待评估', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      '已拆解': { label: '已拆解', className: 'bg-green-100 text-green-800 border-green-200' },
      '已拒绝': { label: '已拒绝', className: 'bg-red-100 text-red-800 border-red-200' }
    },
    task: {
      '待办': { label: '待办', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      '搁置': { label: '搁置', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      '取消': { label: '取消', className: 'bg-red-100 text-red-800 border-red-200' },
      '完成': { label: '完成', className: 'bg-green-100 text-green-800 border-green-200' }
    },
    issue: {
      '报告': { label: '报告', className: 'bg-red-100 text-red-800 border-red-200' },
      '复现': { label: '复现', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      '修复': { label: '修复', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      '解决': { label: '解决', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      '关闭': { label: '关闭', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    }
  };

  // 获取配置，如果找不到则使用默认配置
  const typeConfig = statusConfig[todoType] || {};
  const config = typeConfig[status] || {
    label: status || '未知',
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-sm'
  };

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${config.className} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
};

export default StatusTag;
