import { cn } from '@/lib/cn';

export default function Button({ children, as: Component = 'button', variant = 'default', className = '', ...props }) {
  const base =
    'inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50';
  
  const variants = {
    default: 'bg-black text-white hover:bg-gray-900',
    outline: 'border border-gray-300 text-black hover:bg-gray-100',
    ghost: 'text-black hover:bg-gray-100',
  };

  return (
    <Component className={cn(base, variants[variant], className)} {...props}>
      {children}
    </Component>
  );
}