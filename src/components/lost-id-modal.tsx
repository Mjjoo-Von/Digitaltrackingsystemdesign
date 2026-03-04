import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import {
  AlertTriangle,
  X,
  MapPin,
  Calendar,
  FileText,
  ChevronDown,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface LostIDModalProps {
  studentId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_OPTIONS = [
  'Lost in school premises',
  'Lost outside school',
  'Stolen',
  'Misplaced at home',
  'Other',
];

export function LostIDModal({ studentId, onClose, onSuccess }: LostIDModalProps) {
  const { accessToken } = useAuth();
  const [reason, setReason] = useState('');
  const [lastSeenDate, setLastSeenDate] = useState('');
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for the lost ID report.');
      return;
    }
    if (!confirmed) {
      setError('Please confirm that the information provided is accurate.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/lost-id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            studentId,
            reason,
            lastSeenDate,
            lastSeenLocation,
            additionalDetails,
          }),
        }
      );

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onSuccess();
        }, 2500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit lost ID report. Please try again.');
      }
    } catch (err) {
      console.error('Lost ID report error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-lg">Report Lost ID</h2>
              <p className="text-gray-500 text-sm">Student ID: {studentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-gray-900 font-semibold text-xl mb-2">Report Submitted!</h3>
            <p className="text-gray-600 text-sm mb-1">
              Your lost ID report has been submitted successfully.
            </p>
            <p className="text-gray-500 text-sm">
              The ID office will review your report and contact you with next steps.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Warning Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 font-medium text-sm">Important Notice</p>
                <p className="text-amber-700 text-sm mt-1">
                  Filing a false lost ID report may result in disciplinary action. Please ensure
                  all information provided is accurate and truthful.
                </p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for Report <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none appearance-none bg-white text-gray-900 pr-10"
                  required
                >
                  <option value="">Select a reason...</option>
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Last Seen Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Last Seen Date
                </span>
              </label>
              <input
                type="date"
                value={lastSeenDate}
                onChange={(e) => setLastSeenDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>

            {/* Last Seen Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Last Known Location
                </span>
              </label>
              <input
                type="text"
                value={lastSeenLocation}
                onChange={(e) => setLastSeenLocation(e.target.value)}
                placeholder="e.g., Canteen, Library, Classroom 201..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Additional Details
                </span>
              </label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Any other relevant information about when or how you lost your ID..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="confirm" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
                I confirm that my ID card is lost and all information provided above is accurate
                and truthful. I understand that a replacement fee may apply.
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
