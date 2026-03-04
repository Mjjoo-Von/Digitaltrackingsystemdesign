import React, { useState } from 'react';
import { projectId } from '../utils/supabase/info';
import {
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Calendar,
  FileText,
  User,
  IdCard,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Info,
  Banknote,
} from 'lucide-react';

interface LostReport {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  reason: string;
}

interface ReplaceIDModalProps {
  report: LostReport;
  accessToken: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'details' | 'review' | 'success';

export function ReplaceIDModal({ report, accessToken, onClose, onSuccess }: ReplaceIDModalProps) {
  const [step, setStep] = useState<Step>('details');
  const [replacementFee, setReplacementFee] = useState('');
  const [estimatedReadyDate, setEstimatedReadyDate] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d71c034e/replace-id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            studentId: report.studentId,
            lostReportId: report.id,
            replacementFee: replacementFee ? parseFloat(replacementFee) : 0,
            estimatedReadyDate: estimatedReadyDate || null,
            adminNote,
          }),
        }
      );

      if (response.ok) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to initiate replacement. Please try again.');
      }
    } catch (err) {
      console.error('Replace ID error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEP_CONFIG = {
    details: { index: 0, label: 'Replacement Details' },
    review: { index: 1, label: 'Review & Confirm' },
    success: { index: 2, label: 'Done' },
  };

  const currentStepIndex = STEP_CONFIG[step].index;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-gray-900 font-semibold text-lg">Initiate ID Replacement</h2>
              <p className="text-gray-500 text-sm">{report.studentName} · {report.studentId}</p>
            </div>
          </div>
          {step !== 'success' && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step Progress Bar */}
        {step !== 'success' && (
          <div className="px-6 pt-5 pb-1">
            <div className="flex items-center gap-2">
              {(['details', 'review'] as const).map((s, idx) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      idx < currentStepIndex
                        ? 'bg-indigo-600 text-white'
                        : idx === currentStepIndex
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {idx < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className={`text-sm font-medium hidden sm:block ${
                      idx === currentStepIndex ? 'text-indigo-700' : idx < currentStepIndex ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {STEP_CONFIG[s].label}
                    </span>
                  </div>
                  {idx < 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full ${
                      currentStepIndex > idx ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 1: Details ── */}
        {step === 'details' && (
          <div className="p-6 space-y-5">

            {/* Student Summary */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <p className="text-indigo-800 font-medium text-sm flex items-center gap-2">
                <Info className="w-4 h-4" /> Student Information
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-indigo-600 text-xs">Name</p>
                    <p className="text-indigo-900 font-medium">{report.studentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="text-indigo-600 text-xs">Student ID</p>
                    <p className="text-indigo-900 font-medium">{report.studentId}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-indigo-600 text-xs">Lost Reason</p>
                  <p className="text-indigo-900 text-sm">{report.reason}</p>
                </div>
              </div>
            </div>

            {/* Replacement Fee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-gray-400" />
                  Replacement Fee (₱)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={replacementFee}
                  onChange={(e) => setReplacementFee(e.target.value)}
                  placeholder="0.00  (leave blank if no fee)"
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <p className="text-gray-400 text-xs mt-1">Leave blank or enter 0 for no fee.</p>
            </div>

            {/* Estimated Ready Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Estimated Ready Date
                </span>
              </label>
              <input
                type="date"
                value={estimatedReadyDate}
                onChange={(e) => setEstimatedReadyDate(e.target.value)}
                min={today}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900"
              />
              <p className="text-gray-400 text-xs mt-1">This will be shown to the student as a target date.</p>
            </div>

            {/* Admin Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" />
                  Message to Student
                </span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="e.g., Please bring your school receipt when claiming your replacement ID..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('review')}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2"
              >
                Review
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 'review' && (
          <div className="p-6 space-y-5">
            <p className="text-gray-600 text-sm">
              Please review the replacement details below before confirming. This action will:
            </p>

            {/* Impact Summary */}
            <div className="space-y-2 text-sm">
              {[
                { icon: <RefreshCw className="w-4 h-4 text-indigo-500" />, text: "Reset the student's ID status back to Processing" },
                { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: 'Mark the lost ID report as Resolved' },
                { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, text: 'Clear the lost ID flag from the student record' },
                { icon: <Info className="w-4 h-4 text-blue-500" />, text: 'Send a notification to the student about their replacement' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  {item.icon}
                  <p className="text-gray-700">{item.text}</p>
                </div>
              ))}
            </div>

            {/* Replacement Summary Card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl overflow-hidden">
              <div className="bg-indigo-600 px-4 py-2.5">
                <p className="text-white font-semibold text-sm">Replacement Summary</p>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><User className="w-4 h-4" /> Student</span>
                  <span className="text-gray-900 font-medium">{report.studentName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><IdCard className="w-4 h-4" /> ID Number</span>
                  <span className="text-gray-900 font-medium">{report.studentId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5"><Banknote className="w-4 h-4" /> Fee</span>
                  <span className={`font-semibold ${parseFloat(replacementFee || '0') > 0 ? 'text-indigo-700' : 'text-green-700'}`}>
                    {parseFloat(replacementFee || '0') > 0 ? `₱${parseFloat(replacementFee).toFixed(2)}` : 'No Fee'}
                  </span>
                </div>
                {estimatedReadyDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Est. Ready Date</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(estimatedReadyDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {adminNote && (
                  <div className="pt-2 border-t border-indigo-200">
                    <p className="text-gray-500 text-xs mb-1 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Message to Student</p>
                    <p className="text-gray-800 italic text-xs leading-relaxed">"{adminNote}"</p>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setStep('details'); setError(''); }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
                disabled={submitting}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><RefreshCw className="w-4 h-4" /> Confirm Replacement</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 'success' && (
          <div className="p-8 text-center">
            {/* Animated success ring */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-40" />
              <div className="relative w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-10 h-10 text-indigo-600" />
              </div>
            </div>

            <h3 className="text-gray-900 font-bold text-xl mb-2">Replacement Initiated!</h3>
            <p className="text-gray-600 text-sm mb-4 max-w-xs mx-auto">
              The student's ID record has been reset to <strong>Processing</strong> and they've been notified.
            </p>

            {/* Mini summary chips */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                {report.studentName}
              </span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                ID: {report.studentId}
              </span>
              {parseFloat(replacementFee || '0') > 0 && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Fee: ₱{parseFloat(replacementFee).toFixed(2)}
                </span>
              )}
              {estimatedReadyDate && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Est. {new Date(estimatedReadyDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>

            <p className="text-gray-400 text-xs">This window will close automatically…</p>
          </div>
        )}
      </div>
    </div>
  );
}
