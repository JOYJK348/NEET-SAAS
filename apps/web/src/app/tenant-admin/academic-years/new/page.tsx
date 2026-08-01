'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Save,
  Loader2,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useCreateAcademicYear } from '@/features/master-data/hooks/use-academic-years';
import { toast } from 'sonner';
import type { CreateAcademicYearInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

const generateUniqueYearCode = () => {
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  return `AY-${currentYear}-${nextYearShort}`;
};

interface FormErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
}

function CreateAcademicYearContent() {
  const router = useRouter();
  const createMutation = useCreateAcademicYear();
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreateAcademicYearInput>({
    code: generateUniqueYearCode(),
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    isCurrent: false,
  });

  const validateForm = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Academic Year Name is required (e.g. Academic Year 2026-27)';
    }

    if (!formData.startDate) {
      errs.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errs.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errs.endDate = 'End date must be after the start date';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNameChange = (nameVal: string) => {
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
    setFormData((prev) => ({ ...prev, name: nameVal }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted validation errors');
      return;
    }

    try {
      const result = await createMutation.mutateAsync(formData);
      toast.success('New Academic Year created successfully!');
      if (result?.id) {
        router.push(`/tenant-admin/academic-years/${result.id}`);
      } else {
        router.push('/tenant-admin/academic-years');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create academic year';
      toast.error(errorMsg);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Top Back Action Bar */}
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
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant-admin/academic-years')}
            className="rounded-xl text-xs font-bold text-slate-600 shrink-0 px-3 sm:px-4 py-2"
          >
            <X className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
            Cancel
          </Button>
        </div>

        {/* Dedicated Screen Header Banner */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-700 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5 sm:mt-0">
                <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                  <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                    Academic Calendar Setup
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  Add New Academic Year 📅
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  Establish new academic session dates, active status, and default filters.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5E7EB] rounded-3xl p-5 sm:p-7 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-600" /> Academic Session Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure start/end dates and status for the new academic cycle.
              </p>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-sm shrink-0 px-4 py-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Create Academic Year
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Academic Year Code *
                </label>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-500" /> Auto-Generated
                </span>
              </div>
              <Input
                value={formData.code}
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
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Academic Year 2026-27"
                required
                className={cn(
                  'rounded-xl text-xs font-bold',
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200',
                )}
              />
              {errors.name && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Session Start Date *
              </label>
              <Input
                type="date"
                value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }));
                }}
                required
                className={cn(
                  'rounded-xl text-xs font-medium',
                  errors.startDate
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200',
                )}
              />
              {errors.startDate && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Session End Date *
              </label>
              <Input
                type="date"
                value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }));
                }}
                required
                className={cn(
                  'rounded-xl text-xs font-medium',
                  errors.endDate
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200',
                )}
              />
              {errors.endDate && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.endDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Description / Remarks
              </label>
              <Input
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Regular academic cycle for standard NEET batches."
                className="rounded-xl border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Initial Status
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
              onClick={() => router.push('/tenant-admin/academic-years')}
              className="rounded-xl text-xs font-bold text-slate-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Create & Save Academic Year
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function CreateAcademicYearPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <CreateAcademicYearContent />
    </ProtectedRoute>
  );
}
