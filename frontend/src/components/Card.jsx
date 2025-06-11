import { cn } from '@/lib/cn';

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4',
        'background-color: white; dark:background-color: #18181b;', // Avoid bg-white
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}