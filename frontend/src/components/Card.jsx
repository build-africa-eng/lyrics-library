import { cn } from '@/lib/cn';
import { Music2 } from 'lucide-react';

// Card now accepts title and artist as props and displays them.
// It can also be a link by wrapping it with <Link> in the Library component.
export default function Card({ title, artist, className, ...props }) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800',
        'bg-white dark:bg-zinc-900', // Corrected styling
        'flex items-start gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800',
        className
      )}
      {...props}
    >
      <div className="mt-1">
        <Music2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex flex-col truncate">
        <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{artist}</p>
      </div>
    </div>
  );
}