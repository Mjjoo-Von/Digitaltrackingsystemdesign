import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { projectId } from '../utils/supabase/info';
import schoolLogo from 'figma:asset/5763e9ff02364fda840f40312c6e0ef65765b303.png';
import { 
  IdCard, 
  Bell, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Package,
  Calendar,
  HelpCircle,
  User
} from 'lucide-react';

interface IDRecord {
  studentId: string;
  userId: string;
  status: 'processing' | 'ready' | 'claimed';
  studentName: string;
  studentEmail: string;
  createdAt: string;
  updatedAt: string;
  history: Array<{
    status: string;
    timestamp: string;
    note: string;
    updatedBy?: string;
  }>;
}

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
}

export function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { user, signOut, accessToken } = useAuth();
  const [idRecord, setIdRecord] = useState<IDRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.studentId) {
      fetchIDRecord();
      fetchNotifications();
    }
  }, [user]);

  const fetchIDRecord = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/id/${user?.studentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIdRecord(data.idRecord);
      }
    } catch (error) {
      console.error('Error fetching ID record:', error);
    } finally {
      setLoading(false);
    }
  };

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
        const unread = data.notifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'ready':
        return <Package className="w-6 h-6 text-green-600" />;
      case 'claimed':
        return <CheckCircle className="w-6 h-6 text-blue-600" />;
      default:
        return <Clock className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'ready':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'claimed':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'processing':
        return 33;
      case 'ready':
        return 66;
      case 'claimed':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={schoolLogo} alt="School Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-gray-900">ID Tracking System</h1>
                <p className="text-gray-600">Student Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-gray-900">{user?.name}</p>
                  <p className="text-gray-600">ID: {user?.studentId}</p>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-gray-900 mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-gray-600">Track your ID card status and manage your requests.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : idRecord ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Status Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Status Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-gray-900 mb-1">ID Card Status</h3>
                    <p className="text-gray-600">Student ID: {idRecord.studentId}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full border ${getStatusColor(idRecord.status)}`}>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(idRecord.status)}
                      <span>{getStatusLabel(idRecord.status)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Progress</span>
                    <span className="text-gray-600">{getProgressPercentage(idRecord.status)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${getProgressPercentage(idRecord.status)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Status Steps */}
                <div className="grid grid-cols-3 gap-4">
                  <div className={`text-center p-4 rounded-lg ${
                    idRecord.status === 'processing' || idRecord.status === 'ready' || idRecord.status === 'claimed'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <Clock className={`w-8 h-8 mx-auto mb-2 ${
                      idRecord.status === 'processing' || idRecord.status === 'ready' || idRecord.status === 'claimed'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`} />
                    <p className="text-gray-900">Processing</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${
                    idRecord.status === 'ready' || idRecord.status === 'claimed'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <Package className={`w-8 h-8 mx-auto mb-2 ${
                      idRecord.status === 'ready' || idRecord.status === 'claimed'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`} />
                    <p className="text-gray-900">Ready</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${
                    idRecord.status === 'claimed'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                      idRecord.status === 'claimed'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }`} />
                    <p className="text-gray-900">Claimed</p>
                  </div>
                </div>

                {/* Claim Button */}
                {idRecord.status === 'ready' && (
                  <div className="mt-6">
                    <button
                      onClick={() => onNavigate('claim')}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                      Request to Claim ID
                    </button>
                  </div>
                )}
              </div>

              {/* Status History */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-gray-900 mb-4">Status History</h3>
                <div className="space-y-4">
                  {idRecord.history.map((entry, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          {getStatusIcon(entry.status)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-gray-900">{getStatusLabel(entry.status)}</p>
                          <p className="text-gray-600">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-600">{entry.note}</p>
                        {entry.updatedBy && (
                          <p className="text-gray-500 mt-1">Updated by: {entry.updatedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => onNavigate('notifications')}
                    className="w-full flex items-center gap-3 p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  >
                    <Bell className="w-5 h-5 text-blue-600" />
                    <span>View Notifications</span>
                  </button>
                  <button
                    onClick={() => onNavigate('help')}
                    className="w-full flex items-center gap-3 p-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition"
                  >
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    <span>Help & FAQ</span>
                  </button>
                </div>
              </div>

              {/* Student Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-gray-900 mb-4">Your Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="text-gray-900">{user?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IdCard className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Student ID</p>
                      <p className="text-gray-900">{user?.studentId}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-600">Registered</p>
                      <p className="text-gray-900">
                        {new Date(idRecord.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <IdCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-gray-900 mb-2">No ID Record Found</h3>
            <p className="text-gray-600">
              Your ID card record will appear here once it&apos;s been created by the admin.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}