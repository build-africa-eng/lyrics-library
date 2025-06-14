import { cn } from '@/lib/cn';
import { Music2 } from 'lucide-react';

export default function SongListItem({ title, artist, onClick, active = false }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2 cursor-pointer rounded-xl transition-colors',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        active && 'bg-gray-100 dark:bg-gray-800 font-medium'
      )}
    >
      <Music2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      <div className="flex flex-col truncate">
        <span className="truncate">{title}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{artist}</span>
      </div>
    </div>
  );
}