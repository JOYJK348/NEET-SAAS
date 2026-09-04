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
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit2,
  Save,
  Loader2,
  Eye,
  Clock,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import {
  useAcademicYears,
  useUpdateAcademicYear,
} from '@/features/master-data/hooks/use-academic-years';
import { useCourses } from '@/features/master-data/hooks/use-courses';
import { toast } from 'sonner';
import type { UpdateAcademicYearInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function AcademicYearDetailContent() {
  const params = useParams();
  const router = useRouter();
  const yearId = params?.id as string;

  const { data: yearsRes, isLoading, error } = useAcademicYears({ limit: 100 });
  const allYears = yearsRes?.data || [];
  const year = allYears.find((y) => y.id === yearId);
  const updateMutation = useUpdateAcademicYear();

  const { data: coursesRes } = useCourses({ limit: 100 });
  const courses = coursesRes?.data || [];

  const [isEditing, setIsEditing] = useState(false);

  // Form State
  const [formData, setFormData] = useState<UpdateAcademicYearInput>({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isCurrent: false,
  });

  useEffect(() => {
    if (year) {
      setFormData({
        name: year.name || '',
        code: year.code || '',
        description: year.description || '',
        startDate: year.startDate ? new Date(year.startDate).toISOString().split('T')[0] : '',
        endDate: year.endDate ? new Date(year.endDate).toISOString().split('T')[0] : '',
        isActive: year.isActive ?? true,
        isCurrent: year.isCurrent ?? false,
      });
    }
  }, [year]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearId) return;

    if (!formData.name || !formData.name.trim()) {
      toast.error('Academic Year Name is required');
      return;
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast.error('End date must be after start date');
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: yearId,
        input: formData,
      });
      toast.success('Academic Year details updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update academic year details');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen p-6 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052CC]" />
          <p className="text-sm font-semibold text-slate-600">Loading academic year info...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !year) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center max-w-md mx-auto my-12 border border-rose-200 rounded-3xl bg-rose-50/50 space-y-3">
          <Calendar className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Academic Year Not Found</h3>
          <p className="text-xs text-slate-500">
            The requested academic session calendar could not be loaded.
          </p>
          <Button
            onClick={() => router.push('/tenant-admin/academic-years')}
            className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Academic Years
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isActive = year.isActive;

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Breadcrumb & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <button
              onClick={() => router.push('/tenant-admin/academic-years')}
              className="hover:underline flex items-center gap-1 font-bold text-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" /> Academic Sessions
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-extrabold text-[#0B2447]">{year.name}</span>
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
                <span>Edit Academic Session</span>
              </>
            )}
          </Button>
        </div>

        {/* ISML LMS Light Blue Header Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200">
                  {year.code}
                </span>
                {year.isCurrent && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                    Current Active Session
                  </span>
                )}
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
                      Active Status
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
                {year.name}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                {year.description || 'Regular academic session cycle.'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Overview & Parameters (or Edit Form) */}
        <div className="space-y-4">
          {isEditing ? (
            <form
              onSubmit={handleSave}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-[#0B2447] flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-[#0052CC]" /> Edit Academic Session Details
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update academic year name, duration dates, and default session flags.
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
                  Save Changes
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Academic Year Code
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Fixed Code
                    </span>
                  </div>
                  <Input
                    value={formData.code || ''}
                    disabled
                    readOnly
                    placeholder="e.g. AY-2026-27"
                    className="rounded-xl border-slate-200 text-xs font-mono font-bold bg-slate-100 text-slate-500 cursor-not-allowed border-dashed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Academic Year Name *
                  </label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Academic Year 2026-27"
                    required
                    className="rounded-xl border-slate-200 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Session Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="rounded-xl border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Session End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="rounded-xl border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Description / Remarks
                  </label>
                  <Input
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Standard cycle for regular courses."
                    className="rounded-xl border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Active Status
                  </label>
                  <select
                    value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div className="space-y-1.5 flex items-end pb-1">
                  <label className="relative inline-flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.isCurrent || false}
                      onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0052CC]"></div>
                    <span className="text-xs font-bold text-slate-700">
                      Set as Current Active Session
                    </span>
                  </label>
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
                  Save Parameters
                </Button>
              </div>
            </form>
          ) : (
            /* Overview Info Cards */
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-[#0B2447] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0052CC]" /> Duration & Calendar Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Start Date
                    </p>
                    <p className="text-xs font-bold text-[#0B2447] mt-0.5 truncate">
                      {year.startDate ? format(new Date(year.startDate), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      End Date
                    </p>
                    <p className="text-xs font-bold text-[#0B2447] mt-0.5 truncate">
                      {year.endDate ? format(new Date(year.endDate), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Active Configuration
                    </p>
                    <p className="text-xs font-bold text-[#0B2447] mt-0.5 truncate">
                      {year.isCurrent ? 'Default Active Session' : 'Standard Year'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AcademicYearDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <AcademicYearDetailContent />
    </ProtectedRoute>
  );
}
