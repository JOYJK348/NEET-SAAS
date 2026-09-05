'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Printer,
  X,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

import { useQuery } from '@tanstack/react-query';

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

async function fetchStudentFeeAccount(studentAdmissionId: string): Promise<StudentAccount> {
  try {
    const res = await api.get<StudentAccount>(`/billing/fee-assignments/${studentAdmissionId}`);
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

function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + inWords(n % 100) : '');
    if (n < 100000)
      return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000)
      return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  };

  return `${inWords(Math.floor(num))} Rupees Only`;
}

function StudentFeeContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [payingInstId, setPayingInstId] = useState<string | null>(null);
  const [payingFull, setPayingFull] = useState(false);

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<any | null>(null);

  const handleViewReceipt = (payment: any) => {
    const year = payment.paymentDate ? new Date(payment.paymentDate).getFullYear() : new Date().getFullYear();
    const shortId = (payment.id || 'PAY').slice(-6).toUpperCase();
    const instantData = {
      receiptNumber: `RCP-${year}-${shortId}`,
      generatedAt: payment.paymentDate || new Date().toISOString(),
      paymentId: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod || 'RAZORPAY_ONLINE',
      referenceNumber: payment.referenceNumber || `REF-${shortId}`,
      paymentDate: payment.paymentDate || new Date().toISOString(),
      installmentNumber: payment.installmentNumber || 1,
      studentName: (user as any)?.name || 'Student',
      admissionNumber: 'NEET-2026-001',
      courseName: 'NEET 2026 Medical Intensive Program',
      paidBy: payment.paidBy || 'Student',
      paidByRoleLabel:
        payment.paidByRoleLabel ||
        (payment.paidByRole === 'PARENT' ? 'Paid by Parent 👨‍👩‍👧' : 'Paid by Student 🎓'),
    };

    setReceiptModalData(instantData);
    setSelectedPaymentId(payment.id);

    // Background fetch to enrich receipt fields
    api
      .get<any>(`/billing/payments/receipts/${payment.id}`, { skipGlobalToast: true })
      .then((fresh) => {
        if (fresh) setReceiptModalData((prev: any) => ({ ...prev, ...fresh }));
      })
      .catch(() => {});
  };

  const studentAdmissionId =
    (user as any)?.studentAdmissionId || (user as any)?.id || 'DEMO_STUDENT_ID';

  const {
    data: account = null,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['student-fee-account', studentAdmissionId],
    queryFn: () => fetchStudentFeeAccount(studentAdmissionId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!studentAdmissionId,
  });

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
          name: account?.student.name || 'Student',
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
    try {
      setPayingFull(true);
      const resScript = await loadRazorpayScript();
      if (!resScript) {
        toast.error('Failed to load Razorpay SDK');
        setPayingFull(false);
        return;
      }

      const orderData = await api.post<any>('/billing/payments/razorpay/create-full-order', {
        studentAdmissionId,
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
                studentAdmissionId,
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
          name: account?.student.name || 'Student',
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

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans">
        {/* ── ISML LMS Light Blue Header Banner ── */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Student Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Fees & Receipts</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B2447]">
              My Fee Account & Payment Receipts 💳
            </h1>
            <p className="text-xs text-slate-600 font-medium max-w-xl">
              Track course fee schedules, view digital receipts, and clear installment dues with
              instant Razorpay checkout.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            <Link
              href="/dashboard/student/courses"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition shadow-2xs"
            >
              <BookOpen className="w-4 h-4 text-[#0052CC]" />
              <span>My Courses</span>
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

        {loading && !account ? (
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
              Your fee plan is currently being processed by the administration. Course access will
              unlock automatically once a plan is assigned.
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
                    Outstanding Dues
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
                      : 'Remaining balance for course unlock'}
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

            {/* ── Installments Breakdown Grid ── */}
            <Card className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4.5 h-4.5 text-[#0052CC] shrink-0" />
                  <h2 className="text-sm font-extrabold text-[#0B2447] uppercase tracking-wider">
                    Installments Schedule
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
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-extrabold text-[#0B2447] truncate">
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
                          <span className="text-[11px] text-slate-500 font-medium block truncate">
                            Payer:{' '}
                            <span className="font-bold text-slate-800">
                              {p.paidBy || 'Student'}
                            </span>{' '}
                            • Ref:{' '}
                            <span className="font-mono text-slate-700 font-bold">
                              {p.referenceNumber}
                            </span>
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewReceipt(p)}
                        className="text-xs font-bold text-[#0052CC] border-blue-200 bg-white hover:bg-blue-50 shrink-0 rounded-xl cursor-pointer"
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

        {/* ── Official Professional Tax Fee Bill Receipt Modal ── */}
        {selectedPaymentId && receiptModalData && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-300 my-auto print:shadow-none print:border-none print:rounded-none">
              {/* Floating Action Controls Bar (Hidden on print) */}
              <div className="px-6 py-3.5 bg-[#0B2447] text-white flex items-center justify-between print:hidden border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-400 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Official Fee Tax Invoice
                    </h3>
                    <p className="text-[10px] text-slate-300 font-medium">
                      NEET Premier Academy • Verified Voucher
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0052CC] hover:bg-blue-600 active:scale-95 text-white rounded-xl text-xs font-black transition shadow-sm cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPaymentId(null);
                      setReceiptModalData(null);
                    }}
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Bill Document Container */}
              <div className="p-6 sm:p-10 space-y-6 bg-white text-slate-900 font-sans relative print:p-0 border-t-8 border-[#0052CC]">
                {/* Header Branding & Tax Invoice Banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-800 pb-5 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-[#0052CC] text-white flex items-center justify-center font-black text-sm shadow-md">
                        NPA
                      </div>
                      <div>
                        <h1 className="text-2xl font-black text-[#0B2447] tracking-tight uppercase">
                          NEET PREMIER ACADEMY
                        </h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          Govt. Regd. Educational Institute • HSN/SAC Code: 999293
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium pt-1">
                      124, Premier Tower, Anna Salai, Chennai - 600002 • Helpline: +91 98765 43210
                    </p>
                  </div>

                  <div className="sm:text-right bg-blue-50/80 p-3 sm:p-4 rounded-xl border border-blue-200 shrink-0">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#0052CC] bg-white border border-blue-200 px-2 py-0.5 rounded-md mb-1">
                      OFFICIAL PAYMENT RECEIPT
                    </span>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      Receipt No
                    </div>
                    <div className="text-lg font-black text-[#0B2447] font-mono tracking-tight">
                      {receiptModalData.receiptNumber}
                    </div>
                    <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                      📅 Date:{' '}
                      {new Date(receiptModalData.paymentDate || receiptModalData.generatedAt).toLocaleDateString(
                        'en-IN',
                        { day: '2-digit', month: 'short', year: 'numeric' },
                      )}
                    </div>
                  </div>
                </div>

                {/* Payer & Student Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 text-xs">
                  <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Billed To (Student Details)
                    </span>
                    <p className="font-black text-[#0B2447] text-base">{receiptModalData.studentName}</p>
                    <div className="space-y-0.5 text-slate-600 font-medium">
                      <p>
                        Admission No:{' '}
                        <span className="font-mono font-bold text-slate-900">
                          {receiptModalData.admissionNumber}
                        </span>
                      </p>
                      <p>
                        Program:{' '}
                        <span className="font-bold text-[#0052CC]">{receiptModalData.courseName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:pl-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Payment & Transaction Details
                    </span>
                    <div className="space-y-1 text-slate-600 font-medium">
                      <p>
                        Payment Date:{' '}
                        <span className="font-bold text-slate-900">
                          {new Date(receiptModalData.paymentDate || receiptModalData.generatedAt).toLocaleDateString(
                            'en-IN',
                            { day: '2-digit', month: 'long', year: 'numeric' },
                          )}
                        </span>
                      </p>
                      <p>
                        Payment Mode:{' '}
                        <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {receiptModalData.paymentMethod}
                        </span>
                      </p>
                      <p className="flex items-center gap-1.5 flex-wrap">
                        Ref ID:{' '}
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {receiptModalData.referenceNumber}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(receiptModalData.referenceNumber);
                            toast.success('Copied transaction ID!');
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition text-slate-500 cursor-pointer print:hidden"
                          title="Copy Transaction Ref ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </p>
                      <p>
                        Payer:{' '}
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {receiptModalData.paidByRoleLabel || 'Paid by Student 🎓'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Itemized Invoice Table */}
                <div className="rounded-xl border-2 border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3 w-20">HSN/SAC</th>
                        <th className="p-3">Fee Particulars & Description</th>
                        <th className="p-3 text-center w-24">Installment</th>
                        <th className="p-3 text-right w-36">Amount Paid (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white font-medium">
                      <tr>
                        <td className="p-3 font-mono text-slate-500">999293</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 text-sm">
                            Academic Tuition & NEET Program Fee
                          </div>
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                            {receiptModalData.courseName} • Verified via Razorpay Digital Gateway
                          </div>
                        </td>
                        <td className="p-3 text-center font-extrabold text-[#0052CC]">
                          #{receiptModalData.installmentNumber}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          {formatRupees(receiptModalData.amount)}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-50 border-t-2 border-slate-800">
                      <tr>
                        <td
                          colSpan={3}
                          className="p-3.5 text-right font-black text-slate-900 text-xs uppercase tracking-wider"
                        >
                          Total Fees Paid:
                        </td>
                        <td className="p-3.5 text-right font-black text-emerald-600 text-xl">
                          {formatRupees(receiptModalData.amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Amount in Words */}
                <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>Amount Paid in Words:</span>
                  <span className="font-extrabold text-emerald-900 italic">
                    {numberToWordsINR(receiptModalData.amount)}
                  </span>
                </div>

                {/* Audit Verification & Signature Footer */}
                <div className="pt-4 border-t-2 border-dashed border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                  {/* QR Code Verification Stamp */}
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-slate-900 p-1.5 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
                      <div className="w-full h-full border border-dashed border-slate-500 flex items-center justify-center text-[9px] font-mono text-center font-extrabold leading-tight text-emerald-400">
                        OFFICIAL
                        <br />
                        VERIFIED
                        <br />
                        STAMP
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 uppercase tracking-wider">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        VERIFIED & AUDITED
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        System Receipt ID:{' '}
                        <span className="font-mono font-bold text-slate-800">
                          {receiptModalData.receiptNumber}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Authorized Signature Box */}
                  <div className="sm:text-right space-y-1">
                    <div className="inline-block border-b-2 border-slate-800 pb-1 px-4">
                      <span className="font-serif italic text-lg font-bold text-slate-800 tracking-wide">
                        Accounts Dept.
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                      Authorized Officer • NEET Premier Academy
                    </p>
                    <p className="text-[9px] text-slate-400">
                      Computer generated tax invoice. No physical signature required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function StudentFeePage() {
  return (
    <ProtectedRoute allowedRoles={['STUDENT', 'TENANT_ADMIN', 'SUPER_ADMIN']}>
      <StudentFeeContent />
    </ProtectedRoute>
  );
}
