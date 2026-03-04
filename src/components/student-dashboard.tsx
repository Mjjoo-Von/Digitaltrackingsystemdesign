import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { projectId } from '../utils/supabase/info';
import schoolLogo from 'figma:asset/5763e9ff02364fda840f40312c6e0ef65765b303.png';
import { LostIDModal } from './lost-id-modal';
import { 
  IdCard, 
  Bell, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Package,
  Calendar,
  HelpCircle,
  User,
  AlertTriangle,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

interface IDRecord {
  studentId: string;
  userId: string;
  status: 'processing' | 'ready' | 'claimed';
  studentName: string;
  studentEmail: string;
  createdAt: string;
  updatedAt: string;
  lostReported?: boolean;
  lostReportedAt?: string;
  replacementInitiated?: boolean;
  replacementInitiatedAt?: string;
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
  const [showLostIDModal, setShowLostIDModal] = useState(false);

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
      case 'lost_reported':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'replacement_initiated':
        return <RefreshCw className="w-6 h-6 text-indigo-600" />;
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
      case 'lost_reported':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'lost_reported') return 'Lost (Reported)';
    if (status === 'replacement_initiated') return 'Replacement Initiated';
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

            {/* Replacement-in-Progress Banner */}
            {idRecord.replacementInitiated && !idRecord.lostReported && (
              <div className="lg:col-span-3 bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-indigo-800 font-semibold">Replacement ID In Progress</p>
                  <p className="text-indigo-700 text-sm mt-0.5">
                    Your replacement ID was initiated on{' '}
                    {idRecord.replacementInitiatedAt
                      ? new Date(idRecord.replacementInitiatedAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })
                      : 'recently'}
                    . Your ID status has been reset to Processing and will move through the usual steps. Check notifications for fee and pickup details.
                  </p>
                </div>
              </div>
            )}

            {/* Lost ID Alert Banner */}
            {idRecord.lostReported && (
              <div className="lg:col-span-3 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Lost ID Report Active</p>
                  <p className="text-red-700 text-sm mt-0.5">
                    You have an active lost ID report submitted on{' '}
                    {idRecord.lostReportedAt
                      ? new Date(idRecord.lostReportedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'recently'}
                    . The ID office is reviewing your report and will contact you.
                  </p>
                </div>
              </div>
            )}

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
                      className={`h-3 rounded-full transition-all duration-500 ${idRecord.replacementInitiated ? 'bg-indigo-600' : 'bg-blue-600'}`}
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
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.status === 'lost_reported'
                            ? 'bg-red-100'
                            : entry.status === 'replacement_initiated'
                            ? 'bg-indigo-100'
                            : 'bg-blue-100'
                        }`}>
                          {getStatusIcon(entry.status)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-medium ${
                            entry.status === 'replacement_initiated' ? 'text-indigo-700' :
                            entry.status === 'lost_reported' ? 'text-red-700' : 'text-gray-900'
                          }`}>
                            {getStatusLabel(entry.status)}
                          </p>
                          <p className="text-gray-600">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-gray-600 text-sm">{entry.note}</p>
                        {entry.updatedBy && (
                          <p className="text-gray-500 text-xs mt-1">Updated by: {entry.updatedBy}</p>
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

                  {/* ID Issues section */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2 px-1">ID Issues</p>

                    {/* Replacement in progress state */}
                    {idRecord.replacementInitiated && !idRecord.lostReported ? (
                      <div className="w-full flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                        <div>
                          <span className="text-indigo-700 font-medium text-sm block">Replacement In Progress</span>
                          <span className="text-indigo-500 text-xs">Your replacement ID is being processed</span>
                        </div>
                      </div>
                    ) : idRecord.lostReported ? (
                      <div className="w-full flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div>
                          <span className="text-red-700 font-medium text-sm block">Lost ID Reported</span>
                          <span className="text-red-500 text-xs">Awaiting review by ID office</span>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowLostIDModal(true)}
                        className="w-full flex items-center gap-3 p-3 text-left text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition"
                      >
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span>Report Lost ID</span>
                      </button>
                    )}
                  </div>
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

      {/* Lost ID Modal */}
      {showLostIDModal && user?.studentId && (
        <LostIDModal
          studentId={user.studentId}
          onClose={() => setShowLostIDModal(false)}
          onSuccess={() => {
            setShowLostIDModal(false);
            fetchIDRecord();
          }}
        />
      )}
    </div>
  );
}