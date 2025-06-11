import { cn } from '@/lib/cn';
import { Home, Library, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Home', icon: Home, to: '/' },
  { name: 'Library', icon: Library, to: '/library' },
  { name: 'Settings', icon: Settings, to: '/settings' },
];

export default function Sidebar({ className }) {
  return (
    <aside
      className={cn(
        'w-48 p-4 border-r border-gray-200 dark:border-gray-700 h-screen fixed top-0 left-0',
        'bg-white dark:bg-zinc-900', // Corrected styling
        className
      )}
    >
      <nav className="flex flex-col gap-4">
        {navItems.map(({ name, icon: Icon, to }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 p-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
                isActive && 'bg-gray-100 dark:bg-gray-800 font-medium'
              )
            }
          >
            <Icon className="w-4 h-4" />
            {name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}