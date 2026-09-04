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

  if (typeof window !== 'undefined' && id === 'new') {
    router.replace('/dashboard/students/new');
  }

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
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Profile Header */}
        <StudentProfileHeader student={student} onEdit={handleEdit} />

        {/* Main responsive grid: Top stack on mobile, 3-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Consolidated Profile Card (Takes 1 column on desktop) */}
          <div className="lg:col-span-1 space-y-5">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-2xs">
              <CardContent className="p-5 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Contact Info
                  </h3>
                  <div className="space-y-4">
                    {contactDetails.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {item.label}
                          </p>
                          <p className="text-sm font-extrabold text-[#0B2447] mt-0.5 break-words">
                            {item.value || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                    Parent / Guardian
                  </h3>
                  <div className="space-y-4">
                    {parentDetails.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                          {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {item.label}
                          </p>
                          <p className="text-sm font-extrabold text-[#0B2447] mt-0.5 break-words">
                            {item.value || 'Not provided'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Academic Details & Enrolled Courses (Takes 2 columns on desktop) */}
          <div className="lg:col-span-2 space-y-5">
            <StudentInfoCard
              title="Academic Record"
              description="Enrolled courses and admission details"
              items={academicDetails}
              columns={2}
            />

            {/* Courses and batches track section card */}
            <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-[#0B2447]">
                    Enrolled Courses & Batches
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Manage active programs, batches, and delivery modes
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-9 px-3.5 rounded-xl text-xs bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs"
                  onClick={() => setShowEnrollModal(true)}
                >
                  Enroll New Course
                </Button>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {studentAllEnrollments.length > 0 ? (
                  studentAllEnrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="font-extrabold text-sm text-[#0B2447] block">
                          {enrollment.courseName}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                          <span>
                            Batch:{' '}
                            <span className="font-bold text-slate-800">
                              {enrollment.batchName || '—'}
                            </span>
                          </span>
                          <span>
                            Branch:{' '}
                            <span className="font-bold text-slate-800">
                              {enrollment.branchName}
                            </span>
                          </span>
                          <span>
                            Date:{' '}
                            <span className="font-bold text-slate-800">
                              {formatAdmissionDate(enrollment.admissionDate)}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <AdmissionStatusBadge status={enrollment.admissionStatus} />

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
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
                  <div className="p-5 text-center text-xs text-slate-500 font-medium bg-white">
                    No active enrollments found for this student.
                  </div>
                )}
              </div>
            </Card>
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

import { ProtectedRoute } from '@/components/auth/protected-route';

export default function StudentDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
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
    </ProtectedRoute>
  );
}
