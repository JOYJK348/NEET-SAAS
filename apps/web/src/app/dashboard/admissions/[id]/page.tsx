'use client';

import { useCallback, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  BookOpen,
  MapPin,
  CalendarDays,
  Hash,
  ArrowRightLeft,
  Users,
} from 'lucide-react';
import {
  useAdmission,
  useAdmissionTimeline,
  useUpdateAdmissionStatus,
} from '@/features/admissions/hooks/use-admissions';
import { AdmissionSummaryCard } from '@/features/admissions/components/AdmissionSummaryCard';
import { AdmissionInfoCard } from '@/features/admissions/components/AdmissionInfoCard';
import { AdmissionTimeline } from '@/features/admissions/components/AdmissionTimeline';
import { AdmissionSectionHeader } from '@/features/admissions/components/AdmissionSectionHeader';
import { AdmissionSkeleton } from '@/features/admissions/components/AdmissionSkeleton';
import { AdmissionEmptyState } from '@/features/admissions/components/AdmissionEmptyState';
import { StatusUpdateDialog } from '@/features/admissions/components/StatusUpdateDialog';
import { AdmissionStatusBadge } from '@/features/admissions/components/AdmissionStatusBadge';
import { formatDate } from '@/features/admissions/utils/admission-utils';
import { toast } from '@/hooks/use-toast';
import type { AdmissionStatus } from '@/features/admissions/types/admission';

function AdmissionDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { admission, isLoading, error } = useAdmission(id);
  const { events: timelineEvents, isLoading: timelineLoading } = useAdmissionTimeline(id);
  const { updateStatus, isUpdating } = useUpdateAdmissionStatus();

  const [activeTab, setActiveTab] = useState<'academic' | 'timeline'>('academic');
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const handleStatusConfirm = useCallback(
    async (newStatus: AdmissionStatus, notes?: string) => {
      if (!admission) return;
      const result = await updateStatus({ id: admission.id, status: newStatus, notes });
      if (result) {
        toast({
          title: 'Status Updated',
          description: `Admission status changed to ${newStatus}.`,
        });
        setShowStatusDialog(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update admission status.',
          variant: 'destructive',
        });
      }
    },
    [admission, updateStatus],
  );

  if (isLoading) {
    return (
      <div className="p-4">
        <AdmissionSkeleton variant="detail" />
      </div>
    );
  }

  if (error || !admission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AdmissionEmptyState hasFilters={false} variant="default" />
        <Button
          variant="outline"
          className="rounded-xl h-11 mt-4"
          onClick={() => router.push('/dashboard/admissions')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admissions
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'academic' as const, label: 'Academic Info' },
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
            onClick={() => router.push('/dashboard/admissions')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{admission.admissionNumber}</h1>
              <AdmissionStatusBadge status={admission.admissionStatus} />
            </div>
            <p className="text-sm text-gray-500">
              Student: {admission.student.firstName} {admission.student.lastName}
            </p>
          </div>
        </div>
        <Button
          className="rounded-xl h-11 px-5 bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setShowStatusDialog(true)}
        >
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          Update Status
        </Button>
      </div>

      {/* Summary Card */}
      <AdmissionSummaryCard admission={admission} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <AdmissionInfoCard
            title="Student Information"
            items={[
              {
                label: 'Name',
                value: `${admission.student.firstName} ${admission.student.lastName}`,
                icon: User,
              },
              { label: 'Email', value: admission.student.email, icon: Mail },
              { label: 'Phone', value: admission.student.phone, icon: Phone },
              ...(admission.student.dateOfBirth
                ? [
                    {
                      label: 'Date of Birth',
                      value: formatDate(admission.student.dateOfBirth),
                      icon: CalendarDays,
                    },
                  ]
                : []),
              ...(admission.student.gender
                ? [{ label: 'Gender', value: admission.student.gender, icon: User }]
                : []),
              ...(admission.student.address
                ? [
                    {
                      label: 'Address',
                      value: [
                        admission.student.address,
                        admission.student.city,
                        admission.student.state,
                      ]
                        .filter(Boolean)
                        .join(', '),
                      icon: MapPin,
                    },
                  ]
                : []),
            ]}
            columns={2}
          />

          {/* Tab Switcher */}
          <div className="space-y-4">
            <div className="flex gap-1 border-b border-gray-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'academic' ? (
              <AdmissionInfoCard
                title="Academic Record"
                items={[
                  { label: 'Course', value: admission.course.name, icon: BookOpen },
                  { label: 'Branch', value: admission.branch.name, icon: MapPin },
                  { label: 'Academic Year', value: admission.academicYearId, icon: CalendarDays },
                  {
                    label: 'Admission Date',
                    value: formatDate(admission.admissionDate),
                    icon: CalendarDays,
                  },
                  { label: 'Batch', value: admission.batch?.name || 'Not assigned', icon: Hash },
                ]}
                columns={2}
              />
            ) : (
              <AdmissionTimeline events={timelineEvents} isLoading={timelineLoading} />
            )}
          </div>
        </div>

        {/* Right Column - Parent & Quick Actions */}
        <div className="space-y-6">
          {/* Parent Information */}
          <AdmissionInfoCard
            title="Parent / Guardian"
            items={
              admission.parent
                ? [
                    { label: 'Name', value: admission.parent.name, icon: Users },
                    { label: 'Phone', value: admission.parent.phone, icon: Phone },
                    ...(admission.parent.email
                      ? [{ label: 'Email', value: admission.parent.email, icon: Mail }]
                      : []),
                  ]
                : [{ label: 'Info', value: 'No parent information available' }]
            }
            columns={1}
          />

          {/* Quick Actions */}
          <Card className="border border-gray-200">
            <CardContent className="p-4 lg:p-5">
              <AdmissionSectionHeader title="Quick Actions" />
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl h-12"
                  onClick={() => setShowStatusDialog(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2 text-purple-600" />
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl h-12"
                  onClick={() => router.push(`/dashboard/students/${admission.studentProfileId}`)}
                >
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  View Student Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
        currentStatus={admission.admissionStatus}
        admissionNumber={admission.admissionNumber}
        onConfirm={handleStatusConfirm}
        isUpdating={isUpdating}
      />
    </div>
  );
}

export default function AdmissionDetailPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <AdmissionDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}
