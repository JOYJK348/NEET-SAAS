'use client';

import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import { useCourses } from '@/features/master-data/hooks/use-courses';
import { useAcademicYears } from '@/features/master-data/hooks/use-academic-years';
import { useBatches } from '@/features/batches/hooks/use-batches';
import {
  BookOpen,
  Calendar,
  Layers,
  MapPin,
  Loader2,
  Building2,
  Mail,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Radio,
} from 'lucide-react';
import type { Branch } from '../../types';
import { cn } from '@/lib/utils';

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
  const isActive = branch.status === 'ACTIVE';
  const typeStr = branch.branchType.toUpperCase();
  const isMain = typeStr.includes('MAIN');
  const isOnline = typeStr.includes('ONLINE') || typeStr.includes('VIRTUAL');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto p-0 border border-[#E5E7EB] rounded-3xl overflow-hidden shadow-xl bg-[#FAFAFA]">
        {/* Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 p-6 text-white relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Building2 className="w-6 h-6 text-violet-100" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] font-mono font-bold text-white border border-white/20">
                    {branch.code}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                      isActive
                        ? 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30'
                        : 'bg-rose-400/20 text-rose-100 border-rose-300/30',
                    )}
                  >
                    {isActive ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Active Branch
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-200" />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {branch.name}
                </DialogTitle>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  {branch.displayName || branch.name}
                </p>
              </div>
            </div>

            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border shrink-0 bg-white/10 backdrop-blur-md border-white/20 text-white',
              )}
            >
              {isMain ? (
                <Building2 className="w-3.5 h-3.5 text-sky-200" />
              ) : isOnline ? (
                <Radio className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-purple-200" />
              )}
              {branch.branchType.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-6">
          {/* Quick Contact & Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100/80 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-sky-100/80 text-sky-700 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Email</p>
                <p
                  className="text-xs font-bold text-slate-800 truncate"
                  title={branch.email || 'N/A'}
                >
                  {branch.email || 'Not configured'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100/80 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100/80 text-amber-700 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                  Phone
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {branch.phone || 'Not configured'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/80 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-700 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Timezone
                </p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {branch.timezone || 'Asia/Kolkata'}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="text-xs font-semibold text-slate-500">Fetching campus details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Offered Courses Section */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-50 text-violet-600 border border-violet-100">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    Offered Courses
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-bold">
                    {mappedCourses.length} Courses
                  </span>
                </div>

                {mappedCourses.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 bg-slate-50/50">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-600">
                      No courses offered at this branch yet.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Map courses to this branch in Course Settings.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {mappedCourses.map((mc) => (
                      <div
                        key={mc.mappingId}
                        className="p-4 border border-slate-150 rounded-xl bg-slate-50/40 hover:bg-violet-50/30 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md">
                              {mc.academicYearName}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {mc.code}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                            {mc.name}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Batches Section */}
              <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                      <Layers className="h-4 w-4" />
                    </div>
                    Active Batches
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                    {branchBatches.length} Batches
                  </span>
                </div>

                {branchBatches.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 bg-slate-50/50">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                    <p className="text-xs font-bold text-slate-600">
                      No active batches running at this branch.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Create new batches under the Batches tab.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {branchBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {batch.name}
                            </span>
                            <span className="text-xs font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 shrink-0">
                              {batch.code}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-medium truncate">
                            Course: {batch.courseName || 'Regular Program'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                            {batch.deliveryTypeName || 'Regular'}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-1.5">
                            <Calendar className="h-3 w-3 text-slate-400" />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
