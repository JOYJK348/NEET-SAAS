'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  CheckCircle2,
  Receipt,
  ArrowLeft,
  DollarSign,
  Printer,
  Sparkles,
  RefreshCw,
  UserCheck,
  Zap,
  BookOpen,
  Layers,
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

function CollectPaymentContent() {
  const router = useRouter();
  const [allAccounts, setAllAccounts] = useState<StudentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

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

  const loadAllAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const data = await api.get<StudentAccount[]>('/billing/fee-assignments');
      const validAccounts = (Array.isArray(data) ? data : []).filter(
        (acc) => acc.hasFeeAssigned && acc.installments.some((i) => i.status !== 'PAID'),
      );
      setAllAccounts(validAccounts);
    } catch (err: any) {
      console.error('Failed to load student fee accounts:', err);
      toast.error('Failed to load student fee accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadAllAccounts();
  }, []);

  // Cascading Maps: Course ➔ Batches ➔ Students
  const courseMap = new Map<
    string,
    { id: string; name: string; batches: Map<string, { id: string; name: string; accounts: StudentAccount[] }> }
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
  const selectedBatchObj = selectedCourseObj && selectedBatchId ? selectedCourseObj.batches.get(selectedBatchId) : null;
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

      toast.success('🎉 Fee payment collected & digital receipt generated!');
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
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* ── Signature Violet Hero Header ── */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 text-violet-200" />
              <span className="text-[11px] sm:text-xs font-black text-violet-200 uppercase tracking-wider">
                Tenant Administration • Fee Collection Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Collect Fee Payment 💳
            </h1>
            <p className="text-violet-200 text-xs sm:text-sm mt-1 max-w-xl">
              Select Course ➔ Batch ➔ Student ➔ Installment to record manual cash, UPI, or bank transfer payments with instant digital receipts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              onClick={() => router.push('/tenant-admin/fees/students')}
              className="bg-white/10 hover:bg-white/20 text-white font-bold border-white/30 rounded-2xl text-xs px-4 py-2.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Fee Accounts
            </Button>
          </div>
        </div>

        {receiptResult ? (
          /* ── Receipt Success View ── */
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-6 shadow-2xs max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-black text-emerald-600 tracking-wider">
                Payment Collected & Verified
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-1">
                {formatRupees(Number(receiptResult.payment?.amount))}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">
                Receipt Number:{' '}
                <span className="font-mono text-violet-700 font-bold">
                  {receiptResult.receipt?.receiptNumber || 'RCPT-ONLINE'}
                </span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2.5 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Payment Method:</span>
                <span className="font-black text-slate-900">{receiptResult.payment?.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Reference Number:</span>
                <span className="font-mono font-bold text-slate-800">{receiptResult.payment?.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Selected Installment Balance:</span>
                <span className="font-black text-emerald-600">
                  {formatRupees(Number(receiptResult.installment?.balanceAmount))} {Number(receiptResult.installment?.balanceAmount) === 0 ? '(Cleared ✅)' : ''}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-2">
                <span className="text-slate-700 font-black">Total Outstanding Course Dues:</span>
                <span className="font-black text-amber-600">
                  {formatRupees(Number(receiptResult.outstandingAmount ?? receiptResult.installment?.balanceAmount))}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => router.push(`/tenant-admin/fees/receipts/${receiptResult.payment?.id}`)}
                className="text-xs font-bold text-violet-700 border-violet-200 bg-white hover:bg-violet-50 rounded-xl cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-2" /> View & Print Digital Receipt
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-2xs cursor-pointer"
              >
                Collect Another Fee Payment
              </Button>
            </div>
          </div>
        ) : (
          /* ── 4-Step Cascading Dropdown Collection Form ── */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-violet-600 shrink-0" />
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Fee Collection Form
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: Select Course Dropdown */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  1. Select Course 📚
                </label>
                {loadingAccounts ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-400 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600" />
                    Loading enrolled courses list...
                  </div>
                ) : (
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                <label className="text-xs font-black text-slate-700 block mb-1">
                  2. Select Batch 👥
                </label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                <label className="text-xs font-black text-slate-700 block mb-1">
                  3. Select Student 🎓
                </label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
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
                        {acc.student.name} (#{acc.student.admissionNumber}) — Outstanding Dues: {formatRupees(outAmt)}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Step 4: Select Unpaid Installment Dropdown */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  4. Select Unpaid Installment 💳
                </label>
                <select
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                  value={installmentId}
                  onChange={(e) => handleInstallmentChange(e.target.value)}
                  disabled={!selectedStudentId || unpaidInstallments.length === 0}
                  required
                >
                  <option value="">
                    {!selectedStudentId
                      ? '-- Select a Student first --'
                      : unpaidInstallments.length === 0
                      ? '🎉 All installments fully cleared!'
                      : '-- Choose Installment --'}
                  </option>
                  {unpaidInstallments.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      Inst #{inst.installmentNumber} — Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — Balance: {formatRupees(Number(inst.balanceAmount))} ({inst.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 5: Amount Input */}
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  5. Amount to Collect (₹)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 2399"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  className="rounded-xl text-xs font-black text-slate-900 p-3"
                  required
                />
              </div>

              {/* Step 6: Payment Method & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">
                    Payment Method
                  </label>
                  <select
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  <label className="text-xs font-black text-slate-700 block mb-1">
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
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Remarks / Notes (Optional)
                </label>
                <Input
                  placeholder="e.g. Paid 2nd installment partial at Sivakasi office"
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
                  className="text-xs font-bold rounded-xl border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !installmentId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl shadow-2xs cursor-pointer"
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
