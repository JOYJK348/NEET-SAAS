'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import { useCourses } from '@/features/master-data/hooks/use-courses';
import { useAcademicYears } from '@/features/master-data/hooks/use-academic-years';
import { useBatches } from '@/features/batches/hooks/use-batches';
import { BookOpen, Calendar, Layers, MapPin, Loader2 } from 'lucide-react';
import type { Branch } from '../../types';

interface BranchDetailsModalProps {
  branch: Branch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BranchDetailsModal({ branch, open, onOpenChange }: BranchDetailsModalProps) {
  // 1. Fetch all course-to-branch mapping configurations
  const { data: mappings = [], isLoading: mappingsLoading } = useBranchCourses(
    branch?.id || undefined,
  );

  // 2. Fetch list of course details
  const { data: coursesRes } = useCourses({ limit: 100 });
  const courses = coursesRes?.data || [];

  // 3. Fetch academic years details
  const { data: yearsRes } = useAcademicYears({ limit: 100 });
  const academicYears = yearsRes?.data || [];

  // 4. Fetch all active batches
  const { batches = [], isLoading: batchesLoading } = useBatches({ autoFetch: open });

  if (!branch) return null;

  // Filter mappings belonging to this branch
  const activeBranchMappings = mappings.filter((m) => m.branchId === branch.id);

  // Get unique mapped courses details
  const mappedCourses = activeBranchMappings.map((mapping) => {
    const course = courses.find((c) => c.id === mapping.courseId);
    const academicYear = academicYears.find((y) => y.id === mapping.academicYearId);
    return {
      mappingId: mapping.id,
      courseId: course?.id || mapping.courseId,
      name: course?.name || 'Loading Course...',
      code: course?.code || '...',
      academicYearName: academicYear?.name || 'Loading Track...',
    };
  });

  // Filter batches running at this branch
  const branchBatches = batches.filter((b) => b.branchId === branch.id);

  const loading = mappingsLoading || batchesLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                {branch.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Code: {branch.code} | Type: {branch.branchType.replace('_', ' ')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="text-sm">Loading branch details...</p>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            {/* Mapped Courses */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-purple-600" />
                Offered Courses ({mappedCourses.length})
              </h3>
              {mappedCourses.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50">
                  <p className="text-xs text-gray-500">No courses offered at this branch yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mappedCourses.map((mc) => (
                    <div
                      key={mc.mappingId}
                      className="p-3.5 border border-gray-150 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
                          {mc.academicYearName}
                        </p>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                          {mc.name}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 font-mono">Code: {mc.code}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Batches */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-purple-600" />
                Active Batches ({branchBatches.length})
              </h3>
              {branchBatches.length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-xl border-gray-200 dark:border-gray-800 bg-gray-50/50">
                  <p className="text-xs text-gray-500">No active batches running at this branch.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950">
                  {branchBatches.map((batch) => (
                    <div
                      key={batch.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {batch.name}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">({batch.code})</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Course: {batch.courseName || 'Loading Course...'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-xxs font-medium text-purple-700 dark:text-purple-400 ring-1 ring-inset ring-purple-600/10">
                          {batch.deliveryTypeName || 'Regular'}
                        </span>
                        <div className="flex items-center gap-1 text-xxs text-gray-400 mt-1.5">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {batch.startDate
                              ? new Date(batch.startDate).toLocaleDateString(undefined, {
                                  year: '2-digit',
                                  month: 'short',
                                })
                              : ''}{' '}
                            -{' '}
                            {batch.endDate
                              ? new Date(batch.endDate).toLocaleDateString(undefined, {
                                  year: '2-digit',
                                  month: 'short',
                                })
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
