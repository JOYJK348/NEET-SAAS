'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentAcademicsData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { STALE_TIMES } from '@/lib/staleTimes';
import { Layers, Building2, CheckCircle2, Sparkles } from 'lucide-react';

export default function ParentBatchesPage() {
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  const {
    data,
    isLoading: isBatchesLoading,
  } = useQuery<ParentAcademicsData>({
    queryKey: ['parent', 'academics', selectedChildId],
    queryFn: () => parentPortalService.getAcademics(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });

  const isLoading = (isBatchesLoading && !data) || isSwitcherLoading;

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const enrolledBatches = data?.enrolledBatches || [];
  const studentName = selectedChild?.name || 'Student';

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Hero Progress Banner - Identical to Academic Overview */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-violet-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md border border-white/20 text-white">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Academic Performance & Enrollment Profile</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl shadow-inner border border-white/30 shrink-0 text-white">
              {studentName.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {studentName}&apos;s Assigned Batches
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Batches List Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="h-4 w-4 text-violet-600" />
          Active Batch Sections ({enrolledBatches.length})
        </h3>

        {enrolledBatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enrolledBatches.map((batch) => (
              <Card
                key={batch.id}
                className="p-6 rounded-3xl bg-white border border-[#E5E7EB] shadow-sm space-y-4 hover:border-violet-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
                      <Layers className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-[#111827]">{batch.name}</h4>
                      {batch.code && (
                        <p className="text-xs font-mono font-bold text-violet-700 mt-0.5">
                          Batch Code: {batch.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Active Batch
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <Building2 className="h-4 w-4 text-violet-600" />
                    <span>Campus Centre: {batch.branchName || 'Main Branch'}</span>
                  </div>
                  <p className="text-slate-500">Regular classroom section assigned for lectures, daily test practice, and tutor mentoring.</p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-xs font-medium text-slate-400 rounded-2xl bg-white border border-[#E5E7EB]">
            No batch assigned yet.
          </Card>
        )}
      </div>
    </div>
  );
}
