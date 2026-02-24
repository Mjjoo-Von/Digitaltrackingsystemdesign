import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/auth-context';
import { LoginPage } from './components/login-page';
import { RegisterPage } from './components/register-page';
import { StudentDashboard } from './components/student-dashboard';
import { AdminDashboard } from './components/admin-dashboard';
import { NotificationsPage } from './components/notifications-page';
import { ClaimRequestPage } from './components/claim-request-page';
import { HelpPage } from './components/help-page';
import { UpdateStatusModal } from './components/update-status-modal';

type AuthView = 'login' | 'register';
type Page = 'dashboard' | 'notifications' | 'claim' | 'help';

interface IDRecord {
  studentId: string;
  userId: string;
  status: 'processing' | 'ready' | 'claimed';
  studentName: string;
  studentEmail: string;
  createdAt: string;
  updatedAt: string;
}

function AppContent() {
  const auth = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedRecord, setSelectedRecord] = useState<IDRecord | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const handleEditRecord = (record: IDRecord) => {
    setSelectedRecord(record);
    setShowUpdateModal(true);
  };

  const handleUpdateSuccess = () => {
    setShowUpdateModal(false);
    setSelectedRecord(null);
    // Trigger a refresh by navigating back to dashboard
    setCurrentPage('dashboard');
  };

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!auth.user) {
    if (authView === 'login') {
      return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
    } else {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
  }

  // Student views
  if (auth.user.role === 'student') {
    if (currentPage === 'notifications') {
      return <NotificationsPage onBack={() => setCurrentPage('dashboard')} />;
    }
    
    if (currentPage === 'claim') {
      return <ClaimRequestPage onBack={() => setCurrentPage('dashboard')} />;
    }
    
    if (currentPage === 'help') {
      return <HelpPage onBack={() => setCurrentPage('dashboard')} />;
    }
    
    return <StudentDashboard onNavigate={(page) => setCurrentPage(page as Page)} />;
  }

  // Admin views
  if (auth.user.role === 'admin') {
    return (
      <>
        <AdminDashboard onEditRecord={handleEditRecord} />
        {showUpdateModal && selectedRecord && (
          <UpdateStatusModal
            record={selectedRecord}
            onClose={() => setShowUpdateModal(false)}
            onSuccess={handleUpdateSuccess}
          />
        )}
      </>
    );
  }

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}