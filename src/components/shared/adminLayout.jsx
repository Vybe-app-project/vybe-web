import React, { useState, useEffect } from 'react';
import { 
  MdDashboard, 
  MdAdminPanelSettings, 
  MdPeople, 
  MdFitnessCenter, 
  MdSettings, 
  MdLogout,
  MdMenu,
  MdClose,
  MdNotifications,
  MdKeyboardArrowDown
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

// Sidebar Component
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const [currentPath, setCurrentPath] = useState('');
  const navigate = useNavigate();

  // Get current path on component mount and when location changes
  useEffect(() => {
    const updatePath = () => {
      setCurrentPath(window.location.pathname);
    };
    
    updatePath();
    
    // Listen for route changes (for SPA navigation)
    window.addEventListener('popstate', updatePath);
    
    return () => {
      window.removeEventListener('popstate', updatePath);
    };
  }, []);

  // Function to check if a route is active
  const isActiveRoute = (_path) => {
    let path = "/admin"+_path;
    // Exact match
    if (currentPath === path) return true;
    // For dashboard, also match root admin path
    if (path === '/admin/home' && (currentPath === '/admin' || currentPath === '/admin/')) return true;
    
    // For nested routes, check if current path starts with the menu path
    if (path !== '/' && currentPath.startsWith(path)) return true;
    
    return false;
  };

  const menuItems = [
    { name: 'Dashboard', icon: MdDashboard, path: '/home' },
    { name: 'Admins', icon: MdAdminPanelSettings, path: '/admins' },
    { name: 'Users', icon: MdPeople, path: '/users' },
    { name: 'Workouts', icon: MdFitnessCenter, path: '/workouts' },
  ];

  const bottomMenuItems = [
    { name: 'Settings', icon: MdSettings, path: '/settings' },
    { name: 'Logout', icon: MdLogout, path: '/logout', isLogout: true },
  ];

  // Handle navigation (for SPA)
  const handleNavigation = (path, isLogout = false) => {
    if (isLogout) {
        localStorage.removeItem("access_token");
    window.location.href = ("/admin");
      return;
    }
    
    // Update current path for immediate UI feedback
    setCurrentPath(path);
    
    // For actual navigation, you might use:
    // - React Router: navigate(path) or history.push(path)
    // - Next.js: router.push(path)
    // - Or regular navigation: window.location.href = path
    
    // For now, just updating the URL for demo purposes
    navigate(path)
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        shadow-2xl z-50 transform transition-all duration-300 ease-out border-r border-slate-700/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:z-auto flex flex-col
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="text-white">
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                Vybe
              </h2>
              <p className="text-xs text-slate-400 font-medium">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 mt-8 px-4">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">
              Main Navigation
            </p>
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = isActiveRoute(item.path);
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl
                               transition-all duration-200 group cursor-pointer relative overflow-hidden
                               ${isActive
                                 ? 'bg-gradient-to-r from-[#00D4AA]/20 to-[#00D4AA]/10 text-white border border-[#00D4AA]/30' 
                                 : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                               }`}
                    >
                      <div className={`p-1 rounded-lg ${
                        isActive
                          ? 'bg-gradient-to-r from-[#00D4AA] to-[#00D4AA]/80 text-white shadow-lg shadow-[#00D4AA]/20' 
                          : 'text-slate-400 group-hover:text-white group-hover:bg-slate-600/50'
                      } transition-all duration-200`}>
                        <item.icon className="text-base" />
                      </div>
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {item.name}
                      </span>
                      {isActive && (
                        <div className="absolute right-3 w-2 h-2 bg-[#00D4AA] rounded-full animate-pulse" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Bottom Menu Items */}
        <div className="px-4 pb-6">
          <div className="border-t border-slate-700/50 pt-4">
            <ul className="space-y-1">
              {bottomMenuItems.map((item) => {
                const isActive = isActiveRoute(item.path);
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item.path, item.isLogout)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium
                               rounded-xl transition-all duration-200 group cursor-pointer
                               ${item.isLogout 
                                 ? 'text-slate-300 hover:text-red-400 hover:bg-red-500/20 border border-slate-600/50 hover:border-red-500/50' 
                                 : isActive 
                                   ? 'bg-gradient-to-r from-[#00D4AA]/20 to-[#00D4AA]/10 text-white border border-[#00D4AA]/30'
                                   : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                               }`}
                    >
                      <div className={`p-1 rounded-lg transition-all duration-200 ${
                        item.isLogout 
                          ? 'text-slate-400 group-hover:text-red-400 group-hover:bg-red-500/20' 
                          : isActive
                            ? 'bg-gradient-to-r from-[#00D4AA] to-[#00D4AA]/80 text-white shadow-lg shadow-[#00D4AA]/20'
                            : 'text-slate-400 group-hover:text-white group-hover:bg-slate-600/50'
                      }`}>
                        <item.icon className="text-base" />
                      </div>
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {item.name}
                      </span>
                      {isActive && !item.isLogout && (
                        <div className="absolute right-3 w-2 h-2 bg-[#00D4AA] rounded-full animate-pulse" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

// Header Component
const Header = ({ toggleSidebar, adminName = "John Doe", adminRole = "Super Admin", title,subTitle }) => {
  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 px-4 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Side - Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <MdMenu className="text-xl text-slate-600" />
          </button>
          
          {/* Breadcrumb or Page Title */}
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-slate-800">{title}</h1>
            <p className="text-sm text-slate-500">{subTitle}</p>
          </div>
        </div>

        {/* Right Side - User Info */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors relative group">
            <MdNotifications className="text-lg text-slate-600 group-hover:text-slate-800" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-[#00D4AA] to-[#00D4AA]/80 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg animate-pulse">
              3
            </span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 bg-slate-50/80 rounded-xl px-4 py-2.5 hover:bg-slate-100/80 transition-all duration-200 cursor-pointer border border-slate-200/50 hover:border-slate-300/50">
            {/* Avatar */}
            <div className="w-9 h-9 bg-gradient-to-tr from-[#00D4AA] via-[#00D4AA]/80 to-[#00D4AA]/60 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">
                {adminName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            
            {/* User Info */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-800">{adminName}</p>
              <p className="text-xs text-slate-500 font-medium">{adminRole}</p>
            </div>

            {/* Settings Button */}
            <button className="p-1.5 rounded-lg hover:bg-slate-200/80 transition-colors">
              <MdSettings className="text-base text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Admin Layout Component
const AdminLayout = ({ children, adminName, adminRole, title,subTitle }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header 
          title={title}
          toggleSidebar={toggleSidebar} 
          adminName={adminName}
          subTitle={subTitle}
          adminRole={adminRole}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;