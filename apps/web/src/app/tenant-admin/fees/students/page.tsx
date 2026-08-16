'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Users,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Receipt,
  Sparkles,
  RefreshCw,
  DollarSign,
  UserCheck,
  ChevronRight,
  ArrowLeft,
  Zap,
  BookOpen,
  Layers,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    referenceNumber: string;
    paymentDate: string;
    paidBy?: string;
    paidByRole?: 'STUDENT' | 'PARENT' | 'ADMIN' | string;
    paidByRoleLabel?: string;
  }>;
}

interface FeePlanOption {
  id: string;
  code: string;
  name: string;
  totalAmount: number;
}

function formatRupees(val: number): string {
  if (isNaN(val) || val == null) return '₹0';
  return `₹${val.toLocaleString('en-IN')}`;
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

function StudentFeeAccountContent() {
  const router = useRouter();
  const [allAccounts, setAllAccounts] = useState<StudentAccount[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<StudentAccount | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [feePlans, setFeePlans] = useState<FeePlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [assigning, setAssigning] = useState(false);

  const loadAllAccounts = async () => {
    try {
      setLoading(true);
      const data = await api.get<StudentAccount[]>('/billing/fee-assignments');
      setAllAccounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load student fee accounts:', err);
      setAllAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeePlans = async () => {
    try {
      const data = await api.get<FeePlanOption[]>('/billing/fee-plans');
      setFeePlans(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAllAccounts();
    loadFeePlans();
  }, []);

  // 1. Group by Courses
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
  const batchesList = selectedCourseObj ? Array.from(selectedCourseObj.batches.values()) : [];
  const selectedBatchObj = selectedCourseObj && selectedBatchId ? selectedCourseObj.batches.get(selectedBatchId) : null;

  // Active accounts list for table view (under selected batch or course)
  const activeBatchAccounts = selectedBatchObj ? selectedBatchObj.accounts : [];

  const filteredTableAccounts = activeBatchAccounts.filter((acc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.student.name.toLowerCase().includes(q) ||
      acc.student.admissionNumber.toLowerCase().includes(q) ||
      (acc.feeStructure?.name || '').toLowerCase().includes(q)
    );
  });

  const handleAssignFee = async () => {
    if (!selectedAccount?.student.id || !selectedPlanId) {
      toast.error('Please select a fee plan');
      return;
    }

    try {
      setAssigning(true);
      const res = await api.post<StudentAccount>('/billing/fee-assignments', {
        studentAdmissionId: selectedAccount.student.id,
        feeStructureId: selectedPlanId,
        discountAmount: Number(discountAmount) || 0,
      });

      toast.success('Fee plan assigned successfully!');
      setSelectedAccount(res);
      await loadAllAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign fee plan');
    } finally {
      setAssigning(false);
    }
  };

  // KPI summary
  const totalBilled = allAccounts.reduce(
    (sum, a) => sum + Number(a.assignment?.finalAmount || 0),
    0,
  );
  const totalOutstanding = allAccounts.reduce(
    (sum, a) => sum + Number(a.assignment?.outstandingAmount || 0),
    0,
  );
  const totalCollected = totalBilled - totalOutstanding;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* ── Signature Violet Hero Header ── */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-3xl p-5 sm:p-6 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 text-violet-200" />
              <span className="text-[11px] sm:text-xs font-black text-violet-200 uppercase tracking-wider">
                Tenant Administration • Courses & Batches Fee Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Course & Batch Fee Ledgers 💳
            </h1>
            <p className="text-violet-200 text-xs sm:text-sm mt-1 max-w-xl">
              Navigate by Courses ➔ Batches ➔ Students to inspect fee plans, outstanding dues, and collect payments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap sm:flex-nowrap">
            <Button
              onClick={() => router.push('/tenant-admin/fees/payments/collect')}
              className="flex-1 sm:flex-none bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black border-0 shadow-lg shadow-emerald-500/20 rounded-2xl text-xs px-4 py-2.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 mr-1.5 text-slate-950" />
              <span>Collect Fee Payment 💳</span>
            </Button>
          </div>
        </div>

        {/* ── Interactive Breadcrumb Navigation Bar ── */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-600 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
          <button
            onClick={() => {
              setSelectedCourseId(null);
              setSelectedBatchId(null);
              setSelectedAccount(null);
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer',
              !selectedCourseId ? 'bg-violet-600 text-white font-black' : 'hover:bg-slate-100 text-slate-700',
            )}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>All Courses ({coursesList.length})</span>
          </button>

          {selectedCourseObj && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <button
                onClick={() => {
                  setSelectedBatchId(null);
                  setSelectedAccount(null);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer',
                  selectedCourseId && !selectedBatchId
                    ? 'bg-violet-600 text-white font-black'
                    : 'hover:bg-slate-100 text-slate-700',
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{selectedCourseObj.name} ({selectedCourseObj.batches.size} Batches)</span>
              </button>
            </>
          )}

          {selectedBatchObj && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <button
                onClick={() => setSelectedAccount(null)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition cursor-pointer',
                  selectedBatchId && !selectedAccount
                    ? 'bg-violet-600 text-white font-black'
                    : 'hover:bg-slate-100 text-slate-700',
                )}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{selectedBatchObj.name} ({selectedBatchObj.accounts.length} Students)</span>
              </button>
            </>
          )}

          {selectedAccount && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Student: {selectedAccount.student.name}</span>
              </span>
            </>
          )}
        </div>

        {/* ── KPI Metric Header Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Students</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{allAccounts.length} Enrolled</p>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Fees Billed</span>
            <p className="text-2xl font-black text-violet-700 mt-2">{formatRupees(totalBilled)}</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collected</span>
            <p className="text-2xl font-black text-emerald-600 mt-2">{formatRupees(totalCollected)}</p>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Dues</span>
            <p className="text-2xl font-black text-amber-600 mt-2">{formatRupees(totalOutstanding)}</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-semibold space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin mx-auto text-violet-600" />
            <p className="text-xs">Loading course & batch fee ledgers...</p>
          </div>
        ) : selectedAccount ? (
          /* ── LEVEL 4: Selected Student Fee Account Inspection ── */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setSelectedAccount(null)}
                variant="outline"
                className="text-xs font-bold rounded-xl border-slate-200 bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Batch Students List
              </Button>
            </div>

            {!selectedAccount.hasFeeAssigned ? (
              <Card className="p-8 border-slate-200 rounded-3xl bg-white space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs uppercase text-slate-400 font-bold">Student Admission</span>
                    <h2 className="text-xl font-black text-slate-900">{selectedAccount.student.name}</h2>
                    <span className="text-xs text-violet-600 font-bold">#{selectedAccount.student.admissionNumber}</span>
                  </div>
                  <span className="text-xs font-black uppercase px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                    No Fee Plan Assigned
                  </span>
                </div>

                <div className="space-y-4 max-w-md">
                  <h4 className="text-sm font-black text-slate-900">Assign Fee Structure</h4>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Select Fee Plan</label>
                    <select
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                    >
                      <option value="">-- Choose Fee Structure --</option>
                      {feePlans.map((fp) => (
                        <option key={fp.id} value={fp.id}>
                          {fp.name} ({formatRupees(fp.totalAmount)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Discount Amount (Optional ₹)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="rounded-xl text-xs font-bold"
                    />
                  </div>

                  <Button
                    onClick={handleAssignFee}
                    disabled={assigning}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black w-full rounded-xl cursor-pointer"
                  >
                    {assigning ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Assign Fee & Generate Schedule
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Student Overview Header */}
                <div className="bg-gradient-to-r from-violet-50 via-indigo-50/60 to-purple-50 rounded-3xl p-6 text-slate-900 shadow-2xs border border-violet-200/80">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-violet-700 font-black">
                        Admission #{selectedAccount.student.admissionNumber}
                      </span>
                      <h2 className="text-2xl font-black mt-1 text-slate-900">{selectedAccount.student.name}</h2>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        Course: <span className="font-bold text-slate-900">{selectedAccount.student.courseName}</span> • Batch: <span className="font-bold text-slate-900">{selectedAccount.student.batchName}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-violet-100/90 shadow-2xs">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 font-black block">Total Fee</span>
                        <p className="text-base font-black text-slate-900">{formatRupees(Number(selectedAccount.assignment?.finalAmount))}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-emerald-600 font-black block">Paid</span>
                        <p className="text-base font-black text-emerald-600">
                          {formatRupees(
                            Number(selectedAccount.assignment?.finalAmount || 0) -
                              Number(selectedAccount.assignment?.outstandingAmount || 0),
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-amber-600 font-black block">Outstanding</span>
                        <p className="text-base font-black text-amber-600">
                          {formatRupees(Number(selectedAccount.assignment?.outstandingAmount))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Installment Schedule Breakdown */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Installment Schedule Breakdown
                    </h3>
                    <Button
                      onClick={() => router.push('/tenant-admin/fees/payments/collect')}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-2xs"
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Collect Payment
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase font-black text-slate-500 border-b border-slate-200/80 tracking-wider">
                        <tr>
                          <th className="p-3.5">#</th>
                          <th className="p-3.5">Due Date</th>
                          <th className="p-3.5">Total Amount</th>
                          <th className="p-3.5">Paid Amount</th>
                          <th className="p-3.5">Balance</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAccount.installments.map((inst) => (
                          <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-black text-violet-700">Inst #{inst.installmentNumber}</td>
                            <td className="p-3.5 font-bold text-slate-600">
                              {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="p-3.5 font-black text-slate-900">{formatRupees(Number(inst.finalAmount))}</td>
                            <td className="p-3.5 font-black text-emerald-600">
                              {formatRupees(Number(inst.paidAmount))}
                            </td>
                            <td className="p-3.5 font-black text-slate-900">
                              {formatRupees(Number(inst.balanceAmount))}
                            </td>
                            <td className="p-3.5">{getStatusBadge(inst.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment History Log */}
                {selectedAccount.payments.length > 0 && (
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                      Payment History Log
                    </h3>
                    <div className="space-y-3">
                      {selectedAccount.payments.map((p: any) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                              <Receipt className="w-5 h-5" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-black text-slate-900 truncate">
                                  {formatRupees(Number(p.amount))} ({p.paymentMethod})
                                </p>
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs',
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
                              <span className="text-xs text-slate-500 block truncate">
                                Payer: <span className="font-bold text-slate-800">{p.paidBy || 'Student'}</span> • Ref: <span className="font-mono text-slate-700 font-bold">{p.referenceNumber}</span> • {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/tenant-admin/fees/receipts/${p.id}`)}
                            className="text-xs font-bold text-violet-700 border-violet-200 bg-white hover:bg-violet-50 shrink-0 rounded-xl cursor-pointer"
                          >
                            View Receipt
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : selectedBatchId && selectedBatchObj ? (
          /* ── LEVEL 3: Batch Enrolled Students Fee Table ── */
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600 shrink-0" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Students in {selectedBatchObj.name} ({filteredTableAccounts.length})
                </h2>
              </div>

              {/* Real-time Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Filter student name or admission #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-2xl text-xs font-medium border-slate-200/90 bg-slate-50/50"
                />
              </div>
            </div>

            {filteredTableAccounts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold">No student fee records found in this batch</p>
                <p className="text-xs text-slate-400">Try adjusting your search filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase font-black text-slate-500 border-b border-slate-200/80 tracking-wider">
                    <tr>
                      <th className="p-3.5">Student</th>
                      <th className="p-3.5">Admission #</th>
                      <th className="p-3.5">Fee Plan</th>
                      <th className="p-3.5">Total Fee</th>
                      <th className="p-3.5">Amount Paid</th>
                      <th className="p-3.5">Outstanding Dues</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTableAccounts.map((acc) => {
                      const finalAmt = Number(acc.assignment?.finalAmount || 0);
                      const outAmt = Number(acc.assignment?.outstandingAmount || 0);
                      const paidAmt = finalAmt - outAmt;
                      const paidPct = finalAmt > 0 ? Math.round((paidAmt / finalAmt) * 100) : 0;

                      return (
                        <tr
                          key={acc.student.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedAccount(acc)}
                        >
                          <td className="p-3.5 font-black text-slate-900">
                            {acc.student.name}
                          </td>
                          <td className="p-3.5 font-bold text-violet-700 font-mono">
                            #{acc.student.admissionNumber}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">
                            {acc.feeStructure?.name || 'NEET Standard Plan'}
                          </td>
                          <td className="p-3.5 font-black text-slate-900">
                            {formatRupees(finalAmt)}
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-emerald-600">{formatRupees(paidAmt)}</span>
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {paidPct}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 font-black text-amber-600">
                            {formatRupees(outAmt)}
                          </td>
                          <td className="p-3.5 text-right">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAccount(acc);
                              }}
                              className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-2xs cursor-pointer"
                            >
                              Inspect Ledger <ChevronRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : selectedCourseId && selectedCourseObj ? (
          /* ── LEVEL 2: Batches Grid View (Under Selected Course) ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Batches in {selectedCourseObj.name} ({batchesList.length})
              </h2>
              <Button
                onClick={() => setSelectedCourseId(null)}
                variant="ghost"
                className="text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All Courses
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {batchesList.map((batch) => {
                const bStudents = batch.accounts.length;
                const bBilled = batch.accounts.reduce(
                  (sum, a) => sum + Number(a.assignment?.finalAmount || 0),
                  0,
                );
                const bOutstanding = batch.accounts.reduce(
                  (sum, a) => sum + Number(a.assignment?.outstandingAmount || 0),
                  0,
                );

                return (
                  <div
                    key={batch.id}
                    onClick={() => setSelectedBatchId(batch.id)}
                    className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 border-l-4 border-l-violet-600"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
                          {bStudents} Enrolled
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {batch.name}
                      </h3>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Total Fees Billed:</span>
                        <span className="font-bold text-slate-900">{formatRupees(bBilled)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Outstanding Dues:</span>
                        <span className="font-bold text-amber-600">{formatRupees(bOutstanding)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBatchId(batch.id);
                      }}
                      className="w-full bg-violet-50 hover:bg-violet-100 text-violet-800 font-black text-xs rounded-xl border border-violet-200 cursor-pointer"
                    >
                      Inspect Batch Students ({bStudents}) ➔
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── LEVEL 1: Courses Grid View (Default Root View) ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Select Course to Inspect Fee Ledgers ({coursesList.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coursesList.map((course) => {
                const bCount = course.batches.size;
                let cTotalStudents = 0;
                let cTotalBilled = 0;
                let cTotalOutstanding = 0;

                course.batches.forEach((b) => {
                  cTotalStudents += b.accounts.length;
                  b.accounts.forEach((a) => {
                    cTotalBilled += Number(a.assignment?.finalAmount || 0);
                    cTotalOutstanding += Number(a.assignment?.outstandingAmount || 0);
                  });
                });

                return (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 border-l-4 border-l-indigo-600"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
                          <BookOpen className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                          {bCount} Batch(es)
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        {cTotalStudents} Total Student(s) Enrolled
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Total Course Fees:</span>
                        <span className="font-bold text-slate-900">{formatRupees(cTotalBilled)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Outstanding Dues:</span>
                        <span className="font-bold text-amber-600">{formatRupees(cTotalOutstanding)}</span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourseId(course.id);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-2xs cursor-pointer"
                    >
                      View Batches ({bCount}) ➔
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TenantAdminStudentFeePage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <StudentFeeAccountContent />
    </ProtectedRoute>
  );
}
