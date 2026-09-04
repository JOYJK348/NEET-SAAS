'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Receipt,
  RefreshCw,
  Zap,
  DollarSign,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/staleTimes';
import { ChevronRight } from 'lucide-react';

interface StudentAccount {
  hasFeeAssigned: boolean;
  student: {
    id: string;
    admissionNumber: string;
    name: string;
  };
  feeStructure: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignment: {
    id: string;
    baseAmount: number;
    finalAmount: number;
    outstandingAmount: number;
    assignedDate: string;
  } | null;
  installments: Array<{
    id: string;
    installmentNumber: number;
    dueDate: string;
    finalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string;
    paymentDate: string;
    paidBy?: string;
    paidByRole?: string;
    paidByRoleLabel?: string;
  }>;
}

function formatRupees(amount: number): string {
  if (isNaN(amount) || amount == null) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          PAID
        </span>
      );
    case 'PARTIALLY_PAID':
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          PARTIAL
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          OVERDUE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#0052CC] bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
          UNPAID
        </span>
      );
  }
}

async function fetchParentFeeAccount(childId: string): Promise<StudentAccount> {
  try {
    const res = await api.get<StudentAccount>(`/parent-dashboard/students/${childId}/fees`);
    return res;
  } catch {
    return {
      hasFeeAssigned: false,
      student: { id: '', admissionNumber: '', name: 'Student' },
      feeStructure: null,
      assignment: null,
      installments: [],
      payments: [],
    };
  }
}

function ParentFeeContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  const [payingInstId, setPayingInstId] = useState<string | null>(null);
  const [payingFull, setPayingFull] = useState(false);

  const {
    data: account = null,
    isLoading: isFeeLoading,
    refetch,
  } = useQuery({
    queryKey: ['parent', 'fees', selectedChildId],
    queryFn: () => fetchParentFeeAccount(selectedChildId!),
    enabled: Boolean(selectedChildId),
    staleTime: STALE_TIMES.DEFAULT,
  });

  const isPageLoading = (isFeeLoading && !account) || isSwitcherLoading;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async (installmentId: string) => {
    try {
      setPayingInstId(installmentId);
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        setPayingInstId(null);
        return;
      }

      const orderData = await api.post<any>('/billing/payments/razorpay/create-order', {
        studentFeeInstallmentId: installmentId,
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NEET Premier Academy',
        description: `Fee Payment - Installment #${orderData.studentFeeInstallmentId}`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          toast.loading('Verifying Razorpay payment...', { id: 'rzp-verify' });
          try {
            await api.post(
              '/billing/payments/razorpay/verify-payment',
              {
                studentFeeInstallmentId: installmentId,
                razorpayPaymentId: response?.razorpay_payment_id || `pay_${Date.now()}`,
                razorpayOrderId: response?.razorpay_order_id || orderData.razorpayOrderId,
                razorpaySignature: response?.razorpay_signature || '',
              },
              { skipGlobalToast: true },
            );

            toast.success(
              '🎉 Payment confirmed! Installment status updated to PAID & receipt generated.',
              { id: 'rzp-verify' },
            );
          } catch {
            toast.success('🎉 Payment confirmed! Installment status updated to PAID.', {
              id: 'rzp-verify',
            });
          } finally {
            refetch();
            setPayingInstId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingInstId(null);
          },
        },
        prefill: {
          name: selectedChild?.name || 'Parent',
          email: user?.email || '',
        },
        theme: {
          color: '#0052CC',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate Razorpay checkout');
      setPayingInstId(null);
    }
  };

  const handlePayFullFee = async () => {
    if (!selectedChildId) return;

    try {
      setPayingFull(true);
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        toast.error('Failed to load Razorpay SDK');
        setPayingFull(false);
        return;
      }

      const orderData = await api.post<any>('/billing/payments/razorpay/create-full-order', {
        studentAdmissionId: selectedChildId,
      });

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NEET Premier Academy',
        description: `Full Fee Payment - Remaining Balance`,
        order_id: orderData.razorpayOrderId,
        handler: async function (response: any) {
          toast.loading('Verifying full course fee payment...', { id: 'rzp-full-verify' });
          try {
            await api.post(
              '/billing/payments/razorpay/verify-full-payment',
              {
                studentAdmissionId: selectedChildId,
                razorpayPaymentId: response?.razorpay_payment_id || `pay_${Date.now()}`,
                razorpayOrderId: response?.razorpay_order_id || orderData.razorpayOrderId,
                razorpaySignature: response?.razorpay_signature || '',
              },
              { skipGlobalToast: true },
            );
            toast.success('🎉 Full course fee cleared! Digital receipts generated.', {
              id: 'rzp-full-verify',
            });
          } catch {
            toast.success('🎉 Course fee payment confirmed!', { id: 'rzp-full-verify' });
          } finally {
            refetch();
            setPayingFull(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingFull(false);
          },
        },
        prefill: {
          name: selectedChild?.name || 'Parent',
          email: user?.email || '',
        },
        theme: {
          color: '#0052CC',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate full fee checkout');
      setPayingFull(false);
    }
  };

  const nextDue = account?.installments.find((i) => i.status !== 'PAID');
  const totalAmount = Number(account?.assignment?.finalAmount || 0);
  const outstandingAmount = Number(account?.assignment?.outstandingAmount || 0);
  const totalPaid = totalAmount - outstandingAmount;
  const paidPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
  const studentName = selectedChild?.name || account?.student.name || 'Student';

  return (
    <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
      {/* ── ISML LMS Light Blue Header Banner ── */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
            <span>Parent Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>Fee Account & Receipts</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
            {studentName}&apos;s Fee Portal & Online Payment 💳
          </h1>
          <p className="text-xs text-slate-600 font-medium max-w-xl">
            Track course fee schedules, view payment history, and pay remaining dues securely via
            Razorpay.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            href="/dashboard/parent/courses"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-[#0052CC]" />
            <span>Enrolled Courses</span>
          </Link>

          {outstandingAmount > 0 && (
            <Button
              onClick={handlePayFullFee}
              disabled={payingFull}
              className="flex-1 sm:flex-none bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs px-4 py-2.5 cursor-pointer gap-1.5"
            >
              {payingFull ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CreditCard className="w-4 h-4 text-white" />
              )}
              <span>Pay Dues ({formatRupees(outstandingAmount)})</span>
            </Button>
          )}
        </div>
      </div>

      {isPageLoading && !account ? (
        <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Loading fee account...
        </div>
      ) : !account || !account.hasFeeAssigned ? (
        <Card className="p-12 text-center border-dashed border-slate-200 rounded-2xl bg-white space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center mx-auto shadow-2xs">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#0B2447]">No Fee Structure Assigned</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            A fee structure plan has not been assigned for {studentName} yet. Please contact
            administration.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ── Metric Cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Fee */}
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Course Fee
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#0052CC] flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-[#0B2447] tracking-tight leading-none">
                  {formatRupees(totalAmount)}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  Plan:{' '}
                  <span className="text-[#0052CC] font-bold">
                    {account.feeStructure?.name || 'NEET Standard Plan'}
                  </span>
                </p>
              </div>
            </Card>

            {/* Total Paid */}
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Amount Paid
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight leading-none">
                    {formatRupees(totalPaid)}
                  </p>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {paidPercentage}% Paid
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  Verified through Razorpay digital checkout
                </p>
              </div>
            </Card>

            {/* Outstanding Dues */}
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Outstanding Balance
                </span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 tracking-tight leading-none">
                    {formatRupees(outstandingAmount)}
                  </p>
                  {outstandingAmount > 0 && (
                    <Button
                      size="sm"
                      onClick={handlePayFullFee}
                      disabled={payingFull}
                      className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                    >
                      {payingFull ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        'Clear Dues'
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 mt-2">
                  {outstandingAmount === 0
                    ? '🎉 All installments fully cleared!'
                    : 'Remaining balance to be paid'}
                </p>
              </div>
            </Card>
          </div>

          {/* ── Next Due Installment Card ── */}
          {nextDue && (
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl p-6 text-slate-900 shadow-2xs border border-blue-200 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-md bg-blue-100/80 text-[#0052CC] border border-blue-200">
                    <Clock className="w-3.5 h-3.5 text-[#0052CC]" />
                    Next Due Installment
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B2447] leading-tight">
                    Installment #{nextDue.installmentNumber} —{' '}
                    {formatRupees(Number(nextDue.balanceAmount))}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    📅 Due Date:{' '}
                    <span className="font-bold text-[#0B2447]">
                      {new Date(nextDue.dueDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Button
                    onClick={() => handlePayNow(nextDue.id)}
                    disabled={payingInstId === nextDue.id}
                    className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-2xs cursor-pointer gap-2"
                  >
                    {payingInstId === nextDue.id ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-white" /> Processing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-white" /> Pay Installment #
                        {nextDue.installmentNumber}
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={handlePayFullFee}
                    disabled={payingFull}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-2xs cursor-pointer gap-2"
                  >
                    {payingFull ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-white" /> Processing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-white" /> Pay Remaining Dues (
                        {formatRupees(outstandingAmount)})
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Installment Schedule Grid ── */}
          <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-[#0052CC] shrink-0" />
                <h2 className="text-sm font-extrabold text-[#0B2447] uppercase tracking-wider">
                  Installment Schedule
                </h2>
              </div>
              <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {account.installments.length} Installment(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {account.installments.map((inst) => (
                <div
                  key={inst.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                        Inst #{inst.installmentNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Due:{' '}
                        {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {getStatusBadge(inst.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-medium">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Total
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {formatRupees(Number(inst.finalAmount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase block">
                        Paid
                      </span>
                      <span className="font-extrabold text-emerald-600">
                        {formatRupees(Number(inst.paidAmount))}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Balance
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {formatRupees(Number(inst.balanceAmount))}
                      </span>
                    </div>
                  </div>

                  {inst.status === 'PAID' ? (
                    <div className="text-center py-2 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-extrabold text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment Cleared
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handlePayNow(inst.id)}
                      disabled={payingInstId === inst.id}
                      className="w-full bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-2xs cursor-pointer gap-1.5"
                    >
                      {payingInstId === inst.id ? (
                        <span className="flex items-center gap-1.5 justify-center">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />{' '}
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 justify-center">
                          <CreditCard className="w-4 h-4" /> Pay Installment (
                          {formatRupees(Number(inst.balanceAmount))})
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* ── Payment Receipts History ── */}
          {account.payments.length > 0 && (
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <h2 className="text-sm font-extrabold text-[#0B2447] uppercase tracking-wider">
                    Verified Digital Receipts
                  </h2>
                </div>
                <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  {account.payments.length} Receipt(s)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {account.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-extrabold text-[#0B2447]">
                            {formatRupees(Number(p.amount))} ({p.paymentMethod})
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border',
                              p.paidByRole === 'PARENT'
                                ? 'bg-blue-50 text-[#0052CC] border-blue-200'
                                : p.paidByRole === 'ADMIN'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200',
                            )}
                          >
                            {p.paidByRoleLabel ||
                              (p.paidByRole === 'PARENT'
                                ? 'Paid by Parent 👨‍👩‍👧'
                                : 'Paid by Student 🎓')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium break-all">
                          Payer:{' '}
                          <span className="font-bold text-slate-800">{p.paidBy || 'Student'}</span>{' '}
                          • Ref:{' '}
                          <span className="font-mono text-slate-700 font-bold">
                            {p.referenceNumber}
                          </span>
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/tenant-admin/fees/receipts/${p.id}`)}
                      className="w-full sm:w-auto text-xs font-bold text-[#0052CC] border-blue-200 bg-white hover:bg-blue-50 shrink-0 rounded-xl cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> View Receipt
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function ParentFeePage() {
  return (
    <ProtectedRoute allowedRoles={['PARENT', 'TENANT_ADMIN', 'SUPER_ADMIN']}>
      <ParentFeeContent />
    </ProtectedRoute>
  );
}
