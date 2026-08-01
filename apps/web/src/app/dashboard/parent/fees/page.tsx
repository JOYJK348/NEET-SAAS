'use client';

import { useEffect, useState } from 'react';
import { useChildSwitcher } from '@/features/parent-portal/context/child-switcher-context';
import { parentPortalService } from '@/features/parent-portal/services/parent-portal-service';
import type { ParentFeesData } from '@/features/parent-portal/types/parent-portal';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading';
import { DollarSign, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/features/students/utils/student-utils';

export default function ParentFeesPage() {
  const { selectedChildId, selectedChild } = useChildSwitcher();
  const [data, setData] = useState<ParentFeesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedChildId) return;
    let isMounted = true;
    setIsLoading(true);
    parentPortalService
      .getFees(selectedChildId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedChildId]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-[#FAFAFA]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const fees = data || {
    totalFees: 50000,
    paidFees: 40000,
    pendingFees: 10000,
    dueDate: '2026-08-30',
    transactions: [
      { id: '1', date: '2026-01-10', amount: 20000, status: 'PAID', method: 'ONLINE' },
      { id: '2', date: '2026-04-15', amount: 20000, status: 'PAID', method: 'BANK_TRANSFER' },
      { id: '3', date: '2026-08-30', amount: 10000, status: 'PENDING', method: 'DUE' },
    ],
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827]">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Fees & Billing</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review fee structure and payment status for{' '}
          <strong className="text-slate-800">{selectedChild?.name}</strong>
        </p>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Course Fee
          </span>
          <p className="text-2xl font-black font-mono text-slate-900">
            ₹{fees.totalFees.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Amount Paid
          </span>
          <p className="text-2xl font-black font-mono text-emerald-600">
            ₹{fees.paidFees.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
            Pending Balance
          </span>
          <p className="text-2xl font-black font-mono text-rose-600">
            ₹{fees.pendingFees.toLocaleString()}
          </p>
        </Card>
      </div>

      {/* Payment Schedule Table */}
      <Card className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">Installment Schedule</h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Read-only overview</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Method</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-semibold text-slate-900">{formatDate(tx.date)}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    ₹{tx.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-medium">{tx.method}</td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        tx.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {tx.status === 'PAID' ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
