import { cn } from '@/lib/cn';
import { Menu, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import SearchBar from '@/components/SearchBar';

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Sync dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Library', href: '/library' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <header
      className={cn(
        'flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800',
        'background-color: white; dark:background-color: #18181b;'
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

      <div className="flex items-center gap-4">
        <SearchBar value={searchValue} onChange={setSearchValue} />
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="focus:outline-none text-gray-600 dark:text-gray-300"
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 p-4 z-10">
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