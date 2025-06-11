import { cn } from "@/lib/utils/cn";

export default function LyricsDisplay({ lyrics, className }) {
  return (
    <div
      className={cn(
        "whitespace-pre-wrap text-sm p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100",
        "max-h-[70vh] overflow-y-auto leading-relaxed tracking-wide",
        className
      )}
    >
      {lyrics ? lyrics : <span className="text-zinc-400 italic">No lyrics available.</span>}
    </div>
  );
}