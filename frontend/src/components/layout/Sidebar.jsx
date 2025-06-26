import { NavLink } from 'react-router-dom';
import { Home, Package, Users, Settings } from 'lucide-react';

// import useAuth from '@/hooks/useAuth'; // We will use this soon

// This function correctly applies classes for active/inactive links
const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
    isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
  }`;

export default function Sidebar() {
  // const { can } = useAuth(); // Example for role-based rendering later

  return (
    // This is a crucial line: It hides the sidebar on mobile and shows it as a block on medium+ screens
    <div className="hidden border-r bg-background md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6" />
            <span>ProjectHub</span>
          </NavLink>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <NavLink to="/dashboard" className={navLinkClasses}>
              <Home className="h-4 w-4" />
              Dashboard
            </NavLink>
            <NavLink to="/startups" className={navLinkClasses}>
              <Users className="h-4 w-4" />
              Startups
            </NavLink>
            <NavLink to="/settings" className={navLinkClasses}>
              <Settings className="h-4 w-4" />
              Settings
            </NavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
