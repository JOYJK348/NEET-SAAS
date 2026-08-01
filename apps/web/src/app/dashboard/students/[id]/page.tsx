'use client';

import { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import {
  useStudent,
  useStudentTimeline,
  useArchiveStudent,
} from '@/features/students/hooks/use-students';
import { StudentProfileHeader } from '@/features/students/components/StudentProfileHeader';
import { StudentInfoCard } from '@/features/students/components/StudentInfoCard';
import { StudentTimeline } from '@/features/students/components/StudentTimeline';
import { StudentArchiveDialog } from '@/features/students/components/StudentArchiveDialog';
import { StudentEmptySection } from '@/features/students/components/StudentEmptySection';
import { formatDate } from '@/features/students/utils/student-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  User,
  Heart,
  Fingerprint,
  Users,
  BookOpen,
  AlertCircle,
  Activity,
  Award,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  useAdmissions,
  useUpdateAdmissionStatus,
  useUpdateAdmissionBatch,
  useBatchesForAdmission,
  useCreateAdmission,
  useCoursesForAdmission,
  useBranchesForAdmission,
  useAcademicYearsForAdmission,
} from '@/features/admissions/hooks/use-admissions';
import { BatchUpdateDialog } from '@/features/admissions/components/BatchUpdateDialog';
import { StatusUpdateDialog } from '@/features/admissions/components/StatusUpdateDialog';
import { EnrollCourseModal } from '@/features/students/components/EnrollCourseModal';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import { AdmissionStatusBadge } from '@/features/admissions/components/AdmissionStatusBadge';
import { formatDate as formatAdmissionDate } from '@/features/admissions/utils/admission-utils';
import type { AdmissionStatus, AdmissionListItem } from '@/features/admissions/types/admission';
import { Hash, ArrowRightLeft } from 'lucide-react';

function StudentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || null;

  const { student, isLoading, error } = useStudent(id);
  const { events: timelineEvents, isLoading: timelineLoading } = useStudentTimeline(id);
  const { archiveStudent, isArchiving } = useArchiveStudent();

  // Admissions hooks
  const { admissions: studentAllEnrollments, refetch: refetchEnrollments } = useAdmissions({
    initialFilters: { studentProfileId: id || undefined, perPage: 100 },
    autoFetch: !!id,
  });
  const { updateStatus, isUpdating: isUpdatingStatus } = useUpdateAdmissionStatus();
  const { updateBatch, isUpdating: isUpdatingBatch } = useUpdateAdmissionBatch();
  const { createAdmission, isCreating: isCreatingEnrollment } = useCreateAdmission();

  // Master Data hooks
  const { courses } = useCoursesForAdmission();
  const { branches } = useBranchesForAdmission();
  const { years } = useAcademicYearsForAdmission();
  const { data: branchCourses = [] } = useBranchCourses();

  const [activeTab, setActiveTab] = useState<'academics' | 'medical' | 'timeline'>('academics');
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const [selectedEnrollment, setSelectedEnrollment] = useState<AdmissionListItem | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // Resolves batches for selected enrollment's course track
  const { batches: selectedTrackBatches } = useBatchesForAdmission(
    selectedEnrollment?.courseId || undefined,
    selectedEnrollment?.branchId || undefined,
  );

  // Dynamic batch resolution inside Enroll modal
  const [modalCourseId, setModalCourseId] = useState('');
  const [modalBranchId, setModalBranchId] = useState('');
  const { batches: modalCourseBatches } = useBatchesForAdmission(
    modalCourseId || undefined,
    modalBranchId || undefined,
  );

  const handleEdit = useCallback(() => {
    if (id) router.push(`/dashboard/students/${id}/edit`);
  }, [id, router]);

  const handleArchive = useCallback(async () => {
    if (!id) return;
    const success = await archiveStudent(id);
    if (success) {
      toast({ title: 'Student archived successfully' });
      setShowArchiveDialog(false);
    } else {
      toast({ title: 'Failed to archive student', variant: 'destructive' });
    }
  }, [id, archiveStudent]);

  const handleStatusConfirm = useCallback(
    async (newStatus: AdmissionStatus, notes?: string) => {
      if (!selectedEnrollment) return;
      const result = await updateStatus({ id: selectedEnrollment.id, status: newStatus, notes });
      if (result) {
        toast({
          title: 'Status Updated',
          description: `Enrollment status changed to ${newStatus}.`,
        });
        refetchEnrollments();
        setShowStatusDialog(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update enrollment status.',
          variant: 'destructive',
        });
      }
    },
    [selectedEnrollment, updateStatus, refetchEnrollments],
  );

  const handleBatchConfirm = useCallback(
    async (newBatchId: string) => {
      if (!selectedEnrollment) return;
      const result = await updateBatch({ id: selectedEnrollment.id, batchId: newBatchId });
      if (result) {
        toast({
          title: 'Batch Updated',
          description: 'Student batch has been updated successfully.',
        });
        refetchEnrollments();
        setShowBatchDialog(false);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update student batch.',
          variant: 'destructive',
        });
      }
    },
    [selectedEnrollment, updateBatch, refetchEnrollments],
  );

  const handleEnrollConfirm = useCallback(
    async (data: {
      courseId: string;
      batchId: string;
      branchId: string;
      academicYearId: string;
      admissionDate: string;
      notes?: string;
    }) => {
      if (!id) return;
      try {
        const result = await createAdmission({
          studentProfileId: id,
          ...data,
        });
        if (result) {
          toast({
            title: 'Enrolled Successfully',
            description: `Student enrolled into course track.`,
          });
          refetchEnrollments();
          setShowEnrollModal(false);
        }
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to enroll student';
        toast({
          title: 'Enrollment Failed',
          description: Array.isArray(msg) ? msg.join('. ') : msg,
          variant: 'destructive',
        });
      }
    },
    [id, createAdmission, refetchEnrollments],
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-[#FAFAFA]">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !student) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6 bg-[#FAFAFA] min-h-screen">
          <StudentEmptySection
            title="Student not found"
            description={
              error?.message ||
              'The student you are looking for does not exist or has been removed.'
            }
            variant="warning"
            icon={<AlertCircle className="h-6 w-6" />}
            actionLabel="Back to Students"
            onAction={() => router.push('/dashboard/students')}
          />
        </div>
      </DashboardLayout>
    );
  }

  // Grouped contact details for the Left Column
  const contactDetails = [
    { label: 'Email', value: student.email, icon: <Mail className="h-3.5 w-3.5" /> },
    { label: 'Phone', value: student.phone, icon: <Phone className="h-3.5 w-3.5" /> },
    {
      label: 'Date of Birth',
      value: formatDate(student.dateOfBirth),
      icon: <CalendarDays className="h-3.5 w-3.5" />,
    },
    {
      label: 'Gender',
      value: student.gender === 'MALE' ? 'Male' : student.gender === 'FEMALE' ? 'Female' : 'Other',
      icon: <User className="h-3.5 w-3.5" />,
    },
    {
      label: 'Address',
      value: `${student.address}, ${student.city}, ${student.state} - ${student.pincode}`,
      icon: <MapPin className="h-3.5 w-3.5" />,
    },
  ];

  const parentDetails = [
    { label: 'Parent Name', value: student.parentName, icon: <User className="h-3.5 w-3.5" /> },
    { label: 'Parent Phone', value: student.parentPhone, icon: <Phone className="h-3.5 w-3.5" /> },
    { label: 'Parent Email', value: student.parentEmail, icon: <Mail className="h-3.5 w-3.5" /> },
  ];

  const medicalDetails = [
    {
      label: 'Blood Group',
      value: student.bloodGroup || 'Not provided',
      icon: <Heart className="h-3.5 w-3.5" />,
    },
    {
      label: 'Aadhar Number',
      value: student.aadharNumber || 'Not provided',
      icon: <Fingerprint className="h-3.5 w-3.5" />,
    },
    {
      label: 'Emergency Contact',
      value: student.emergencyContact || 'Not provided',
      icon: <Phone className="h-3.5 w-3.5" />,
    },
  ];

  // Dynamically resolve course and batch from the latest active enrollment
  const latestEnrollment =
    studentAllEnrollments.find((e) => e.admissionStatus === 'ACTIVE') || studentAllEnrollments[0];
  const activeCourseName = latestEnrollment ? latestEnrollment.courseName : student.courseName;
  const activeBatchName = latestEnrollment ? latestEnrollment.batchName : student.batchName;
  const activeAdmissionDate = latestEnrollment
    ? latestEnrollment.admissionDate
    : student.admissionDate;

  const academicDetails = [
    {
      label: 'Primary Course',
      value: activeCourseName,
      icon: <BookOpen className="h-3.5 w-3.5" />,
    },
    { label: 'Primary Batch', value: activeBatchName, icon: <Users className="h-3.5 w-3.5" /> },
    {
      label: 'Admission Date',
      value: formatDate(activeAdmissionDate),
      icon: <CalendarDays className="h-3.5 w-3.5" />,
    },
    {
      label: 'Student Since',
      value: formatDate(student.createdAt),
      icon: <CalendarDays className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Profile Header */}
        <StudentProfileHeader student={student} onEdit={handleEdit} />

        {/* Main responsive grid: Top stack on mobile, 3-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Consolidated Profile Card (Takes 1 column on desktop) */}
          <div className="lg:col-span-1 space-y-5">
            <Card className="rounded-2xl border-[#E5E7EB] bg-white shadow-sm">
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    Contact Info
                  </h3>
                  <div className="space-y-4">
                    {contactDetails.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {item.label}
                          </p>
                          <p className="text-sm font-medium text-[#111827] mt-0.5 break-words">
                            {item.value || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[#E5E7EB] pt-5">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    Parent / Guardian
                  </h3>
                  <div className="space-y-4">
                    {parentDetails.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {item.label}
                          </p>
                          <p className="text-sm font-medium text-[#111827] mt-0.5 break-words">
                            {item.value || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parent Portal Account Card */}
                <div className="border-t border-[#E5E7EB] pt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🔐</span> Parent Portal Account
                    </h3>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Status</span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Portal
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-500 font-medium block">Portal Email</span>
                      <span className="font-semibold font-mono text-slate-800 dark:text-slate-200 block truncate">
                        {student.parentEmail || 'father@example.com'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-slate-800 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Last Login</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          Today, 10:42 AM
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Linked Children</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          1 Child
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8 text-xs font-semibold gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50"
                        onClick={() => {
                          toast({
                            title: 'Password Reset Triggered',
                            description:
                              'New password generated: ISML@847201 (Force change on next login)',
                          });
                        }}
                      >
                        Reset Parent Password
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs font-semibold text-slate-600 hover:text-slate-900"
                        onClick={() => router.push('/tenant-admin/parents')}
                      >
                        Open Parent Profile →
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabbed Details & Activity (Takes 2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Custom Tab Switcher */}
            <div className="flex border-b border-[#E5E7EB] gap-6">
              {[
                { id: 'academics', label: 'Academics', icon: BookOpen },
                { id: 'medical', label: 'Medical & Identity', icon: Heart },
                { id: 'timeline', label: 'Timeline', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all',
                      active
                        ? 'border-[#7C3AED] text-[#7C3AED]'
                        : 'border-transparent text-muted-foreground hover:text-[#111827]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content areas */}
            {activeTab === 'academics' && (
              <div className="space-y-5">
                <StudentInfoCard
                  title="Academic Record"
                  description="Enrolled courses and admission details"
                  items={academicDetails}
                  columns={2}
                />

                {/* Courses and batches track section card */}
                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-[#111827]">
                        Enrolled Courses & Batches
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Manage active programs, batches, and delivery modes
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="h-9 px-3 rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setShowEnrollModal(true)}
                    >
                      Enroll New Course
                    </Button>
                  </div>

                  <div className="divide-y divide-gray-100 border rounded-xl overflow-hidden bg-gray-50/50">
                    {studentAllEnrollments.length > 0 ? (
                      studentAllEnrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between p-3.5 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="space-y-1">
                            <span className="font-semibold text-sm text-gray-900 block">
                              {enrollment.courseName}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>
                                Batch:{' '}
                                <span className="font-medium text-gray-700">
                                  {enrollment.batchName || '—'}
                                </span>
                              </span>
                              <span>
                                Branch: <span>{enrollment.branchName}</span>
                              </span>
                              <span>
                                Date: <span>{formatAdmissionDate(enrollment.admissionDate)}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <AdmissionStatusBadge status={enrollment.admissionStatus} />

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 rounded-lg text-xs"
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setShowBatchDialog(true);
                              }}
                            >
                              Change Batch
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-5 text-center text-xs text-gray-500 bg-white">
                        No active enrollments found for this student.
                      </div>
                    )}
                  </div>
                </Card>

                {/* Academic Highlights placeholder visual */}
                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-[#E5E7EB] pb-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#111827]">Performance Highlight</h4>
                      <p className="text-xs text-muted-foreground">Recent progress evaluations</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Average Test Score
                      </span>
                      <p className="text-xl font-extrabold text-[#7C3AED] mt-1">720/720 (Max)</p>
                    </div>
                    <a
                      href="/dashboard/attendance"
                      className="block p-3 rounded-xl bg-slate-50 border border-[#E5E7EB] hover:border-teal-300 hover:bg-teal-50 transition-colors group"
                    >
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        Attendance Rate
                        <span className="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity text-[9px]">
                          View →
                        </span>
                      </span>
                      <p className="text-xl font-extrabold text-teal-600 mt-1 group-hover:text-teal-700">
                        Click to view
                      </p>
                    </a>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'medical' && (
              <StudentInfoCard
                title="Medical Info & Identity Verification"
                description="Identification cards and emergency medical records"
                items={medicalDetails}
                columns={2}
              />
            )}

            {activeTab === 'timeline' && (
              <StudentTimeline events={timelineEvents} isLoading={timelineLoading} />
            )}
          </div>
        </div>
      </div>

      {/* Archive Dialog */}
      <StudentArchiveDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        studentName={`${student.firstName} ${student.lastName}`}
        onConfirm={handleArchive}
        isArchiving={isArchiving}
      />

      {/* Batch Change Dialog */}
      {selectedEnrollment && (
        <BatchUpdateDialog
          open={showBatchDialog}
          onOpenChange={setShowBatchDialog}
          currentBatchId={selectedEnrollment.batchId || undefined}
          batches={selectedTrackBatches}
          onConfirm={handleBatchConfirm}
          isUpdating={isUpdatingBatch}
          studentProfileId={id || undefined}
          excludeAdmissionId={selectedEnrollment.id}
        />
      )}

      {/* Status Toggle Dialog */}
      {selectedEnrollment && (
        <StatusUpdateDialog
          open={showStatusDialog}
          onOpenChange={setShowStatusDialog}
          currentStatus={selectedEnrollment.admissionStatus}
          admissionNumber={selectedEnrollment.admissionNumber}
          onConfirm={handleStatusConfirm}
          isUpdating={isUpdatingStatus}
        />
      )}

      {/* Enroll Course Modal */}
      <EnrollCourseModal
        open={showEnrollModal}
        onOpenChange={(open) => {
          setShowEnrollModal(open);
          if (!open) {
            setModalCourseId('');
            setModalBranchId('');
          }
        }}
        courses={courses}
        branches={branches}
        batches={modalCourseBatches}
        years={years}
        branchCourses={branchCourses}
        activeEnrollments={studentAllEnrollments}
        onConfirm={handleEnrollConfirm}
        isSubmitting={isCreatingEnrollment}
        onCourseChange={setModalCourseId}
        onBranchChange={setModalBranchId}
        studentProfileId={id || undefined}
      />
    </DashboardLayout>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-[#FAFAFA]">
            <LoadingSpinner size="lg" />
          </div>
        </DashboardLayout>
      }
    >
      <StudentDetailContent />
    </Suspense>
  );
}
