'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';

interface SelectAcademicYearStepProps {
  years: { id: string; name: string }[];
  selectedYearId: string;
  onSelect: (yearId: string) => void;
  error?: string;
}

export function SelectAcademicYearStep({
  years,
  selectedYearId,
  onSelect,
  error,
}: SelectAcademicYearStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Select Academic Year</Label>
        <p className="text-sm text-gray-500 mb-3">Choose the academic year for this admission.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {years.map((year) => (
          <Card
            key={year.id}
            className={cn(
              'cursor-pointer border transition-all hover:border-purple-300',
              selectedYearId === year.id && 'border-purple-500 ring-1 ring-purple-500',
            )}
            onClick={() => onSelect(year.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                <CalendarDays className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{year.name}</p>
                <p className="text-sm text-gray-500">Academic Year</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
