import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Children from './pages/Children';
import ChildDetail from './pages/ChildDetail';
import Meals from './pages/Meals';
import MealPlanner from './pages/MealPlanner';
import Alerts from './pages/Alerts';
import Notifications from './pages/Notifications';
import EmergencyContacts from './pages/EmergencyContacts';
import Analytics from './pages/Analytics';
import ParentPortal from './pages/ParentPortal';
import AdminRequests from './pages/AdminRequests';
import DailyDigest from './pages/DailyDigest';
import { authService } from './services/auth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  if (authService.getRole() !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ParentRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  if (authService.getRole() !== 'parent') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LayoutWithTitle() {
  return <Layout title="AllergyGuard" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <LayoutWithTitle />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="children" element={<Children />} />
          <Route path="children/:id" element={<ChildDetail />} />
          <Route path="meals" element={<Meals />} />
          <Route path="meal-planner" element={<MealPlanner />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="emergency" element={<EmergencyContacts />} />
          <Route path="analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
          <Route path="digest" element={<PrivateRoute><DailyDigest /></PrivateRoute>} />
          <Route path="admin-requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
          <Route path="parent-portal" element={<ParentRoute><ParentPortal /></ParentRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
