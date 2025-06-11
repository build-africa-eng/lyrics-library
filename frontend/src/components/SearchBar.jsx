import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar({ value, onChange, placeholder = "Search songs..." }) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-zinc-300 dark:border-zinc-700",
          "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        )}
      />
    </div>
  );
}