import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import Input from '@/components/ui/Input';

export default function SearchBar({ value, onChange, placeholder = 'Search songs...' }) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}