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
  Layers,
  Users,
  FileText,
  TrendingUp,
  ArrowRight,
  ChevronRight,
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
      <div className="w-full space-y-6 p-4 lg:p-6 bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans pb-24">
        {/* Header Banner - ISML LMS Light Blue Style */}
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 text-slate-900 p-4 sm:p-6 rounded-2xl shadow-2xs space-y-2 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#0052CC]">
              <span>Management Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#0052CC]" />
              <span>Financial Operations & Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B2447]">
              Fee Management Engine
            </h1>
            <p className="text-xs text-slate-600 font-medium">
              Course fee plans, installment schedules, offline payments, and Razorpay online
              checkout.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
            <Button
              onClick={() => router.push('/tenant-admin/fees/plans')}
              className="gap-2 bg-white hover:bg-slate-50 text-[#0052CC] font-extrabold border border-blue-200 shadow-2xs rounded-xl text-xs"
            >
              <Layers className="h-4 w-4 text-[#0052CC]" />
              <span>Fee Plans</span>
            </Button>
            <Button
              onClick={() => router.push('/tenant-admin/fees/payments/collect')}
              className="gap-2 bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold shadow-2xs rounded-xl text-xs"
            >
              <CreditCard className="h-4 w-4 text-white" />
              <span>Collect Payment</span>
            </Button>
          </div>
        </div>

        {/* KPI Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-[#0052CC] shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Total Assigned Fee
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-[#0B2447] mt-0.5">
                  {loading ? '...' : formatRupees(kpis?.totalAssignedFee || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Total Collected
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-0.5">
                  {loading ? '...' : formatRupees(kpis?.totalCollected || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-600 shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Total Outstanding
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-700 mt-0.5">
                  {loading ? '...' : formatRupees(kpis?.totalOutstanding || 0)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-2xs transition-all hover:border-[#0052CC]/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  Overdue Installments
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-0.5">
                  {loading ? '...' : kpis?.overdueCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Fee Plans & Structures */}
          <Card
            onClick={() => router.push('/tenant-admin/fees/plans')}
            className="p-6 rounded-2xl cursor-pointer border border-slate-200 bg-white hover:border-[#0052CC] transition-all hover:shadow-md group flex flex-col justify-between space-y-5 border-l-4 border-l-[#0052CC]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 group-hover:scale-105 transition-transform shadow-2xs">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200 font-mono">
                  Structural Config
                </span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0B2447] group-hover:text-[#0052CC] transition-colors">
                  Fee Plans & Structures
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                  Define course fees, line items (Tuition, Material), and 3-month or 6-month
                  installment plans.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-[#0052CC]">
              <span>Configure Plans</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>

          {/* Card 2: Student Fee Accounts */}
          <Card
            onClick={() => router.push('/tenant-admin/fees/students')}
            className="p-6 rounded-2xl cursor-pointer border border-slate-200 bg-white hover:border-[#0052CC] transition-all hover:shadow-md group flex flex-col justify-between space-y-5 border-l-4 border-l-[#0052CC]"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-200 group-hover:scale-105 transition-transform shadow-2xs">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200 font-mono">
                  Ledger & Balances
                </span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0B2447] group-hover:text-[#0052CC] transition-colors">
                  Student Fee Accounts
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                  Assign fees to students at enrollment, view installment schedules, and track
                  individual balances.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-[#0052CC]">
              <span>Inspect Student Ledgers</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Card>

          {/* Card 3: Overdue & Outstanding Reports */}
          <Card
            onClick={() => router.push('/tenant-admin/fees/reports/outstanding')}
            className="p-6 rounded-2xl cursor-pointer border border-slate-200 bg-white hover:border-rose-400 transition-all hover:shadow-md group flex flex-col justify-between space-y-5 border-l-4 border-l-rose-500"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 group-hover:scale-105 transition-transform shadow-2xs">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-mono">
                  Analytics & Reports
                </span>
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0B2447] group-hover:text-rose-600 transition-colors">
                  Overdue & Outstanding Reports
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                  Filter students with unpaid or overdue installments, view days overdue, and export
                  CSV reports.
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-rose-600">
              <span>View Outstanding Reports</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
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
