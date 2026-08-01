'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Save,
  Loader2,
  X,
  AlertCircle,
  Clock,
  BookOpen,
  Layers,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useCreateCourse } from '@/features/master-data/hooks/use-courses';
import { useBranches } from '@/features/master-data/hooks/use-branches';
import { toast } from 'sonner';
import type { CreateCourseInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

const generateCourseCode = (nameVal?: string) => {
  const clean = (nameVal || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'NEET';
  const randomDigits = Math.floor(100 + Math.random() * 900);
  return `CRS-${prefix}-${randomDigits}`;
};

interface FormErrors {
  name?: string;
  code?: string;
  durationMonths?: string;
}

function CreateCourseContent() {
  const router = useRouter();
  const createMutation = useCreateCourse();
  const { data: branchesData } = useBranches({ limit: 100 });
  const branches = branchesData?.data || [];

  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreateCourseInput>({
    code: generateCourseCode(''),
    name: '',
    displayName: '',
    description: '',
    courseType: 'REGULAR',
    durationMonths: 12,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString()
      .split('T')[0],
    displayOrder: 1,
    isActive: true,
    branchIds: [],
  });

  const validateForm = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Course Name is required';
    }

    if (!formData.code || !formData.code.trim()) {
      errs.code = 'Course Code is required';
    }

    if (formData.durationMonths === undefined || formData.durationMonths <= 0) {
      errs.durationMonths = 'Duration must be greater than 0 months';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNameChange = (nameVal: string) => {
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }

    const clean = nameVal.trim().replace(/[^a-zA-Z0-9]/g, '');
    const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'NEET';
    const randomDigits = formData.code ? formData.code.split('-').pop() || '101' : '101';
    const updatedCode = `CRS-${prefix}-${randomDigits}`;

    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      code: updatedCode,
      displayName: prev.displayName || nameVal,
    }));
  };

  const toggleBranchSelection = (bId: string) => {
    const current = formData.branchIds || [];
    if (current.includes(bId)) {
      setFormData({ ...formData, branchIds: current.filter((id) => id !== bId) });
    } else {
      setFormData({ ...formData, branchIds: [...current, bId] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted validation errors');
      return;
    }

    try {
      await createMutation.mutateAsync(formData);
      toast.success('New Course Program created successfully!');
      router.push('/tenant-admin/curriculum');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Failed to create course program';
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
            <span className="hidden sm:inline">Back to Curriculum Architecture</span>
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
                <GraduationCap className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                  <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                    New Program Setup
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  Create New Course Program 🎓
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  Configure course credentials, syllabus timeline, and associate initial campus
                  branches.
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
                <BookOpen className="w-4 h-4 text-violet-600" /> Course Program Identity
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Provide basic credentials, program name, and unique code identification.
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
              Save Program
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Course Code *
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
                Course Program Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. NEET UG 2-Year Integrated Master"
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
                Display Name (Student Portal)
              </label>
              <Input
                value={formData.displayName || ''}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. NEET 2026 Achievers Program"
                className="rounded-xl border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Program Type *
              </label>
              <select
                value={formData.courseType || 'REGULAR'}
                onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="REGULAR">REGULAR (Standard Academic Batch)</option>
                <option value="CRASH">CRASH COURSE (Accelerated Program)</option>
                <option value="REPEATERS">REPEATERS / DROPPER BATCH</option>
                <option value="FOUNDATION">FOUNDATION (Class 9 & 10 Preparation)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Duration (Months) *
              </label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  max={48}
                  value={formData.durationMonths || 12}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMonths: parseInt(e.target.value, 10) || 12 })
                  }
                  className="rounded-xl border-slate-200 text-xs font-bold pr-12"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  Months
                </span>
              </div>
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
                <option value="ACTIVE">Active (Available for Enrollment)</option>
                <option value="INACTIVE">Inactive (Draft Setup)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-violet-600" /> Start Date
              </label>
              <Input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="rounded-xl border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-violet-600" /> Expected End Date
              </label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="rounded-xl border-slate-200 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Program Description & Highlights
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Enter detailed syllabus highlights, course objectives, and target NEET goals..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Associate Branches Selection Strip */}
            <div className="space-y-2 sm:col-span-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-violet-600" /> Associate Initial Campus Branches
              </label>
              <p className="text-xs text-slate-400">
                Select campuses where this course program will be offered.
              </p>

              {branches.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No campuses available.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {branches.map((b) => {
                    const isSelected = (formData.branchIds || []).includes(b.id);
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => toggleBranchSelection(b.id)}
                        className={cn(
                          'p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between gap-2',
                          isSelected
                            ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                        )}
                      >
                        <span className="truncate">{b.name}</span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-violet-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
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
              Create & Save Program
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function CreateCoursePage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <CreateCourseContent />
    </ProtectedRoute>
  );
}
