'use client';

import { useCallback, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  MapPin,
  GraduationCap,
  Briefcase,
  Calendar,
  Award,
  FileText,
  Pencil,
  Building2,
  Users,
} from 'lucide-react';
import { useTutor, useDeleteTutor } from '@/features/tutors/hooks/use-tutors';
import { TutorInfoCard } from '@/features/tutors/components/TutorInfoCard';
import { TutorSectionHeader } from '@/features/tutors/components/TutorSectionHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-500' },
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  SUSPENDED: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
};

type TabId = 'overview' | 'academic' | 'subjects' | 'batches';

function TutorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['overview']));

  const { data: tutor, isLoading, error } = useTutor(id);
  const { mutateAsync: deleteTutor, isPending: isDeleting } = useDeleteTutor();

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set(prev).add(tab));
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this tutor? This action cannot be undone.'))
      return;
    try {
      await deleteTutor(id);
      toast.success('Tutor deleted successfully');
      router.push('/dashboard/tutors');
    } catch {
      toast.error('Failed to delete tutor');
    }
  }, [id, deleteTutor, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Users className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-700 mb-1">Tutor not found</h3>
        <p className="text-xs text-gray-400 mb-4">
          The tutor you're looking for doesn't exist or has been removed.
        </p>
        <Button
          variant="outline"
          className="rounded-xl h-11"
          onClick={() => router.push('/dashboard/tutors')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tutors
        </Button>
      </div>
    );
  }

  const cfg = statusConfig[tutor.status] ?? {
    label: tutor.status,
    color: 'bg-gray-100 text-gray-500',
  };
  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'academic', label: 'Academic Profile' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'batches', label: 'Batches' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl"
            onClick={() => router.push('/dashboard/tutors')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {tutor.firstName} {tutor.lastName}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold',
                  cfg.color,
                )}
              >
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {tutor.employeeCode && <>Code: {tutor.employeeCode} &middot; </>}
              {tutor.designation || 'Tutor'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl h-11 px-5"
            onClick={() => router.push(`/dashboard/tutors/${tutor.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="rounded-xl h-11 px-5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TutorInfoCard
            title="Personal Information"
            items={[
              { label: 'Email', value: tutor.email, icon: <Mail className="h-4 w-4" /> },
              {
                label: 'Phone',
                value: tutor.phone || 'Not provided',
                icon: <Phone className="h-4 w-4" />,
              },
              {
                label: 'Employee Code',
                value: tutor.employeeCode || 'Not assigned',
                icon: <Briefcase className="h-4 w-4" />,
              },
              {
                label: 'Login Created',
                value: tutor.createdLogin ? 'Yes' : 'No',
                icon: <Users className="h-4 w-4" />,
              },
            ]}
            columns={1}
          />
          <TutorInfoCard
            title="Professional Details"
            items={[
              {
                label: 'Designation',
                value: tutor.designation || 'Not set',
                icon: <Award className="h-4 w-4" />,
              },
              {
                label: 'Years of Experience',
                value: `${tutor.yearsOfExperience} year(s)`,
                icon: <Calendar className="h-4 w-4" />,
              },
              {
                label: 'Previous Institution',
                value: tutor.previousInstitution || 'Not provided',
                icon: <Building2 className="h-4 w-4" />,
              },
              {
                label: 'Qualification',
                value: tutor.qualification || 'Not provided',
                icon: <GraduationCap className="h-4 w-4" />,
              },
            ]}
            columns={1}
          />
          <TutorInfoCard
            title="Subjects"
            items={[
              {
                label: 'Assigned Subjects',
                value: `${tutor.subjects?.length || 0} subject(s)`,
                icon: <BookOpen className="h-4 w-4" />,
              },
            ]}
            columns={1}
          />
          <TutorInfoCard
            title="Branches"
            items={[
              {
                label: 'Assigned Branches',
                value: `${tutor.branches?.length || 0} branch(es)`,
                icon: <MapPin className="h-4 w-4" />,
              },
              {
                label: 'Active Batches',
                value: `${tutor.batchCount || 0} batch(es)`,
                icon: <Users className="h-4 w-4" />,
              },
            ]}
            columns={1}
          />
          {tutor.bio && (
            <div className="lg:col-span-2">
              <TutorInfoCard
                title="Bio"
                items={[{ label: 'About', value: tutor.bio }]}
                columns={1}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'academic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TutorInfoCard
            title="Qualifications"
            items={[
              {
                label: 'Highest Qualification',
                value: tutor.qualification || 'Not provided',
                icon: <GraduationCap className="h-4 w-4" />,
              },
              {
                label: 'Specialization',
                value: tutor.specialization || 'Not specified',
                icon: <BookOpen className="h-4 w-4" />,
              },
              {
                label: 'Years of Experience',
                value: `${tutor.yearsOfExperience} year(s)`,
                icon: <Calendar className="h-4 w-4" />,
              },
              {
                label: 'Previous Institution',
                value: tutor.previousInstitution || 'Not provided',
                icon: <Building2 className="h-4 w-4" />,
              },
            ]}
            columns={1}
          />
          <TutorInfoCard
            title="Professional Info"
            items={[
              {
                label: 'Designation',
                value: tutor.designation || 'Not set',
                icon: <Award className="h-4 w-4" />,
              },
              {
                label: 'Employee Code',
                value: tutor.employeeCode || 'Not assigned',
                icon: <Briefcase className="h-4 w-4" />,
              },
            ]}
            columns={1}
          />
          {tutor.bio && (
            <div className="lg:col-span-2">
              <TutorInfoCard
                title="Bio"
                items={[{ label: 'About', value: tutor.bio }]}
                columns={1}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'subjects' && (
        <Card className="border border-gray-200">
          <CardContent className="p-4 lg:p-5">
            <TutorSectionHeader
              title="Assigned Subjects"
              description={`${tutor.subjects?.length || 0} subject(s) assigned`}
            />
            {tutor.subjects?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tutor.subjects.map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {s.subject?.name || s.subjectId?.substring(0, 8) || 'Unknown'}
                      </p>
                      <p className="text-[10px] text-gray-400">{s.subject?.code || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <BookOpen className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No subjects assigned</p>
                <p className="text-xs text-gray-400 mt-1">
                  Assign subjects to this tutor from the edit page
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'batches' && (
        <Card className="border border-gray-200">
          <CardContent className="p-4 lg:p-5">
            <TutorSectionHeader
              title="Batch Assignments"
              description={`${tutor.batchAssignments?.length || 0} batch(es)`}
            />
            {tutor.batchAssignments?.length > 0 ? (
              <div className="space-y-3">
                {tutor.batchAssignments.map((ba: any) => (
                  <div
                    key={ba.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {ba.batch?.name || ba.batchId?.substring(0, 8) || 'Unknown Batch'}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Subject: {ba.subject?.name || ba.subjectId?.substring(0, 8) || '—'}
                          {ba.effectiveFrom && (
                            <> &middot; From {new Date(ba.effectiveFrom).toLocaleDateString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] px-2 py-0.5',
                        ba.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      {ba.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500">No batch assignments</p>
                <p className="text-xs text-gray-400 mt-1">
                  This tutor has not been assigned to any batches yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function TutorDetailPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner />
          </div>
        }
      >
        <TutorDetailContent />
      </Suspense>
    </DashboardLayout>
  );
}
