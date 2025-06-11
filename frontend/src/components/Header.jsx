import { cn } from '@/lib/cn';
import { Menu, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Logo from '@/components/Logo';
import SearchBar from '@/components/SearchBar';
import { useLyrics } from '@/context/LyricsContext'; // Import context hook

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // State is now managed by the context for global use
  const { searchTerm, setSearchTerm } = useLyrics(); 

  // Sync dark mode with OS preference and local storage
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

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
        'w-full sticky top-0 z-20',
        'p-4 border-b border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-zinc-900' // Corrected styling
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="flex-1 flex justify-center px-4">
           {/* SearchBar now uses the global state from the context */}
          <SearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        <nav className="hidden md:flex items-center gap-2">
          {links.map((link) => (
             <NavLink
              key={link.name}
              to={link.href}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  isActive && 'bg-gray-100 dark:bg-gray-800'
                )
              }
            >
              {link.name}
            </NavLink>
          ))}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </nav>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-600 dark:text-gray-300"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-gray-800 p-4 z-10 space-y-2">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-gray-700 dark:text-gray-200 hover:text-blue-500"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}