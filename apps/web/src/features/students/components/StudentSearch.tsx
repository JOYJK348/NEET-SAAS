'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StudentSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export function StudentSearch({
  value,
  onChange,
  onClear,
  placeholder = 'Search by student name, email, or student ID...',
  className,
}: StudentSearchProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 shrink-0"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 h-10 rounded-xl bg-white border-[#E5E7EB] hover:border-violet-300 focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/20 text-xs sm:text-sm font-medium transition-all shadow-xs"
        aria-label="Search students"
      />
      {value && (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={onClear}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
