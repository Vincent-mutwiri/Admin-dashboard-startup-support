import { NavLink } from 'react-router-dom';
import { Home, Package, Users, Settings, Building2 } from 'lucide-react';

// import useAuth from '@/hooks/useAuth'; // We will use this soon

const navLinkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
    isActive ? 'text-primary bg-muted' : 'text-muted-foreground'
  }`;

const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Startups', href: '/startups', icon: Package },
  { name: 'Departments', href: '/departments', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  // const { can } = useAuth(); // Example for role-based rendering later

  return (
    // This is a crucial line: It hides the sidebar on mobile and shows it as a block on medium+ screens
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <Package className="h-6 w-6" />
            <span className="">Incubator</span>
          </NavLink>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map((link) => (
              <NavLink to={link.href} key={link.name} className={navLinkClasses}>
                <link.icon className="h-4 w-4" />
                {link.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
