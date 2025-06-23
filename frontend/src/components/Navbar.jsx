import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Menu, Sun, Moon } from 'lucide-react';
import Logo from './Logo';

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const links = [
    { name: 'Home', to: '/' },
    { name: 'Library', to: '/library' },
    { name: 'About', to: '/about' },
    { name: 'Settings', to: '/settings' },
  ];

  return (
    <nav
      className={cn(
        'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-900'
      )}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-600 dark:text-gray-300"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Logo />
      </div>

      <div className="hidden md:flex items-center gap-4">
        {links.map(({ name, to }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              cn(
                'px-3 py-2 text-gray-700 dark:text-gray-200',
                'hover:text-blue-600 dark:hover:text-blue-400',
                isActive && 'font-medium text-blue-600 dark:text-blue-400'
              )
            }
          >
            {name}
          </NavLink>
        ))}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-gray-600 dark:text-gray-300"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div
          className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4 z-10"
        >
          {links.map(({ name, to }) => (
            <NavLink
              key={name}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'block py-2 text-gray-700 dark:text-gray-200',
                  'hover:text-blue-600 dark:hover:text-blue-400',
                  isActive && 'font-medium text-blue-600 dark:text-blue-400'
                )
              }
            >
              {name}
            </NavLink>
          ))}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full text-left py-2 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
            aria-label="Toggle dark mode"
          >
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      )}
    </nav>
  );
}
