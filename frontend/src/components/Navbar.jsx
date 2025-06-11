import { Menu } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Library", href: "/library" },
  ];

  return (
    <header className="w-full px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <button onClick={() => setOpen(!open)} className="md:hidden text-zinc-600 dark:text-zinc-300">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden mt-2 space-y-2 px-4 pb-3 text-sm">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "block text-zinc-700 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-blue-400"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}