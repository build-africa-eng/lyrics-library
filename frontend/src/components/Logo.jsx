import { BookOpenText } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function Logo({ className }) {
  return (
    <div className={cn('flex items-center gap-2 text-xl font-bold', className)}>
      <BookOpenText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      <span className="text-zinc-800 dark:text-zinc-100">Lyrix</span>
    </div>
  );
}