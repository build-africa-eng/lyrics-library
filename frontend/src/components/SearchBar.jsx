import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function SearchBar({ value, onChange, placeholder = 'Search songs...' }) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700',
          'background-color: white; dark:background-color: #18181b; text-gray-900 dark:text-gray-100',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
        )}
      />
    </div>
  );
}