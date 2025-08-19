import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAppDispatch, useAppSelector } from './store';
import { checkAuth } from './store/slices/authSlice';
import { useNotification } from './hooks/useNotification';

// Layout components
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';

// Auth pages
import LoginPage from './pages/auth/LoginPage';

// Dashboard pages
import DashboardPage from './pages/dashboard/DashboardPage';

// Report management pages
import ReportsPage from './pages/reports/ReportsPage';
import ReportDetailPage from './pages/reports/ReportDetailPage';
import ReportReviewPage from './pages/reports/ReportReviewPage';

// Challan pages
import ChallansPage from './pages/challans/ChallansPage';
import ChallanDetailPage from './pages/challans/ChallanDetailPage';

// Analytics pages
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// Settings pages
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector(state => state.auth);
  const { showNotification } = useNotification();



  useEffect(() => {
    const initApp = async () => {
      try {
        await dispatch(checkAuth()).unwrap();
      } catch (error) {
        console.error('App: Failed to initialize auth:', error);
        showNotification('error', 'Initialization Error', 'Failed to initialize application');
      }
    };

    initApp();
  }, [dispatch]); // Removed showNotification from dependencies

  if (isLoading) {
    return <LoadingScreen />;
  }



  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Outlet />
              </Layout>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/:id" element={<ReportDetailPage />} />
          <Route path="reports/:id/review" element={<ReportReviewPage />} />
          
          {/* Challans */}
          <Route path="challans" element={<ChallansPage />} />
          <Route path="challans/:id" element={<ChallanDetailPage />} />
          
          {/* Analytics */}
          <Route path="analytics" element={<AnalyticsPage />} />
          
          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Box>
  );
};

export default App;
