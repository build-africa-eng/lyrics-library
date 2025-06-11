import { cn } from '@/lib/cn';

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={cn(
        'px-3 py-2 border border-gray-300 rounded w-full',
        'focus:outline-none focus:ring-2 focus:ring-blue-400',
        'dark:bg-gray-900 dark:text-white dark:border-gray-700',
        className
      )}
      {...props}
    />
  );
}