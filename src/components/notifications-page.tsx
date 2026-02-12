import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { projectId } from '../utils/supabase/info';
import { ArrowLeft, Bell, CheckCircle, Info, AlertCircle } from 'lucide-react';

interface Notification {
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsPageProps {
  onBack: () => void;
}

export function NotificationsPage({ onBack }: NotificationsPageProps) {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notifId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/notifications/${notifId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.createdAt === notifId.split(':')[2] ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_update':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'claim_approved':
        return <CheckCircle className="w-6 h-6 text-blue-600" />;
      case 'alert':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-gray-900">Notifications</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">
              You don&apos;t have any notifications yet. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const notifId = `notif:${notification.userId}:${notification.createdAt}`;
              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-sm border transition ${
                    notification.read
                      ? 'border-gray-200'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-gray-900">{notification.title}</h3>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{notification.message}</p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                          
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notifId)}
                              className="text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
