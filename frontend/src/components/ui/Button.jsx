// Simple reusable Button component
export default function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition font-semibold ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}