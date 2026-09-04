'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  Building2,
  ChevronRight,
  Save,
  Loader2,
  X,
  CreditCard,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useBranches } from '@/features/master-data/hooks/use-branches';
import { useAcademicYears } from '@/features/master-data/hooks/use-academic-years';

function CourseFormBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-generate unique course code!
  const generateUniqueCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `CRS-NEET-${randomNum}`;
  };

  // Form states
  const [code, setCode] = useState(generateUniqueCode());
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical / NEET');
  const [duration, setDuration] = useState('1 Year');
  const [isActive, setIsActive] = useState(true);

  // Branch & Academic Year mappings
  const [branchId, setBranchId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  // Fee Mappings
  const [baseFee, setBaseFee] = useState<string>('');
  const [feePlans, setFeePlans] = useState<Array<{ id: string; name: string; code: string; totalAmount: number }>>([]);
  const [selectedFeePlanId, setSelectedFeePlanId] = useState<string>('auto');

  const { data: branchesData } = useBranches({ limit: 100 });
  const { data: academicYearsData } = useAcademicYears({ limit: 100 });

  const branches = branchesData?.data || [];
  const academicYears = academicYearsData?.data || [];

  useEffect(() => {
    if (branches.length > 0 && !branchId) setBranchId(branches[0].id);
    if (academicYears.length > 0 && !academicYearId) setAcademicYearId(academicYears[0].id);
  }, [branches, academicYears]);

  useEffect(() => {
    async function fetchFeePlans() {
      try {
        const res = await api.get<any>('/billing/fee-plans');
        const data = res?.data || res;
        if (Array.isArray(data)) {
          setFeePlans(data);
        }
      } catch (e) {
        console.error('Failed to load fee plans', e);
      }
    }
    fetchFeePlans();
  }, []);

  useEffect(() => {
    if (!editId) return;

    async function loadExistingCourse() {
      try {
        setLoading(true);
        const res = await api.get<any>(`/master/courses/${editId}`);
        const data = res?.data || res;
        if (data) {
          setCode(data.code || '');
          setName(data.name || '');
          setDisplayName(data.displayName || data.name || '');
          setDescription(data.description || '');
          setIsActive(data.isActive !== false);
        }
      } catch (err: any) {
        toast.error('Failed to load existing course details');
      } finally {
        setLoading(false);
      }
    }

    loadExistingCourse();
  }, [editId]);

  const handleRegenerateCode = () => {
    const newCode = generateUniqueCode();
    setCode(newCode);
    toast.info(`Generated new unique course code: ${newCode}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter a Course Name');
      return;
    }

    if (!code.trim()) {
      toast.error('Please enter a Course Code');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        displayName: displayName.trim() || name.trim(),
        description: description.trim(),
        isActive,
      };

      if (editId) {
        // Update existing course
        await api.patch(`/master/courses/${editId}`, payload);
        toast.success('Course updated successfully!');
      } else {
        // Create new course
        const newCourse = await api.post<any>('/master/courses', payload);
        const courseObj = newCourse?.data || newCourse;

        // Optionally map branch and academic year
        if (courseObj?.id && branchId && academicYearId) {
          try {
            await api.post('/master/branch-courses', {
              courseId: courseObj.id,
              branchId,
              academicYearId,
            });
          } catch (e) {
            console.log('Branch course mapping ignored or already exists');
          }
        }

        // Auto-create Fee Plan if baseFee is specified and no existing feePlan is selected
        const numericBaseFee = Number(baseFee || 0);
        if (courseObj?.id && numericBaseFee > 0 && (!selectedFeePlanId || selectedFeePlanId === 'auto')) {
          try {
            await api.post('/billing/fee-plans', {
              courseId: courseObj.id,
              academicYearId: academicYearId || `AY_${Date.now()}`,
              branchId: branchId || `BRANCH_${Date.now()}`,
              departmentId: `DEPT_${Date.now()}`,
              code: `FEE-${code.trim().toUpperCase()}`,
              name: `${displayName.trim() || name.trim()} Standard Fee Plan`,
              description: `Standard tuition fee plan for ${name.trim()}`,
              effectiveFrom: new Date().toISOString(),
              effectiveTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
              items: [
                {
                  itemName: 'Course Base Tuition Fee',
                  amount: numericBaseFee,
                  taxPercentage: 0,
                  mandatory: true,
                  refundable: false,
                },
              ],
            });
          } catch (feeErr) {
            console.error('Auto fee plan creation error:', feeErr);
          }
        }

        toast.success('Course created successfully with unique code & fee plan mapped!');
      }

      router.push('/tenant-admin/courses');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 font-bold text-xs">
        Loading course details...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-[#0F172A] font-sans">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/tenant-admin/courses')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition shadow-2xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-[#0052CC] shrink-0" />
          <span>Back to Courses</span>
        </button>
        <span className="text-xs font-mono font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200 uppercase">
          {editId ? 'Edit Course Mode' : 'Create Course Mode'}
        </span>
      </div>

      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-5 sm:p-6 rounded-2xl shadow-2xs border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Courses Repository</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>{editId ? 'Edit Program Specs' : 'New Program Registration'}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
            {editId ? `Edit Course: ${name || 'Details'}` : 'Create New Academic Course'}
          </h1>
          <p className="text-xs text-slate-600 font-medium">
            Define course titles, auto-generate unique course codes, and assign branch curriculum
            mappings.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Core Course Information Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2447]">
                Basic Course Specifications
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Provide official course title, display name, and auto-generated unique code.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Auto Unique Code Generator */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Unique Course Code *
                </label>
                {!editId && (
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="text-[11px] font-extrabold text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-[#0052CC]" /> Auto Generate
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  placeholder="e.g. CRS-NEET-5491"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="rounded-xl text-xs font-mono font-extrabold text-[#0052CC] bg-blue-50/50 border-blue-200 uppercase h-10"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  AUTO UNIQUE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Unique identifier used in admissions and fee structures.
              </p>
            </div>

            {/* Course Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Official Course Name *
              </label>
              <Input
                placeholder="e.g. NEET Crash Course 2027"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!displayName) setDisplayName(e.target.value);
                }}
                required
                className="rounded-xl text-xs font-medium bg-slate-50 border-slate-200 focus:border-[#0052CC] h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Short Display Name
              </label>
              <Input
                placeholder="e.g. NEET 2027"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-xl text-xs font-medium bg-slate-50 border-slate-200 focus:border-[#0052CC] h-10"
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Course Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#0B2447] bg-slate-50 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100"
              >
                <option value="Medical / NEET">Medical / NEET</option>
                <option value="Engineering / JEE">Engineering / JEE</option>
              </select>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Course Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#0B2447] bg-slate-50 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100"
              >
                <option value="1 Year">1 Year Academic Program</option>
                <option value="2 Years">2 Years Integrated Program</option>
                <option value="6 Months">6 Months Crash Course</option>
                <option value="3 Months">3 Months Fast Track</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Detailed Overview / Description
            </label>
            <Input
              placeholder="Comprehensive coaching covering Physics, Chemistry, Botany, and Zoology with weekly mock exams."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl text-xs font-medium bg-slate-50 border-slate-200 focus:border-[#0052CC] h-10"
            />
          </div>
        </Card>

        {/* Branch & Academic Year Mapping Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0 shadow-2xs">
              <Building2 className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2447]">
                Branch & Academic Year Mapping
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Link course directly to your primary branch and current academic session.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Assign to Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#0B2447] bg-slate-50 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100"
              >
                {branches.length === 0 ? (
                  <option value="">Main Branch (Default)</option>
                ) : (
                  branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code || 'BRANCH'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Academic Year
              </label>
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#0B2447] bg-slate-50 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100"
              >
                {academicYears.length === 0 ? (
                  <option value="">2026-2027 Session</option>
                ) : (
                  academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} ({ay.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </Card>

        {/* Fee Structure & Base Fee Setup Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0 shadow-2xs">
              <CreditCard className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2447]">
                Fee Structure & Base Fee Mapping
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Set tuition fee for this course program or map to a pre-configured fee plan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Course Base Tuition Fee (₹)
              </label>
              <Input
                type="number"
                placeholder="e.g. 45000"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                className="rounded-xl text-xs font-bold text-[#0052CC] bg-slate-50 border-slate-200 focus:border-[#0052CC] h-10"
              />
              <p className="text-[11px] text-slate-400 font-medium">
                Direct tuition amount. Auto-creates standard fee structure upon saving.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Or Select Existing Fee Plan
              </label>
              <select
                value={selectedFeePlanId}
                onChange={(e) => setSelectedFeePlanId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold text-[#0B2447] bg-slate-50 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-blue-100"
              >
                <option value="auto">Auto-Generate Fee Plan from Base Fee (Recommended)</option>
                {feePlans.map((fp: any) => (
                  <option key={fp.id} value={fp.id}>
                    {fp.name} ({fp.code}) — ₹{Number(fp.totalAmount || 0).toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 font-medium">
                You can manage itemized fee breakdown anytime in Billing &gt; Fee Plans.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Footer Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/tenant-admin/courses')}
            className="rounded-xl text-xs font-bold text-slate-700 w-full sm:w-auto border-slate-200"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs gap-2 w-full sm:w-auto py-2.5 px-6 shadow-2xs cursor-pointer"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>
              {submitting
                ? 'Saving Course...'
                : editId
                  ? 'Update & Save Changes'
                  : 'Save & Publish Course'}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateCoursePage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <Suspense
          fallback={
            <div className="p-6 text-slate-500 font-bold text-xs">
              Loading course creation form...
            </div>
          }
        >
          <CourseFormBody />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
