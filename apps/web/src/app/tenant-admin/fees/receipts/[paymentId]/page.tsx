'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { api } from '@/lib/api';

interface ReceiptData {
  receiptNumber: string;
  generatedAt: string;
  paymentId: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  paymentDate: string;
  installmentNumber: number;
  studentName: string;
  admissionNumber: string;
  courseName: string;
}

function ReceiptViewContent() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.paymentId as string;
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReceipt() {
      try {
        const data = await api.get<ReceiptData>(`/billing/payments/receipts/${paymentId}`);
        setReceipt(data);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReceipt();
  }, [paymentId]);

  const formatRupees = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between print:hidden">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-slate-500">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={handlePrint} className="bg-indigo-600 text-white">
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading receipt details...</div>
        ) : !receipt ? (
          <Card className="p-8 text-center text-rose-500">Receipt record not found</Card>
        ) : (
          /* Receipt Card - Clean printable format */
          <Card className="p-8 border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
              <div>
                <span className="text-xs uppercase font-extrabold text-indigo-600 tracking-wider">
                  Official Fee Receipt
                </span>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  NEET SAAS ACADEMY
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">Head Office Sivakasi • Tamil Nadu</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase block">Receipt Number</span>
                <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {receipt.receiptNumber}
                </span>
                <span className="text-xs text-slate-400 block mt-1">
                  {new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Student & Payment Summary Grid */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold block">Student Name</span>
                <span className="font-bold text-slate-900 dark:text-white">{receipt.studentName}</span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Admission #: {receipt.admissionNumber}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold block">Course Enrolled</span>
                <span className="font-bold text-slate-900 dark:text-white">{receipt.courseName}</span>
                <span className="text-xs text-indigo-600 font-semibold block mt-0.5">
                  Installment #{receipt.installmentNumber}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                    Fee Payment for Installment #{receipt.installmentNumber} ({receipt.courseName})
                  </td>
                  <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatRupees(receipt.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">Total Amount Paid</td>
                  <td className="p-3 text-right font-black text-xl text-emerald-600 dark:text-emerald-400">
                    {formatRupees(receipt.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Payment Details */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-500">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold text-slate-900 dark:text-white">{receipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Reference ID:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{receipt.referenceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Verification Status:</span>
                <span className="font-bold text-emerald-600 inline-flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> VERIFIED & CONFIRMED
                </span>
              </div>
            </div>

            {/* Footer stamp */}
            <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
              <span>This is a computer-generated digital receipt. No signature required.</span>
              <span>Generated on {new Date().toLocaleString()}</span>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function TenantAdminReceiptViewPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <ReceiptViewContent />
    </ProtectedRoute>
  );
}
