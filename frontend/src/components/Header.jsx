import { cn } from "@/lib/cn";
import { Menu, Search, Sun, Moon } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <header
      className={cn(
        "flex items-center justify-between p-4 border-b",
        darkMode ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
      )}
    >
      <div className="flex items-center gap-2">
        <Menu className="w-5 h-5" />
        <span className="text-lg font-semibold">Lyrics Library</span>
      </div>

      <div className="flex items-center gap-4">
        <Search className="w-5 h-5 cursor-pointer" />
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="focus:outline-none"
        >
          {darkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}