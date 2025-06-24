import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginSimple from './pages/LoginSimple.jsx';
import DashboardSimple from './pages/DashboardSimple.jsx';
import ProtectedRoute from './components/ProtectedRoute';

function AppMinimal() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardSimple />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginSimple />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppMinimal;
