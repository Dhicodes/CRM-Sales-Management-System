import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../features/notifications/notificationsApi';

const RELATED_ROUTES = { Lead: 'leads', Customer: 'customers', Deal: 'deals' };

function relatedPath(notification) {
  const base = RELATED_ROUTES[notification.relatedEntityType];
  return base ? `/${base}/${notification.relatedEntityId}` : '/activities';
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const { data } = useGetNotificationsQuery({ limit: 10 }, { pollingInterval: 60000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const notifications = data?.data?.items || [];
  const unreadCount = data?.data?.unreadCount || 0;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (notification) => {
    setIsOpen(false);
    if (!notification.isRead) {
      try {
        await markRead(notification._id).unwrap();
      } catch {
        // Non-critical navigate anyway; the badge will settle on next poll.
      }
    }
    navigate(relatedPath(notification));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-md border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <span className="text-sm font-medium text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            )}
            {notifications.map((n) => (
              <button
                key={n._id}
                onClick={() => handleSelect(n)}
                className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                  n.isRead ? 'text-slate-500' : 'bg-slate-50/60 text-slate-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />}
                  <div className={n.isRead ? '' : 'flex-1'}>
                    <p>{n.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
