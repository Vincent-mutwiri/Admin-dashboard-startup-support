import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts and Pages
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';

// Import pages
import StartupsPage from './pages/StartupsPage';
import ProjectsPage from './pages/ProjectsPage';

// Placeholder pages for our new links
const SettingsPage = () => <div>Settings Page Content</div>;
const ProfilePage = () => <div>Profile Page Content</div>;

function App() {
  return (
    <Routes>
      {/* Public routes that do not have the main layout */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Protected routes that use the main layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* The Outlet in MainLayout will render these nested routes */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="startups" element={<StartupsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

    </Routes>
  );
}

export default App;
