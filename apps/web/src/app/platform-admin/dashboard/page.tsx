'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  RefreshCw,
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Trash2,
  X,
  AlertCircle,
  ShieldCheck,
  Check,
  ToggleLeft,
  ToggleRight,
  Lock,
  Mail,
  Globe,
  Key,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TenantItem {
  id: string;
  code: string;
  slug: string;
  name: string;
  displayName: string;
  email: string;
  phone: string;
  website: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  timezone: string;
  currency: string;
  createdAt: string;
  primaryAdmin: {
    id: string;
    name: string;
    email: string;
  } | null;
  metrics: {
    totalUsers: number;
    branchesCount: number;
    coursesCount: number;
  };
}

interface TenantsResponse {
  items: TenantItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DashboardMetricsResponse {
  metrics: {
    tenants: {
      total: number;
      active: number;
      inactive: number;
      suspended: number;
    };
    users: {
      students: number;
      staff: number;
      tenantAdmins: number;
      totalUsers: number;
    };
  };
}

const DEFAULT_FEATURES = [
  { key: 'ONLINE_CBT_EXAMS', label: 'Online CBT Examination Engine' },
  { key: 'AI_TUTOR_BOT', label: 'AI Tutor & Doubt Assistant' },
  { key: 'FEE_COLLECTION', label: 'Fee Ledger & Payment Processing' },
  { key: 'LIVE_CLASSES', label: 'Live Video Classes & Breakouts' },
  { key: 'ANALYTICS_REPORTS', label: 'Student & Financial Analytics' },
];

const generateUniqueInstituteCode = (nameStr?: string) => {
  let prefix = 'INST';
  if (nameStr && nameStr.trim().length > 0) {
    const clean = nameStr.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length >= 3) {
      prefix = clean.slice(0, 4);
    } else if (clean.length > 0) {
      prefix = clean;
    }
  }
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
};

export default function PlatformAdminDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State for Directory Filters & Pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [viewTenantModal, setViewTenantModal] = useState<TenantItem | null>(null);
  const [selectedTenantForStatus, setSelectedTenantForStatus] = useState<TenantItem | null>(null);
  const [newStatusReason, setNewStatusReason] = useState('');
  const [targetStatus, setTargetStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('SUSPENDED');

  // Register Form State & Success Confirmation Modal State
  const [createdTenantResult, setCreatedTenantResult] = useState<any | null>(null);
  const [registerForm, setRegisterForm] = useState({
    code: generateUniqueInstituteCode(),
    name: '',
    displayName: '',
    email: '',
    phone: '',
    website: '',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    initialFeatures: [
      'ONLINE_CBT_EXAMS',
      'AI_TUTOR_BOT',
      'FEE_COLLECTION',
      'LIVE_CLASSES',
      'ANALYTICS_REPORTS',
      'WHATSAPP_ALERTS',
    ],
  });
  const [registerError, setRegisterError] = useState<string | null>(null);

  const toggleFeatureFlag = (key: string) => {
    setRegisterForm((prev) => {
      const exists = prev.initialFeatures.includes(key);
      return {
        ...prev,
        initialFeatures: exists
          ? prev.initialFeatures.filter((k) => k !== key)
          : [...prev.initialFeatures, key],
      };
    });
  };

  // 1. Fetch KPI Metrics
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<DashboardMetricsResponse>({
    queryKey: ['platform-dashboard-metrics'],
    queryFn: () => api.get('/platform-admin/dashboard'),
    refetchInterval: 30000,
  });

  // 2. Fetch Embedded Tenants Directory List
  const { data: tenantsData, isLoading: tenantsLoading, refetch: refetchTenants } = useQuery<TenantsResponse>({
    queryKey: ['platform-tenants', page, search, statusFilter],
    queryFn: () =>
      api.get('/platform-admin/tenants', {
        params: { page, limit: 10, search, status: statusFilter },
      }),
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: (vars: { tenantId: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; reason?: string }) =>
      api.patch(`/platform-admin/tenants/${vars.tenantId}/status`, {
        status: vars.status,
        reason: vars.reason,
      }),
    onSuccess: () => {
      setSelectedTenantForStatus(null);
      setNewStatusReason('');
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-dashboard-metrics'] });
    },
  });

  // Delete Tenant Mutation
  const [tenantToDelete, setTenantToDelete] = useState<TenantItem | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (tenantId: string) => api.delete(`/platform-admin/tenants/${tenantId}`),
    onSuccess: () => {
      setTenantToDelete(null);
      toast.success('Institute deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-dashboard-metrics'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete institute';
      toast.error(msg);
    },
  });

  // Register Tenant Mutation
  const registerMutation = useMutation({
    mutationFn: (payload: any) => api.post('/platform-admin/tenants', payload),
    onSuccess: (res: any) => {
      setRegisterModalOpen(false);
      setCreatedTenantResult(res);
      setRegisterForm({
        code: generateUniqueInstituteCode(),
        name: '',
        displayName: '',
        email: '',
        phone: '',
        website: '',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        adminFirstName: '',
        adminLastName: '',
        adminEmail: '',
        initialFeatures: [
          'ONLINE_CBT_EXAMS',
          'AI_TUTOR_BOT',
          'FEE_COLLECTION',
          'LIVE_CLASSES',
          'ANALYTICS_REPORTS',
          'WHATSAPP_ALERTS',
        ],
      });
      setRegisterError(null);
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-dashboard-metrics'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to register tenant institute';
      setRegisterError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    if (!registerForm.code || !registerForm.name || !registerForm.email || !registerForm.adminEmail) {
      setRegisterError('Please fill in all required fields marked with *');
      return;
    }

    registerMutation.mutate({
      code: registerForm.code.trim().toUpperCase(),
      name: registerForm.name.trim(),
      displayName: registerForm.displayName.trim() || registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
      phone: registerForm.phone.trim(),
      website: registerForm.website.trim(),
      timezone: registerForm.timezone,
      currency: registerForm.currency,
      adminFirstName: registerForm.adminFirstName.trim(),
      adminLastName: registerForm.adminLastName.trim(),
      adminEmail: registerForm.adminEmail.trim().toLowerCase(),
      initialFeatures: registerForm.initialFeatures,
    });
  };

  const handleStatusSubmit = () => {
    if (!selectedTenantForStatus) return;
    statusMutation.mutate({
      tenantId: selectedTenantForStatus.id,
      status: targetStatus,
      reason: newStatusReason,
    });
  };

  const metrics = metricsData?.metrics;

  return (
    <div className="space-y-8 font-sans text-[#0F172A] pb-12 w-full">
      {/* 🔴 PRIORITY SLIM BANNER BAR: LIVE PLATFORM STATUS (Clean Simple English Theme) */}
      <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50/70 to-sky-50 text-slate-900 p-5 sm:p-6 rounded-2xl shadow-2xs border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-5 font-sans">
        <div className="space-y-2.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-xs font-black rounded-full flex items-center gap-1.5 shrink-0 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              SYSTEM ONLINE & ACTIVE
            </span>
            <span className="text-xs text-[#0052CC] bg-blue-100/70 border border-blue-200 px-3 py-0.5 rounded-full font-extrabold truncate">
              Platform Governance
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2447] tracking-tight leading-snug">
            Institute Management & Platform Overview
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600 font-medium pt-0.5">
            <span className="inline-flex items-center gap-1.5 text-[#0052CC] font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <Building2 className="w-4 h-4 text-[#0052CC]" />
              Active Institutes: {metricsLoading ? '...' : metrics?.tenants?.active ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs font-bold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              System Status: 100% Operational
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs font-bold text-slate-800">
              <Users className="w-4 h-4 text-indigo-600" />
              {metricsLoading ? '...' : metrics?.users?.totalUsers ?? 0} Registered Accounts
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => {
              refetchMetrics();
              refetchTenants();
              toast.info('Refreshing platform data...');
            }}
            variant="outline"
            size="sm"
            className="text-xs font-bold rounded-xl border-slate-300 bg-white hover:bg-slate-50 h-10 px-3.5 cursor-pointer gap-1.5 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Data</span>
          </Button>

          <Button
            onClick={() => router.push('/platform-admin/tenants/new')}
            className="px-5 py-2.5 bg-[#0052CC] hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer h-10"
          >
            <Building2 className="w-4 h-4 text-white" />
            <span>+ REGISTER NEW INSTITUTE</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Institutes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Total Institutes
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {metricsLoading ? '...' : metrics?.tenants.total ?? 0}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Registered Institutes
            </p>
          </div>
        </div>

        {/* Card 2: Active Institutes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
              Active Institutes
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {metricsLoading ? '...' : metrics?.tenants.active ?? 0}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">
              Active & Operational
            </p>
          </div>
        </div>

        {/* Card 3: Suspended / Inactive Institutes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-600 uppercase tracking-wider">
              Inactive / Suspended
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-2">
              {metricsLoading ? (
                '...'
              ) : (
                <>
                  <span>{(metrics?.tenants.suspended ?? 0) + (metrics?.tenants.inactive ?? 0)}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    ({metrics?.tenants.suspended ?? 0} Suspended)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-amber-600 font-medium mt-1">
              Access Blocked
            </p>
          </div>
        </div>

        {/* Card 4: Total Platform Accounts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
              Total Accounts
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {metricsLoading ? '...' : metrics?.users.totalUsers ?? 0}
            </div>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              Students, Teachers & Admins
            </p>
          </div>
        </div>
      </div>

      {/* 3. Embedded Tenants Directory Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0052CC]" /> Institutes Directory
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Filter registered coaching organizations, manage status, and view primary administrator contacts.
            </p>
          </div>
          <Button
            onClick={() => router.push('/platform-admin/tenants/new')}
            className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs px-4 py-2 shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Register New Institute
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search code, name, email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto">
            {['ALL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#0052CC] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table / Card List Container */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* DESKTOP TABLE VIEW (hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Institute Details</th>
                  <th className="py-3.5 px-4">Primary Administrator</th>
                  <th className="py-3.5 px-4">Metrics</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tenantsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0052CC] mb-2" />
                      Loading institutes directory...
                    </td>
                  </tr>
                ) : !tenantsData?.items || tenantsData.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      No institutes matching current search/filter criteria.
                    </td>
                  </tr>
                ) : (
                  tenantsData.items.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 text-[#0052CC] flex items-center justify-center font-black shrink-0 shadow-2xs">
                            {tenant.code.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => router.push(`/platform-admin/tenants/${tenant.id}`)}
                              className="font-extrabold text-slate-900 hover:text-[#0052CC] transition-colors truncate text-left block text-sm cursor-pointer"
                            >
                              {tenant.name}
                            </button>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                              <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md">{tenant.code}</span>
                              <span>•</span>
                              <span className="truncate">{tenant.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {tenant.primaryAdmin ? (
                          <div>
                            <p className="font-bold text-slate-900">{tenant.primaryAdmin.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{tenant.primaryAdmin.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No admin assigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="font-bold text-slate-800 bg-blue-50 text-[#0052CC] border border-blue-100 px-2 py-0.5 rounded-md">
                            {tenant.metrics.totalUsers} Users
                          </span>
                          <span className="font-bold text-slate-800 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {tenant.metrics.branchesCount} Branches
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={tenant.status === 'ACTIVE'}
                            disabled={statusMutation.isPending}
                            onClick={() => {
                              const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                              setSelectedTenantForStatus(tenant);
                              statusMutation.mutate({
                                tenantId: tenant.id,
                                status: nextStatus,
                                reason: `Quick toggle to ${nextStatus} from directory table`,
                              });
                            }}
                            className={cn(
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:ring-offset-2 disabled:opacity-50',
                              tenant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
                            )}
                            title={`Click to ${tenant.status === 'ACTIVE' ? 'deactivate' : 'activate'} institute`}
                          >
                            <span className="sr-only">Toggle institute status</span>
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-[9px] font-bold',
                                tenant.status === 'ACTIVE' ? 'translate-x-5 text-emerald-600' : 'translate-x-0 text-slate-400'
                              )}
                            >
                              {statusMutation.isPending && selectedTenantForStatus?.id === tenant.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-[#0052CC]" />
                              ) : null}
                            </span>
                          </button>
                          <span
                            className={cn(
                              'text-xs font-extrabold tracking-wide uppercase',
                              tenant.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'
                            )}
                          >
                            {tenant.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/platform-admin/tenants/${tenant.id}`)}
                            className="h-8 px-3 bg-blue-50 text-[#0052CC] hover:bg-blue-100 hover:text-blue-800 border-blue-200/80 rounded-xl text-xs font-extrabold gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setTenantToDelete(tenant)}
                            className="h-8 px-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200/80 rounded-xl text-xs font-extrabold gap-1.5 cursor-pointer shadow-2xs"
                            title="Delete Institute"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE / TABLET CARD VIEW (block md:hidden) */}
          <div className="block md:hidden p-4">
            {tenantsLoading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0052CC]" />
                <p className="text-xs font-extrabold">Loading institutes directory...</p>
              </div>
            ) : !tenantsData?.items || tenantsData.items.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium">
                No institutes matching current search/filter criteria.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {tenantsData.items.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-blue-300 transition-all space-y-3.5 relative"
                  >
                    {/* Top Row: Avatar + Name + Code + Status Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 text-[#0052CC] flex items-center justify-center font-black shrink-0 text-sm shadow-2xs">
                          {tenant.code.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => router.push(`/platform-admin/tenants/${tenant.id}`)}
                            className="font-extrabold text-slate-900 hover:text-[#0052CC] transition-colors truncate text-left block text-sm cursor-pointer"
                          >
                            {tenant.name}
                          </button>
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                            {tenant.code}
                          </span>
                        </div>
                      </div>

                      {/* Status Switch */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={tenant.status === 'ACTIVE'}
                          disabled={statusMutation.isPending}
                          onClick={() => {
                            const nextStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                            setSelectedTenantForStatus(tenant);
                            statusMutation.mutate({
                              tenantId: tenant.id,
                              status: nextStatus,
                              reason: `Quick toggle to ${nextStatus}`,
                            });
                          }}
                          className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50',
                            tenant.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'
                          )}
                        >
                          <span
                            className={cn(
                              'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out',
                              tenant.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </button>
                        <span
                          className={cn(
                            'text-[10px] font-black uppercase tracking-wider',
                            tenant.status === 'ACTIVE' ? 'text-emerald-700' : 'text-slate-500'
                          )}
                        >
                          {tenant.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Email & Primary Admin info */}
                    <div className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Contact Email:</span>
                        <span className="font-mono text-slate-700 font-semibold truncate max-w-[170px]">
                          {tenant.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">Primary Admin:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]">
                          {tenant.primaryAdmin ? tenant.primaryAdmin.name : 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Pills */}
                    <div className="flex items-center justify-between gap-2 text-[11px] pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-800 bg-blue-50 text-[#0052CC] border border-blue-100 px-2 py-0.5 rounded-md">
                          {tenant.metrics.totalUsers} Users
                        </span>
                        <span className="font-extrabold text-slate-800 bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {tenant.metrics.branchesCount} Branches
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/platform-admin/tenants/${tenant.id}`)}
                        className="flex-1 h-8 bg-blue-50 text-[#0052CC] hover:bg-blue-100 border-blue-200/80 rounded-xl text-xs font-extrabold gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTenantToDelete(tenant)}
                        className="h-8 px-3 bg-red-50 text-red-600 hover:bg-red-100 border-red-200/80 rounded-xl text-xs font-extrabold gap-1.5 cursor-pointer shrink-0"
                        title="Delete Institute"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {tenantsData?.meta && tenantsData.meta.totalPages > 1 && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing Page <strong>{tenantsData.meta.page}</strong> of <strong>{tenantsData.meta.totalPages}</strong> ({tenantsData.meta.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-xl h-8 text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= tenantsData.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl h-8 text-xs cursor-pointer"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL 1: REGISTER NEW INSTITUTE WIZARD */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 font-sans max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052CC] text-[10px] font-extrabold tracking-wide uppercase mb-0.5">
                    <Sparkles className="w-3 h-3" /> Multi-Tenant Provisioning Engine
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Register New Coaching Institute
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure institute identity, localization, primary admin privileges & initial feature modules.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRegisterModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Security Concept Callout Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg space-y-2 border border-blue-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs font-black tracking-wide text-cyan-300 uppercase">
                    Automated Onboarding & Security Architecture Concept
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-cyan-200 font-bold border border-white/10">
                  Zero-Trust Onboarding
                </span>
              </div>
              <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
                How initial access works for new institute administrators:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] pt-1">
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-1.5 font-extrabold text-cyan-300 mb-0.5">
                    <Lock className="w-3.5 h-3.5" /> 1. Crypto Password
                  </div>
                  <p className="text-slate-300 text-[10px] leading-tight">
                    System generates a secure temporary password using <code className="text-cyan-200 font-mono">crypto.randomBytes(16)</code>.
                  </p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-1.5 font-extrabold text-cyan-300 mb-0.5">
                    <Mail className="w-3.5 h-3.5" /> 2. Welcome Email
                  </div>
                  <p className="text-slate-300 text-[10px] leading-tight">
                    An automated email is sent to Admin Email containing a secure 48-hr portal reset link.
                  </p>
                </div>
                <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-1.5 font-extrabold text-cyan-300 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 3. Mandatory Reset
                  </div>
                  <p className="text-slate-300 text-[10px] leading-tight">
                    Flag <code className="text-cyan-200 font-mono">forcePasswordChange: true</code> forces admin to set a private password on 1st login.
                  </p>
                </div>
              </div>
            </div>

            {registerError && (
              <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-start gap-3 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-extrabold">Registration Failed</p>
                  <p className="text-red-700">{registerError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-6 text-xs font-sans">
              {/* SECTION 1: Institute General Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052CC] flex items-center justify-center text-[10px] font-black">1</span>
                    Institute General Profile
                  </h4>
                  <span className="text-[11px] text-slate-400">* Required Fields</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Institute Unique Code *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. APEX, KOTA, ALLEN"
                      value={registerForm.code}
                      onChange={(e) => setRegisterForm({ ...registerForm, code: e.target.value.toUpperCase() })}
                      className="text-xs font-mono font-bold tracking-wider uppercase rounded-xl border-slate-200 focus:border-[#0052CC]"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Short identifier used in login subdomains & student IDs.</p>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Full Legal Institute Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Apex Coaching Academy Pvt Ltd"
                      value={registerForm.name}
                      onChange={(e) =>
                        setRegisterForm({
                          ...registerForm,
                          name: e.target.value,
                          displayName: registerForm.displayName || e.target.value,
                        })
                      }
                      className="text-xs rounded-xl border-slate-200 focus:border-[#0052CC]"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Display / Brand Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Apex NEET Academy"
                      value={registerForm.displayName}
                      onChange={(e) => setRegisterForm({ ...registerForm, displayName: e.target.value })}
                      className="text-xs rounded-xl border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Official Contact Email *
                    </label>
                    <Input
                      type="email"
                      placeholder="contact@apexcoaching.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      className="text-xs rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Contact Phone Number *
                    </label>
                    <Input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                      className="text-xs rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Official Website URL
                    </label>
                    <Input
                      type="text"
                      placeholder="https://apexcoaching.in"
                      value={registerForm.website}
                      onChange={(e) => setRegisterForm({ ...registerForm, website: e.target.value })}
                      className="text-xs rounded-xl border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Regional & System Config */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052CC] flex items-center justify-center text-[10px] font-black">2</span>
                    Regional & System Configuration
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Primary Timezone</label>
                    <select
                      value={registerForm.timezone}
                      onChange={(e) => setRegisterForm({ ...registerForm, timezone: e.target.value })}
                      className="w-full h-9 text-xs rounded-xl border border-slate-200 px-3 bg-white font-medium focus:ring-2 focus:ring-[#0052CC] outline-none"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="America/New_York">America/New_York (EST -05:00)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Base Billing Currency</label>
                    <select
                      value={registerForm.currency}
                      onChange={(e) => setRegisterForm({ ...registerForm, currency: e.target.value })}
                      className="w-full h-9 text-xs rounded-xl border border-slate-200 px-3 bg-white font-medium focus:ring-2 focus:ring-[#0052CC] outline-none"
                    >
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                      <option value="EUR">EUR (€ - Euro)</option>
                      <option value="AED">AED (AED - UAE Dirham)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Primary Administrator Details */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052CC] flex items-center justify-center text-[10px] font-black">3</span>
                    Primary Administrator Account
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Admin First Name *</label>
                    <Input
                      type="text"
                      placeholder="e.g. Ramesh"
                      value={registerForm.adminFirstName}
                      onChange={(e) => setRegisterForm({ ...registerForm, adminFirstName: e.target.value })}
                      className="text-xs rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Admin Last Name *</label>
                    <Input
                      type="text"
                      placeholder="e.g. Kumar"
                      value={registerForm.adminLastName}
                      onChange={(e) => setRegisterForm({ ...registerForm, adminLastName: e.target.value })}
                      className="text-xs rounded-xl border-slate-200"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">
                      Admin Login Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="admin@apexcoaching.com"
                      value={registerForm.adminEmail}
                      onChange={(e) => setRegisterForm({ ...registerForm, adminEmail: e.target.value })}
                      className="text-xs rounded-xl border-slate-200"
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      This user will be assigned the <strong className="text-slate-700">TENANT_ADMIN</strong> root role with full managerial access to this institute portal.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Initial Feature Flags Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0052CC] flex items-center justify-center text-[10px] font-black">4</span>
                    Enabled SaaS Feature Modules
                  </h4>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {registerForm.initialFeatures.length} / {DEFAULT_FEATURES.length + 1} Modules Selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    ...DEFAULT_FEATURES,
                    { key: 'WHATSAPP_ALERTS', label: 'WhatsApp Notification & SMS Alerts' },
                  ].map((feature) => {
                    const isChecked = registerForm.initialFeatures.includes(feature.key);
                    return (
                      <label
                        key={feature.key}
                        onClick={() => toggleFeatureFlag(feature.key)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none',
                          isChecked
                            ? 'bg-blue-50/70 border-blue-300 text-slate-900 shadow-2xs'
                            : 'bg-slate-50/60 border-slate-200 text-slate-500 hover:bg-slate-100'
                        )}
                      >
                        <span className="font-extrabold text-xs">{feature.label}</span>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-lg flex items-center justify-center transition-colors',
                            isChecked ? 'bg-[#0052CC] text-white' : 'bg-slate-200 text-transparent'
                          )}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRegisterModalOpen(false)}
                  className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="bg-gradient-to-r from-[#0052CC] to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-xl text-xs px-6 py-2.5 shadow-lg shadow-blue-500/25 cursor-pointer gap-2"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Institute...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Complete Registration & Send Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: PROVISIONING SUCCESS CONFIRMATION */}
      {createdTenantResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 font-sans">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Institute Provisioned Successfully!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                The multi-tenant workspace & primary administrator account have been initialized.
              </p>
            </div>

            {/* Summary Details */}
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold uppercase text-[10px]">Institute Code</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                    {createdTenantResult.institute.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Institute Name:</span>
                  <span className="font-extrabold text-slate-900">{createdTenantResult.institute.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Subdomain Slug:</span>
                  <span className="font-mono font-bold text-blue-700">{createdTenantResult.institute.slug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-bold">Admin Email:</span>
                  <span className="font-mono font-bold text-slate-800">{createdTenantResult.adminUser.email}</span>
                </div>
              </div>

              {/* Invitation Link Box */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-[#0052CC] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Admin Onboarding Password Setup Link
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    48h Expiry Token
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  An automated email has been queued to <strong>{createdTenantResult.adminUser.email}</strong>. You can also copy the manual onboarding URL below:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    readOnly
                    value={`http://localhost:3001/auth/reset-password?token=${createdTenantResult.rawInvitationToken}`}
                    className="text-[11px] font-mono bg-white border-blue-200 rounded-xl"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `http://localhost:3001/auth/reset-password?token=${createdTenantResult.rawInvitationToken}`
                      );
                      alert('Onboarding setup link copied to clipboard!');
                    }}
                    className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs px-3 cursor-pointer shrink-0"
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreatedTenantResult(null)}
                className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
              >
                Close Window
              </Button>
              <Button
                onClick={() => {
                  const id = createdTenantResult.institute.id;
                  setCreatedTenantResult(null);
                  router.push(`/platform-admin/tenants/${id}`);
                }}
                className="bg-[#0052CC] hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs px-5 py-2.5 cursor-pointer shadow-md shadow-blue-500/20"
              >
                View Institute Details Profile →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL 2: VIEW INSTITUTE DETAILS */}
      {viewTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] border border-blue-100 flex items-center justify-center font-black">
                  {viewTenantModal.code.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{viewTenantModal.name}</h3>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    Code: {viewTenantModal.code}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewTenantModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-extrabold text-slate-900">{viewTenantModal.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered On</span>
                  <span className="font-extrabold text-slate-900">{new Date(viewTenantModal.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Email</span>
                  <span className="font-bold text-slate-800 truncate block">{viewTenantModal.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone</span>
                  <span className="font-bold text-slate-800">{viewTenantModal.phone || 'N/A'}</span>
                </div>
              </div>

              {viewTenantModal.primaryAdmin && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                  <span className="text-[10px] font-extrabold text-[#0052CC] uppercase tracking-wider">Primary Administrator</span>
                  <p className="font-extrabold text-slate-900 text-xs">{viewTenantModal.primaryAdmin.name}</p>
                  <p className="text-[11px] text-slate-600 font-mono">{viewTenantModal.primaryAdmin.email}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setViewTenantModal(null)}
                className="bg-[#0052CC] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL 3: SUSPEND / REACTIVATE STATUS */}
      {selectedTenantForStatus && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                targetStatus === 'SUSPENDED' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                {targetStatus === 'SUSPENDED' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {targetStatus === 'SUSPENDED' ? 'Suspend Institute Access' : 'Reactivate Institute Access'}
                </h3>
                <p className="text-xs text-slate-500">
                  Institute: <span className="font-bold text-slate-700">{selectedTenantForStatus.name}</span> ({selectedTenantForStatus.code})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {targetStatus === 'SUSPENDED'
                ? 'Transitioning to SUSPENDED blocks non-superadmin users of this institute from logging in. Institute data remains completely intact.'
                : 'Transitioning to ACTIVE immediately restores full login privileges for users belonging to this institute.'}
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Audit Log Reason / Notes</label>
              <Input
                type="text"
                placeholder="Enter justification or audit log note..."
                value={newStatusReason}
                onChange={(e) => setNewStatusReason(e.target.value)}
                className="text-xs rounded-xl border-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedTenantForStatus(null)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusSubmit}
                disabled={statusMutation.isPending}
                className={`rounded-xl text-xs font-bold text-white cursor-pointer ${
                  targetStatus === 'SUSPENDED'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusMutation.isPending ? 'Updating...' : `Confirm ${targetStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: DELETE TENANT CONFIRMATION */}
      {tenantToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold shadow-md shadow-red-500/10">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Delete Institute?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    This action will archive the institute and its user accounts.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTenantToDelete(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-500" />
                <span>{tenantToDelete.name}</span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{tenantToDelete.code}</span>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">{tenantToDelete.name}</strong>? This action will mark the coaching institute as deleted and suspend its registered student and faculty user accounts.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setTenantToDelete(null)}
                className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(tenantToDelete.id)}
                className="bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs px-4 py-2 cursor-pointer shadow-md shadow-red-500/20 gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Institute</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
