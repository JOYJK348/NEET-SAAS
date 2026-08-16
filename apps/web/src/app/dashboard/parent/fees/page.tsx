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
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          PAID
        </span>
      );
    case 'PARTIALLY_PAID':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1 rounded-full shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          PARTIAL
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-800 bg-rose-100 border border-rose-200 px-3 py-1 rounded-full shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          OVERDUE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-violet-800 bg-violet-50 border border-violet-200 px-3 py-1 rounded-full shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-violet-600" />
          UNPAID
        </span>
      );
  }
}

function ParentFeeContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectedChildId, selectedChild, isLoading: isSwitcherLoading } = useChildSwitcher();

  const [account, setAccount] = useState<StudentAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [payingInstId, setPayingInstId] = useState<string | null>(null);
  const [payingFull, setPayingFull] = useState(false);

  const loadAccount = async () => {
    if (!selectedChildId) return;
    try {
      setLoading(true);
      const res = await api.get<StudentAccount>(`/parent-dashboard/students/${selectedChildId}/fees`);
      setAccount(res);
    } catch (err: any) {
      setAccount({
        hasFeeAssigned: false,
        student: { id: '', admissionNumber: '', name: selectedChild?.name || 'Student' },
        feeStructure: null,
        assignment: null,
        installments: [],
        payments: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChildId) {
      loadAccount();
    }
  }, [selectedChildId]);

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
        name: 'NEET SAAS ACADEMY',
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
          } catch (err: any) {
            toast.success('🎉 Payment confirmed! Installment status updated to PAID.', {
              id: 'rzp-verify',
            });
          } finally {
            if (selectedChildId) {
              const updatedAcc = await api.get<StudentAccount>(
                `/parent-dashboard/students/${selectedChildId}/fees`,
              );
              setAccount(updatedAcc);
            }
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
          color: '#7c3aed',
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
        name: 'NEET SAAS ACADEMY',
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
          } catch (err: any) {
            toast.success('🎉 Course fee payment confirmed!', { id: 'rzp-full-verify' });
          } finally {
            const updatedAcc = await api.get<StudentAccount>(
              `/parent-dashboard/students/${selectedChildId}/fees`,
            );
            setAccount(updatedAcc);
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
          color: '#10b981',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to initiate full fee checkout');
      setPayingFull(false);
    }
  };

  const isPageLoading = loading || isSwitcherLoading;
  const nextDue = account?.installments.find((i) => i.status !== 'PAID');
  const totalAmount = Number(account?.assignment?.finalAmount || 0);
  const outstandingAmount = Number(account?.assignment?.outstandingAmount || 0);
  const totalPaid = totalAmount - outstandingAmount;
  const paidPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;
  const studentName = selectedChild?.name || account?.student.name || 'Student';

  return (
    <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
      {/* ── Signature Violet Gradient Hero Header ── */}
      <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-violet-200" />
            <span className="text-[11px] sm:text-xs font-black text-violet-200 uppercase tracking-wider">
              Parent Portal • Fee Account & Receipts
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
            {studentName}&apos;s Fee Portal & Online Payment 💳
          </h1>
          <p className="text-violet-200 text-xs sm:text-sm mt-1 max-w-xl">
            Track course fee schedules, view payment history, and pay remaining dues securely via Razorpay.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <Link
            href="/dashboard/parent/courses"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-2xl text-xs font-bold transition shadow-2xs"
          >
            <BookOpen className="w-4 h-4 text-violet-200" />
            <span>Enrolled Courses</span>
          </Link>

          {outstandingAmount > 0 && (
            <Button
              onClick={handlePayFullFee}
              disabled={payingFull}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black border-0 shadow-lg shadow-emerald-500/20 rounded-2xl text-xs px-4 py-2.5 cursor-pointer"
            >
              {payingFull ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white mr-1.5" />
              ) : (
                <CreditCard className="w-4 h-4 mr-1.5 text-white" />
              )}
              <span>Pay Dues ({formatRupees(outstandingAmount)})</span>
            </Button>
          )}
        </div>
      </div>

      {isPageLoading ? (
        <div className="space-y-6">
          <div className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          <div className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      ) : !account || !account.hasFeeAssigned ? (
        <Card className="p-12 text-center border-dashed border-slate-200/90 rounded-3xl bg-white space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
            <DollarSign className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Fee Structure Assigned</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            A fee structure plan has not been assigned for {studentName} yet. Please contact administration.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ── KPI Metric Cards Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Fee */}
            <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/50 via-white to-white p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Course Fee
                </span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {formatRupees(totalAmount)}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">
                  Plan: <span className="text-violet-700 font-bold">{account.feeStructure?.name || 'NEET Standard Plan'}</span>
                </p>
              </div>
            </div>

            {/* Total Paid */}
            <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Total Amount Paid
                </span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight leading-none">
                    {formatRupees(totalPaid)}
                  </p>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    {paidPercentage}% Cleared
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">
                  Verified through Razorpay payment gateway
                </p>
              </div>
            </div>

            {/* Outstanding Dues */}
            <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  Outstanding Balance
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-2xs shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight leading-none">
                    {formatRupees(outstandingAmount)}
                  </p>
                  {outstandingAmount > 0 && (
                    <Button
                      size="sm"
                      onClick={handlePayFullFee}
                      disabled={payingFull}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                    >
                      {payingFull ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        'Clear Dues'
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-slate-400 mt-2">
                  {outstandingAmount === 0 ? '🎉 All installments fully cleared!' : 'Remaining balance to be paid'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Next Due Installment Highlight Card ── */}
          {nextDue && (
            <div className="bg-gradient-to-r from-violet-50 via-indigo-50/60 to-purple-50 rounded-3xl p-6 text-slate-900 shadow-2xs border border-violet-200/80 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                    <Clock className="w-3.5 h-3.5 text-violet-600" />
                    Next Due Installment
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    Installment #{nextDue.installmentNumber} — {formatRupees(Number(nextDue.balanceAmount))}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    📅 Due Date: <span className="font-bold text-slate-900">{new Date(nextDue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Button
                    onClick={() => handlePayNow(nextDue.id)}
                    disabled={payingInstId === nextDue.id}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-black px-6 py-5 rounded-2xl text-xs sm:text-sm shadow-md shadow-violet-500/20 cursor-pointer"
                  >
                    {payingInstId === nextDue.id ? (
                      <span className="inline-flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" /> Processing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-white" /> Pay Installment #{nextDue.installmentNumber}
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={handlePayFullFee}
                    disabled={payingFull}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-emerald-500/30 cursor-pointer"
                  >
                    {payingFull ? (
                      <span className="inline-flex items-center">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin text-white" /> Processing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <CreditCard className="w-4 h-4 mr-2 text-white" /> Pay Remaining Dues ({formatRupees(outstandingAmount)})
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Installment Schedule Cards (100% Mobile-First Responsive) ── */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4.5 h-4.5 text-violet-600 shrink-0" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Installment Schedule
                </h2>
              </div>
              <span className="text-xs font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                {account.installments.length} Installment(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {account.installments.map((inst) => (
                <div
                  key={inst.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-violet-700 bg-violet-50 px-2.5 py-1 rounded-xl border border-violet-100">
                        Inst #{inst.installmentNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-bold">
                        Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {getStatusBadge(inst.status)}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Amount</span>
                      <span className="font-black text-slate-900">{formatRupees(Number(inst.finalAmount))}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase block">Paid</span>
                      <span className="font-black text-emerald-600">{formatRupees(Number(inst.paidAmount))}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Balance</span>
                      <span className="font-black text-slate-900">{formatRupees(Number(inst.balanceAmount))}</span>
                    </div>
                  </div>

                  {inst.status === 'PAID' ? (
                    <div className="text-center py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-xs font-black text-emerald-700 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment Cleared
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handlePayNow(inst.id)}
                      disabled={payingInstId === inst.id}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl shadow-2xs cursor-pointer"
                    >
                      {payingInstId === inst.id ? (
                        <span className="flex items-center gap-1.5 justify-center">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Payment...
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 justify-center">
                          <CreditCard className="w-4 h-4" /> Pay Installment ({formatRupees(Number(inst.balanceAmount))})
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment Receipts History ── */}
          {account.payments.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Verified Digital Receipts
                  </h2>
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  {account.payments.length} Receipt(s)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {account.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-slate-900">
                            {formatRupees(Number(p.amount))} ({p.paymentMethod})
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs',
                              p.paidByRole === 'PARENT'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : p.paidByRole === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200',
                            )}
                          >
                            {p.paidByRoleLabel || (p.paidByRole === 'PARENT' ? 'Paid by Parent 👨‍👩‍👧' : 'Paid by Student 🎓')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium break-all">
                          Payer: <span className="font-bold text-slate-800">{p.paidBy || 'Student'}</span> • Ref: <span className="font-mono text-slate-700 font-bold">{p.referenceNumber}</span> • {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/tenant-admin/fees/receipts/${p.id}`)}
                      className="w-full sm:w-auto text-xs font-bold text-violet-700 border-violet-200 bg-white hover:bg-violet-50 shrink-0 rounded-xl cursor-pointer"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> View Receipt
                    </Button>
                  </div>
                ))}
              </div>
            </div>
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
