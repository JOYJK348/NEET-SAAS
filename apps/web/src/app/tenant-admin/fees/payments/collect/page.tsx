'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  Printer,
  RefreshCw,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface StudentAccount {
  hasFeeAssigned: boolean;
  student: {
    id: string;
    admissionNumber: string;
    name: string;
    courseId?: string;
    courseName?: string;
    batchId?: string;
    batchName?: string;
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
}

function formatRupees(val: number): string {
  if (isNaN(val) || val == null) return '₹0';
  return `₹${val.toLocaleString('en-IN')}`;
}

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/staleTimes';

function CollectPaymentContent() {
  const router = useRouter();

  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [installmentId, setInstallmentId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState<any>(null);

  const {
    data: allAccountsData,
    isLoading: loadingAccounts,
    refetch: loadAllAccounts,
  } = useQuery<StudentAccount[]>({
    queryKey: ['fees', 'assignments'],
    queryFn: async ({ signal }) => {
      const data = await api.get<StudentAccount[]>('/billing/fee-assignments', { signal });
      return (Array.isArray(data) ? data : []).filter(
        (acc) => acc.hasFeeAssigned && acc.installments.some((i) => i.status !== 'PAID'),
      );
    },
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });
  const allAccounts = allAccountsData || [];

  // Cascading Maps: Course ➔ Batches ➔ Students
  const courseMap = new Map<
    string,
    {
      id: string;
      name: string;
      batches: Map<string, { id: string; name: string; accounts: StudentAccount[] }>;
    }
  >();

  allAccounts.forEach((acc) => {
    const cId = acc.student.courseId || 'course_general';
    const cName = acc.student.courseName || 'General NEET Course';
    const bId = acc.student.batchId || 'batch_general';
    const bName = acc.student.batchName || 'General Batch';

    if (!courseMap.has(cId)) {
      courseMap.set(cId, { id: cId, name: cName, batches: new Map() });
    }
    const cObj = courseMap.get(cId)!;

    if (!cObj.batches.has(bId)) {
      cObj.batches.set(bId, { id: bId, name: bName, accounts: [] });
    }
    cObj.batches.get(bId)!.accounts.push(acc);
  });

  const coursesList = Array.from(courseMap.values());
  const selectedCourseObj = selectedCourseId ? courseMap.get(selectedCourseId) : null;
  const availableBatches = selectedCourseObj ? Array.from(selectedCourseObj.batches.values()) : [];
  const selectedBatchObj =
    selectedCourseObj && selectedBatchId ? selectedCourseObj.batches.get(selectedBatchId) : null;
  const availableStudents = selectedBatchObj ? selectedBatchObj.accounts : [];

  const selectedAccount = allAccounts.find((acc) => acc.student.id === selectedStudentId);
  const unpaidInstallments = selectedAccount
    ? selectedAccount.installments.filter((i) => i.status !== 'PAID')
    : [];

  const handleCourseChange = (cId: string) => {
    setSelectedCourseId(cId);
    setSelectedBatchId('');
    setSelectedStudentId('');
    setInstallmentId('');
    setAmount('');

    const cObj = courseMap.get(cId);
    if (cObj && cObj.batches.size === 1) {
      const singleBatch = Array.from(cObj.batches.values())[0];
      setSelectedBatchId(singleBatch.id);
      if (singleBatch.accounts.length === 1) {
        handleStudentChange(singleBatch.accounts[0].student.id);
      }
    }
  };

  const handleBatchChange = (bId: string) => {
    setSelectedBatchId(bId);
    setSelectedStudentId('');
    setInstallmentId('');
    setAmount('');

    if (selectedCourseObj) {
      const bObj = selectedCourseObj.batches.get(bId);
      if (bObj && bObj.accounts.length === 1) {
        handleStudentChange(bObj.accounts[0].student.id);
      }
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudentId(studentId);
    setInstallmentId('');
    setAmount('');
    const targetAccount = allAccounts.find((acc) => acc.student.id === studentId);
    const firstUnpaid = targetAccount?.installments.find((i) => i.status !== 'PAID');
    if (firstUnpaid) {
      setInstallmentId(firstUnpaid.id);
      setAmount(Number(firstUnpaid.balanceAmount));
    }
  };

  const handleInstallmentChange = (instId: string) => {
    setInstallmentId(instId);
    const targetInst = unpaidInstallments.find((i) => i.id === instId);
    if (targetInst) {
      setAmount(Number(targetInst.balanceAmount));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installmentId || !amount || Number(amount) <= 0) {
      toast.error('Please complete all selection dropdowns and enter collection amount');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<any>('/billing/payments/collect', {
        studentFeeInstallmentId: installmentId,
        amount: Number(amount),
        paymentMethod,
        referenceNumber: referenceNumber || `REF-${Date.now()}`,
        remarks,
      });

      toast.success('Fee payment collected & digital receipt generated!');
      setReceiptResult(res);
      await loadAllAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to collect payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shrink-0"
              onClick={() => router.push('/tenant-admin/fees/students')}
            >
              <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
                <span>Financial Operations</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Collect Payment</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2447]">
                Collect Fee Payment
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Select Course ➔ Batch ➔ Student ➔ Installment to record manual cash, UPI, or bank
                transfer payments.
              </p>
            </div>
          </div>
        </div>

        {receiptResult ? (
          /* Receipt Success View */
          <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center space-y-6 shadow-2xs max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider">
                Payment Collected & Verified
              </span>
              <h2 className="text-3xl font-extrabold text-[#0B2447] mt-1">
                {formatRupees(Number(receiptResult.payment?.amount))}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-bold">
                Receipt Number:{' '}
                <span className="font-mono text-[#0052CC] font-bold">
                  {receiptResult.receipt?.receiptNumber || 'RCPT-ONLINE'}
                </span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5 max-w-md mx-auto font-bold">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Method:</span>
                <span className="text-[#0B2447] font-extrabold">
                  {receiptResult.payment?.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reference Number:</span>
                <span className="font-mono text-[#0B2447]">
                  {receiptResult.payment?.referenceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Selected Installment Balance:</span>
                <span className="text-emerald-600 font-extrabold">
                  {formatRupees(Number(receiptResult.installment?.balanceAmount))}{' '}
                  {Number(receiptResult.installment?.balanceAmount) === 0 ? '(Cleared)' : ''}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700">Total Outstanding Dues:</span>
                <span className="text-amber-600 font-extrabold">
                  {formatRupees(
                    Number(
                      receiptResult.outstandingAmount ?? receiptResult.installment?.balanceAmount,
                    ),
                  )}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/tenant-admin/fees/receipts/${receiptResult.payment?.id}`)
                }
                className="text-xs font-extrabold text-[#0052CC] border-blue-200 bg-white hover:bg-blue-50 rounded-xl cursor-pointer shadow-2xs"
              >
                <Printer className="w-4 h-4 mr-2 text-[#0052CC]" /> View & Print Digital Receipt
              </Button>
              <Button
                onClick={() => {
                  setReceiptResult(null);
                  setSelectedCourseId('');
                  setSelectedBatchId('');
                  setSelectedStudentId('');
                  setInstallmentId('');
                  setAmount('');
                  setReferenceNumber('');
                  setRemarks('');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                Collect Another Fee Payment
              </Button>
            </div>
          </div>
        ) : (
          /* 4-Step Cascading Dropdown Collection Form */
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-[#0052CC] shrink-0" />
              <h2 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Fee Collection Form
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Select Course Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                  1. Select Course *
                </label>
                {loadingAccounts ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-400 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0052CC]" />
                    Loading enrolled courses list...
                  </div>
                ) : (
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0B2447] focus:bg-white focus:outline-none focus:border-[#0052CC]"
                    value={selectedCourseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Course --</option>
                    {coursesList.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.batches.size} Batches)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 2: Select Batch Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                  2. Select Batch *
                </label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0B2447] focus:bg-white focus:outline-none focus:border-[#0052CC] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={selectedBatchId}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  disabled={!selectedCourseId || availableBatches.length === 0}
                  required
                >
                  <option value="">
                    {!selectedCourseId
                      ? '-- Select a Course first --'
                      : availableBatches.length === 0
                        ? 'No active batches in this course'
                        : '-- Choose Batch --'}
                  </option>
                  {availableBatches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.accounts.length} Students with Dues)
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Select Student Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                  3. Select Student *
                </label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0B2447] focus:bg-white focus:outline-none focus:border-[#0052CC] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  disabled={!selectedBatchId || availableStudents.length === 0}
                  required
                >
                  <option value="">
                    {!selectedBatchId
                      ? '-- Select a Batch first --'
                      : availableStudents.length === 0
                        ? 'No students with outstanding dues in this batch'
                        : '-- Choose Student --'}
                  </option>
                  {availableStudents.map((acc) => {
                    const outAmt = Number(acc.assignment?.outstandingAmount || 0);
                    return (
                      <option key={acc.student.id} value={acc.student.id}>
                        {acc.student.name} (#{acc.student.admissionNumber}) — Outstanding Dues:{' '}
                        {formatRupees(outAmt)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Step 4: Select Unpaid Installment Dropdown */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                  4. Select Unpaid Installment *
                </label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0B2447] focus:bg-white focus:outline-none focus:border-[#0052CC] disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={installmentId}
                  onChange={(e) => handleInstallmentChange(e.target.value)}
                  disabled={!selectedStudentId || unpaidInstallments.length === 0}
                  required
                >
                  <option value="">
                    {!selectedStudentId
                      ? '-- Select a Student first --'
                      : unpaidInstallments.length === 0
                        ? 'All installments fully cleared!'
                        : '-- Choose Installment --'}
                  </option>
                  {unpaidInstallments.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      Inst #{inst.installmentNumber} — Due:{' '}
                      {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      — Balance: {formatRupees(Number(inst.balanceAmount))} ({inst.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 5: Amount Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                  5. Amount to Collect (₹) *
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 2399"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  className="rounded-xl text-xs font-extrabold text-[#0B2447] p-3"
                  required
                />
              </div>

              {/* Step 6: Payment Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                    Payment Method
                  </label>
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-[#0B2447] focus:bg-white focus:outline-none focus:border-[#0052CC]"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                    Reference / Transaction No.
                  </label>
                  <Input
                    placeholder="e.g. UPI-9812491 / CHQ-1082"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="rounded-xl text-xs font-bold p-3"
                  />
                </div>
              </div>

              {/* Step 7: Remarks */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase">
                  Remarks / Notes (Optional)
                </label>
                <Input
                  placeholder="e.g. Paid 2nd installment partial at office"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="rounded-xl text-xs font-bold p-3"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/tenant-admin/fees/students')}
                  className="text-xs font-bold rounded-xl border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !installmentId}
                  className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 fill-white" /> Confirm & Collect Payment
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TenantAdminCollectPaymentPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <CollectPaymentContent />
    </ProtectedRoute>
  );
}
