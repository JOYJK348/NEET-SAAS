'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  CreditCard,
  AlertTriangle,
  Receipt,
  Layers,
  Users,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Kpis {
  totalAssignedFee: number;
  totalCollected: number;
  totalOutstanding: number;
  overdueCount: number;
}

function FeesDashboardContent() {
  const router = useRouter();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadKpis() {
      try {
        const data = await api.get<Kpis>('/billing/ledger/kpis');
        setKpis(data);
      } catch (err: any) {
        console.error('Failed to load billing KPIs', err);
      } finally {
        setLoading(false);
      }
    }
    loadKpis();
  }, []);

  const formatRupees = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 lg:p-6 bg-[#FAFAFA] min-h-screen text-[#111827]">
        {/* Welcome Header Banner - Signature Violet Gradient */}
        <div className="bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-violet-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-200" />
              <span className="text-[10px] sm:text-xs font-semibold text-violet-200 uppercase tracking-wider">
                Financial Operations & Ledger
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black leading-tight text-white">
              Fee Management Engine 💰
            </h1>
            <p className="text-violet-200 text-xs mt-0.5">
              Course fee plans, installment schedules, offline payments, and Razorpay online checkout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => router.push('/tenant-admin/fees/plans')}
              className="gap-2 bg-white/20 hover:bg-white/30 text-white font-bold border-0 backdrop-blur-sm rounded-xl text-xs"
            >
              <Layers className="h-4 w-4" />
              <span>Fee Plans</span>
            </Button>
            <Button
              onClick={() => router.push('/tenant-admin/fees/payments/collect')}
              className="gap-2 bg-white text-violet-700 hover:bg-violet-50 font-bold border-0 shadow-xs rounded-xl text-xs"
            >
              <CreditCard className="h-4 w-4 text-violet-600" />
              <span>Collect Payment</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-violet-100 bg-violet-50 text-violet-600 shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Total Assigned Fee
              </p>
              <p className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">
                {loading ? '...' : formatRupees(kpis?.totalAssignedFee || 0)}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Total Collected
              </p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                {loading ? '...' : formatRupees(kpis?.totalCollected || 0)}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-amber-100 bg-amber-50 text-amber-600 shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Total Outstanding
              </p>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                {loading ? '...' : formatRupees(kpis?.totalOutstanding || 0)}
              </p>
            </div>
          </Card>

          <Card className="rounded-2xl border-[#E5E7EB] bg-white p-3.5 sm:p-4 shadow-xs flex items-center gap-3 transition-all hover:-translate-y-0.5 hover:border-[#7C3AED]/50">
            <div className="p-2.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Overdue Installments
              </p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">
                {loading ? '...' : kpis?.overdueCount || 0}
              </p>
            </div>
          </Card>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card
            onClick={() => router.push('/tenant-admin/fees/plans')}
            className="p-6 rounded-2xl cursor-pointer border border-[#E5E7EB] bg-white hover:border-violet-300 transition-all hover:-translate-y-1 hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-violet-600 transition-colors" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Fee Plans & Structures</h3>
            <p className="text-xs text-slate-500 mt-1">
              Define course fees, line items (Tuition, Material), and 3-month or 6-month installment plans.
            </p>
          </Card>

          <Card
            onClick={() => router.push('/tenant-admin/fees/students')}
            className="p-6 rounded-2xl cursor-pointer border border-[#E5E7EB] bg-white hover:border-emerald-300 transition-all hover:-translate-y-1 hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Student Fee Accounts</h3>
            <p className="text-xs text-slate-500 mt-1">
              Assign fees to students at enrollment, view installment schedules, and track individual balances.
            </p>
          </Card>

          <Card
            onClick={() => router.push('/tenant-admin/fees/reports/outstanding')}
            className="p-6 rounded-2xl cursor-pointer border border-[#E5E7EB] bg-white hover:border-rose-300 transition-all hover:-translate-y-1 hover:shadow-md group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">Overdue & Outstanding Reports</h3>
            <p className="text-xs text-slate-500 mt-1">
              Filter students with unpaid or overdue installments, view days overdue, and export CSV reports.
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function TenantAdminFeesPage() {
  return (
    <ProtectedRoute allowedRoles={['TENANT_ADMIN', 'SUPER_ADMIN']}>
      <FeesDashboardContent />
    </ProtectedRoute>
  );
}
