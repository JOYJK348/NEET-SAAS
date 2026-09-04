'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Building2,
  Sparkles,
  Save,
  Loader2,
  X,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
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
      <div className="w-full space-y-6 text-[#0F172A] font-sans">
        {/* Breadcrumb & Toolbar */}
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <button
              onClick={() => router.push('/tenant-admin/branches')}
              className="hover:underline flex items-center gap-1 font-bold text-slate-600"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#0052CC]" /> Branches
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-extrabold text-[#0B2447]">New Branch Registration</span>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant-admin/branches')}
            className="rounded-xl text-xs font-bold text-slate-600 shrink-0 px-3.5 py-1.5 border-slate-200"
          >
            <X className="w-3.5 h-3.5 text-slate-400 mr-1" />
            Cancel
          </Button>
        </div>

        {/* Dedicated ISML LMS Light Blue Style Hero Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-xs border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-[#0052CC] border border-blue-200 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#0052CC]" />
                  INSTITUTIONAL SETUP
                </span>
                <span className="text-xs text-slate-500 font-semibold font-mono">
                  Master Data Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] leading-snug">
                Add New Campus Branch
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Configure physical campuses, regional branches, or online virtual learning centers.
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
                <ShieldCheck className="w-5 h-5 text-[#0052CC]" /> Branch Registration Parameters
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the branch details to establish a new operational center.
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
              Create Branch
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Branch Code *
                </label>
                <span className="text-[10px] font-bold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-[#0052CC]" /> Auto-Generated
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
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Branch Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Main Campus Chennai"
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
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Apex Academy Central Campus"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Branch Type *
              </label>
              <select
                value={formData.branchType}
                onChange={(e) =>
                  setFormData({ ...formData, branchType: e.target.value as BranchType })
                }
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="HEAD_OFFICE">Head Office</option>
                <option value="CAMPUS">Main Campus</option>
                <option value="FRANCHISE">Sub-Branch / Franchise</option>
                <option value="ONLINE">Online Virtual Center</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="e.g. branch@neetacademy.com"
                className={cn(
                  'w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium transition-all',
                  errors.email
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-slate-200 focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100',
                )}
              />
              {errors.email && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                }}
                placeholder="e.g. +91 98765 43210"
                className={cn(
                  'w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium transition-all',
                  errors.phone
                    ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                    : 'border-slate-200 focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100',
                )}
              />
              {errors.phone && (
                <p className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Timezone
              </label>
              <input
                type="text"
                value={formData.timezone || 'Asia/Kolkata'}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="e.g. Asia/Kolkata"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none font-medium focus:border-[#0052CC] focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Initial Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="ACTIVE">Active (Immediate Operation)</option>
                <option value="INACTIVE">Inactive (Draft Setup)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/tenant-admin/branches')}
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
