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

function StudentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || null;

  const { student, isLoading, error, refetch } = useStudent(id);
  const { events: timelineEvents, isLoading: timelineLoading } = useStudentTimeline(id);
  const { archiveStudent, isArchiving } = useArchiveStudent();

  const [activeTab, setActiveTab] = useState<'academics' | 'medical' | 'timeline'>('academics');
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const handleEdit = useCallback(() => {
    if (id) router.push(`/dashboard/students/${id}/edit`);
  }, [id, router]);

  const handleArchive = useCallback(async () => {
    if (!id) return;
    const success = await archiveStudent(id);
    if (success) {
      toast({ title: 'Student archived successfully' });
      setShowArchiveDialog(false);
      refetch();
    } else {
      toast({ title: 'Failed to archive student', variant: 'destructive' });
    }
  }, [id, archiveStudent, refetch]);

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

  const academicDetails = [
    { label: 'Course', value: student.courseName, icon: <BookOpen className="h-3.5 w-3.5" /> },
    { label: 'Batch', value: student.batchName, icon: <Users className="h-3.5 w-3.5" /> },
    {
      label: 'Admission Date',
      value: formatDate(student.admissionDate),
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
        <StudentProfileHeader
          student={student}
          onEdit={handleEdit}
          onArchive={() => setShowArchiveDialog(true)}
        />

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
                    <div className="p-3 rounded-xl bg-slate-50 border border-[#E5E7EB]">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Attendance Rate
                      </span>
                      <p className="text-xl font-extrabold text-green-600 mt-1">98.4%</p>
                    </div>
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
