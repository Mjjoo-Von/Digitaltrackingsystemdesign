import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { projectId } from '../utils/supabase/info';
import schoolLogo from 'figma:asset/5763e9ff02364fda840f40312c6e0ef65765b303.png';
import { ReplaceIDModal } from './replace-id-modal';
import { 
  IdCard, 
  LogOut, 
  Users, 
  Clock, 
  Package, 
  CheckCircle,
  Search,
  Filter,
  Edit,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Calendar,
  ChevronDown,
  Loader2,
  X,
  RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface IDRecord {
  studentId: string;
  userId: string;
  status: 'processing' | 'ready' | 'claimed';
  studentName: string;
  studentEmail: string;
  createdAt: string;
  updatedAt: string;
  lostReported?: boolean;
  replacementInitiated?: boolean;
  replacementInitiatedAt?: string;
}

interface LostReport {
  id: string;
  studentId: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  reason: string;
  lastSeenDate: string | null;
  lastSeenLocation: string;
  additionalDetails: string;
  status: 'pending_review' | 'under_investigation' | 'resolved' | 'dismissed';
  adminNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface ReplacementRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  lostReportId: string | null;
  replacementFee: number;
  estimatedReadyDate: string | null;
  adminNote: string;
  initiatedBy: string;
  initiatedAt: string;
  status: string;
}

interface Analytics {
  total: number;
  statusCounts: {
    processing: number;
    ready: number;
    claimed: number;
  };
  records: IDRecord[];
}

interface AdminDashboardProps {
  onEditRecord: (record: IDRecord) => void;
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6'];

export function AdminDashboard({ onEditRecord }: AdminDashboardProps) {
  const { user, signOut, accessToken } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'records' | 'lost_ids' | 'replacements'>('records');
  const [lostReports, setLostReports] = useState<LostReport[]>([]);
  const [loadingLost, setLoadingLost] = useState(false);
  const [selectedLostReport, setSelectedLostReport] = useState<LostReport | null>(null);
  const [showLostModal, setShowLostModal] = useState(false);
  const [replacements, setReplacements] = useState<ReplacementRecord[]>([]);
  const [loadingReplacements, setLoadingReplacements] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    fetchLostReports();
    fetchReplacements();
  }, []);

  useEffect(() => {
    if (activeTab === 'lost_ids') fetchLostReports();
    if (activeTab === 'replacements') fetchReplacements();
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/analytics`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLostReports = async () => {
    setLoadingLost(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/lost-ids`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setLostReports(data.reports || []);
      } else {
        console.error('Failed to fetch lost reports:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching lost reports:', error);
    } finally {
      setLoadingLost(false);
    }
  };

  const fetchReplacements = async () => {
    setLoadingReplacements(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/replacements`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setReplacements(data.replacements || []);
      } else {
        console.error('Failed to fetch replacements:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching replacements:', error);
    } finally {
      setLoadingReplacements(false);
    }
  };

  const handleModalSuccess = () => {
    setShowLostModal(false);
    setSelectedLostReport(null);
    fetchLostReports();
    fetchAnalytics();
    fetchReplacements();
  };

  const filteredRecords = analytics?.records.filter(record => {
    const matchesSearch =
      record.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  const chartData = analytics ? [
    { name: 'Processing', value: analytics.statusCounts.processing, fill: COLORS[0] },
    { name: 'Ready', value: analytics.statusCounts.ready, fill: COLORS[1] },
    { name: 'Claimed', value: analytics.statusCounts.claimed, fill: COLORS[2] },
  ] : [];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      claimed: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getLostStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending_review: 'bg-orange-100 text-orange-800 border-orange-200',
      under_investigation: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      dismissed: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getLostStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending_review: 'Pending Review',
      under_investigation: 'Under Investigation',
      resolved: 'Resolved',
      dismissed: 'Dismissed',
    };
    return labels[status] || status;
  };

  const lostPending = lostReports.filter(r => r.status === 'pending_review').length;

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
                <p className="text-gray-600">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-gray-900">{user?.name}</p>
                <p className="text-gray-600">Administrator</p>
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-gray-900 mb-2">Dashboard Overview</h2>
          <p className="text-gray-600">Manage student ID records and view analytics.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Cards — 6 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="p-2.5 bg-blue-100 rounded-lg w-fit mb-3">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-gray-500 text-xs mb-1">Total Students</p>
                <p className="text-gray-900 text-xl font-bold">{analytics?.total || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="p-2.5 bg-yellow-100 rounded-lg w-fit mb-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-gray-500 text-xs mb-1">Processing</p>
                <p className="text-gray-900 text-xl font-bold">{analytics?.statusCounts.processing || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="p-2.5 bg-green-100 rounded-lg w-fit mb-3">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-gray-500 text-xs mb-1">Ready</p>
                <p className="text-gray-900 text-xl font-bold">{analytics?.statusCounts.ready || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="p-2.5 bg-blue-100 rounded-lg w-fit mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-gray-500 text-xs mb-1">Claimed</p>
                <p className="text-gray-900 text-xl font-bold">{analytics?.statusCounts.claimed || 0}</p>
              </div>

              <button
                onClick={() => setActiveTab('lost_ids')}
                className="bg-white rounded-xl shadow-sm border border-red-200 p-5 text-left hover:bg-red-50 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-red-100 rounded-lg">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  {lostPending > 0 && (
                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
                      {lostPending}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mb-1">Lost Reports</p>
                <p className="text-gray-900 text-xl font-bold">{lostReports.length}</p>
              </button>

              <button
                onClick={() => setActiveTab('replacements')}
                className="bg-white rounded-xl shadow-sm border border-indigo-200 p-5 text-left hover:bg-indigo-50 transition"
              >
                <div className="p-2.5 bg-indigo-100 rounded-lg w-fit mb-3">
                  <RefreshCw className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-gray-500 text-xs mb-1">Replacements</p>
                <p className="text-gray-900 text-xl font-bold">{replacements.length}</p>
              </button>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-gray-900">Status Distribution</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-gray-900">Status Breakdown</h3>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tab Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Tab Bar */}
              <div className="flex border-b border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('records')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                    activeTab === 'records'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Student Records
                </button>
                <button
                  onClick={() => setActiveTab('lost_ids')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'lost_ids'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Lost ID Reports
                  {lostPending > 0 && (
                    <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-medium">
                      {lostPending}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('replacements')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'replacements'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Replacements
                  {replacements.length > 0 && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium border border-indigo-200">
                      {replacements.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ── Student Records Tab ── */}
              {activeTab === 'records' && (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name, ID, or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white"
                        >
                          <option value="all">All Status</option>
                          <option value="processing">Processing</option>
                          <option value="ready">Ready</option>
                          <option value="claimed">Claimed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-gray-700">Student ID</th>
                          <th className="px-6 py-3 text-left text-gray-700">Name</th>
                          <th className="px-6 py-3 text-left text-gray-700">Email</th>
                          <th className="px-6 py-3 text-left text-gray-700">Status</th>
                          <th className="px-6 py-3 text-left text-gray-700">Flags</th>
                          <th className="px-6 py-3 text-left text-gray-700">Last Updated</th>
                          <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredRecords.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                              No records found
                            </td>
                          </tr>
                        ) : (
                          filteredRecords.map((record) => (
                            <tr key={record.studentId} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-900">{record.studentId}</td>
                              <td className="px-6 py-4 text-gray-900">{record.studentName}</td>
                              <td className="px-6 py-4 text-gray-600">{record.studentEmail}</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full border text-xs ${getStatusBadge(record.status)}`}>
                                  {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  {record.lostReported && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs border border-red-200">
                                      <AlertTriangle className="w-3 h-3" /> Lost
                                    </span>
                                  )}
                                  {record.replacementInitiated && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs border border-indigo-200">
                                      <RefreshCw className="w-3 h-3" /> Replacing
                                    </span>
                                  )}
                                  {!record.lostReported && !record.replacementInitiated && (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">
                                {new Date(record.updatedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => onEditRecord(record)}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                >
                                  <Edit className="w-4 h-4" />
                                  Update
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── Lost ID Reports Tab ── */}
              {activeTab === 'lost_ids' && (
                <div className="p-6">
                  {loadingLost ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
                    </div>
                  ) : lostReports.length === 0 ? (
                    <div className="text-center py-12">
                      <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No Lost ID Reports</p>
                      <p className="text-gray-400 text-sm mt-1">Lost ID reports submitted by students will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lostReports.map((report) => (
                        <div
                          key={report.id}
                          className={`border rounded-xl p-5 transition ${
                            report.status === 'pending_review'
                              ? 'border-orange-200 bg-orange-50'
                              : 'border-gray-200 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <p className="text-gray-900 font-semibold">{report.studentName}</p>
                                <span className="text-gray-500 text-sm">ID: {report.studentId}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getLostStatusBadge(report.status)}`}>
                                  {getLostStatusLabel(report.status)}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-3">{report.studentEmail}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-gray-500 text-xs">Reason</p>
                                    <p className="text-gray-800">{report.reason}</p>
                                  </div>
                                </div>
                                {report.lastSeenDate && (
                                  <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-gray-500 text-xs">Last Seen Date</p>
                                      <p className="text-gray-800">{new Date(report.lastSeenDate).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                )}
                                {report.lastSeenLocation && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-gray-500 text-xs">Last Known Location</p>
                                      <p className="text-gray-800">{report.lastSeenLocation}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {report.additionalDetails && (
                                <p className="text-gray-600 text-sm mt-3 bg-white/60 border border-gray-200 rounded-lg p-3">
                                  {report.additionalDetails}
                                </p>
                              )}
                              {report.adminNote && (
                                <p className="text-blue-700 text-sm mt-2 italic">Admin note: {report.adminNote}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <p className="text-gray-400 text-xs whitespace-nowrap">
                                {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                              <button
                                onClick={() => { setSelectedLostReport(report); setShowLostModal(true); }}
                                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition flex items-center gap-1.5"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Manage
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Replacements Tab ── */}
              {activeTab === 'replacements' && (
                <div className="p-6">
                  {loadingReplacements ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                    </div>
                  ) : replacements.length === 0 ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No Replacement Records</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Initiated ID replacements will appear here. Use the "Manage" button on a Lost ID report to start a replacement.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {replacements.map((rep) => (
                        <div key={rep.id} className="border border-indigo-200 bg-indigo-50 rounded-xl p-5">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1 flex-wrap">
                                <p className="text-gray-900 font-semibold">{rep.studentName}</p>
                                <span className="text-gray-500 text-sm">ID: {rep.studentId}</span>
                                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-full text-xs font-medium flex items-center gap-1">
                                  <RefreshCw className="w-3 h-3" /> Replacement
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mb-4">{rep.studentEmail}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-indigo-500 text-xs font-medium mb-0.5">Replacement Fee</p>
                                  <p className={`font-semibold ${rep.replacementFee > 0 ? 'text-indigo-700' : 'text-green-700'}`}>
                                    {rep.replacementFee > 0 ? `₱${rep.replacementFee.toFixed(2)}` : 'No Fee'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-indigo-500 text-xs font-medium mb-0.5">Est. Ready Date</p>
                                  <p className="text-gray-900">
                                    {rep.estimatedReadyDate
                                      ? new Date(rep.estimatedReadyDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                      : '—'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-indigo-500 text-xs font-medium mb-0.5">Initiated By</p>
                                  <p className="text-gray-900">{rep.initiatedBy}</p>
                                </div>
                                <div>
                                  <p className="text-indigo-500 text-xs font-medium mb-0.5">Initiated On</p>
                                  <p className="text-gray-900">
                                    {new Date(rep.initiatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              {rep.adminNote && (
                                <div className="mt-4 bg-white border border-indigo-200 rounded-lg p-3">
                                  <p className="text-indigo-500 text-xs font-medium mb-1">Message Sent to Student</p>
                                  <p className="text-gray-700 text-sm italic">"{rep.adminNote}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Lost ID Management Modal */}
      {showLostModal && selectedLostReport && (
        <LostIDManageModal
          report={selectedLostReport}
          accessToken={accessToken || ''}
          onClose={() => { setShowLostModal(false); setSelectedLostReport(null); }}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// LostIDManageModal — with embedded "Initiate Replacement" CTA
// ────────────────────────────────────────────────────────────
interface LostIDManageModalProps {
  report: LostReport;
  accessToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

function LostIDManageModal({ report, accessToken, onClose, onSuccess }: LostIDManageModalProps) {
  const [status, setStatus] = useState(report.status);
  const [adminNote, setAdminNote] = useState(report.adminNote || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  const STATUS_OPTIONS = [
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'under_investigation', label: 'Under Investigation' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' },
  ];

  const getLostStatusBadge = (s: string) => {
    const styles: Record<string, string> = {
      pending_review: 'bg-orange-100 text-orange-800 border-orange-200',
      under_investigation: 'bg-blue-100 text-blue-800 border-blue-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      dismissed: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[s] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const encodedId = encodeURIComponent(report.id);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/lost-id/${encodedId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status, adminNote }),
        }
      );
      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update report. Please try again.');
      }
    } catch (err) {
      console.error('Update lost report error:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-gray-900 font-semibold">Manage Lost ID Report</h2>
                <p className="text-gray-500 text-sm">{report.studentName} · {report.studentId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Report Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Reason:</span>
                <span className="text-gray-800 font-medium">{report.reason}</span>
              </div>
              {report.lastSeenLocation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Location:</span>
                  <span className="text-gray-800">{report.lastSeenLocation}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Filed:</span>
                <span className="text-gray-800">{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Current Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs border font-medium ${getLostStatusBadge(report.status)}`}>
                  {STATUS_OPTIONS.find(o => o.value === report.status)?.label || report.status}
                </span>
              </div>
            </div>

            {/* ── Replace ID CTA ── */}
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl flex-shrink-0">
                  <RefreshCw className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-indigo-900 font-semibold">Issue Replacement ID</p>
                  <p className="text-indigo-600 text-xs mt-1 mb-3 leading-relaxed">
                    Start the full replacement workflow — reset the student's status to Processing, set a replacement fee, provide an estimated ready date, and automatically notify the student.
                  </p>
                  <button
                    onClick={() => setShowReplaceModal(true)}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 active:scale-[0.98] transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Initiate Replacement
                  </button>
                </div>
              </div>
            </div>

            {/* Status selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Update Report Status</label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as LostReport['status'])}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none bg-white text-gray-900 pr-10"
                >
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Admin Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Admin Note (optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Add a note that will be sent to the student..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Replace ID Modal — stacked on top at z-[60] */}
      {showReplaceModal && (
        <ReplaceIDModal
          report={report}
          accessToken={accessToken}
          onClose={() => setShowReplaceModal(false)}
          onSuccess={() => {
            setShowReplaceModal(false);
            onSuccess();
          }}
        />
      )}
    </>
  );
}
