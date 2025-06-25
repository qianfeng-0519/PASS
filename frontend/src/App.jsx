import React, { useContext } from 'react'; // 引入 useContext
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, AuthContext } from './components/AuthContext'; // 引入 AuthContext
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import TodoApp from './components/TodoApp';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

// 侧边栏导航组件
function Sidebar() {
  const { user, logout } = useContext(AuthContext); // 使用 useContext(AuthContext)
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/', label: 'Todo列表', icon: '📝' },
    { path: '/profile', label: '个人资料', icon: '👤' },
  ];

  if (user?.is_staff) {
    menuItems.push({ path: '/admin', label: '管理面板', icon: '⚙️' });
  }

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      {/* 应用标题 */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">PASS-星舰</h1>
        {user && (
          <p className="text-sm text-gray-600 mt-1">欢迎, {user.username}</p>
        )}
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 用户操作区 */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
        >
          <span className="mr-3 text-lg">🚪</span>
          退出登录
        </button>
      </div>
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
            path="/" 
            element={
              <ProtectedRoute>
                <div className="h-full p-8">
                  <TodoApp />
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
          
          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// 主应用布局组件
function AppLayout() {
  const { user, loading } = useContext(AuthContext); // 使用 useContext(AuthContext)
  const location = useLocation();

  // 不需要侧边栏的页面
  const noSidebarPages = ['/login', '/register'];
  const showSidebar = user && !noSidebarPages.includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {showSidebar && <Sidebar />}
      <MainContent />
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
