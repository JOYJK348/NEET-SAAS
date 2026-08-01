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
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
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
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
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
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Back & Edit Action Buttons */}
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <button
            onClick={() => router.push('/tenant-admin/academic-years')}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="hidden sm:inline">Back to Academic Years</span>
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
                <span className="hidden sm:inline">Edit Academic Year</span>
                <span className="sm:hidden">Edit</span>
              </>
            )}
          </Button>
        </div>

        {/* Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-mono font-bold text-white border border-white/20">
                    {year.code}
                  </span>
                  {year.isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-400/30 text-amber-100 border border-amber-300/40">
                      ★ Current Active Session
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
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Active Status
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
                  {year.name}
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5 truncate">
                  {year.description || 'Regular academic session cycle.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Overview & Session Parameters (or Edit Form) */}
        <div className="space-y-4">
          {isEditing ? (
            <form
              onSubmit={handleSave}
              className="bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-violet-600" /> Edit Academic Session Parameters
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update academic year name, duration dates, and default session flags.
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
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
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
                  className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
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
            /* Overview & Details Info Cards */
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" /> Duration & Calendar Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-violet-50 text-violet-600 border border-violet-100 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Start Date
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {year.startDate ? format(new Date(year.startDate), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                </Card>

                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      End Date
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {year.endDate ? format(new Date(year.endDate), 'MMM d, yyyy') : 'Not set'}
                    </p>
                  </div>
                </Card>

                <Card className="rounded-2xl border-[#E5E7EB] bg-white p-5 shadow-xs flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Configuration
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {year.isCurrent ? 'Default Active Session' : 'Standard Year'}
                    </p>
                  </div>
                </Card>
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
