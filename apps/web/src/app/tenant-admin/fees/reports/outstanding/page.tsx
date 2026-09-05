'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Download,
  Filter,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  ChevronRight,
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

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { STALE_TIMES } from '@/lib/staleTimes';

function OutstandingReportContent() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'UNPAID' | 'PARTIALLY_PAID'>(
    'ALL',
  );

  const { data: reportData, isLoading: loading } = useQuery<OutstandingItem[]>({
    queryKey: ['fees', 'outstanding', statusFilter],
    queryFn: ({ signal }) => {
      const queryParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      return api.get<OutstandingItem[]>(`/billing/ledger/outstanding${queryParam}`, { signal });
    },
    staleTime: STALE_TIMES.DEFAULT,
    placeholderData: keepPreviousData,
  });
  const report = reportData || [];

  const formatRupees = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleExportCsv = () => {
    if (report.length === 0) return;
    const headers = [
      'Student Name',
      'Admission No',
      'Course',
      'Installment',
      'Due Date',
      'Balance Amount',
      'Status',
      'Days Overdue',
    ];
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
    link.setAttribute(
      'download',
      `Fee_Outstanding_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalOutstanding = report.reduce((sum, item) => sum + Number(item.balanceAmount), 0);

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
              onClick={() => router.push('/tenant-admin/fees')}
            >
              <ArrowLeft className="h-5 w-5 text-[#0052CC]" />
            </Button>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
                <span>Financial Reports</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
                <span>Outstanding & Overdue</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2447]">
                Outstanding & Overdue Fee Report
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Inspect pending installment balances across courses and track overdue days.
              </p>
            </div>
          </div>

          <Button
            onClick={handleExportCsv}
            className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs shrink-0 rounded-xl text-xs self-end sm:self-auto"
          >
            <Download className="w-4 h-4 text-white shrink-0" />
            <span>Export CSV Report</span>
          </Button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <span className="text-xs font-bold uppercase text-slate-500">Status Filter:</span>
            {(['ALL', 'OVERDUE', 'UNPAID', 'PARTIALLY_PAID'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#0052CC] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Pending' : st}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-slate-600">
            Total Outstanding Listed:{' '}
            <span className="font-extrabold text-amber-700 text-sm">
              {formatRupees(totalOutstanding)}
            </span>
          </div>
        </div>

        {/* Report Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium">
            Loading outstanding report...
          </div>
        ) : report.length === 0 ? (
          <Card className="p-12 text-center border-dashed rounded-2xl border-slate-200 bg-white shadow-2xs">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
            <h3 className="text-base font-extrabold text-[#0B2447]">Zero Outstanding Balances</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 font-medium">
              No student installments match the selected filter criteria.
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
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
                <tbody className="divide-y divide-slate-100">
                  {report.map((item) => (
                    <tr key={item.installmentId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-extrabold text-[#0B2447]">
                        {item.student.studentName}
                      </td>
                      <td className="p-3.5 text-xs text-[#0052CC] font-mono font-bold">
                        #{item.student.admissionNumber}
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{item.courseName}</td>
                      <td className="p-3.5 font-bold text-slate-700">
                        Inst #{item.installmentNumber}
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">
                        {new Date(item.dueDate).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 font-extrabold text-amber-700">
                        {formatRupees(item.balanceAmount)}
                      </td>
                      <td className="p-3.5">
                        {item.status === 'OVERDUE' ? (
                          <span className="inline-flex items-center text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" /> OVERDUE
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            UNPAID
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-700">
                        {item.daysOverdue > 0 ? (
                          <span className="text-rose-600 font-extrabold">
                            {item.daysOverdue} days
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          onClick={() => router.push('/tenant-admin/fees/payments/collect')}
                          className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5 mr-1" /> Collect
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
