'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronRight,
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
          <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
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
            className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
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
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Back & Breadcrumb Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <button
              onClick={() => router.push('/tenant-admin/branches')}
              className="hover:underline flex items-center gap-1 font-bold text-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" /> Branches
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-extrabold text-[#0B2447]">{branch.name}</span>
          </div>

          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'outline' : 'default'}
            className={cn(
              'gap-1.5 rounded-xl text-xs font-extrabold transition-all shadow-2xs shrink-0 px-4 py-2 self-end sm:self-auto',
              isEditing
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-[#0052CC] hover:bg-blue-700 text-white',
            )}
          >
            {isEditing ? (
              <>
                <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Cancel Editing</span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4 text-white shrink-0" />
                <span>Edit Branch Details</span>
              </>
            )}
          </Button>
        </div>

        {/* Dedicated ISML LMS Light Blue Hero Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200">
                  {branch.code}
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200',
                  )}
                >
                  {isActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Campus Node
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                      Inactive
                    </>
                  )}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] leading-snug truncate">
                {branch.name}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                {branch.displayName || branch.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-right shadow-2xs">
              <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Campus Category
              </p>
              <p className="text-xs font-extrabold text-[#0B2447] uppercase mt-0.5">
                {branch.branchType ? branch.branchType.replace(/_/g, ' ') : 'CAMPUS'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Overview & Parameters Form */}
        <div className="space-y-4">
          {isEditing ? (
            <form
              onSubmit={handleSave}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-[#0052CC]" /> Edit Branch Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update location name, code, email, phone, and operational status.
                  </p>
                </div>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Branch Details
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Branch Code
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      System Code
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
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
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
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
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
                  className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Branch Details
                </Button>
              </div>
            </form>
          ) : (
            /* Overview & Details Info Cards */
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0052CC]" /> Campus Communication & Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-xs font-bold text-[#0B2447] mt-0.5 truncate">
                      {branch.email || 'Not configured'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Phone Number
                    </p>
                    <p className="text-xs font-bold text-[#0B2447] mt-0.5 truncate">
                      {branch.phone || 'Not configured'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Timezone
                    </p>
                    <p className="text-xs font-bold text-[#0B2447] mt-0.5 truncate">
                      {branch.timezone || 'Asia/Kolkata'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Offered Courses */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4.5 h-4.5 text-[#0052CC] shrink-0" /> Offered Courses (
              {mappedCourses.length})
            </h3>
            <span className="text-xs font-bold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shrink-0 font-mono">
              {mappedCourses.length} Active Courses
            </span>
          </div>

          {mappedCourses.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 bg-slate-50/50">
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
                  className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="text-[10px] font-extrabold text-[#0052CC] uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-md shrink-0">
                        {mc.academicYearName}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 shrink-0">
                        {mc.code}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#0B2447] mt-1 leading-snug line-clamp-2">
                      {mc.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Active Student Batches */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-[#0052CC] shrink-0" /> Active Student Batches (
              {branchBatches.length})
            </h3>
            <span className="text-xs font-bold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 shrink-0 font-mono">
              {branchBatches.length} Running Batches
            </span>
          </div>

          {branchBatches.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 bg-slate-50/50">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">
                No active batches running at this branch.
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Create new student batches under Batch Management.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              {branchBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-extrabold text-xs sm:text-sm text-[#0B2447] leading-snug">
                        {batch.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                        {batch.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Program:{' '}
                      <span className="text-slate-800 font-bold">
                        {batch.courseName || 'Regular Course'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end shrink-0 gap-2 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0">
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-[#0052CC] border border-blue-200 shrink-0">
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
