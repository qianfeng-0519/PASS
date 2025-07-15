import React from 'react';

const MacosTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className = "",
  disabled = false,
  error = false,
  rows = 3,
  ...props 
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      className={`
        w-full px-4 py-3 rounded-macos border bg-white/50 backdrop-blur-sm 
        focus:outline-none focus:ring-2 focus:ring-macos-blue focus:border-transparent 
        transition-all duration-200 resize-none
        ${error ? 'border-red-300' : 'border-macos-gray-200'}
        ${disabled ? 'bg-macos-gray-50 text-macos-gray-400 cursor-not-allowed' : 'hover:bg-white/70'}
        ${className}
      `}
      {...props}
    />
  );
};

export default MacosTextarea;