'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Bookmark,
  Sparkles,
  Save,
  Loader2,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useCreateSubject } from '@/features/master-data/hooks/use-subjects';
import { toast } from 'sonner';
import type { CreateSubjectInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

const generateSubjectCode = (nameVal?: string) => {
  const clean = (nameVal || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'SUB';
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `SUB-${prefix}-${randomDigits}`;
};

interface FormErrors {
  name?: string;
  code?: string;
}

function CreateSubjectContent() {
  const router = useRouter();
  const createMutation = useCreateSubject();
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreateSubjectInput>({
    code: generateSubjectCode(''),
    name: '',
    shortName: '',
    displayName: '',
    description: '',
    subjectType: 'CORE',
    isActive: true,
  });

  const validateForm = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Subject Name is required';
    }

    if (!formData.code || !formData.code.trim()) {
      errs.code = 'Subject Code is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNameChange = (nameVal: string) => {
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }

    const clean = nameVal.trim().replace(/[^a-zA-Z0-9]/g, '');
    const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'SUB';
    const randomDigits = formData.code ? formData.code.split('-').pop() || '101' : '101';
    const updatedCode = `SUB-${prefix}-${randomDigits}`;

    const shortNameVal =
      clean.length >= 4 ? clean.substring(0, 4).toUpperCase() : clean.toUpperCase();

    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      code: updatedCode,
      displayName: prev.displayName || nameVal,
      shortName: prev.shortName || shortNameVal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted validation errors');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success('Master Subject created successfully!');
      router.push('/tenant-admin/curriculum');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create subject';
      toast.error(errorMsg);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Top Back Action Bar */}
        <div className="flex flex-row items-center justify-between gap-2 w-full">
          <button
            onClick={() => router.push('/tenant-admin/curriculum')}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="hidden sm:inline">Back to Curriculum</span>
            <span className="sm:hidden">Back</span>
          </button>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant-admin/curriculum')}
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
                <Bookmark className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                  <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                    Syllabus Subject Creation
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  Add Master Subject 📚
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  Configure reusable core subjects (Physics, Chemistry, Botany, Zoology) across your
                  institute.
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
                <FileText className="w-4 h-4 text-violet-600" /> Subject Profile Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Provide core subject details, subject type, and display names.
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
              Create Subject
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Subject Code *
                </label>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-500" /> Auto-Generated
                </span>
              </div>
              <Input
                value={formData.code}
                disabled
                readOnly
                placeholder="Auto-generating..."
                className="rounded-xl border-slate-200 text-xs font-mono font-bold bg-slate-100 text-slate-500 cursor-not-allowed border-dashed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subject Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Physics / Organic Chemistry"
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
                Display Name
              </label>
              <Input
                value={formData.displayName || ''}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Advanced NEET Physics"
                className="rounded-xl border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Short Name / Tag
              </label>
              <Input
                value={formData.shortName || ''}
                onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                placeholder="e.g. PHY / CHEM"
                className="rounded-xl border-slate-200 text-xs font-medium uppercase"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subject Type *
              </label>
              <select
                value={formData.subjectType}
                onChange={(e) => setFormData({ ...formData, subjectType: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="CORE">CORE (Mandatory Science Subject)</option>
                <option value="ELECTIVE">ELECTIVE (Optional Stream Subject)</option>
                <option value="LANGUAGE">LANGUAGE (Foundation / Grammar)</option>
                <option value="VOCATIONAL">VOCATIONAL / SKILL</option>
              </select>
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
                <option value="ACTIVE">Active (Available for Course Assignment)</option>
                <option value="INACTIVE">Inactive (Draft / Suspended)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Description / Notes
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Add optional notes or description about this master subject..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/tenant-admin/curriculum')}
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
              Create & Save Subject
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function CreateSubjectPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <CreateSubjectContent />
    </ProtectedRoute>
  );
}
