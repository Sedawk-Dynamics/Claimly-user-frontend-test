import { useEffect, useState, useRef } from 'react';
import { userService } from '../services/user.service';
import { Bell, CheckCircle, Trash2, RefreshCw } from 'lucide-react';

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  const loadNotifications = async (silent = false) => {
    try {
      if (!silent) {
        if (isInitialLoadRef.current) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
      }
      setError('');
      const data = await userService.getNotifications();
      setNotifications(
        data.map((n: any) => ({
          id: String(n.id),
          title: n.title,
          message: n.message,
          is_read: n.is_read,
          created_at: n.created_at,
        }))
      );
      isInitialLoadRef.current = false;
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadNotifications();

    // Set up polling - check for new notifications every 30 seconds
    const startPolling = () => {
      pollingIntervalRef.current = setInterval(() => {
        // Only poll if page is visible
        if (!document.hidden) {
          loadNotifications(true); // Silent refresh
        }
      }, 30000); // 30 seconds
    };

    // Handle page visibility - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, clear interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        // Page is visible, start polling if not already running
        if (!pollingIntervalRef.current) {
          startPolling();
        }
        // Also refresh immediately when page becomes visible
        loadNotifications(true);
      }
    };

    // Start polling
    startPolling();

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await userService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to mark as read');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      await userService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to delete notification');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-60 animate-pulse-glow" />
            <div className="relative p-3 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-xl shadow-glow-brand">
              <Bell className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gradient-brand">Notifications</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View important updates from Claimly. Auto-refreshes every 30 seconds.
            </p>
          </div>
        </div>
        <button
          onClick={() => loadNotifications()}
          disabled={refreshing || loading}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-cyan text-white shadow-glow-cyan hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh notifications"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-gray-600 dark:text-gray-300">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="card p-6 text-center text-gray-600 dark:text-gray-300">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start justify-between border ${
                n.is_read ? 'border-gray-200 dark:border-navy-700' : 'border-cyan-400/40'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1">
                <Bell
                  className={`w-5 h-5 mt-1 ${
                    n.is_read ? 'text-gray-400' : 'text-cyan-500'
                  }`}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{n.title}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{n.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {!n.is_read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-cyan text-white shadow-glow-cyan hover:opacity-90 transition-opacity"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Mark read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n.id)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


