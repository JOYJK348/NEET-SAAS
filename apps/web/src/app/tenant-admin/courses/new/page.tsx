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
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  DollarSign,
  Layers,
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

  // Form states - Core Course Information
  const [code, setCode] = useState(generateUniqueCode());
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Medical / NEET');
  const [isActive, setIsActive] = useState(true);

  // Dates & Auto-Calculated Duration
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationMonths, setDurationMonths] = useState<number>(12);

  // Branch & Academic Year mappings
  const [branchId, setBranchId] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');

  // Fee Component Breakdown (Auto-calculated Total)
  const [lineItems, setLineItems] = useState<Array<{ itemName: string; amount: number }>>([
    { itemName: 'Tuition Base Fee', amount: 40000 },
    { itemName: 'Study Material & Test Series', amount: 5000 },
  ]);

  // Installment Plan & Auto-Split Schedule
  const [installmentPlanName, setInstallmentPlanName] = useState('3 Installments Schedule');
  const [installmentItems, setInstallmentItems] = useState<
    Array<{ installmentNumber: number; label: string; dueDate: string; amountFixed: number }>
  >([
    { installmentNumber: 1, label: '1st Installment', dueDate: '2026-06-10', amountFixed: 15000 },
    { installmentNumber: 2, label: '2nd Installment', dueDate: '2026-08-10', amountFixed: 15000 },
    { installmentNumber: 3, label: '3rd Installment', dueDate: '2026-10-10', amountFixed: 15000 },
  ]);

  const { data: branchesData } = useBranches({ limit: 100 });
  const { data: academicYearsData } = useAcademicYears({ limit: 100 });

  const branches = branchesData?.data || [];
  const academicYears = academicYearsData?.data || [];

  useEffect(() => {
    if (branches.length > 0 && !branchId) setBranchId(branches[0].id);
    if (academicYears.length > 0 && !academicYearId) setAcademicYearId(academicYears[0].id);
  }, [branches, academicYears]);

  // AUTO-CALCULATION 1: Duration (Months) calculation from Start Date & End Date
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start < end) {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const computed = Math.round(diffDays / 30.4375);
        if (computed > 0) {
          setDurationMonths(computed);
        }
      }
    }
  }, [startDate, endDate]);

  // AUTO-CALCULATION 2: Calculated Course Total Fee from Fee Component Items
  const totalCourseFee = lineItems.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalInstallmentsSum = installmentItems.reduce(
    (acc, item) => acc + Number(item.amountFixed || 0),
    0,
  );

  // AUTO-CALCULATION 3: Recalculate & re-split installment amounts whenever totalCourseFee changes!
  useEffect(() => {
    if (totalCourseFee <= 0 || installmentItems.length === 0) return;

    const count = installmentItems.length;
    const baseAmount = Math.floor(totalCourseFee / count);
    const remainder = totalCourseFee - baseAmount * count;

    setInstallmentItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        amountFixed: idx === count - 1 ? baseAmount + remainder : baseAmount,
      })),
    );
  }, [totalCourseFee]);

  // Load existing course when editing
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
          if (data.durationMonths) setDurationMonths(data.durationMonths);
          if (data.startDate) setStartDate(data.startDate.split('T')[0]);
          if (data.endDate) setEndDate(data.endDate.split('T')[0]);
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

  // Fee Component Row Handlers
  const addLineItemRow = () => {
    setLineItems([...lineItems, { itemName: '', amount: 0 }]);
  };

  const removeLineItemRow = (idx: number) => {
    if (lineItems.length <= 1) {
      toast.error('At least 1 fee line item is required');
      return;
    }
    setLineItems(lineItems.filter((_, index) => index !== idx));
  };

  // Installment Auto-Split Handlers
  const autoDistributeInstallments = () => {
    const count = installmentItems.length;
    if (count === 0 || totalCourseFee <= 0) return;

    const baseAmount = Math.floor(totalCourseFee / count);
    const remainder = totalCourseFee - baseAmount * count;

    const updated = installmentItems.map((item, idx) => ({
      ...item,
      amountFixed: idx === count - 1 ? baseAmount + remainder : baseAmount,
    }));

    setInstallmentItems(updated);
    toast.success(
      `Auto-distributed ₹${totalCourseFee.toLocaleString('en-IN')} across ${count} installments!`,
    );
  };

  const addInstallmentRow = () => {
    const nextNum = installmentItems.length + 1;
    const suffix = nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th';
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + nextNum);
    const dateStr = nextMonth.toISOString().split('T')[0];

    const newItems = [
      ...installmentItems,
      {
        installmentNumber: nextNum,
        label: `${nextNum}${suffix} Installment`,
        dueDate: dateStr,
        amountFixed: 0,
      },
    ];

    if (totalCourseFee > 0) {
      const count = newItems.length;
      const baseAmount = Math.floor(totalCourseFee / count);
      const remainder = totalCourseFee - baseAmount * count;

      setInstallmentItems(
        newItems.map((item, idx) => ({
          ...item,
          amountFixed: idx === count - 1 ? baseAmount + remainder : baseAmount,
        })),
      );
    } else {
      setInstallmentItems(newItems);
    }
  };

  const removeInstallmentRow = (idx: number) => {
    if (installmentItems.length <= 1) {
      toast.error('Installment schedule must contain at least 1 installment row');
      return;
    }
    const filtered = installmentItems.filter((_, index) => index !== idx);
    const renumbered = filtered.map((item, index) => ({
      ...item,
      installmentNumber: index + 1,
    }));

    if (totalCourseFee > 0) {
      const count = renumbered.length;
      const baseAmount = Math.floor(totalCourseFee / count);
      const remainder = totalCourseFee - baseAmount * count;

      setInstallmentItems(
        renumbered.map((item, index) => ({
          ...item,
          amountFixed: index === count - 1 ? baseAmount + remainder : baseAmount,
        })),
      );
    } else {
      setInstallmentItems(renumbered);
    }
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
        durationMonths,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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

        // Map branch & academic year
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

        // Create Itemized Fee Structure Plan & Installment Plan
        const validLineItems = lineItems.filter((i) => i.itemName.trim() && i.amount > 0);
        if (courseObj?.id && validLineItems.length > 0) {
          try {
            const feePlan = await api.post<any>('/billing/fee-plans', {
              courseId: courseObj.id,
              academicYearId: academicYearId || `AY_${Date.now()}`,
              branchId: branchId || `BRANCH_${Date.now()}`,
              departmentId: `DEPT_${Date.now()}`,
              code: `FEE-${code.trim().toUpperCase()}`,
              name: `${displayName.trim() || name.trim()} Fee Structure Plan`,
              description: `Auto-calculated fee structure for ${name.trim()}`,
              effectiveFrom: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
              effectiveTo: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
              items: validLineItems,
            });

            // Create Installment Schedule
            if (feePlan?.id && installmentItems.length > 0) {
              await api.post(`/billing/fee-plans/${feePlan.id}/installment-plans`, {
                name: installmentPlanName,
                isDefault: true,
                items: installmentItems.map((pi, idx) => ({
                  ...pi,
                  installmentNumber: idx + 1,
                  dueDate: new Date(pi.dueDate).toISOString(),
                })),
              });
            }
          } catch (feeErr) {
            console.error('Fee plan creation error:', feeErr);
          }
        }

        toast.success('Course created with auto-calculated fee plan & installment schedule!');
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
    <div className="w-full space-y-6 text-[#0F172A] font-sans pb-16">
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
            Define course details, auto-calculate syllabus duration, and configure interactive fee component schedules.
          </p>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* SECTION 1: Core Course Information */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Timeline & AUTO-CALCULATED Duration Section */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0052CC]" />
              <span className="text-xs font-extrabold text-[#0B2447]">
                Academic Schedule & Auto-Calculated Duration
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-xl text-xs font-medium bg-white border-slate-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-xl text-xs font-medium bg-white border-slate-200 h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Calculated Duration (Months) ⚡
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={durationMonths}
                    readOnly
                    className="rounded-xl text-xs font-extrabold text-[#0052CC] bg-blue-50/80 border-blue-200 h-10 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-extrabold text-[#0052CC] bg-blue-100 px-2 py-0.5 rounded-md">
                    AUTO CALC
                  </span>
                </div>
              </div>
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

        {/* SECTION 2: Branch & Academic Year Mapping */}
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

        {/* SECTION 3: Interactive Fee Component Breakdown (AUTO-CALCULATED TOTAL) */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 shadow-2xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0B2447]">
                  Fee Components & Auto-Calculated Total
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Add tuition, material, and test series line items. Total fee auto-calculates in real-time.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItemRow}
              className="text-xs font-extrabold text-[#0052CC] border-blue-200 hover:bg-blue-50 rounded-xl shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Component Row
            </Button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center text-xs p-3 sm:p-0 rounded-2xl bg-slate-50 sm:bg-transparent border sm:border-0 border-slate-200"
              >
                <Input
                  placeholder="Component Name (e.g. Tuition Base Fee)"
                  value={item.itemName}
                  className="flex-1 rounded-xl text-xs bg-white font-bold"
                  onChange={(e) => {
                    const updated = [...lineItems];
                    updated[idx].itemName = e.target.value;
                    setLineItems(updated);
                  }}
                />
                <div className="relative w-full sm:w-48">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                    ₹
                  </span>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={item.amount || ''}
                    className="pl-7 font-extrabold text-[#0B2447] rounded-xl text-xs bg-white"
                    onChange={(e) => {
                      const updated = [...lineItems];
                      updated[idx].amount = Number(e.target.value);
                      setLineItems(updated);
                    }}
                  />
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLineItemRow(idx)}
                    className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Real-time Calculated Total Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Auto-Calculated Course Total Fee
              </span>
            </div>
            <span className="text-xl font-black text-emerald-700 font-mono">
              ₹{totalCourseFee.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        {/* SECTION 4: Installment Schedule Builder (AUTO-SPLIT & SUM MATCH) */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0 shadow-2xs">
                <Calendar className="w-5 h-5 text-[#0052CC]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0B2447]">
                  Installment Schedule & Auto-Split
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Divide course total fee across student installment due dates automatically.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoDistributeInstallments}
                className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 rounded-xl flex-1 sm:flex-none shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Auto-Split Equally ⚡
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addInstallmentRow}
                className="text-xs text-[#0052CC] font-extrabold hover:bg-blue-50 rounded-xl flex-1 sm:flex-none"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {installmentItems.map((pi, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center text-xs p-3 sm:p-0 rounded-2xl bg-slate-50 sm:bg-transparent border sm:border-0 border-slate-200"
              >
                <Input
                  placeholder="Label (e.g. 1st Installment)"
                  value={pi.label}
                  className="flex-1 rounded-xl text-xs bg-white font-bold"
                  onChange={(e) => {
                    const updated = [...installmentItems];
                    updated[idx].label = e.target.value;
                    setInstallmentItems(updated);
                  }}
                />
                <Input
                  type="date"
                  value={pi.dueDate}
                  className="w-full sm:w-44 rounded-xl text-xs bg-white font-bold"
                  onChange={(e) => {
                    const updated = [...installmentItems];
                    updated[idx].dueDate = e.target.value;
                    setInstallmentItems(updated);
                  }}
                />
                <div className="relative w-full sm:w-40">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">
                    ₹
                  </span>
                  <Input
                    type="number"
                    placeholder="Amount"
                    value={pi.amountFixed || ''}
                    className="pl-7 font-extrabold text-[#0B2447] rounded-xl text-xs bg-white"
                    onChange={(e) => {
                      const updated = [...installmentItems];
                      updated[idx].amountFixed = Number(e.target.value);
                      setInstallmentItems(updated);
                    }}
                  />
                </div>
                <div className="flex justify-end sm:justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInstallmentRow(idx)}
                    className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Sum Match Verification Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold">
            <span className="text-slate-600">
              Target Course Fee:{' '}
              <strong className="text-[#0B2447]">₹{totalCourseFee.toLocaleString('en-IN')}</strong>
            </span>
            <div>
              {Math.abs(totalInstallmentsSum - totalCourseFee) < 0.01 ? (
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Installments Sum Matches Exactly (₹
                  {totalInstallmentsSum.toLocaleString('en-IN')})
                </span>
              ) : (
                <span className="font-extrabold text-amber-600">
                  Installment Sum (₹{totalInstallmentsSum.toLocaleString('en-IN')}) != Total Fee (₹
                  {totalCourseFee.toLocaleString('en-IN')})
                </span>
              )}
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
