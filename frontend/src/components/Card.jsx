import { cn } from "@/lib/cn";

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}