import React, { useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { projectId } from '../utils/supabase/info';
import schoolLogo from 'figma:asset/5763e9ff02364fda840f40312c6e0ef65765b303.png';
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
  BarChart3
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

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/analytics`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
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
    const styles = {
      processing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ready: 'bg-green-100 text-green-800 border-green-200',
      claimed: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-gray-600 mb-1">Total Students</p>
                <p className="text-gray-900">{analytics?.total || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <p className="text-gray-600 mb-1">Processing</p>
                <p className="text-gray-900">{analytics?.statusCounts.processing || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-600 mb-1">Ready for Claim</p>
                <p className="text-gray-900">{analytics?.statusCounts.ready || 0}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-gray-600 mb-1">Claimed</p>
                <p className="text-gray-900">{analytics?.statusCounts.claimed || 0}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bar Chart */}
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

              {/* Pie Chart */}
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

            {/* Student Records Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-gray-900 mb-4">Student Records</h3>
                
                {/* Search and Filter */}
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-700">Student ID</th>
                      <th className="px-6 py-3 text-left text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-gray-700">Last Updated</th>
                      <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
            </div>
          </>
        )}
      </main>
    </div>
  );
}