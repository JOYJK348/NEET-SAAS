'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  Building2,
  ArrowLeft,
  UserCheck,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  ShieldCheck,
  Lock,
  Globe,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  ExternalLink,
  Phone,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AVAILABLE_FEATURES = [
  { key: 'ONLINE_CBT_EXAMS', label: 'Online CBT Examination Engine', desc: 'Real-time NTA style CBT mock exams & instant analysis.', default: true },
  { key: 'AI_TUTOR_BOT', label: 'AI Tutor & Doubt Assistant', desc: '24/7 AI-powered Doubt Resolution & Concept Explainer.', default: true },
  { key: 'FEE_COLLECTION', label: 'Fee Ledger & Payment Processing', desc: 'Automated fee collection, installments & receipts.', default: true },
  { key: 'LIVE_CLASSES', label: 'Live Video Classes & Breakouts', desc: 'HD Interactive online classrooms & recording archive.', default: true },
  { key: 'ANALYTICS_REPORTS', label: 'Student & Financial Analytics', desc: 'Predictive student performance graphs & revenue audit.', default: true, disabled: false },
  { key: 'WHATSAPP_ALERTS', label: 'WhatsApp & SMS Notifications', desc: 'Instant student attendance & exam result alert dispatch.', default: false, disabled: true },
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

export default function PlatformNewTenantPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [provisionedResult, setProvisionedResult] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [formData, setFormData] = useState({
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
  });

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    AVAILABLE_FEATURES.filter((f) => f.default).map((f) => f.key)
  );

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: (payload: any) => api.post('/platform-admin/tenants', payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
      queryClient.invalidateQueries({ queryKey: ['platform-dashboard-metrics'] });
      setProvisionedResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || err?.message || 'Failed to register tenant institute';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const toggleFeature = (key: string) => {
    const feat = AVAILABLE_FEATURES.find((f) => f.key === key);
    if (feat?.disabled) return;
    setSelectedFeatures((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.code || !formData.name || !formData.email || !formData.adminEmail) {
      setErrorMsg('Please fill in all required fields marked with *');
      return;
    }

    registerMutation.mutate({
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      displayName: formData.displayName.trim() || formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      website: formData.website.trim(),
      timezone: formData.timezone,
      currency: formData.currency,
      adminFirstName: formData.adminFirstName.trim(),
      adminLastName: formData.adminLastName.trim(),
      adminEmail: formData.adminEmail.trim().toLowerCase(),
      initialFeatures: selectedFeatures,
    });
  };

  // SUCCESS PROVISIONED SCREEN
  if (provisionedResult) {
    const onboardingUrl = `http://localhost:3001/auth/reset-password?token=${provisionedResult.rawInvitationToken}`;

    return (
      <div className="w-full space-y-8 font-sans pb-16 pt-4 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xl space-y-8 text-center relative overflow-hidden max-w-4xl mx-auto">
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
          
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Workspace Live & Provisioned
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {provisionedResult.institute.name}
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Multi-Tenant Coaching Workspace initialized. Primary Administrator permissions & initial SaaS feature flags have been active.
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Institute Code</span>
              <p className="font-mono font-extrabold text-slate-900 text-base">{provisionedResult.institute.code}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Subdomain Portal</span>
              <p className="font-mono font-bold text-[#0052CC] text-xs truncate">
                {provisionedResult.institute.slug}.neetplatform.com
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Primary Admin</span>
              <p className="font-bold text-slate-900 text-xs truncate">{provisionedResult.adminUser.email}</p>
            </div>
          </div>

          {/* Welcome Credentials Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 text-left space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0052CC]">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Admin Login Credentials Dispatched to Email
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Welcome Email Sent
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              An automated welcome email with initial login credentials has been sent to <strong>{provisionedResult.adminUser.email}</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Admin Login Email</span>
                <p className="font-mono font-extrabold text-slate-900 text-xs truncate">
                  {provisionedResult.adminUser.email}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Default Generated Password</span>
                <div className="flex items-center justify-between">
                  <p className="font-mono font-extrabold text-[#0052CC] text-sm">
                    {provisionedResult.adminUser?.initialPassword || `Admin@${(provisionedResult.institute?.phone || '').replace(/\D/g, '').slice(-4) || '1234'}`}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const pwd = provisionedResult.adminUser?.initialPassword || `Admin@${(provisionedResult.institute?.phone || '').replace(/\D/g, '').slice(-4) || '1234'}`;
                      navigator.clipboard.writeText(pwd);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    }}
                    className="h-6 px-2 text-[10px] text-blue-700 font-bold hover:bg-blue-50 rounded-lg cursor-pointer"
                  >
                    {copiedLink ? 'Copied!' : 'Copy Password'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => {
                setProvisionedResult(null);
                setFormData({
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
                });
              }}
              variant="outline"
              className="w-full sm:w-auto rounded-xl text-xs font-extrabold px-6 py-2.5 cursor-pointer"
            >
              Register Another Institute
            </Button>
            <Button
              onClick={() => router.push(`/platform-admin/tenants/${provisionedResult.institute.id}`)}
              className="w-full sm:w-auto bg-[#0052CC] hover:bg-blue-700 text-white font-black rounded-xl text-xs px-8 py-3 shadow-lg shadow-blue-500/25 cursor-pointer gap-2"
            >
              View Full Institute Workspace <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 font-sans pb-16">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Link href="/platform-admin/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl h-8 px-3 text-xs font-bold gap-1.5 cursor-pointer backdrop-blur-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </Button>
              </Link>
              <span className="text-white/40">•</span>
              <span className="text-[11px] font-bold text-cyan-200 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                Platform Governance Hub
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Building2 className="w-7 h-7 text-cyan-300" /> Register New Institute
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium">
              Enterprise Tenant Provisioning Engine — Configure institute profile, administrator credentials, regional settings & SaaS feature modules.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-semibold border border-red-200 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-extrabold">Registration Failed</p>
            <p className="text-red-700">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* 2. FULL SCREEN EDGE-TO-EDGE REGISTRATION FORM */}
      <form onSubmit={handleSubmit} className="space-y-8 w-full">
        {/* SECTION 1: Institute Profile */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0052CC] border border-blue-100 flex items-center justify-center font-bold shadow-2xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                1. Institute Identity & Profile
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Core organizational details used for tenant context and login subdomains.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Institute Code <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Auto-Generated
                </span>
              </div>
              <div className="relative flex items-center">
                <Input
                  type="text"
                  value={formData.code}
                  disabled
                  readOnly
                  className="text-xs uppercase font-mono font-black tracking-wider rounded-xl border-slate-200 bg-slate-100/90 text-slate-700 cursor-not-allowed select-none pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Regenerate unique code"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      code: generateUniqueInstituteCode(prev.name),
                    }))
                  }
                  className="absolute right-1 h-7 w-7 p-0 text-slate-400 hover:text-[#0052CC] hover:bg-white rounded-lg cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Unique identifier automatically generated for student IDs & subdomains (Read-only).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Apex Coaching Academy Pvt Ltd"
                value={formData.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    name: val,
                    code: generateUniqueInstituteCode(val),
                    displayName: prev.displayName || val,
                  }));
                }}
                className="text-xs rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Brand / Display Name</label>
              <Input
                type="text"
                placeholder="e.g. Apex NEET Academy"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="text-xs rounded-xl border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Official Contact Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="contact@apexcoaching.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="text-xs rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Official Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="text-xs rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Official Website URL</label>
              <Input
                type="text"
                placeholder="https://apexcoaching.in"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="text-xs rounded-xl border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Regional & System Config */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold shadow-2xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                2. Regional & System Configuration
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Timezone localization and base currency settings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Primary Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full h-10 text-xs rounded-xl border border-slate-200 px-3 bg-white font-medium focus:ring-2 focus:ring-[#0052CC] outline-none"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30 - India Standard Time)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00 - Gulf Standard Time)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America/New_York (EST -05:00 - Eastern Time)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Base Billing Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full h-10 text-xs rounded-xl border border-slate-200 px-3 bg-white font-medium focus:ring-2 focus:ring-[#0052CC] outline-none"
              >
                <option value="INR">INR (₹ - Indian Rupee)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="AED">AED (AED - UAE Dirham)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Primary Administrator Account */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center font-bold shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                3. Primary Administrator Account
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Root superuser credentials for managing this coaching institute.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Admin First Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Ramesh"
                value={formData.adminFirstName}
                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                className="text-xs rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Admin Last Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. Kumar"
                value={formData.adminLastName}
                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                className="text-xs rounded-xl border-slate-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Admin Login Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                placeholder="admin@apexcoaching.com"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                className="text-xs rounded-xl border-slate-200"
                required
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: Enterprise Modules */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-100 flex items-center justify-center font-bold shadow-2xs">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                  4. Enabled Enterprise SaaS Feature Flags
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Select which functional modules are active for this tenant workspace.
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-[#0052CC] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {selectedFeatures.length} / {AVAILABLE_FEATURES.length} Modules Selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AVAILABLE_FEATURES.map((feat) => {
              const isChecked = selectedFeatures.includes(feat.key);
              const isDisabled = feat.disabled;
              return (
                <div
                  key={feat.key}
                  onClick={() => !isDisabled && toggleFeature(feat.key)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all flex items-start justify-between select-none',
                    isDisabled
                      ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                      : isChecked
                      ? 'bg-blue-50/60 border-blue-300 shadow-2xs cursor-pointer'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 cursor-pointer'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('font-extrabold text-xs', isDisabled ? 'text-slate-500' : 'text-slate-900')}>
                        {feat.label}
                      </span>
                      {isDisabled && (
                        <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full border border-slate-300">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{feat.desc}</p>
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors mt-0.5',
                      isDisabled
                        ? 'bg-slate-300 text-slate-400'
                        : isChecked
                        ? 'bg-[#0052CC] text-white'
                        : 'bg-slate-200 text-transparent'
                    )}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Bottom Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-lg flex items-center justify-between">
          <Link href="/platform-admin/dashboard">
            <Button type="button" variant="outline" className="rounded-xl text-xs font-bold px-5 py-2.5 cursor-pointer">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={registerMutation.isPending}
            className="bg-gradient-to-r from-[#0052CC] via-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-xl text-sm px-8 py-3 shadow-lg shadow-blue-500/25 cursor-pointer gap-2"
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Institute...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Provision Institute Workspace
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
