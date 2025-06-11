// Simple reusable Input component
export default function Input({ className = "", ...props }) {
  return (
    <input
      className={`px-3 py-2 border border-zinc-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-zinc-900 dark:text-white ${className}`}
      {...props}
    />
  );
}