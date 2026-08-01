'use client';

import { useChildSwitcher } from '../context/child-switcher-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, GraduationCap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChildSwitcherProps {
  isCollapsed?: boolean;
}

export function ChildSwitcher({ isCollapsed = false }: ChildSwitcherProps) {
  const { linkedStudents, selectedChild, setSelectedChildId } = useChildSwitcher();

  if (!selectedChild && linkedStudents.length === 0) {
    return (
      <div className="p-3 text-xs text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl">
        No linked students
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm mx-auto hover:bg-violet-100 transition-colors"
            title={selectedChild?.name || 'Child Switcher'}
          >
            {selectedChild?.name.charAt(0).toUpperCase() || 'C'}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-slate-500 uppercase">
            Switch Student
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {linkedStudents.map((child) => (
            <DropdownMenuItem
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div>
                <p className="font-semibold text-sm">{child.name}</p>
                <p className="text-xs text-slate-400">{child.courseName}</p>
              </div>
              {child.id === selectedChild?.id && <Check className="h-4 w-4 text-violet-600" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
        Current Student
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-2.5 rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/70 dark:bg-violet-950/30 text-left hover:bg-violet-100/60 dark:hover:bg-violet-900/40 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {selectedChild?.name.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {selectedChild?.name}
                </p>
                <p className="text-[11px] text-violet-700 dark:text-violet-400 truncate">
                  {selectedChild?.courseName} • {selectedChild?.batchName}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-violet-600 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="text-xs text-slate-500 uppercase flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
            Linked Children ({linkedStudents.length})
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {linkedStudents.map((child) => {
            const isSelected = child.id === selectedChild?.id;
            return (
              <DropdownMenuItem
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={cn(
                  'flex items-center justify-between p-2.5 cursor-pointer rounded-lg transition-colors',
                  isSelected && 'bg-violet-50 dark:bg-violet-950/50 font-semibold',
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {child.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {child.courseName} ({child.admissionNumber})
                  </p>
                </div>
                {isSelected && <Check className="h-4 w-4 text-violet-600 shrink-0" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
