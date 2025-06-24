import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import LoginSimple from './pages/LoginSimple.jsx';
import DashboardSimple from './pages/DashboardSimple.jsx';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardSimple />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: <div>Users Page</div>,
      },
      {
        path: 'settings',
        element: <div>Settings Page</div>,
      },
    ],
  },
  {
    path: 'login',
    element: <LoginSimple />,
  },
]);

export default router;
