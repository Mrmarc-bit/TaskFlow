import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  WifiOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useUIStore } from '../store/ui.store';
import { useThemeStore } from '../store/theme.store';
import { api } from '../lib/axios';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { TaskDetailsPanel } from '../features/tasks/components/task-details-panel';

export const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { theme, setTheme } = useThemeStore();
  
  // Menus toggles
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Search and Drawer states
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Fetch user profile data
  const { data: userProfile } = useQuery<any>({
    queryKey: ['myProfile'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data.data;
    },
  });

  // 1.5 Fetch all tasks for local search palette filtering
  const { data: allTasksList = [] } = useQuery<any[]>({
    queryKey: ['allTasksSearch'],
    queryFn: async () => {
      const response = await api.get('/tasks?limit=100');
      return response.data.data.tasks || [];
    },
  });

  const filteredTasks = searchQuery.trim() === ''
    ? []
    : allTasksList.filter((task: any) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // 2. Fetch notifications list
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data.data;
    },
  });

  // 3. Mark single read mutation
  const readNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 4. Mark all read mutation
  const readAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // 5. Establish real-time socket connections on mount
  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    socket.on('notification', () => {
      // Invalidate queries to trigger instant list refresh
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    });

    return () => {
      socket.off('notification');
      disconnectSocket();
    };
  }, [queryClient]);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('taskflow-token');
    window.location.href = '/';
  };

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const unreadCount = unreadNotifications.length;

  const initials = userProfile
    ? `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase()
    : 'JD';

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* 1. Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-screen sticky top-0 z-30"
      >
        {/* Brand / Logo header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-3 select-none">
            <img src="/icon.svg" className="w-8 h-8 rounded-lg object-contain shrink-0" alt="TaskFlow" />
            {sidebarOpen && (
              <span className="font-display font-bold text-lg bg-linear-to-r from-brand-500 to-sky-accent bg-clip-text text-transparent">
                TaskFlow
              </span>
            )}
          </Link>
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-slate-500/10 text-slate-400 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 py-6 px-3 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-500 text-white font-medium shadow-md shadow-brand-500/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-500/10 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer collapse toggle */}
        {!sidebarOpen && (
          <div className="h-16 border-t border-slate-500/10 dark:border-white/5 flex items-center justify-center">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-slate-500/10 text-slate-400 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </motion.aside>

      {/* 2. Main app section */}
      <div className="flex-1 flex flex-col min-w-0">
        {isOffline && (
          <div className="bg-red-500 text-white text-center py-2 text-xs font-semibold select-none flex items-center justify-center gap-2 z-50 shrink-0 shadow-lg">
            <WifiOff size={14} className="animate-pulse" />
            <span>You are currently offline. Running in offline/read-only mode.</span>
          </div>
        )}
        
        {/* Main top header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-500/10 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
          
          {/* Left search bar */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-xl hover:bg-slate-500/10 text-slate-500 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => setSearchPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-500/10 dark:border-white/5 bg-slate-500/5 dark:bg-white/5 text-slate-400 w-64 text-left cursor-pointer hover:bg-slate-500/10 transition-colors focus:outline-none"
            >
              <Search size={16} />
              <span className="text-xs">Search tasks or keywords...</span>
              <kbd className="ml-auto text-[10px] bg-slate-500/10 px-1.5 py-0.5 rounded-md font-mono select-none">⌘K</kbd>
            </button>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Theme trigger */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl hover:bg-slate-500/10 text-slate-500 cursor-pointer transition-transform duration-200 active:scale-95"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification triggers */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl hover:bg-slate-500/10 text-slate-500 relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-accent animate-ping" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger-accent" />
                  </>
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-4 max-h-96 overflow-y-auto flex flex-col gap-3"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-500/10 dark:border-white/5">
                        <span className="text-sm font-bold font-display">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => readAllNotificationsMutation.mutate()}
                            className="text-[10px] text-brand-500 font-bold hover:underline cursor-pointer"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">No notifications yet</p>
                        ) : (
                          notifications.map((notif: any) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                if (!notif.isRead) readNotificationMutation.mutate(notif.id);
                              }}
                              className={`p-2.5 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                                notif.isRead
                                  ? 'border-transparent bg-slate-500/5 dark:bg-white/[0.01]'
                                  : 'border-brand-500/10 bg-brand-500/5 hover:bg-brand-500/10'
                              }`}
                            >
                              {!notif.isRead && (
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold leading-tight">{notif.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">{notif.message}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-500/10 cursor-pointer focus:outline-none"
              >
                <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-brand-500 to-sky-accent text-white flex items-center justify-center font-display font-semibold text-sm">
                  {initials}
                </div>
              </button>

              <AnimatePresence>
                {profileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2"
                    >
                      <div className="px-3 py-2 border-b border-slate-500/10 dark:border-white/5 mb-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Signed in as</p>
                        <p className="text-sm font-medium truncate mt-0.5">
                          {userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'John Doe'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {userProfile ? userProfile.email : 'john.doe@taskflow.dev'}
                        </p>
                      </div>
                      
                      <Link
                        to="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-slate-500/10 dark:hover:bg-white/5 transition-colors"
                      >
                        <User size={15} />
                        <span>My Profile</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-danger-accent hover:bg-danger-accent/10 transition-colors cursor-pointer text-left"
                      >
                        <LogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content canvas viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 3. Mobile Navigation drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col md:hidden"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <img src="/icon.svg" className="w-8 h-8 rounded-lg object-contain shrink-0" alt="TaskFlow" />
                  <span className="font-display font-bold text-lg bg-linear-to-r from-brand-500 to-sky-accent bg-clip-text text-transparent">
                    TaskFlow
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md hover:bg-white/5 text-slate-400 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 py-6 px-3 flex flex-col gap-1.5 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-500 text-white font-medium shadow-md shadow-brand-500/20'
                          : 'text-slate-500 dark:text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {searchPaletteOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSearchPaletteOpen(false)}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks, categories, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:ring-0 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setSearchPaletteOpen(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                >
                  ESC
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
                {searchQuery.trim() === '' ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Type a query to search tasks...</p>
                ) : filteredTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No tasks found matching "{searchQuery}"</p>
                ) : (
                  filteredTasks.map((task: any) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setActiveTaskId(task.id);
                        setSearchPaletteOpen(false);
                      }}
                      className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-500/5 dark:hover:bg-white/5 text-left transition-colors cursor-pointer group border-0 outline-none bg-transparent"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-500 transition-colors">
                            {task.title}
                          </h4>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-500/10 px-1.5 py-0.5 rounded">
                            {task.status}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{task.description}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Task Details Panel */}
      <TaskDetailsPanel taskId={activeTaskId} onClose={() => setActiveTaskId(null)} />

    </div>
  );
};
