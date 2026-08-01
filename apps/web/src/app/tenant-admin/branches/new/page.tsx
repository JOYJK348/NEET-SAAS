'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Building2, Sparkles, Save, Loader2, X, AlertCircle } from 'lucide-react';
import { useCreateBranch } from '@/features/master-data/hooks/use-branches';
import { toast } from 'sonner';
import type { BranchType, CreateBranchInput } from '@/features/master-data/types';
import { cn } from '@/lib/utils';

const generateUniqueCode = (nameVal?: string) => {
  const clean = (nameVal || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'MAIN';
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `BR-${prefix}-${randomDigits}`;
};

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

function CreateBranchContent() {
  const router = useRouter();
  const createMutation = useCreateBranch();
  const [errors, setErrors] = useState<FormErrors>({});

  const [formData, setFormData] = useState<CreateBranchInput>({
    code: generateUniqueCode(''),
    slug: '',
    name: '',
    displayName: '',
    email: '',
    phone: '',
    branchType: 'CAMPUS',
    status: 'ACTIVE',
    timezone: 'Asia/Kolkata',
  });

  const validateForm = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.name || !formData.name.trim()) {
      errs.name = 'Branch Name is required';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errs.email = 'Please enter a valid email address (e.g. branch@domain.com)';
      }
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneClean = formData.phone.trim();
      const phoneRegex = /^[+\d\s-]{10,15}$/;
      const digitCount = (phoneClean.match(/\d/g) || []).length;
      if (!phoneRegex.test(phoneClean) || digitCount < 10) {
        errs.phone = 'Please enter a valid phone number (minimum 10 digits)';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNameChange = (nameVal: string) => {
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }

    const slugVal = nameVal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Auto-update branch code prefix if name is typed
    const clean = nameVal.trim().replace(/[^a-zA-Z0-9]/g, '');
    const prefix = clean.length >= 3 ? clean.substring(0, 3).toUpperCase() : 'MAIN';
    const randomDigits = formData.code ? formData.code.split('-').pop() || '1001' : '1001';
    const updatedCode = `BR-${prefix}-${randomDigits}`;

    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      code: updatedCode,
      displayName: prev.displayName || nameVal,
      slug: slugVal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the highlighted validation errors');
      return;
    }

    const computedSlug = formData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const payload: CreateBranchInput = {
      ...formData,
      slug: computedSlug || 'branch-location',
    };

    try {
      const result = await createMutation.mutateAsync(payload);
      toast.success('New branch created successfully!');
      if (result?.id) {
        router.push(`/tenant-admin/branches/${result.id}`);
      } else {
        router.push('/tenant-admin/branches');
      }
    } catch (err) {
      toast.error('Failed to create branch. Please check inputs.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Top Back Action Bar */}
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
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant-admin/branches')}
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
                <Building2 className="w-5 h-5 sm:w-7 sm:h-7 text-violet-100" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-violet-200" />
                  <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                    New Campus Setup
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                  Add New Campus Branch 🏫
                </h1>
                <p className="text-xs text-violet-200 font-medium mt-0.5">
                  Configure physical campuses, regional branches, or online virtual centers.
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
                <Building2 className="w-4 h-4 text-violet-600" /> Campus Branch Parameters
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fill in the branch details to establish a new operational center.
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
              Create Branch
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Branch Code *
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
                Branch Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Main Campus Chennai"
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
                value={formData.displayName}
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
                value={formData.branchType}
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
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="e.g. branch@neetacademy.com"
                className={cn(
                  'rounded-xl text-xs font-medium',
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200',
                )}
              />
              {errors.email && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contact Phone
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="e.g. +91 98765 43210"
                className={cn(
                  'rounded-xl text-xs font-medium',
                  errors.phone
                    ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20'
                    : 'border-slate-200',
                )}
              />
              {errors.phone && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> {errors.phone}
                </p>
              )}
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

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Initial Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="ACTIVE">Active (Immediate Operation)</option>
                <option value="INACTIVE">Inactive (Draft Setup)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/tenant-admin/branches')}
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
              Create & Save Branch
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function CreateBranchPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <CreateBranchContent />
    </ProtectedRoute>
  );
}
