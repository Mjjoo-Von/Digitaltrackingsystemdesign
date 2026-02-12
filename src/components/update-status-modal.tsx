import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { projectId } from '../utils/supabase/info';
import { X, AlertCircle } from 'lucide-react';

interface IDRecord {
  studentId: string;
  userId: string;
  status: 'processing' | 'ready' | 'claimed';
  studentName: string;
  studentEmail: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateStatusModalProps {
  record: IDRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export function UpdateStatusModal({ record, onClose, onSuccess }: UpdateStatusModalProps) {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState(record.status);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/id/${record.studentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status, note }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Update ID Status</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Student Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-1">Student</p>
            <p className="text-gray-900">{record.studentName}</p>
            <p className="text-gray-600 mt-2">Student ID: {record.studentId}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Status Selection */}
          <div className="mb-4">
            <label className="block mb-2 text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="processing">Processing</option>
              <option value="ready">Ready for Claim</option>
              <option value="claimed">Claimed</option>
            </select>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block mb-2 text-gray-700">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Add a note about this status update..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
