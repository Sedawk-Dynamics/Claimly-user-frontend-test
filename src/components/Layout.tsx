import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import {
  Home,
  User,
  Users,
  CreditCard,
  FileText,
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { userService } from '../services/user.service';
import { User as UserType } from '../types';
import ThemeToggle from './ThemeToggle';
import ApiResponseViewer from './ApiResponseViewer';
import logo from '../logo/claimly logo png.png';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'My Profile', href: '/profile', icon: User },
  { name: 'Nominees', href: '/nominees', icon: Users },
  { name: 'My Subscription', href: '/subscription', icon: CreditCard },
  { name: 'My Policies', href: '/policies', icon: FileText },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(() => authService.getStoredUser());

  useEffect(() => {
    const stored = authService.getStoredUser();
    if (stored) {
      setUser(stored);
      userService
        .getProfile()
        .then(setUser)
        .catch((error) => {
          console.error('Failed to fetch user profile in layout', error);
        });
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-navy-900 via-navy-900 to-navy-950 dark:from-navy-950 dark:via-navy-900 dark:to-black border-r border-cyan-500/20 shadow-glow-brand transform transition-all duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-cyan-500/20 bg-gradient-to-r from-brand-600/10 to-cyan-500/10">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="relative p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <img src={logo} alt="Claimly" className="h-8 w-auto" />
                </div>
              </div>
              <span className="text-xl font-bold text-gradient-sunset">Claimly</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-cyan-400 hover:text-cyan-300 transition-colors p-1 hover:bg-cyan-500/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group relative flex items-center px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 ${isActive
                      ? 'bg-gradient-sunset text-white shadow-glow-orange-lg scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-cyan-500/10 hover:translate-x-2'
                    }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-fire opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                  )}
                  <Icon className={`relative w-5 h-5 mr-3 ${isActive ? 'animate-pulse' : ''}`} />
                  <span className="relative">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-yellow-400 rounded-l-full animate-pulse"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-cyan-500/20 p-4 bg-gradient-to-r from-brand-600/5 to-cyan-500/5">
            <div className="mb-3 px-3 py-2 rounded-lg bg-white/5 backdrop-blur-sm">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-cyan-400 mt-1">{user?.mobileNumber}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-semibold text-orange-400 rounded-xl hover:bg-orange-500/20 border border-orange-400/30 hover:border-orange-400 transition-all duration-200 hover:scale-105 hover:shadow-glow-orange group"
            >
              <LogOut className="w-4 h-4 mr-2 group-hover:animate-pulse" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-10 glass backdrop-blur-xl border-b border-cyan-400/20 shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-brand-600 dark:text-cyan-400 hover:text-brand-700 dark:hover:text-cyan-300 transition-colors p-2 hover:bg-brand-50 dark:hover:bg-cyan-500/10 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page indicator for mobile */}
            <div className="flex-1 lg:hidden">
              <h2 className="text-lg font-bold text-gradient-brand">
                {navigation.find(item =>
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href)
                )?.name || 'Claimly'}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 animate-fade-in pb-[720px]">
          <Outlet />
        </main>
      </div>

      {/* API Response Viewer */}
      <ApiResponseViewer />
    </div>
  );
}

