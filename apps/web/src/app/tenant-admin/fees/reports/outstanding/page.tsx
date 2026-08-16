'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  AlertTriangle,
  Clock,
  Download,
  Filter,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface OutstandingItem {
  installmentId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'OVERDUE' | 'UNPAID' | 'PARTIALLY_PAID';
  daysOverdue: number;
  student: {
    admissionId: string;
    admissionNumber: string;
    studentName: string;
  };
  courseName: string;
}

function OutstandingReportContent() {
  const router = useRouter();
  const [report, setReport] = useState<OutstandingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'UNPAID' | 'PARTIALLY_PAID'>('ALL');

  const loadReport = async () => {
    try {
      setLoading(true);
      const queryParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const data = await api.get<OutstandingItem[]>(`/billing/ledger/outstanding${queryParam}`);
      setReport(data);
    } catch (err: any) {
      toast.error('Failed to load outstanding report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [statusFilter]);

  const formatRupees = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleExportCsv = () => {
    if (report.length === 0) return;
    const headers = ['Student Name', 'Admission No', 'Course', 'Installment', 'Due Date', 'Balance Amount', 'Status', 'Days Overdue'];
    const rows = report.map((r) => [
      r.student.studentName,
      r.student.admissionNumber,
      r.courseName,
      `Installment #${r.installmentNumber}`,
      new Date(r.dueDate).toLocaleDateString(),
      r.balanceAmount,
      r.status,
      r.daysOverdue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fee_Outstanding_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalOutstanding = report.reduce((sum, item) => sum + Number(item.balanceAmount), 0);
  const overdueCount = report.filter((r) => r.status === 'OVERDUE').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/tenant-admin/fees')}
              className="text-slate-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Outstanding & Overdue Fee Report
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Inspect pending installment balances across courses and track overdue days.
              </p>
            </div>
          </div>
          <Button onClick={handleExportCsv} variant="outline" className="border-slate-300 dark:border-slate-700">
            <Download className="w-4 h-4 mr-2" /> Export CSV Report
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <span className="text-xs font-bold uppercase text-slate-400">Status Filter:</span>
            {(['ALL', 'OVERDUE', 'UNPAID', 'PARTIALLY_PAID'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Pending' : st}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total Outstanding Listed:{' '}
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
              {formatRupees(totalOutstanding)}
            </span>
          </div>
        </div>

        {/* Report Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading outstanding report...</div>
        ) : report.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Zero Outstanding Balances</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
              No student installments match the selected filter criteria.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Admission #</th>
                    <th className="p-3.5">Course</th>
                    <th className="p-3.5">Installment</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Balance</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Days Overdue</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.map((item) => (
                    <tr key={item.installmentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        {item.student.studentName}
                      </td>
                      <td className="p-3.5 text-xs text-indigo-600 font-mono">
                        #{item.student.admissionNumber}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">{item.courseName}</td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        Inst #{item.installmentNumber}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-bold text-amber-600 dark:text-amber-400">
                        {formatRupees(item.balanceAmount)}
                      </td>
                      <td className="p-3.5">
                        {item.status === 'OVERDUE' ? (
                          <span className="inline-flex items-center text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 mr-1" /> OVERDUE
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                            UNPAID
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                        {item.daysOverdue > 0 ? (
                          <span className="text-rose-600">{item.daysOverdue} days</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          onClick={() => router.push('/tenant-admin/fees/payments/collect')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          <CreditCard className="w-3 h-3 mr-1" /> Collect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TenantAdminOutstandingReportPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <OutstandingReportContent />
    </ProtectedRoute>
  );
}
