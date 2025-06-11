import { cn } from '@/lib/cn';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/Logo';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync dark mode with class on <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Title', href: '/title' }, // Adjust to 'Library' if needed
  ];

  return (
    <header
      className={cn(
        'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-950'
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

      <nav className={cn('hidden md:flex items-center gap-4 text-base')}>
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            className={cn(
              'text-gray-700 dark:text-gray-200',
              'hover:text-blue-600 dark:hover:text-blue-400 transition-colors'
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <Search className="w-5 h-5 cursor-pointer text-gray-600 dark:text-gray-300" />
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="focus:outline-none text-gray-600 dark:text-gray-300"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'block py-2 text-gray-700 dark:text-gray-200',
                'hover:text-blue-600 dark:hover:text-blue-400'
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}