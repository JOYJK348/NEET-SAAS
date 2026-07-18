'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import type { AdmissionBranch } from '@/features/admissions/types/admission';

interface SelectBranchStepProps {
  branches: AdmissionBranch[];
  selectedBranchId: string;
  onSelect: (branchId: string) => void;
  error?: string;
}

export function SelectBranchStep({
  branches,
  selectedBranchId,
  onSelect,
  error,
}: SelectBranchStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Select Branch</Label>
        <p className="text-sm text-gray-500 mb-3">
          Choose the branch where the student will attend.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {branches.map((branch) => (
          <Card
            key={branch.id}
            className={cn(
              'cursor-pointer border transition-all hover:border-purple-300',
              selectedBranchId === branch.id && 'border-purple-500 ring-1 ring-purple-500',
            )}
            onClick={() => onSelect(branch.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{branch.name}</p>
                {branch.code && <p className="text-xs text-gray-500">{branch.code}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
