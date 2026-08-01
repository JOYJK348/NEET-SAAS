'use client';

import { useCallback, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  Award,
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

  const handleUnassignStaff = useCallback(
    async (assignmentId: string) => {
      if (!confirm('Are you sure you want to remove this tutor assignment?')) return;
      try {
        await unassignMutation.mutateAsync({ batchId: id, assignmentId });
        toast({
          title: 'Tutor Removed',
          description: 'Tutor assignment has been successfully removed.',
        });
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err?.message || 'Failed to remove tutor assignment.',
          variant: 'destructive',
        });
      }
    },
    [id, unassignMutation],
  );

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
          className="rounded-xl h-11 mt-4 border-gray-200 hover:bg-gray-50"
          onClick={() => router.push('/dashboard/batches')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
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
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-6 lg:p-8 text-white shadow-xl shadow-purple-500/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-purple-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/20"
                onClick={() => router.push('/dashboard/batches')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-purple-100 border border-white/20">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Batch Details
              </div>
              <BatchStatusBadge status={batch.status} />
            </div>

            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                {batch.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-purple-100/90 font-medium">
                <span className="bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10 font-mono text-xs">
                  {batch.code}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-purple-200" />
                  {batch.courseName}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-purple-200" />
                  {batch.branchName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isTerminal && (
              <Button
                onClick={() => router.push(`/dashboard/batches/${batch.id}/edit`)}
                className="rounded-2xl h-11 px-6 bg-white text-purple-700 hover:bg-purple-50 font-semibold shadow-lg shadow-black/10 transition-all gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit Batch Details
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-purple-100/80 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Enrolled Capacity
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold text-gray-900">
                  {batch.enrolledCount} / {batch.maxStudents}
                </span>
                <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                  {utilizationRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100/80 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Academic Year
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[140px]">
                {batch.academicYearName || 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100/80 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Monitor className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Delivery Mode
              </p>
              <p className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[140px]">
                {batch.deliveryType?.name ?? 'Standard'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100/80 bg-white/80 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Batch Duration
              </p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {formatBatchDate(batch.startDate)}
              </p>
              <p className="text-xs text-gray-500 font-medium">
                to {formatBatchDate(batch.endDate)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Content */}
      <div className="space-y-6">
        {/* Custom Modern Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-100/80 backdrop-blur-md rounded-2xl border border-gray-200/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-white text-purple-700 shadow-sm border border-purple-100/50 scale-[1.02]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50',
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-purple-600' : 'text-gray-400')} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs rounded-full font-bold',
                      isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700',
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
                  icon: <BookOpen className="h-4 w-4 text-purple-500" />,
                },
                {
                  label: 'Campus Branch',
                  value: batch.branchName,
                  icon: <MapPin className="h-4 w-4 text-emerald-500" />,
                },
                {
                  label: 'Academic Year',
                  value: batch.academicYearName,
                  icon: <CalendarDays className="h-4 w-4 text-blue-500" />,
                },
              ]}
              columns={1}
              className="rounded-2xl border-purple-100/80 shadow-sm hover:shadow-md transition-all"
            />
            <BatchInfoCard
              title="Delivery & Admission Settings"
              description="Attendance criteria and capacity management rules"
              items={[
                {
                  label: 'Delivery Mode',
                  value: batch.deliveryType?.name ?? 'Standard Classroom',
                  icon: <Monitor className="h-4 w-4 text-indigo-500" />,
                },
                {
                  label: 'Attendance Tracking',
                  value: batch.deliveryType
                    ? BATCH_ATTENDANCE_MODE_LABELS[batch.deliveryType.attendanceMode]
                    : 'Standard Attendance',
                  icon: <GraduationCap className="h-4 w-4 text-purple-500" />,
                },
                {
                  label: 'Student Capacity',
                  value: `${batch.enrolledCount} / ${batch.maxStudents} Enrolled (${utilizationRate}%)`,
                  icon: <Users className="h-4 w-4 text-amber-500" />,
                },
                {
                  label: 'New Admissions Status',
                  value: (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold',
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
              className="rounded-2xl border-purple-100/80 shadow-sm hover:shadow-md transition-all"
            />
            <BatchInfoCard
              title="Batch Timeline Schedule"
              description="Official start date and scheduled completion date"
              items={[
                {
                  label: 'Official Start Date',
                  value: formatBatchDate(batch.startDate),
                  icon: <CalendarDays className="h-4 w-4 text-teal-500" />,
                },
                {
                  label: 'Expected End Date',
                  value: formatBatchDate(batch.endDate),
                  icon: <CalendarDays className="h-4 w-4 text-rose-500" />,
                },
              ]}
              columns={2}
              className="rounded-2xl border-purple-100/80 shadow-sm hover:shadow-md transition-all"
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
                  icon: <FileText className="h-4 w-4 text-gray-500" />,
                },
              ]}
              columns={1}
              className="rounded-2xl border-purple-100/80 shadow-sm hover:shadow-md transition-all"
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

            <Card className="border border-purple-100/80 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-5 lg:p-6">
                <BatchSectionHeader
                  title="Enrolled Students Roster"
                  description={`Currently managing ${enrolledStudents.length} student(s) in this batch`}
                >
                  <Button
                    onClick={() => setShowMapStudents((prev) => !prev)}
                    className="rounded-2xl h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-md shadow-purple-500/20 font-semibold transition-all gap-2 text-xs"
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

            <Card className="border border-purple-100/80 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-5 lg:p-6">
                <BatchSectionHeader
                  title="Assigned Tutors & Faculty"
                  description={`${staffAssignments.length} staff member(s) assigned to this batch`}
                >
                  <Button
                    onClick={() => setShowMapTutor((prev) => !prev)}
                    className="rounded-2xl h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-md shadow-purple-500/20 font-semibold transition-all gap-2 text-xs"
                  >
                    <UserCheck className="h-4 w-4" />
                    {showMapTutor ? 'Close Assignment Panel' : 'Map New Tutor'}
                  </Button>
                </BatchSectionHeader>
                <div className="mt-4">
                  <BatchStaffAssignmentTable
                    assignments={staffAssignments}
                    isLoading={staffLoading}
                    onUnassign={handleUnassignStaff}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'timeline' && (
          <Card className="border border-purple-100/80 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden">
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
