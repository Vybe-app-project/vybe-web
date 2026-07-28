import { useState } from 'react';
import { 
  MdDashboard, 
  MdAdminPanelSettings, 
  MdPeople, 
  MdFitnessCenter, 
  MdReport,
  MdSupportAgent,
  MdHistory,
  MdSettings, 
  MdLogout,
  MdMenu,
  MdClose
} from 'react-icons/md';
import { useAdminRouter } from '../../routing';
import { useAdminSession } from '../../context/admin-session';
import { clearAdminSession } from '../../utils/adminAuthStorage';

// Sidebar Component
const Sidebar = ({ isOpen, toggleSidebar, isSuperAdmin }) => {
  const { navigate, route } = useAdminRouter();

  // Function to check if a route is active
  const isActiveRoute = (path) => {
    if (route === path) return true;
    // For dashboard, also match root admin path
    if (path === '/home' && route === '/') return true;
    
    // For nested routes, check if current path starts with the menu path
    if (path !== '/' && route.startsWith(`${path}/`)) return true;
    
    return false;
  };

  const menuItems = [
    { name: 'Dashboard', icon: MdDashboard, path: '/home' },
    ...(isSuperAdmin
      ? [
        { name: 'Admins', icon: MdAdminPanelSettings, path: '/admins' },
        { name: 'Audit log', icon: MdHistory, path: '/audit-log' },
      ]
      : []),
    { name: 'Users', icon: MdPeople, path: '/users' },
    { name: 'Workouts', icon: MdFitnessCenter, path: '/workouts' },
    { name: 'Moderation', icon: MdReport, path: '/reports' },
    { name: 'Support', icon: MdSupportAgent, path: '/support' },
  ];

  const bottomMenuItems = [
    { name: 'Settings', icon: MdSettings, path: '/settings' },
    { name: 'Logout', icon: MdLogout, path: '/logout', isLogout: true },
  ];

  // Handle navigation (for SPA)
  const handleNavigation = (path, isLogout = false) => {
    if (isLogout) {
      clearAdminSession();
      navigate("/", { replace: true });
      if (isOpen) toggleSidebar();
      return;
    }
    
    navigate(path);
    if (isOpen) toggleSidebar();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div
        id="admin-sidebar"
        className={`
        fixed left-0 top-0 h-full w-72 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
        shadow-2xl z-50 transform transition-all duration-300 ease-out border-r border-slate-700/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:z-auto flex flex-col
      `}
      >
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
            type="button"
            aria-label="Close admin navigation"
            onClick={toggleSidebar}
            className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-700/50"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav aria-label="Admin navigation" className="flex-1 mt-8 px-4">
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
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
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
                      type="button"
                      aria-current={isActive && !item.isLogout ? 'page' : undefined}
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
const Header = ({
  toggleSidebar,
  sidebarOpen,
  adminName,
  adminRole,
  title,
  subTitle,
}) => {
  const { navigate } = useAdminRouter();
  return (
    <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 px-4 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        {/* Left Side - Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            aria-label="Open admin navigation"
            aria-controls="admin-sidebar"
            aria-expanded={sidebarOpen}
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
          {/* User Profile */}
          <div className="flex items-center space-x-3 bg-slate-50/80 rounded-xl px-4 py-2.5 border border-slate-200/50">
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
            <button
              type="button"
              aria-label="Open admin settings"
              onClick={() => navigate('/settings')}
              className="p-1.5 rounded-lg hover:bg-slate-200/80 transition-colors"
            >
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
  const {
    admin,
    isSuperAdmin,
    loading: sessionLoading,
  } = useAdminSession();
  const resolvedName = adminName || admin?.fullName || (
    sessionLoading ? 'Validating…' : 'Vybe Admin'
  );
  const resolvedRole = adminRole
    || admin?.role?.replace('_', ' ')
    || 'Admin';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        isSuperAdmin={isSuperAdmin}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <Header 
          title={title}
          toggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          adminName={resolvedName}
          subTitle={subTitle}
          adminRole={resolvedRole}
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
