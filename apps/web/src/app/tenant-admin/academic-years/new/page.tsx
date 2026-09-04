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
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useCreateAcademicYear } from '@/features/master-data/hooks/use-academic-years';
import { toast } from 'sonner';
import type { CreateAcademicYearInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

const generateUniqueYearCode = () => {
  const currentYear = new Date().getFullYear();
  const nextYearShort = String(currentYear + 1).slice(-2);
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `AY-${currentYear}-${nextYearShort}-${randomSuffix}`;
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
      await createMutation.mutateAsync(formData);
      toast.success('New Academic Year created successfully!');
      router.push('/tenant-admin/academic-years');
      router.refresh();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create academic year';
      toast.error(errorMsg);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Breadcrumb & Toolbar */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <button
              onClick={() => router.push('/tenant-admin/academic-years')}
              className="hover:underline flex items-center gap-1 font-bold text-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" /> Academic Sessions
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-extrabold text-[#0B2447]">New Session Setup</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant-admin/academic-years')}
            className="rounded-xl text-xs font-bold text-slate-600 shrink-0 px-3.5 py-1.5 border-slate-200"
          >
            <X className="w-3.5 h-3.5 text-slate-400 mr-1" />
            Cancel
          </Button>
        </div>

        {/* Dedicated ISML LMS Style Light Blue Hero Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
                  ACADEMIC CALENDAR
                </span>
                <span className="text-xs text-slate-500 font-semibold font-mono">
                  Master Data Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] leading-snug">
                Add New Academic Year
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Establish new academic session dates, active status, and default filters.
              </p>
            </div>
          </div>
        </div>

        {/* ISML LMS Style Registration Form Container */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-2xs space-y-6 w-full"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0B2447] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0052CC]" /> Academic Session Details
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure start/end dates and status for the new academic cycle.
              </p>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs shrink-0 px-5 py-2.5 transition-all"
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
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Academic Year Code *
                </label>
                <span className="text-[10px] font-bold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-[#0052CC]" /> Auto-Generated
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
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Academic Year Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Academic Year 2026-27"
                required
                className={cn(
                  'w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-bold transition-all',
                  errors.name
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-slate-200 focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100',
                )}
              />
              {errors.name && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Session Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate ? formData.startDate.split('T')[0] : ''}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }));
                }}
                required
                className={cn(
                  'w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium transition-all',
                  errors.startDate
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-slate-200 focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100',
                )}
              />
              {errors.startDate && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Session End Date *
              </label>
              <input
                type="date"
                value={formData.endDate ? formData.endDate.split('T')[0] : ''}
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: undefined }));
                }}
                required
                className={cn(
                  'w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium transition-all',
                  errors.endDate
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-slate-200 focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100',
                )}
              />
              {errors.endDate && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.endDate}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Description / Remarks
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Regular academic cycle for standard NEET batches."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Initial Status
              </label>
              <select
                value={formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.value === 'ACTIVE' })
                }
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/tenant-admin/academic-years')}
              className="rounded-xl text-xs font-bold text-slate-600 px-4 py-2.5 border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-2xs px-6 py-2.5 transition-all"
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
