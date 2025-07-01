import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

function UserAvatar() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 获取用户名首字母作为头像
  const getInitials = (username) => {
    if (!username) return 'U';
    return username.charAt(0).toUpperCase();
  };

  // 处理退出登录
  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 用户头像按钮 */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* 圆形头像 */}
        <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
          {getInitials(user.username)}
        </div>
        {/* 用户名 */}
        <span className="text-sm font-medium text-gray-700 hidden md:block">
          {user.username}
        </span>
        {/* 下拉箭头 */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* 下拉菜单 */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* 个人资料 */}
          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            onClick={() => setIsDropdownOpen(false)}
          >
            <User className="w-4 h-4 mr-3" />
            个人资料
          </Link>

          {/* 管理面板（仅管理员可见） */}
          {user?.is_staff && (
            <Link
              to="/admin"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Settings className="w-4 h-4 mr-3" />
              管理面板
            </Link>
          )}

          {/* 分割线 */}
          <hr className="my-1 border-gray-200" />

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}

export default UserAvatar;