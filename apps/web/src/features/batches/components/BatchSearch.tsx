'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BatchSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export function BatchSearch({
  value,
  onChange,
  onClear,
  placeholder = 'Search batches by name, code...',
  className,
}: BatchSearchProps) {
  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search
        className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10 h-10 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-xs sm:text-sm font-medium transition-all"
        aria-label="Search batches"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={onClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
