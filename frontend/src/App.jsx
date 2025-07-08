import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import Bridge from './components/Bridge';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import ConfigManagement from './components/ConfigManagement';
import UserAvatar from './components/UserAvatar';
// 导入四个中心页面组件
import InformationCenter from './components/InformationCenter';
import StrategicCenter from './components/StrategicCenter';
import CommandCenter from './components/CommandCenter';
import MaintenanceCenter from './components/MaintenanceCenter';
// 导入图标
import { Rocket, Info, Target, Command, Wrench, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import './App.css';

// 顶部导航栏组件
function TopNavbar() {
  const { user } = useAuth();
  
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* 左侧标题和欢迎信息 */}
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-semibold text-gray-800">PASS-星舰</h1>
        {user && (
          <span className="text-base text-gray-600">欢迎, {user.nickname}</span>
        )}
      </div>
      
      {/* 右侧用户头像 */}
      <UserAvatar />
    </div>
  );
}

// 侧边栏导航组件
function Sidebar({ isVisible, onToggle }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/bridge', label: '舰桥', icon: Rocket, bgColor: 'bg-gray-500' },
    { path: '/information', label: '信息中心', icon: Info, bgColor: 'bg-blue-500' },
    { path: '/strategic', label: '战略中心', icon: Target, bgColor: 'bg-green-500' },
    { path: '/command', label: '指挥中心', icon: Command, bgColor: 'bg-yellow-500' },
    { path: '/maintenance', label: '维护中心', icon: Wrench, bgColor: 'bg-red-500' },
    { path: '/config-management', label: '配置管理', icon: Settings, bgColor: 'bg-purple-500' },
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <div className="w-48 bg-gray-50 border-r border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* 导航菜单 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${item.bgColor} text-white mr-3`}>
                    <IconComponent size={20} />
                  </div>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      {/* 隐藏导航栏按钮 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeft size={16} className="mr-2" />
          隐藏导航栏
        </button>
      </div>
    </div>
  );
}

// 隐藏状态下的展开按钮
function ExpandButton({ onClick }) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white px-1 py-2 rounded-r-lg shadow-lg transition-colors z-10"
        title="显示导航栏"
        style={{ left: '0px' }}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

// 主内容区组件
function MainContent() {
  return (
    <div className="flex-1 bg-white overflow-auto">
      <div className="h-full">
        <Routes>
          {/* 公开路由 */}
          <Route 
            path="/login" 
            element={<Login />} 
          />
          <Route 
            path="/register" 
            element={<Register />} 
          />
          
          {/* 受保护的路由 */}
          <Route 
            path="/bridge" 
            element={
              <ProtectedRoute>
                <div className="h-full">
                  <Bridge />
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* 四个中心页面路由 */}
          <Route 
            path="/information" 
            element={
              <ProtectedRoute>
                <InformationCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/strategic" 
            element={
              <ProtectedRoute>
                <StrategicCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/command" 
            element={
              <ProtectedRoute>
                <CommandCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/maintenance" 
            element={
              <ProtectedRoute>
                <MaintenanceCenter />
              </ProtectedRoute>
            } 
          />
          
          {/* 配置管理页面 */}
          <Route 
            path="/config-management" 
            element={
              <ProtectedRoute>
                <div className="h-full p-8">
                  <ConfigManagement />
                </div>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <div className="h-full p-8">
                  <UserProfile />
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* 管理员路由 */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <div className="h-full p-8">
                  <AdminDashboard />
                </div>
              </ProtectedRoute>
            } 
          />
          
          {/* 默认重定向到舰桥 */}
          <Route path="/" element={<Navigate to="/bridge" replace />} />
          <Route path="*" element={<Navigate to="/bridge" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// 主应用布局组件
function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // 不需要侧边栏的页面
  const noSidebarPages = ['/login', '/register'];
  const showSidebar = user && !noSidebarPages.includes(location.pathname);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏（仅登录用户可见） */}
      {user && !noSidebarPages.includes(location.pathname) && <TopNavbar />}
      
      {/* 主体内容区域 - 添加高度限制和溢出控制 */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {showSidebar && (
          <Sidebar 
            isVisible={sidebarVisible} 
            onToggle={toggleSidebar}
          />
        )}
        {showSidebar && !sidebarVisible && (
          <ExpandButton onClick={toggleSidebar} />
        )}
        <MainContent />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
