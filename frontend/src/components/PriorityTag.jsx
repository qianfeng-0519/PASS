import React from 'react';

const PriorityTag = ({ priority, size = 'sm' }) => {
  const priorityConfig = {
    high: {
      label: '高',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    medium: {
      label: '中', 
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    low: {
      label: '低',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    none: {
      label: '无',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const config = priorityConfig[priority] || priorityConfig.none;
  
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

export default PriorityTag;