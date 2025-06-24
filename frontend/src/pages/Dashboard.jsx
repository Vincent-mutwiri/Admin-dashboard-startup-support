import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to the Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats cards */}
        <div className="bg-card rounded-lg p-6 shadow">
          <h3 className="text-xl font-semibold mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-primary">1,234</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow">
          <h3 className="text-xl font-semibold mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-primary">856</p>
        </div>
        <div className="bg-card rounded-lg p-6 shadow">
          <h3 className="text-xl font-semibold mb-2">New Users</h3>
          <p className="text-3xl font-bold text-primary">123</p>
        </div>
      </div>
      <div className="bg-card rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {/* Activity items */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">User Login</h3>
              <p className="text-sm text-muted-foreground">John Doe logged in</p>
            </div>
            <span className="text-sm text-muted-foreground">10:30 AM</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">New User</h3>
              <p className="text-sm text-muted-foreground">New user registered</p>
            </div>
            <span className="text-sm text-muted-foreground">9:45 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
