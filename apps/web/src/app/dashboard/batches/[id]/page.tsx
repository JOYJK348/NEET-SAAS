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
  Archive,
  Pencil,
  Monitor,
} from 'lucide-react';
import {
  useBatch,
  useBatchTimeline,
  useBatchStudents,
  useBatchStaffAssignments,
  useArchiveBatch,
} from '@/features/batches/hooks/use-batches';
import { BatchSummaryCard } from '@/features/batches/components/BatchSummaryCard';
import { BatchInfoCard } from '@/features/batches/components/BatchInfoCard';
import { BatchTimeline } from '@/features/batches/components/BatchTimeline';
import { BatchSectionHeader } from '@/features/batches/components/BatchSectionHeader';
import { BatchSkeleton } from '@/features/batches/components/BatchSkeleton';
import { BatchEmptyState } from '@/features/batches/components/BatchEmptyState';
import { BatchStatusBadge } from '@/features/batches/components/BatchStatusBadge';
import { BatchStudentEnrollmentTable } from '@/features/batches/components/BatchStudentEnrollmentTable';
import { BatchStaffAssignmentTable } from '@/features/batches/components/BatchStaffAssignmentTable';
import { BatchArchiveDialog } from '@/features/batches/components/BatchArchiveDialog';
import { formatBatchDate } from '@/features/batches/utils/batch-utils';
import { BATCH_ATTENDANCE_MODE_LABELS } from '@/features/batches/types/batch';
import { toast } from '@/hooks/use-toast';

function BatchDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'staff' | 'timeline'>('info');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['info']));
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const { batch, isLoading, error } = useBatch(id);
  const { events: timelineEvents, isLoading: timelineLoading } = useBatchTimeline(id);
  const { students: enrolledStudents, isLoading: studentsLoading } = useBatchStudents(id, {
    enabled: visitedTabs.has('students'),
  });
  const { assignments: staffAssignments, isLoading: staffLoading } = useBatchStaffAssignments(id, {
    enabled: visitedTabs.has('staff'),
  });
  const { archiveBatch, isArchiving } = useArchiveBatch();

  const handleTabChange = useCallback((tab: 'info' | 'students' | 'staff' | 'timeline') => {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set(prev).add(tab));
  }, []);

  const handleArchiveConfirm = useCallback(async () => {
    if (!batch) return;
    const result = await archiveBatch(batch.id);
    if (result) {
      toast({
        title: 'Batch Archived',
        description: `Batch ${batch.code} - ${batch.name} has been archived.`,
      });
      setShowArchiveDialog(false);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to archive batch.',
        variant: 'destructive',
      });
    }
  }, [batch, archiveBatch]);

  if (isLoading) {
    return (
      <div className="p-4">
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
          className="rounded-xl h-11 mt-4"
          onClick={() => router.push('/dashboard/batches')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Batches
        </Button>
      </div>
    );
  }

  const isTerminal = batch.status === 'ARCHIVED';
  const tabs = [
    { id: 'info' as const, label: 'Batch Info' },
    { id: 'students' as const, label: 'Students' },
    { id: 'staff' as const, label: 'Staff' },
    { id: 'timeline' as const, label: 'Timeline' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => router.push('/dashboard/batches')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{batch.name}</h1>
              <BatchStatusBadge status={batch.status} />
            </div>
            <p className="text-sm text-gray-500">
              Code: {batch.code} &middot; {batch.courseName} &middot; {batch.branchName}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {!isTerminal && (
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl h-11 px-5"
              onClick={() => router.push(`/dashboard/batches/${batch.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {!isTerminal && (batch.status === 'COMPLETED' || batch.status === 'CANCELLED') && (
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl h-11 px-5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowArchiveDialog(true)}
              disabled={isArchiving}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <BatchSummaryCard batch={batch} />

      {/* Main Content */}
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BatchInfoCard
              title="Course & Branch"
              items={[
                {
                  label: 'Course',
                  value: batch.courseName,
                  icon: <BookOpen className="h-4 w-4" />,
                },
                { label: 'Branch', value: batch.branchName, icon: <MapPin className="h-4 w-4" /> },
                {
                  label: 'Academic Year',
                  value: batch.academicYearName,
                  icon: <CalendarDays className="h-4 w-4" />,
                },
              ]}
              columns={1}
            />
            <BatchInfoCard
              title="Delivery & Capacity"
              items={[
                {
                  label: 'Delivery Type',
                  value: batch.deliveryType?.name ?? 'Not set',
                  icon: <Monitor className="h-4 w-4" />,
                },
                {
                  label: 'Attendance Mode',
                  value: batch.deliveryType
                    ? BATCH_ATTENDANCE_MODE_LABELS[batch.deliveryType.attendanceMode]
                    : 'Not set',
                  icon: <GraduationCap className="h-4 w-4" />,
                },
                {
                  label: 'Capacity',
                  value: `${batch.enrolledCount} / ${batch.maxStudents} students`,
                  icon: <Users className="h-4 w-4" />,
                },
                {
                  label: 'New Admissions',
                  value: batch.allowNewAdmissions ? 'Allowed' : 'Closed',
                  icon: <Clock className="h-4 w-4" />,
                },
              ]}
              columns={1}
            />
            <BatchInfoCard
              title="Schedule"
              items={[
                {
                  label: 'Start Date',
                  value: formatBatchDate(batch.startDate),
                  icon: <CalendarDays className="h-4 w-4" />,
                },
                {
                  label: 'End Date',
                  value: formatBatchDate(batch.endDate),
                  icon: <CalendarDays className="h-4 w-4" />,
                },
              ]}
              columns={2}
            />
            <BatchInfoCard
              title="Description"
              items={[{ label: 'Details', value: batch.description || 'No description provided.' }]}
              columns={1}
            />
          </div>
        )}

        {activeTab === 'students' && (
          <Card className="border border-gray-200">
            <CardContent className="p-4 lg:p-5">
              <BatchSectionHeader
                title="Enrolled Students"
                description={`${enrolledStudents.length} student(s) enrolled`}
              />
              <BatchStudentEnrollmentTable
                students={enrolledStudents}
                isLoading={studentsLoading}
              />
            </CardContent>
          </Card>
        )}

        {activeTab === 'staff' && (
          <Card className="border border-gray-200">
            <CardContent className="p-4 lg:p-5">
              <BatchSectionHeader
                title="Staff Assignments"
                description={`${staffAssignments.length} staff assigned`}
              />
              <BatchStaffAssignmentTable assignments={staffAssignments} isLoading={staffLoading} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card className="border border-gray-200">
            <CardContent className="p-4 lg:p-5">
              <BatchSectionHeader title="Activity Timeline" />
              <BatchTimeline events={timelineEvents} isLoading={timelineLoading} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Archive Dialog */}
      <BatchArchiveDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        batchName={batch.name}
        batchCode={batch.code}
        onConfirm={handleArchiveConfirm}
        isArchiving={isArchiving}
      />
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
