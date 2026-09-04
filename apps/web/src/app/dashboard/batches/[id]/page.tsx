'use client';

import { useCallback, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  CalendarDays,
  Users,
  GraduationCap,
  Clock,
  Pencil,
  Monitor,
  UserPlus,
  UserCheck,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ChevronRight,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  useBatch,
  useBatchTimeline,
  useBatchStudents,
  useBatchStaffAssignments,
  useUnassignStaff,
} from '@/features/batches/hooks/use-batches';
import { BatchInfoCard } from '@/features/batches/components/BatchInfoCard';
import { BatchTimeline } from '@/features/batches/components/BatchTimeline';
import { BatchSectionHeader } from '@/features/batches/components/BatchSectionHeader';
import { BatchSkeleton } from '@/features/batches/components/BatchSkeleton';
import { BatchEmptyState } from '@/features/batches/components/BatchEmptyState';
import { BatchStatusBadge } from '@/features/batches/components/BatchStatusBadge';
import { BatchStudentEnrollmentTable } from '@/features/batches/components/BatchStudentEnrollmentTable';
import { BatchStaffAssignmentTable } from '@/features/batches/components/BatchStaffAssignmentTable';
import { MapStudentsSection } from '@/features/batches/components/MapStudentsSection';
import { MapTutorSection } from '@/features/batches/components/MapTutorSection';
import { formatBatchDate, calculateUtilizationRate } from '@/features/batches/utils/batch-utils';
import { BATCH_ATTENDANCE_MODE_LABELS } from '@/features/batches/types/batch';
import type { BatchStaffAssignment } from '@/features/batches/types/batch';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function BatchDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'staff' | 'timeline'>('info');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['info']));
  const [showMapStudents, setShowMapStudents] = useState(false);
  const [showMapTutor, setShowMapTutor] = useState(false);

  // State for Tutor Unassign Confirmation Modal
  const [unassignTarget, setUnassignTarget] = useState<BatchStaffAssignment | null>(null);

  const { batch, isLoading, error } = useBatch(id);
  const { events: timelineEvents, isLoading: timelineLoading } = useBatchTimeline(id);
  const { students: enrolledStudents = [], isLoading: studentsLoading } = useBatchStudents(id, {
    enabled: visitedTabs.has('students'),
  });
  const { assignments: staffAssignments = [], isLoading: staffLoading } = useBatchStaffAssignments(
    id,
    {
      enabled: visitedTabs.has('staff'),
    },
  );
  const unassignMutation = useUnassignStaff();

  const handleTabChange = useCallback((tab: 'info' | 'students' | 'staff' | 'timeline') => {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set(prev).add(tab));
  }, []);

  const handlePromptUnassign = useCallback((assignment: BatchStaffAssignment) => {
    setUnassignTarget(assignment);
  }, []);

  const handleConfirmUnassign = useCallback(async () => {
    if (!unassignTarget) return;
    try {
      await unassignMutation.mutateAsync({ batchId: id, assignmentId: unassignTarget.id });
      toast({
        title: 'Tutor Removed',
        description: `Tutor assignment for ${unassignTarget.staffName} (${unassignTarget.subject}) has been removed.`,
      });
      setUnassignTarget(null);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'Failed to remove tutor assignment.',
        variant: 'destructive',
      });
    }
  }, [id, unassignTarget, unassignMutation]);

  if (isLoading) {
    return (
      <div className="p-6">
        <BatchSkeleton variant="card" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <BatchEmptyState hasFilters={false} variant="default" />
        <Button
          variant="outline"
          className="rounded-xl h-11 mt-4 border-slate-200 hover:bg-slate-50"
          onClick={() => router.push('/dashboard/batches')}
        >
          <ArrowLeft className="h-4 w-4 mr-2 text-[#0052CC]" />
          Back to Batches
        </Button>
      </div>
    );
  }

  const isTerminal = batch.status === 'ARCHIVED';
  const utilizationRate = calculateUtilizationRate(batch.enrolledCount, batch.maxStudents);

  const tabs = [
    { id: 'info' as const, label: 'Batch Overview', icon: Layers },
    {
      id: 'students' as const,
      label: 'Enrolled Students',
      count: batch.enrolledCount,
      icon: Users,
    },
    {
      id: 'staff' as const,
      label: 'Assigned Staff',
      count: staffAssignments.length > 0 ? staffAssignments.length : undefined,
      icon: GraduationCap,
    },
    { id: 'timeline' as const, label: 'Activity Logs', icon: Activity },
  ];

  return (
    <div className="w-full space-y-6 pb-12 text-[#0F172A] font-sans">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
              onClick={() => router.push('/dashboard/batches')}
            >
              <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
            </Button>
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#0052CC]">
              <span>Batches & Sections</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Batch Details</span>
            </div>
            <BatchStatusBadge status={batch.status} />
          </div>

          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0B2447] flex items-center gap-3">
              {batch.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600 font-medium">
              <span className="bg-blue-50 text-[#0052CC] px-2.5 py-0.5 rounded-md border border-blue-200 font-mono font-extrabold">
                {batch.code}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-[#0052CC]" />
                {batch.courseName}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#0052CC]" />
                {batch.branchName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isTerminal && (
            <Button
              onClick={() => router.push(`/dashboard/batches/${batch.id}/edit`)}
              className="rounded-xl h-10 px-5 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs transition-all gap-2 text-xs"
            >
              <Pencil className="h-4 w-4" />
              Edit Batch Details
            </Button>
          )}
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden hover:border-blue-300 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-[#0052CC]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Enrolled Capacity
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-extrabold text-[#0B2447]">
                  {batch.enrolledCount} / {batch.maxStudents}
                </span>
                <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {utilizationRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden hover:border-blue-300 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-[#0052CC]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Academic Year
              </p>
              <p className="text-base font-extrabold text-[#0B2447] mt-0.5 truncate max-w-[140px]">
                {batch.academicYearName || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden hover:border-blue-300 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
              <Monitor className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Delivery Mode
              </p>
              <p className="text-base font-extrabold text-[#0B2447] mt-0.5 truncate max-w-[140px]">
                {batch.deliveryType?.name ?? 'Standard'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-2xs rounded-2xl overflow-hidden hover:border-blue-300 transition-all">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Batch Duration
              </p>
              <p className="text-sm font-extrabold text-[#0B2447] mt-0.5">
                {formatBatchDate(batch.startDate)}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                to {formatBatchDate(batch.endDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Content */}
      <div className="space-y-6">
        {/* Custom Modern Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-[#0B2447] hover:bg-white/60',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] rounded-full font-extrabold',
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700',
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BatchInfoCard
              title="Academic & Location Info"
              description="Associated course, campus branch, and academic session"
              items={[
                {
                  label: 'Course Name',
                  value: batch.courseName,
                  icon: <BookOpen className="h-4 w-4 text-[#0052CC]" />,
                },
                {
                  label: 'Campus Branch',
                  value: batch.branchName,
                  icon: <MapPin className="h-4 w-4 text-emerald-600" />,
                },
                {
                  label: 'Academic Year',
                  value: batch.academicYearName,
                  icon: <CalendarDays className="h-4 w-4 text-blue-600" />,
                },
              ]}
              columns={1}
              className="rounded-2xl border-slate-200 shadow-2xs hover:border-blue-200 transition-all"
            />
            <BatchInfoCard
              title="Delivery & Admission Settings"
              description="Attendance criteria and capacity management rules"
              items={[
                {
                  label: 'Delivery Mode',
                  value: batch.deliveryType?.name ?? 'Standard Classroom',
                  icon: <Monitor className="h-4 w-4 text-[#0052CC]" />,
                },
                {
                  label: 'Attendance Tracking',
                  value: batch.deliveryType
                    ? BATCH_ATTENDANCE_MODE_LABELS[batch.deliveryType.attendanceMode]
                    : 'Standard Attendance',
                  icon: <GraduationCap className="h-4 w-4 text-[#0052CC]" />,
                },
                {
                  label: 'Student Capacity',
                  value: `${batch.enrolledCount} / ${batch.maxStudents} Enrolled (${utilizationRate}%)`,
                  icon: <Users className="h-4 w-4 text-amber-600" />,
                },
                {
                  label: 'New Admissions Status',
                  value: (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold',
                        batch.allowNewAdmissions
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200',
                      )}
                    >
                      {batch.allowNewAdmissions ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5" />
                      )}
                      {batch.allowNewAdmissions ? 'Open for Admissions' : 'Admissions Locked'}
                    </span>
                  ),
                  icon: <Clock className="h-4 w-4 text-rose-500" />,
                },
              ]}
              columns={1}
              className="rounded-2xl border-slate-200 shadow-2xs hover:border-blue-200 transition-all"
            />
            <BatchInfoCard
              title="Batch Timeline Schedule"
              description="Official start date and scheduled completion date"
              items={[
                {
                  label: 'Official Start Date',
                  value: formatBatchDate(batch.startDate),
                  icon: <CalendarDays className="h-4 w-4 text-teal-600" />,
                },
                {
                  label: 'Expected End Date',
                  value: formatBatchDate(batch.endDate),
                  icon: <CalendarDays className="h-4 w-4 text-rose-500" />,
                },
              ]}
              columns={2}
              className="rounded-2xl border-slate-200 shadow-2xs hover:border-blue-200 transition-all"
            />
            <BatchInfoCard
              title="Batch Overview & Notes"
              description="Additional batch context or instructions"
              items={[
                {
                  label: 'Batch Description',
                  value:
                    batch.description ||
                    'No additional description or notes specified for this batch.',
                  icon: <FileText className="h-4 w-4 text-slate-400" />,
                },
              ]}
              columns={1}
              className="rounded-2xl border-slate-200 shadow-2xs hover:border-blue-200 transition-all"
            />
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Inline Map Students Card when toggled */}
            {showMapStudents && (
              <MapStudentsSection
                batchId={batch.id}
                courseId={batch.courseId}
                branchId={batch.branchId}
                enrolledStudentIds={enrolledStudents
                  .map((s: any) => s.admissionId || s.studentAdmissionId)
                  .filter(Boolean)}
                onClose={() => setShowMapStudents(false)}
                onSuccess={() => setShowMapStudents(false)}
              />
            )}

            <Card className="border border-slate-200 bg-white rounded-2xl shadow-2xs overflow-hidden">
              <CardContent className="p-5 lg:p-6">
                <BatchSectionHeader
                  title="Enrolled Students Roster"
                  description={`Currently managing ${enrolledStudents.length} student(s) in this batch`}
                >
                  <Button
                    onClick={() => setShowMapStudents((prev) => !prev)}
                    className="rounded-xl h-10 px-4 bg-[#0052CC] text-white hover:bg-blue-700 shadow-2xs font-extrabold transition-all gap-2 text-xs"
                  >
                    <UserPlus className="h-4 w-4" />
                    {showMapStudents ? 'Close Mapping Panel' : 'Map New Students'}
                  </Button>
                </BatchSectionHeader>
                <div className="mt-4">
                  <BatchStudentEnrollmentTable
                    students={enrolledStudents}
                    isLoading={studentsLoading}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Inline Map Tutor Card when toggled */}
            {showMapTutor && (
              <MapTutorSection
                batchId={batch.id}
                courseId={batch.courseId}
                onClose={() => setShowMapTutor(false)}
                onSuccess={() => setShowMapTutor(false)}
              />
            )}

            <Card className="border border-slate-200 bg-white rounded-2xl shadow-2xs overflow-hidden">
              <CardContent className="p-5 lg:p-6">
                <BatchSectionHeader
                  title="Assigned Tutors & Faculty"
                  description={`${staffAssignments.length} staff member(s) assigned to this batch`}
                >
                  <Button
                    onClick={() => setShowMapTutor((prev) => !prev)}
                    className="rounded-xl h-10 px-4 bg-[#0052CC] text-white hover:bg-blue-700 shadow-2xs font-extrabold transition-all gap-2 text-xs"
                  >
                    <UserCheck className="h-4 w-4" />
                    {showMapTutor ? 'Close Assignment Panel' : 'Map New Tutor'}
                  </Button>
                </BatchSectionHeader>
                <div className="mt-4">
                  <BatchStaffAssignmentTable
                    assignments={staffAssignments}
                    isLoading={staffLoading}
                    onUnassign={handlePromptUnassign}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'timeline' && (
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-2xs overflow-hidden">
            <CardContent className="p-5 lg:p-6">
              <BatchSectionHeader
                title="Batch Audit & Activity Logs"
                description="Historical record of events and state changes for this batch"
              />
              <div className="mt-4">
                <BatchTimeline events={timelineEvents} isLoading={timelineLoading} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete / Unassign Tutor Custom Modal Confirmation Dialog */}
      <Dialog open={!!unassignTarget} onOpenChange={(open) => !open && setUnassignTarget(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border border-slate-200 shadow-2xl bg-white text-[#0F172A] font-sans">
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center shrink-0">
              <AlertTriangle className="h-7 w-7 text-rose-600" />
            </div>

            <div className="space-y-1">
              <DialogTitle className="text-lg font-extrabold text-[#0B2447]">
                Remove Tutor Assignment?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to unassign{' '}
                <span className="font-extrabold text-[#0B2447]">{unassignTarget?.staffName}</span>{' '}
                from teaching{' '}
                <span className="font-extrabold text-[#0052CC]">{unassignTarget?.subject}</span> in
                this batch?
              </DialogDescription>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Tutor Name:</span>
                <span className="font-bold text-[#0B2447]">{unassignTarget?.staffName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Subject:</span>
                <span className="font-bold text-[#0052CC]">{unassignTarget?.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Effective From:</span>
                <span className="font-bold text-slate-700">
                  {unassignTarget?.effectiveFrom
                    ? formatBatchDate(unassignTarget.effectiveFrom)
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setUnassignTarget(null)}
              className="rounded-xl h-10 px-4 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUnassign}
              disabled={unassignMutation.isPending}
              className="rounded-xl h-10 px-5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-2xs gap-1.5 border-none transition-all disabled:opacity-50"
            >
              {unassignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Remove Tutor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BatchDetailPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <BatchDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}
