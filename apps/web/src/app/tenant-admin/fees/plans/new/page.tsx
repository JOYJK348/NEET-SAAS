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
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  DollarSign,
  Calendar,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

function FeePlanFormBody() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states for Fee Plan
  const [code, setCode] = useState(`NEET-${Date.now().toString().slice(-4)}`);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lineItems, setLineItems] = useState<Array<{ itemName: string; amount: number }>>([
    { itemName: 'Tuition Fee', amount: 50000 },
    { itemName: 'Material Fee', amount: 10000 },
  ]);

  // Installment Option Toggle & Items
  const [includeInstallments] = useState(true);
  const [installmentPlanName, setInstallmentPlanName] = useState('3 Installments Schedule');
  const [installmentItems, setInstallmentItems] = useState<
    Array<{ installmentNumber: number; label: string; dueDate: string; amountFixed: number }>
  >([
    { installmentNumber: 1, label: '1st Installment', dueDate: '2026-06-10', amountFixed: 20000 },
    { installmentNumber: 2, label: '2nd Installment', dueDate: '2026-08-10', amountFixed: 20000 },
    { installmentNumber: 3, label: '3rd Installment', dueDate: '2026-10-10', amountFixed: 20000 },
  ]);

  const [courses, setCourses] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [courseId, setCourseId] = useState<string>('COURSE_NEET');

  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await api.get<any>('/master/courses');
        const list = res?.data || res?.items || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setCourses(list);
          if (!courseId || courseId === 'COURSE_NEET') setCourseId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!editId) return;

    async function loadExistingPlan() {
      try {
        setLoading(true);
        const data = await api.get<any>(`/billing/fee-plans/${editId}`);
        if (data) {
          setCode(data.code || '');
          setName(data.name || '');
          setDescription(data.description || '');
          if (data.courseId) setCourseId(data.courseId);

          if (data.items && data.items.length > 0) {
            setLineItems(
              data.items.map((i: any) => ({
                itemName: i.itemName,
                amount: Number(i.amount || 0),
              })),
            );
          }

          if (data.installmentPlans && data.installmentPlans.length > 0) {
            const defaultIp = data.installmentPlans[0];
            setInstallmentPlanName(defaultIp.name || 'Installment Schedule');
            if (defaultIp.items && defaultIp.items.length > 0) {
              setInstallmentItems(
                defaultIp.items.map((ipi: any) => ({
                  installmentNumber: ipi.installmentNumber,
                  label: ipi.label,
                  dueDate: ipi.dueDate ? ipi.dueDate.split('T')[0] : '',
                  amountFixed: Number(ipi.amountFixed || 0),
                })),
              );
            }
          }
        }
      } catch (err: any) {
        toast.error('Failed to load existing fee plan for editing');
      } finally {
        setLoading(false);
      }
    }

    loadExistingPlan();
  }, [editId]);

  const totalCourseFee = lineItems.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalInstallmentsSum = installmentItems.reduce(
    (acc, item) => acc + Number(item.amountFixed || 0),
    0,
  );

  // Automatically recalculate & re-split installment amounts whenever totalCourseFee changes!
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
      toast.error('Please enter a Fee Plan Name');
      return;
    }

    const validLineItems = lineItems.filter((i) => i.itemName.trim() && i.amount > 0);
    if (validLineItems.length === 0) {
      toast.error('Please add at least 1 valid line item with an amount > ₹0');
      return;
    }

    try {
      setSubmitting(true);

      if (editId) {
        // UPDATE EXISTING FEE PLAN
        await api.patch(`/billing/fee-plans/${editId}`, {
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          items: validLineItems,
        });

        // Add or replace installment plan
        if (includeInstallments && installmentItems.length > 0) {
          await api.post(`/billing/fee-plans/${editId}/installment-plans`, {
            name: installmentPlanName,
            isDefault: true,
            items: installmentItems.map((pi, idx) => ({
              ...pi,
              installmentNumber: idx + 1,
              dueDate: new Date(pi.dueDate).toISOString(),
            })),
          });
        }

        toast.success('Fee Plan updated successfully!');
      } else {
        // CREATE NEW FEE PLAN
        const newPlan = await api.post<any>('/billing/fee-plans', {
          courseId: courseId || 'COURSE_NEET',
          academicYearId: 'AY_2026_2027',
          branchId: `BRANCH_${Date.now()}`,
          departmentId: `DEPT_${Date.now()}`,
          code: code.trim(),
          name: name.trim(),
          description: description.trim(),
          effectiveFrom: new Date().toISOString(),
          effectiveTo: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
          items: validLineItems,
        });

        if (includeInstallments && newPlan?.id && installmentItems.length > 0) {
          await api.post(`/billing/fee-plans/${newPlan.id}/installment-plans`, {
            name: installmentPlanName,
            isDefault: true,
            items: installmentItems.map((pi, idx) => ({
              ...pi,
              installmentNumber: idx + 1,
              dueDate: new Date(pi.dueDate).toISOString(),
            })),
          });
        }

        toast.success('Fee Plan created successfully!');
      }

      router.push('/tenant-admin/fees/plans');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save fee plan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-slate-500 font-medium">
        Loading fee plan configuration...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
      {/* Header Banner - ISML LMS Light Blue Style */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
            onClick={() => router.push('/tenant-admin/fees/plans')}
          >
            <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Fee Plans</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>{editId ? 'Edit Fee Plan' : 'Create Fee Plan'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2447]">
              {editId ? `Edit Fee Plan: ${name || 'Details'}` : 'Create New Fee Plan & Schedule'}
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Configure course fee structures, component line items, and dynamic calendar
              installment schedules.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form (Full Screen / Full Width) */}
      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B2447]">Basic Plan Details</h3>
              <p className="text-xs text-slate-500 font-medium">
                Specify the unique code, course title, and plan description.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                Target Course Program *
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold focus:outline-none focus:border-[#0052CC] bg-slate-50 text-slate-800"
              >
                {courses.length === 0 ? (
                  <option value="COURSE_NEET">NEET Master Course (Default)</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                Plan Code *
              </label>
              <Input
                placeholder="NEET-2027-STD"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="rounded-xl text-xs font-bold font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                Plan Name *
              </label>
              <Input
                placeholder="NEET 2027 Standard Course Fee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
              Description
            </label>
            <Input
              placeholder="Full annual course fee including tuition, test series, and study material"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl text-xs font-medium"
            />
          </div>
        </Card>

        {/* Line Items Breakdown Card */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0B2447]">Fee Component Breakdown</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Break down the fee into Tuition, Materials, and Exam fees.
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
                  placeholder="Component Name (e.g. Tuition Fee)"
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

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Calculated Course Total</span>
            <span className="text-lg font-extrabold text-emerald-600">
              ₹{totalCourseFee.toLocaleString('en-IN')}
            </span>
          </div>
        </Card>

        {/* Installment Schedule Section */}
        <Card className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-200 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0B2447]">
                  Installment Schedule Setup
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Divide the total course fee into flexible due dates.
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
                <RefreshCw className="w-3 h-3 mr-1 text-emerald-600" /> Auto-Split Equally
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

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
              Schedule Name
            </label>
            <Input
              placeholder="3 Installments Schedule"
              value={installmentPlanName}
              onChange={(e) => setInstallmentPlanName(e.target.value)}
              className="rounded-xl text-xs max-w-md font-bold"
            />
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
            onClick={() => router.push('/tenant-admin/fees/plans')}
            className="rounded-xl text-xs font-bold text-slate-700 w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={submitting}
            className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs gap-2 w-full sm:w-auto py-3 sm:py-2 shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {submitting
                ? 'Saving Fee Plan...'
                : editId
                  ? 'Update & Save Changes'
                  : 'Save & Publish Fee Plan'}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CreateFeePlanPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <DashboardLayout>
        <Suspense fallback={<div className="p-6 text-slate-500 font-bold">Loading form...</div>}>
          <FeePlanFormBody />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
