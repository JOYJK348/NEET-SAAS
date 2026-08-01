'use client';

import { useCallback, useState, useMemo, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { LoadingSpinner } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Pencil,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  useTutor,
  useDeleteTutor,
  useSubjects,
  useBranches,
} from '@/features/tutors/hooks/use-tutors';
import { useBatches } from '@/features/students/hooks/use-students';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TabId = 'overview' | 'academic' | 'subjects' | 'batches';

function getInitials(firstName: string, lastName: string): string {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'T';
}

function TutorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { data: tutor, isLoading, error } = useTutor(id);
  const { mutateAsync: deleteTutor, isPending: isDeleting } = useDeleteTutor();

  const { data: subjects = [] } = useSubjects();
  const { data: branches = [] } = useBranches();
  const { batches = [] } = useBatches();

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; code: string }>();
    (subjects ?? []).forEach((s: any) => map.set(s.id, { name: s.name, code: s.code }));
    return map;
  }, [subjects]);

  const batchMap = useMemo(() => {
    const map = new Map<string, { name: string; code?: string }>();
    (batches ?? []).forEach((b: any) => map.set(b.id, { name: b.name, code: b.code }));
    return map;
  }, [batches]);

  const handleDelete = useCallback(async () => {
    if (
      !confirm('Are you sure you want to delete this faculty member? This action cannot be undone.')
    )
      return;
    try {
      await deleteTutor(id);
      toast.success('Faculty record deleted successfully');
      router.push('/dashboard/tutors');
    } catch {
      toast.error('Failed to delete faculty record');
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-3">
          <Users className="h-7 w-7 text-rose-500" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Faculty Record Not Found</h3>
        <p className="text-xs text-slate-500 max-w-xs mb-4">
          The tutor profile you are looking for does not exist or may have been removed.
        </p>
        <Button
          variant="outline"
          className="rounded-xl h-10 text-xs font-bold border-[#E5E7EB]"
          onClick={() => router.push('/dashboard/tutors')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Faculty Directory
        </Button>
      </div>
    );
  }

  const fullName = `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim();
  const isActive = tutor.status === 'ACTIVE';

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview & Contact' },
    { id: 'academic', label: 'Academic & Qualifications' },
    { id: 'subjects', label: 'Assigned Subjects', count: tutor.subjects?.length || 0 },
    {
      id: 'batches',
      label: 'Active Batches',
      count: tutor.batchAssignments?.length || tutor.batchCount || 0,
    },
  ];

  const statCards = [
    {
      label: 'Subjects Handled',
      value: tutor.subjects?.length || 0,
      icon: BookOpen,
      bg: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      label: 'Branches Assigned',
      value: tutor.branches?.length || 0,
      icon: MapPin,
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      label: 'Active Batches',
      value: tutor.batchAssignments?.length || tutor.batchCount || 0,
      icon: GraduationCap,
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      label: 'Teaching Experience',
      value: tutor.yearsOfExperience ? `${tutor.yearsOfExperience} Yrs` : 'N/A',
      icon: Calendar,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* Top Back Action Bar */}
      <div className="flex flex-row items-center justify-between gap-2 w-full">
        <button
          onClick={() => router.push('/dashboard/tutors')}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
          <span className="hidden sm:inline">Back to Faculty Directory</span>
          <span className="sm:hidden">Back</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push(`/dashboard/tutors/${tutor.id}/edit`)}
            className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-xs shrink-0 px-3 sm:px-4 py-2"
          >
            <Pencil className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="hidden sm:inline">Edit Faculty Details</span>
            <span className="sm:hidden">Edit</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl text-xs shrink-0 px-3 sm:px-4 py-2"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Signature Violet Gradient Header Banner */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Avatar */}
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-white/30 shadow-md shrink-0">
              <AvatarFallback className="text-xl sm:text-2xl font-black bg-white/20 text-white rounded-2xl backdrop-blur-md">
                {getInitials(tutor.firstName, tutor.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {tutor.employeeCode && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold text-white border border-white/20">
                    {tutor.employeeCode}
                  </span>
                )}
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border',
                    isActive
                      ? 'bg-emerald-400/20 text-emerald-100 border-emerald-300/30'
                      : 'bg-rose-400/20 text-rose-100 border-rose-300/30',
                  )}
                >
                  {isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active Faculty Member
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 text-rose-200" />
                      Inactive
                    </>
                  )}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-black text-white leading-tight truncate">
                {fullName}
              </h1>

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-violet-100">
                {tutor.designation && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-semibold">
                    <Award className="w-3 h-3 text-violet-200 shrink-0" />
                    {tutor.designation}
                  </span>
                )}
                {tutor.qualification && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] font-semibold">
                    <GraduationCap className="w-3 h-3 text-violet-200 shrink-0" />
                    {tutor.qualification}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mild KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => {
          const IconComp = stat.icon;
          return (
            <Card
              key={stat.label}
              className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-2.5"
            >
              <div className={`p-2.5 rounded-xl border shrink-0 ${stat.bg}`}>
                <IconComp className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  {stat.label}
                </p>
                <p className="text-lg font-black text-slate-900 leading-none mt-0.5">
                  {stat.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Single Page Details Grid */}
      <div className="space-y-6">
        {/* Section 1: Personal, Contact & Professional Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal & Contact Details Card */}
          <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="w-4 h-4 text-violet-600" /> Contact & Personal Details
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Email Address</span>
                <span className="font-semibold text-slate-900">{tutor.email}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Phone Number</span>
                <span className="font-semibold text-slate-900">
                  {tutor.phone ||
                    (tutor as any).workPhone ||
                    (tutor as any).phoneNumber ||
                    'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Employee Code</span>
                <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                  {tutor.employeeCode || 'Not assigned'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Platform Login Status</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {tutor.createdLogin ? 'Access Granted' : 'No Login'}
                </span>
              </div>
            </div>
          </Card>

          {/* Professional Employment & Qualifications Card */}
          <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Briefcase className="w-4 h-4 text-violet-600" /> Employment & Qualifications
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Current Designation</span>
                <span className="font-semibold text-slate-900">
                  {tutor.designation || 'Faculty Member'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Highest Qualification</span>
                <span className="font-semibold text-slate-900">
                  {tutor.qualification || 'Not provided'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Years of Experience</span>
                <span className="font-semibold text-slate-900">
                  {tutor.yearsOfExperience ? `${tutor.yearsOfExperience} Year(s)` : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500">Previous Institution</span>
                <span className="font-semibold text-slate-900">
                  {tutor.previousInstitution || 'Not provided'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Section 2: Biography (If present) */}
        {tutor.bio && (
          <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="w-4 h-4 text-violet-600" /> Faculty Biography & Overview
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {tutor.bio}
            </p>
          </Card>
        )}

        {/* Section 3: Assigned Subjects Card */}
        <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <BookOpen className="w-4 h-4 text-violet-600" /> Assigned Subjects (
            {tutor.subjects?.length || 0})
          </h3>

          {tutor.subjects && tutor.subjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tutor.subjects.map((s: any) => {
                const subObj = subjectMap.get(s.subjectId);
                const name = s.subject?.name || subObj?.name || 'Assigned Subject';
                const code = s.subject?.code || subObj?.code || 'SUBJECT';

                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-sky-100 bg-sky-50/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                      <p className="text-xs text-sky-700 font-mono font-semibold">{code}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <BookOpen className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Subjects Assigned</p>
              <p className="text-[11px] text-slate-400">
                You can assign subjects to this faculty member from the edit profile page.
              </p>
            </div>
          )}
        </Card>

        {/* Section 4: Active Batch Schedules Card */}
        <Card className="rounded-3xl border-[#E5E7EB] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="w-4 h-4 text-violet-600" /> Active Batch Schedules (
            {tutor.batchAssignments?.length || 0})
          </h3>

          {tutor.batchAssignments && tutor.batchAssignments.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tutor.batchAssignments.map((ba: any) => {
                const batchObj = batchMap.get(ba.batchId);
                const batchName = ba.batch?.name || batchObj?.name || 'Assigned Batch';
                const subObj = subjectMap.get(ba.subjectId);
                const subjectName = ba.subject?.name || subObj?.name || 'General Faculty';

                return (
                  <div
                    key={ba.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-amber-100 bg-amber-50/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{batchName}</p>
                        <p className="text-xs text-slate-500">
                          Subject:{' '}
                          <span className="font-semibold text-slate-700">{subjectName}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-extrabold border',
                        ba.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200',
                      )}
                    >
                      {ba.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <Users className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">No Active Batches Assigned</p>
              <p className="text-[11px] text-slate-400">
                This faculty member has not been assigned to any active batch schedules yet.
              </p>
            </div>
          )}
        </Card>
      </div>
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
