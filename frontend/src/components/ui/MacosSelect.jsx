import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const MacosSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "请选择", 
  className = "",
  disabled = false,
  error = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [dropdownDirection, setDropdownDirection] = useState('down'); // 'up' or 'down'
  const selectRef = useRef(null);

  useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedOption(option);
  }, [value, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 检测下拉方向
  const checkDropdownDirection = () => {
    if (selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // 估算下拉列表高度（每个选项约48px，最多显示5个选项）
      const estimatedDropdownHeight = Math.min(options.length * 48, 240);
      
      // 如果下方空间不足且上方空间充足，则向上展开
      if (spaceBelow < estimatedDropdownHeight && spaceAbove > estimatedDropdownHeight) {
        setDropdownDirection('up');
      } else {
        setDropdownDirection('down');
      }
    }
  };

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange({ target: { value: option.value } });
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        checkDropdownDirection();
      }
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-macos border bg-white/50 backdrop-blur-sm 
          focus:outline-none focus:ring-2 focus:ring-macos-blue focus:border-transparent 
          transition-all duration-200 text-left flex items-center justify-between
          ${error ? 'border-red-300' : 'border-macos-gray-200'}
          ${disabled ? 'bg-macos-gray-50 text-macos-gray-400 cursor-not-allowed' : 'hover:bg-white/70'}
          ${isOpen ? 'ring-2 ring-macos-blue border-transparent' : ''}
        `}
      >
        <span className={selectedOption ? 'text-macos-gray-800' : 'text-macos-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-macos-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {isOpen && (
        <div className={`
          absolute z-50 w-full bg-white border border-macos-gray-200 rounded-macos shadow-macos max-h-60 overflow-y-auto
          ${dropdownDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}
        `}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className={`
                w-full px-4 py-3 text-left hover:bg-macos-gray-50 transition-colors
                ${selectedOption?.value === option.value ? 'bg-macos-blue/10 text-macos-blue' : 'text-macos-gray-800'}
                first:rounded-t-macos last:rounded-b-macos
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MacosSelect;