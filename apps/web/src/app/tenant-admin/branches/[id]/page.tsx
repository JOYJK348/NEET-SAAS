'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Sparkles,
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  Clock,
  BookOpen,
  Layers,
  Edit2,
  Save,
  Radio,
  Loader2,
  Calendar,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useBranch, useUpdateBranch } from '@/features/master-data/hooks/use-branches';
import { useBranchCourses } from '@/features/master-data/hooks/use-branch-courses';
import { useCourses } from '@/features/master-data/hooks/use-courses';
import { useAcademicYears } from '@/features/master-data/hooks/use-academic-years';
import { useBatches } from '@/features/batches/hooks/use-batches';
import { toast } from 'sonner';
import type { BranchType, UpdateBranchInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

function BranchDetailContent() {
  const params = useParams();
  const router = useRouter();
  const branchId = params?.id as string;

  const { data: branch, isLoading, error } = useBranch(branchId);
  const updateMutation = useUpdateBranch();

  // Related data fetching
  const { data: mappings = [], isLoading: mappingsLoading } = useBranchCourses(branchId);
  const { data: coursesRes } = useCourses({ limit: 100 });
  const courses = coursesRes?.data || [];
  const { data: yearsRes } = useAcademicYears({ limit: 100 });
  const academicYears = yearsRes?.data || [];
  const { batches = [], isLoading: batchesLoading } = useBatches({ autoFetch: true });

  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<UpdateBranchInput>({
    name: '',
    displayName: '',
    code: '',
    email: '',
    phone: '',
    branchType: 'CAMPUS',
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        displayName: branch.displayName || '',
        code: branch.code || '',
        email: branch.email || '',
        phone: branch.phone || '',
        branchType: branch.branchType || 'CAMPUS',
        status: branch.status || 'ACTIVE',
        timezone: branch.timezone || 'Asia/Kolkata',
      });
    }
  }, [branch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    if (!formData.name || !formData.name.trim()) {
      toast.error('Branch Name is required');
      return;
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast.error('Please enter a valid email address (e.g. branch@domain.com)');
        return;
      }
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneClean = formData.phone.trim();
      const phoneRegex = /^[+\d\s-]{10,15}$/;
      const digitCount = (phoneClean.match(/\d/g) || []).length;
      if (!phoneRegex.test(phoneClean) || digitCount < 10) {
        toast.error('Please enter a valid phone number (minimum 10 digits)');
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: branchId,
        input: formData,
      });
      toast.success('Branch details updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update branch details');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-slate-600">Loading branch information...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !branch) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center max-w-md mx-auto my-12 border border-rose-200 rounded-3xl bg-rose-50/50 space-y-3">
          <Building2 className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Branch Not Found</h3>
          <p className="text-xs text-slate-500">The requested campus branch could not be loaded.</p>
          <Button
            onClick={() => router.push('/tenant-admin/branches')}
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Branches
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Filter mappings belonging to this branch
  const activeBranchMappings = mappings.filter((m) => m.branchId === branch.id);
  const mappedCourses = activeBranchMappings.map((mapping) => {
    const course = courses.find((c) => c.id === mapping.courseId);
    const academicYear = academicYears.find((y) => y.id === mapping.academicYearId);
    return {
      mappingId: mapping.id,
      courseId: course?.id || mapping.courseId,
      name: course?.name || 'Loading Course...',
      code: course?.code || '...',
      academicYearName: academicYear?.name || 'Academic Track',
    };
  });

  const branchBatches = batches.filter((b) => b.branchId === branch.id);
  const isActive = (isEditing ? formData.status : branch.status) === 'ACTIVE';

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Back & Edit Action Buttons - Mobile Responsive Row */}
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <button
            onClick={() => router.push('/tenant-admin/branches')}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="hidden sm:inline">Back to All Branches</span>
            <span className="sm:hidden">Back</span>
          </button>

          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'outline' : 'default'}
            className={cn(
              'gap-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 px-3 sm:px-4 py-2',
              isEditing
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-violet-600 hover:bg-violet-700 text-white',
            )}
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="hidden sm:inline">Cancel Editing</span>
                <span className="sm:hidden">Cancel</span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 text-white shrink-0" />
                <span className="hidden sm:inline">Edit Branch Details</span>
                <span className="sm:hidden">Edit</span>
              </>
            )}
          </Button>
        </div>

        {/* Dedicated Screen Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold text-white border border-white/20">
                    {branch.code}
                  </span>
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
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active Campus
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
                  {branch.name}
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5 truncate">
                  {branch.displayName || branch.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              <div className="bg-white/10 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-white/20 text-left sm:text-right">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase text-violet-200 tracking-wider">
                  Campus Type
                </p>
                <p className="text-xs font-bold text-white uppercase mt-0.5">
                  {branch.branchType.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Overview & Campus Details (or Edit Form) */}
        <div className="space-y-4">
          {isEditing ? (
            <form
              onSubmit={handleSave}
              className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-violet-600" /> Edit Campus Branch Parameters
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update branch location name, code, contact information, and operational status.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Branch Code
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Fixed Code
                    </span>
                  </div>
                  <Input
                    value={formData.code || ''}
                    disabled
                    readOnly
                    placeholder="e.g. BR-MAIN-01"
                    className="rounded-xl border-slate-200 text-xs font-mono font-bold bg-slate-100 text-slate-500 cursor-not-allowed border-dashed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Branch Name *
                  </label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Main Campus Chennai"
                    required
                    className="rounded-xl border-slate-200 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Display Name
                  </label>
                  <Input
                    value={formData.displayName || ''}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Apex Academy Central Campus"
                    className="rounded-xl border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Branch Type *
                  </label>
                  <select
                    value={formData.branchType || 'CAMPUS'}
                    onChange={(e) =>
                      setFormData({ ...formData, branchType: e.target.value as BranchType })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="HEAD_OFFICE">Head Office</option>
                    <option value="CAMPUS">Main Campus</option>
                    <option value="FRANCHISE">Sub-Branch / Franchise</option>
                    <option value="ONLINE">Online Virtual Center</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. branch@neetacademy.com"
                    className="rounded-xl border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Contact Phone
                  </label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 98765 43210"
                    className="rounded-xl border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Timezone
                  </label>
                  <Input
                    value={formData.timezone || 'Asia/Kolkata'}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    placeholder="e.g. Asia/Kolkata"
                    className="rounded-xl border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Operational Status
                  </label>
                  <select
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Branch Parameters
                </Button>
              </div>
            </form>
          ) : (
            /* Overview & Details Info Cards */
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-violet-600" /> Overview & Contact Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {branch.email || 'Not configured'}
                    </p>
                  </div>
                </Card>

                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {branch.phone || 'Not configured'}
                    </p>
                  </div>
                </Card>

                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Timezone
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {branch.timezone || 'Asia/Kolkata'}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Offered Courses */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-violet-600 shrink-0" /> Offered
              Courses ({mappedCourses.length})
            </h3>
            <span className="text-[10px] sm:text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-lg border border-violet-100 shrink-0">
              {mappedCourses.length} Active Courses
            </span>
          </div>

          {mappedCourses.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-2xl border-slate-200 bg-slate-50/50">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                No courses offered at this branch yet.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure course offering mappings in Master Data settings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {mappedCourses.map((mc) => (
                <div
                  key={mc.mappingId}
                  className="p-4 border border-slate-200/80 rounded-2xl bg-slate-50/50 hover:bg-violet-50/30 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-md shrink-0">
                        {mc.academicYearName}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                        {mc.code}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug break-words">
                      {mc.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Active Student Batches */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#E5E7EB] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-600 shrink-0" /> Active
              Student Batches ({branchBatches.length})
            </h3>
            <span className="text-[10px] sm:text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shrink-0">
              {branchBatches.length} Running Batches
            </span>
          </div>

          {branchBatches.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-2xl border-slate-200 bg-slate-50/50">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                No active batches running at this branch.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Create new student batches under Batch Management.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
              {branchBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/60 transition-colors gap-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-slate-900 leading-snug break-words">
                        {batch.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 shrink-0">
                        {batch.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed break-words">
                      Program:{' '}
                      <span className="text-slate-700 font-semibold">
                        {batch.courseName || 'Regular Course'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end shrink-0 gap-2 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0">
                    <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-100 shrink-0">
                      {batch.deliveryTypeName || 'Regular'}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {batch.startDate
                          ? new Date(batch.startDate).toLocaleDateString(undefined, {
                              year: '2-digit',
                              month: 'short',
                            })
                          : ''}{' '}
                        -{' '}
                        {batch.endDate
                          ? new Date(batch.endDate).toLocaleDateString(undefined, {
                              year: '2-digit',
                              month: 'short',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function BranchDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <BranchDetailContent />
    </ProtectedRoute>
  );
}
