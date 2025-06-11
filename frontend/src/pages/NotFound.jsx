import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export default function NotFound() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-screen',
        'bg-gray-50 dark:bg-gray-950 text-center'
      )}
    >
      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">404 - Page Not Found</h1>
      <p className="mb-8 text-gray-600 dark:text-gray-300">
        Sorry, the page you're looking for doesn't exist.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
}