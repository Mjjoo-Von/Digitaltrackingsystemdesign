import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { AlertCircle, IdCard, UserCircle, ShieldCheck } from 'lucide-react';
import schoolLogo from 'figma:asset/5763e9ff02364fda840f40312c6e0ef65765b303.png';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    studentId: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.role === 'student' && !formData.studentId) {
      setError('Student ID is required for student accounts');
      return;
    }

    setLoading(true);

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.studentId,
        formData.role
      );
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img src={schoolLogo} alt="School Logo" className="w-20 h-20 object-contain" />
            </div>
            <h1 className="text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Register for the ID Tracking System</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block mb-3 text-gray-700">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.role === 'student'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <UserCircle className={`w-8 h-8 mx-auto mb-2 ${
                    formData.role === 'student' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className="text-gray-900">Student</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'admin' })}
                  className={`p-4 rounded-lg border-2 transition ${
                    formData.role === 'admin'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <ShieldCheck className={`w-8 h-8 mx-auto mb-2 ${
                    formData.role === 'admin' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <p className="text-gray-900">Admin</p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block mb-2 text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Student ID (conditional) */}
              {formData.role === 'student' && (
                <div>
                  <label htmlFor="studentId" className="block mb-2 text-gray-700">
                    Student ID
                  </label>
                  <input
                    id="studentId"
                    type="text"
                    required={formData.role === 'student'}
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Enter student ID"
                  />
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block mb-2 text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block mb-2 text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Min. 6 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block mb-2 text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}