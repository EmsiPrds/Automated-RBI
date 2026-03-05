import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HouseholdList from './pages/HouseholdList';
import HouseholdForm from './pages/HouseholdForm';
import HouseholdView from './pages/HouseholdView';
import FormBList from './pages/FormBList';
import FormBForm from './pages/FormBForm';
import FormBView from './pages/FormBView';
import Reports from './pages/Reports';
import DigitalId from './pages/DigitalId';
import VerifyId from './pages/VerifyId';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-pulse" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="households" element={<HouseholdList />} />
        <Route path="households/new" element={<HouseholdForm />} />
        <Route path="households/:id" element={<HouseholdView />} />
        <Route path="households/:id/edit" element={<HouseholdForm />} />
        <Route path="form-b" element={<FormBList />} />
        <Route path="form-b/new" element={<FormBForm />} />
        <Route path="form-b/:id" element={<FormBView />} />
        <Route path="form-b/:id/edit" element={<FormBForm />} />
        <Route
          path="reports"
          element={
            <PrivateRoute roles={['secretary', 'punong_barangay']}>
              <Reports />
            </PrivateRoute>
          }
        />
        <Route
          path="digital-id"
          element={
            <PrivateRoute roles={['resident']}>
              <DigitalId />
            </PrivateRoute>
          }
        />
      </Route>
      <Route path="verify" element={<VerifyId />} />
      <Route path="verify/:idNumber" element={<VerifyId />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
