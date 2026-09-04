'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { BatchSectionHeader } from './BatchSectionHeader';
import { TableSkeleton } from '@/components/ui/loading';
import { Trash, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBatchDate } from '@/features/batches/utils/batch-utils';
import type { BatchStaffAssignment } from '@/features/batches/types/batch';

interface BatchStaffAssignmentTableProps {
  assignments: BatchStaffAssignment[];
  isLoading?: boolean;
  className?: string;
  onUnassign?: (assignment: BatchStaffAssignment) => void;
}

export function BatchStaffAssignmentTable({
  assignments,
  isLoading,
  className,
  onUnassign,
}: BatchStaffAssignmentTableProps) {
  if (isLoading) {
    return (
      <Card className={cn('border border-slate-200 rounded-2xl shadow-2xs bg-white', className)}>
        <CardContent className="p-4 lg:p-5">
          <BatchSectionHeader
            title="Assigned Tutors & Faculty"
            description="Staff assigned to this batch"
          />
          <TableSkeleton rows={4} columns={6} />
        </CardContent>
      </Card>
    );
  }

  if (!assignments?.length) {
    return (
      <Card className={cn('border border-slate-200 rounded-2xl shadow-2xs bg-white', className)}>
        <CardContent className="p-4 lg:p-5">
          <BatchSectionHeader
            title="Assigned Tutors & Faculty"
            description="Staff assigned to this batch"
          />
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-[#0052CC]" />
            </div>
            <p className="font-extrabold text-sm text-[#0B2447]">No tutors assigned yet</p>
            <p className="text-xs text-slate-500 font-medium max-w-xs">
              Click &quot;Map New Tutor&quot; above to assign faculty members to teach subjects in
              this batch section.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border border-slate-200 rounded-2xl shadow-2xs bg-white overflow-hidden',
        className,
      )}
    >
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-extrabold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Staff Name</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Subject</th>
                <th className="px-4 py-3 text-left">Effective From</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Effective To</th>
                <th className="px-4 py-3 text-left">Status</th>
                {onUnassign && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {assignments.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3.5 font-extrabold text-[#0B2447]">
                    {assignment.staffName}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 hidden lg:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-[#0052CC] border border-blue-200">
                      {assignment.subject}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {formatBatchDate(assignment.effectiveFrom)}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 hidden lg:table-cell font-medium">
                    {assignment.effectiveTo ? formatBatchDate(assignment.effectiveTo) : 'Current'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border',
                        assignment.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200',
                      )}
                    >
                      {assignment.isActive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </span>
                  </td>
                  {onUnassign && (
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onUnassign(assignment)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 rounded-xl transition-all border border-transparent hover:border-rose-200"
                        title="Remove tutor assignment"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
