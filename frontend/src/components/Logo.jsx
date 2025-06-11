import { cn } from '@/lib/cn';

export default function LyricsDisplay({ lyrics, className }) {
  return (
    <div
      className={cn(
        'whitespace-pre-wrap text-sm p-4 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100',
        'max-h-[70vh] overflow-y-auto leading-relaxed tracking-wide',
        className
      )}
    >
      {lyrics ? lyrics : <span className="text-gray-400 italic">No lyrics available.</span>}
    </div>
  );
}