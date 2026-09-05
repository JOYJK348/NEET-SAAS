'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
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
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
        <div className="flex items-center justify-between print:hidden max-w-3xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-slate-600 font-bold"
          >
            <ArrowLeft className="w-4 h-4 mr-1 text-[#0052CC]" /> Back
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs"
          >
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 font-medium">
            Loading receipt details...
          </div>
        ) : !receipt ? (
          <Card className="p-8 text-center text-rose-600 font-bold max-w-3xl mx-auto rounded-2xl">
            Receipt record not found
          </Card>
        ) : (
          /* Receipt Card - Clean printable format */
          <Card className="max-w-3xl mx-auto p-8 border border-slate-200 bg-white shadow-2xs space-y-6 rounded-2xl print:shadow-none print:border-none print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs uppercase font-extrabold text-[#0052CC] tracking-wider">
                  Official Fee Receipt
                </span>
                <h1 className="text-2xl font-extrabold text-[#0B2447] mt-1">NEET ACADEMY</h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Head Office • Tamil Nadu
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase block tracking-wider">
                  Receipt Number
                </span>
                <span className="text-lg font-extrabold text-[#0052CC] font-mono">
                  {receipt.receiptNumber}
                </span>
                <span className="text-xs text-slate-500 block font-medium mt-1">
                  {new Date(receipt.paymentDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Student & Payment Summary Grid */}
            <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">
                  Student Name
                </span>
                <span className="font-extrabold text-[#0B2447]">{receipt.studentName}</span>
                <span className="text-xs text-slate-500 font-mono block mt-0.5">
                  Admission #: {receipt.admissionNumber}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold block">
                  Course Enrolled
                </span>
                <span className="font-extrabold text-[#0B2447]">{receipt.courseName}</span>
                <span className="text-xs text-[#0052CC] font-extrabold block mt-0.5">
                  Installment #{receipt.installmentNumber}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] uppercase font-extrabold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-800">
                    Fee Payment for Installment #{receipt.installmentNumber} ({receipt.courseName})
                  </td>
                  <td className="p-3 text-right font-extrabold text-[#0B2447]">
                    {formatRupees(receipt.amount)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="border-t-2 border-slate-200">
                <tr>
                  <td className="p-3 font-extrabold text-[#0B2447]">Total Amount Paid</td>
                  <td className="p-3 text-right font-extrabold text-xl text-emerald-600">
                    {formatRupees(receipt.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Payment Details */}
            <div className="pt-4 border-t border-slate-100 text-xs space-y-1.5 text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-extrabold text-[#0B2447]">{receipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Reference ID:</span>
                <span className="font-mono text-slate-700 font-bold">
                  {receipt.referenceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Verification Status:</span>
                <span className="font-extrabold text-emerald-600 inline-flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> VERIFIED & CONFIRMED
                </span>
              </div>
            </div>

            {/* Footer stamp */}
            <div className="pt-6 border-t border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-medium">
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
    <ProtectedRoute allowedRoles={['PARENT', 'STUDENT', 'TENANT_ADMIN', 'SUPER_ADMIN']}>
      <ReceiptViewContent />
    </ProtectedRoute>
  );
}
