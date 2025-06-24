import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Welcome to the Dashboard</h1>
      {user && <p className="mt-2">Hello, {user.fullName}! Your role is: {user.role}</p>}
      <Button onClick={handleLogout} className="mt-4">
        Logout
      </Button>
    </div>
  );
}
