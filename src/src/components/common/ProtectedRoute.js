import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTopColor: '#1a56db',
        borderRadius: '50%',
        animation: 'lc-spin 1s linear infinite',
      }} />
      <style>{`@keyframes lc-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
