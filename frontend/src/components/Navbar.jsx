import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import Logo from '@/components/Logo';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Title', href: '/title' },
  ];

  return (
    <header
      className={cn(
        'w-full px-4 py-3 border-b border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-gray-950'
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo />
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

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-gray-600 dark:text-gray-300"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-2 space-y-2 px-4 pb-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block text-gray-700 dark:text-gray-200',
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