import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { DocumentAnalysisPage } from './pages/DocumentAnalysisPage';
import { PhotoKYCPage } from './pages/PhotoKYCPage';
import { FraudNetworkPage } from './pages/FraudNetworkPage';
import { VerificationLedgerPage } from './pages/VerificationLedgerPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { getAuthToken } from './services/api';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <ApplicationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <DocumentAnalysisPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <PhotoKYCPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/network"
          element={
            <ProtectedRoute>
              <FraudNetworkPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ledger"
          element={
            <ProtectedRoute>
              <VerificationLedgerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
