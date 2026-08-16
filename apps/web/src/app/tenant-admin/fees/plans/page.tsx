'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Layers,
  Search,
  Sparkles,
  BookMarked,
  CheckCircle2,
  X,
  Trash2,
  RefreshCw,
  DollarSign,
  Pencil,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface FeePlanItem {
  id: string;
  itemName: string;
  amount: number;
  taxPercentage: number;
  mandatory: boolean;
}

interface InstallmentItem {
  id: string;
  installmentNumber: number;
  label: string;
  dueDate: string;
  amountFixed: number | null;
  amountPercentage: number | null;
}

interface InstallmentPlan {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  items: InstallmentItem[];
}

interface FeePlan {
  id: string;
  code: string;
  name: string;
  description: string;
  totalAmount: number;
  status: string;
  items: FeePlanItem[];
  installmentPlans: InstallmentPlan[];
}

function FeePlansContent() {
  const router = useRouter();
  const [plans, setPlans] = useState<FeePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Inline Installment Schedule Form Panel (Per Fee Plan)
  const [activeInstallmentPlanId, setActiveInstallmentPlanId] = useState<string | null>(null);

  // Form states for new Installment Plan
  const [planName, setPlanName] = useState('3 Installments Plan');
  const [planItems, setPlanItems] = useState<
    Array<{ installmentNumber: number; label: string; dueDate: string; amountFixed: number }>
  >([
    { installmentNumber: 1, label: '1st Installment', dueDate: '2026-06-10', amountFixed: 20000 },
    { installmentNumber: 2, label: '2nd Installment', dueDate: '2026-08-10', amountFixed: 20000 },
    { installmentNumber: 3, label: '3rd Installment', dueDate: '2026-10-10', amountFixed: 20000 },
  ]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await api.get<FeePlan[]>('/billing/fee-plans');
      setPlans(data);
    } catch (err: any) {
      toast.error('Failed to load fee plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openInstallmentPanel = (plan: FeePlan) => {
    if (activeInstallmentPlanId === plan.id) {
      setActiveInstallmentPlanId(null);
      return;
    }

    setActiveInstallmentPlanId(plan.id);
    setPlanName(`${plan.name} - Installment Schedule`);

    const total = Number(plan.totalAmount) || 0;
    const initialCount = 3;
    const baseAmount = Math.floor(total / initialCount);
    const remainder = total - baseAmount * initialCount;

    const initialItems = Array.from({ length: initialCount }, (_, idx) => {
      const nextNum = idx + 1;
      const suffix = nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th';
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + nextNum);
      const dateStr = nextMonth.toISOString().split('T')[0];

      const amountFixed = idx === initialCount - 1 ? baseAmount + remainder : baseAmount;

      return {
        installmentNumber: nextNum,
        label: `${nextNum}${suffix} Installment`,
        dueDate: dateStr,
        amountFixed,
      };
    });

    setPlanItems(initialItems);
  };

  const autoDistributeEqually = () => {
    const activePlan = plans.find((p) => p.id === activeInstallmentPlanId);
    const total = Number(activePlan?.totalAmount) || 0;
    const count = planItems.length;

    if (count === 0 || total <= 0) return;

    const baseAmount = Math.floor(total / count);
    const remainder = total - baseAmount * count;

    const updated = planItems.map((item, idx) => ({
      ...item,
      amountFixed: idx === count - 1 ? baseAmount + remainder : baseAmount,
    }));

    setPlanItems(updated);
    toast.success(`Auto-distributed ₹${total.toLocaleString('en-IN')} equally across ${count} installments!`);
  };

  const addInstallmentRow = () => {
    const nextNum = planItems.length + 1;
    const suffix = nextNum === 1 ? 'st' : nextNum === 2 ? 'nd' : nextNum === 3 ? 'rd' : 'th';
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + nextNum);
    const dateStr = nextMonth.toISOString().split('T')[0];

    const activePlan = plans.find((p) => p.id === activeInstallmentPlanId);
    const total = Number(activePlan?.totalAmount) || 0;

    const newItems = [
      ...planItems,
      {
        installmentNumber: nextNum,
        label: `${nextNum}${suffix} Installment`,
        dueDate: dateStr,
        amountFixed: 0,
      },
    ];

    if (total > 0) {
      const count = newItems.length;
      const baseAmount = Math.floor(total / count);
      const remainder = total - baseAmount * count;

      setPlanItems(
        newItems.map((item, idx) => ({
          ...item,
          amountFixed: idx === count - 1 ? baseAmount + remainder : baseAmount,
        })),
      );
    } else {
      setPlanItems(newItems);
    }
  };

  const removeInstallmentRow = (index: number) => {
    if (planItems.length <= 1) {
      toast.error('Installment plan must contain at least 1 installment row');
      return;
    }
    const filtered = planItems.filter((_, idx) => idx !== index);
    const renumbered = filtered.map((item, idx) => ({
      ...item,
      installmentNumber: idx + 1,
    }));

    const activePlan = plans.find((p) => p.id === activeInstallmentPlanId);
    const total = Number(activePlan?.totalAmount) || 0;

    if (total > 0) {
      const count = renumbered.length;
      const baseAmount = Math.floor(total / count);
      const remainder = total - baseAmount * count;

      setPlanItems(
        renumbered.map((item, idx) => ({
          ...item,
          amountFixed: idx === count - 1 ? baseAmount + remainder : baseAmount,
        })),
      );
    } else {
      setPlanItems(renumbered);
    }
  };

  const handleCreateInstallmentPlan = async (feePlanId: string) => {
    try {
      if (planItems.length === 0) {
        toast.error('Please add at least 1 installment row');
        return;
      }

      await api.post(`/billing/fee-plans/${feePlanId}/installment-plans`, {
        name: planName,
        isDefault: true,
        items: planItems.map((pi, idx) => ({
          ...pi,
          installmentNumber: idx + 1,
          dueDate: new Date(pi.dueDate).toISOString(),
        })),
      });

      toast.success('Installment schedule added!');
      setActiveInstallmentPlanId(null);
      loadPlans();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add installment plan');
    }
  };

  const formatRupees = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const filteredPlans = plans.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
    }
    return true;
  });

  const totalFeePlans = plans.length;
  const totalInstallmentSchedules = plans.reduce((acc, p) => acc + (p.installmentPlans?.length || 0), 0);
  const totalValue = plans.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Financial Fee Architecture
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Fee Plans & Installment Schedules 💳
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Configure course fee structures, component line items, and student installment due dates.
            </p>
          </div>

          <Button
            onClick={() => router.push('/tenant-admin/fees/plans/new')}
            className="w-full sm:w-auto gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs shrink-0 rounded-xl text-xs"
          >
            <Plus className="h-4 w-4 text-violet-600 shrink-0" />
            <span>Create New Fee Plan</span>
          </Button>
        </div>

        {/* KPI Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Total Fee Plans
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{totalFeePlans}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Configured Schedules
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{totalInstallmentSchedules}</p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Combined Course Value
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">{formatRupees(totalValue)}</p>
            </div>
          </Card>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search fee plans by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent p-0 focus:outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Fee Plans List */}
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading fee plans...</div>
        ) : filteredPlans.length === 0 ? (
          <Card className="p-12 text-center border-dashed rounded-2xl border-slate-200 bg-white shadow-xs">
            <Layers className="w-12 h-12 mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Fee Plans Configured</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
              Get started by creating your first fee structure to manage student tuition & installment plans.
            </p>
            <Button onClick={() => router.push('/tenant-admin/fees/plans/new')} className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs">
              <Plus className="w-4 h-4 mr-2" /> Create Fee Plan
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
                        {plan.code}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                    </div>
                    {plan.description && (
                      <p className="text-xs text-slate-500 mt-1">{plan.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block tracking-wider">Total Fee Amount</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {formatRupees(plan.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Line Items Breakdown */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Fee Component Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {plan.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
                      >
                        <span className="text-xs font-semibold text-slate-700">
                          {item.itemName}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {formatRupees(Number(item.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Installment Plans Section */}
                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Configured Installment Schedules
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/tenant-admin/fees/plans/new?id=${plan.id}`)}
                        className="rounded-xl text-xs font-bold text-slate-700 border-slate-200 hover:bg-slate-50 flex-1 sm:flex-none"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        Edit Plan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInstallmentPanel(plan)}
                        className="rounded-xl text-xs font-bold text-violet-600 border-violet-200 hover:bg-violet-50 flex-1 sm:flex-none"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        {activeInstallmentPlanId === plan.id ? 'Close Panel' : 'Add Installment Schedule'}
                      </Button>
                    </div>
                  </div>

                  {/* INLINE INSTALLMENT CREATION FORM PANEL */}
                  {activeInstallmentPlanId === plan.id && (
                    <div className="mb-4 p-4 sm:p-5 rounded-2xl bg-violet-50/50 border border-violet-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between border-b border-violet-200/60 pb-2">
                        <h4 className="text-sm font-bold text-violet-900">Configure Installment Schedule for {plan.name}</h4>
                        <button onClick={() => setActiveInstallmentPlanId(null)} className="text-violet-400 hover:text-violet-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-600 block mb-1">Schedule Plan Name</label>
                          <Input
                            placeholder="3 Installments Plan"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            className="rounded-xl text-xs bg-white"
                          />
                        </div>

                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                            <label className="text-xs font-bold text-slate-600 block">
                              Installment Rows & Fixed Calendar Due Dates
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={autoDistributeEqually}
                                className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 rounded-xl flex-1 sm:flex-none"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" /> Auto-Split Equally
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addInstallmentRow}
                                className="text-xs text-violet-700 font-bold hover:bg-violet-100 rounded-xl flex-1 sm:flex-none"
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                            {planItems.map((pi, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center text-xs p-3 sm:p-0 rounded-2xl bg-white sm:bg-transparent border sm:border-0 border-violet-100">
                                <Input
                                  placeholder="Label (e.g. 1st Installment)"
                                  value={pi.label}
                                  className="flex-1 rounded-xl text-xs bg-white"
                                  onChange={(e) => {
                                    const newItems = [...planItems];
                                    newItems[idx].label = e.target.value;
                                    setPlanItems(newItems);
                                  }}
                                />
                                <Input
                                  type="date"
                                  value={pi.dueDate}
                                  className="w-full sm:w-36 rounded-xl text-xs bg-white"
                                  onChange={(e) => {
                                    const newItems = [...planItems];
                                    newItems[idx].dueDate = e.target.value;
                                    setPlanItems(newItems);
                                  }}
                                />
                                <Input
                                  type="number"
                                  placeholder="Amount ₹"
                                  value={pi.amountFixed || ''}
                                  className="w-full sm:w-32 font-bold text-slate-900 rounded-xl text-xs bg-white"
                                  onChange={(e) => {
                                    const newItems = [...planItems];
                                    newItems[idx].amountFixed = Number(e.target.value);
                                    setPlanItems(newItems);
                                  }}
                                />
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

                          {(() => {
                            const targetTotal = Number(plan.totalAmount) || 0;
                            const currentSum = planItems.reduce((acc, i) => acc + Number(i.amountFixed || 0), 0);
                            const matches = Math.abs(currentSum - targetTotal) < 0.01;

                            return (
                              <div className="mt-3 p-3 rounded-xl bg-white border border-violet-100 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">
                                  Total Course Fee: <strong className="text-slate-900">₹{targetTotal.toLocaleString('en-IN')}</strong>
                                </span>
                                <div className="flex items-center gap-2">
                                  {matches ? (
                                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Sum Matches (₹{currentSum.toLocaleString('en-IN')})
                                    </span>
                                  ) : (
                                    <span className="font-bold text-amber-600">
                                      ⚠️ Sum: ₹{currentSum.toLocaleString('en-IN')} (Diff: ₹{(targetTotal - currentSum).toLocaleString('en-IN')})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-violet-200/60">
                          <Button type="button" variant="outline" onClick={() => setActiveInstallmentPlanId(null)} className="rounded-xl text-xs">
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleCreateInstallmentPlan(plan.id)}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs"
                          >
                            Save Installment Schedule
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {plan.installmentPlans.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                      ⚠️ No installment plan attached. Students assigned to this fee will pay full ₹
                      {plan.totalAmount} up front.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {plan.installmentPlans.map((ip) => (
                        <div
                          key={ip.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-violet-700">
                              {ip.name}
                            </span>
                            {ip.isDefault && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Default Plan
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {(ip.items || []).map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs flex flex-col justify-between"
                              >
                                <span className="font-semibold text-slate-700">
                                  {item.label}
                                </span>
                                <div className="mt-1 flex items-center justify-between text-slate-500">
                                  <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                  <span className="font-bold text-slate-900">
                                    {formatRupees(Number(item.amountFixed || 0))}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TenantAdminFeePlansPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <FeePlansContent />
    </ProtectedRoute>
  );
}
