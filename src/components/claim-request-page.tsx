import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { projectId } from '../utils/supabase/info';
import { ArrowLeft, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface ClaimRequestPageProps {
  onBack: () => void;
}

export function ClaimRequestPage({ onBack }: ClaimRequestPageProps) {
  const { user, accessToken } = useAuth();
  const [claimDate, setClaimDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/claim`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            studentId: user?.studentId,
            claimDate,
            notes,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit claim request');
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting claim request:', err);
      setError(err.message || 'Failed to submit claim request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your claim request has been submitted successfully. The admin will review it shortly.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-gray-900">Claim Request</h1>
              <p className="text-gray-600">Submit your ID claim request</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Info Banner */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900">
              Your ID card is ready for claim! Please fill out the form below to schedule your pickup.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-gray-700">Student Name</label>
                <input
                  type="text"
                  value={user?.name || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-700">Student ID</label>
                <input
                  type="text"
                  value={user?.studentId || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            {/* Claim Date */}
            <div>
              <label htmlFor="claimDate" className="block mb-2 text-gray-700">
                Preferred Claim Date <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="claimDate"
                  type="date"
                  required
                  value={claimDate}
                  onChange={(e) => setClaimDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <p className="mt-2 text-gray-600">
                Select a date when you can come to the ID office to claim your card.
              </p>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block mb-2 text-gray-700">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Any special instructions or requirements..."
              />
            </div>

            {/* Office Hours Info */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-gray-900 mb-2">ID Office Hours</h4>
              <ul className="space-y-1 text-gray-600">
                <li>Monday - Friday: 8:00 AM - 5:00 PM</li>
                <li>Saturday: 9:00 AM - 12:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
              <p className="mt-3 text-gray-600">
                Please bring your receipt when claiming your ID card.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
