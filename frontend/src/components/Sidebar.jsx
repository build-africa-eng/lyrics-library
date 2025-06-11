import { cn } from "@/lib/cn";
import { Home, Library, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Home", icon: Home, to: "/" },
  { name: "Library", icon: Library, to: "/library" },
  { name: "Settings", icon: Settings, to: "/settings" },
];

export default function Sidebar({ className }) {
  return (
    <aside
      className={cn(
        "w-48 p-4 border-r border-zinc-200 dark:border-zinc-700 h-screen fixed top-0 left-0 bg-white dark:bg-zinc-900",
        className
      )}
    >
      <nav className="flex flex-col gap-4">
        {navItems.map(({ name, icon: Icon, to }) => (
          <NavLink
            key={name}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 p-2 rounded-xl transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isActive && "bg-zinc-100 dark:bg-zinc-800 font-medium"
              )
            }
          >
            <Icon className="w-4 h-4" />
            {name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}