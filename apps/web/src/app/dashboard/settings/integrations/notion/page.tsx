'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  KeyRound,
  FileText,
  ShieldCheck,
  Unlink,
  HelpCircle,
  Sliders,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotionConnectionStatus {
  isConnected: boolean;
  workspaceName?: string;
  botId?: string;
  destinationParentPageId?: string;
  destinationParentPageTitle?: string;
  destinationParentPageUrl?: string;
  connectedAt?: string;
}

export default function NotionIntegrationSettingsPage() {
  const [status, setStatus] = useState<NotionConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [parentPageId, setParentPageId] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.get<NotionConnectionStatus>('/integrations/notion/status');
      setStatus(data);
    } catch {
      setStatus({ isConnected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !parentPageId.trim()) {
      toast.error('Both Notion Integration Secret and Destination Page ID are required');
      return;
    }

    setConnecting(true);
    try {
      const result = await api.post<NotionConnectionStatus>('/integrations/notion/connect', {
        apiKey: apiKey.trim(),
        destinationParentPageId: parentPageId.trim(),
      });
      setStatus(result);
      setApiKey('');
      setParentPageId('');
      toast.success(
        `Successfully connected to Notion workspace "${result.workspaceName || 'Notion'}"!`,
      );
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect to Notion');
    } finally {
      setConnecting(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await api.post<{
        success: boolean;
        message: string;
        workspaceName?: string;
        pageTitle?: string;
      }>('/integrations/notion/test');

      if (result.success) {
        toast.success(
          `Connection verified! Workspace: "${result.workspaceName || 'Notion'}" · Destination Page: "${result.pageTitle || 'Active'}"`,
        );
      } else {
        toast.error(`Notion test failed: ${result.message}`);
      }
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await api.post('/integrations/notion/disconnect');
      setStatus({ isConnected: false });
      setShowConfirmDisconnect(false);
      toast.success('Notion integration disconnected successfully');
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect Notion');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8 bg-[#FAFAFA] min-h-screen text-[#111827] space-y-6 max-w-6xl mx-auto">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white text-slate-950 flex items-center justify-center font-black text-xs">
                N
              </span>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enterprise Content Destination
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Notion Workspace Integration 🩺
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-medium leading-relaxed">
              Automatically publish approved NEET class study notes, formulas, definitions, and high-yield concepts into your Notion workspace as beautiful, structured pages.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {status?.isConnected ? (
              <span className="px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black flex items-center gap-2 backdrop-blur-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Connected & Active
              </span>
            ) : (
              <span className="px-4 py-2 rounded-2xl bg-white/10 text-slate-300 border border-white/20 text-xs font-bold flex items-center gap-2 backdrop-blur-xs">
                <AlertCircle className="w-4 h-4 text-amber-400" /> Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Main Status & Configuration Card */}
        {loading ? (
          <Card className="p-10 rounded-3xl border-slate-200 bg-white shadow-2xs flex items-center justify-center gap-3 text-slate-500 text-sm font-semibold">
            <Loader2 className="w-5 h-5 text-[#0052CC] animate-spin" />
            Loading Notion integration status...
          </Card>
        ) : status?.isConnected ? (
          /* Connected State Card */
          <Card className="p-6 sm:p-8 rounded-3xl border-slate-200 bg-white shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    Active Workspace: {status.workspaceName || 'Notion Workspace'}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Approved study notes will automatically synchronize to your linked Notion destination page.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', testing && 'animate-spin')} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                {!showConfirmDisconnect ? (
                  <button
                    onClick={() => setShowConfirmDisconnect(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" /> Disconnect
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-all cursor-pointer"
                    >
                      {disconnecting ? 'Disconnecting...' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setShowConfirmDisconnect(false)}
                      className="px-2 py-1 rounded-lg text-slate-600 hover:bg-rose-100 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Connection Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <FileText className="w-4 h-4 text-[#0052CC]" />
                  <span>Destination Parent Page</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {status.destinationParentPageTitle || 'Configured Page'}
                </p>
                <p className="text-[11px] font-mono text-slate-500 truncate">
                  ID: {status.destinationParentPageId}
                </p>
                {status.destinationParentPageUrl && (
                  <a
                    href={status.destinationParentPageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0052CC] hover:underline pt-1"
                  >
                    Open Page in Notion <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Encryption & Security</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Integration token encrypted at rest using <strong>AES-256-GCM</strong> authenticated encryption with tamper protection.
                </p>
                {status.connectedAt && (
                  <p className="text-[11px] text-slate-400 font-medium pt-1">
                    Connected on: {new Date(status.connectedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ) : (
          /* Not Connected — Configuration Form */
          <Card className="p-6 sm:p-8 rounded-3xl border-slate-200 bg-white shadow-2xs space-y-6">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <h2 className="text-lg font-extrabold text-slate-900">Connect Your Notion Workspace</h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter your Notion internal integration secret and the destination page ID where lecture notes will be published.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span>Notion Integration Secret (API Key)</span>
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0052CC] hover:underline flex items-center gap-1 font-semibold text-[11px]"
                  >
                    Create Integration in Notion <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="secret_... or ntn_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent text-xs font-mono pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Your token is encrypted using AES-256-GCM before being stored in the database.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800">
                  Destination Parent Page ID
                </label>
                <input
                  type="text"
                  placeholder="32-character hex ID (e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d) or full URL"
                  value={parentPageId}
                  onChange={(e) => setParentPageId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 font-medium">
                  Open your target page in Notion. Click <strong>Share</strong> &gt; <strong>Copy link</strong>. The 32 characters at the end of the URL is the Page ID.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={connecting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying with Notion API...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" /> Connect Notion Workspace
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* 3-Step Setup Guide */}
        <Card className="p-6 sm:p-8 rounded-3xl border-slate-200 bg-white shadow-2xs space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <HelpCircle className="w-5 h-5 text-[#0052CC]" />
            <h3 className="text-sm font-extrabold text-slate-900">How to Setup Notion Integration (3 Easy Steps)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-black">
                1
              </span>
              <h4 className="text-xs font-extrabold text-slate-900">Create Internal Integration</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Visit{' '}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0052CC] font-bold hover:underline"
                >
                  notion.so/my-integrations
                </a>
                . Click <strong>+ New integration</strong>, name it <em>&quot;NEET Study Notes&quot;</em>, and copy the Integration Secret.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-black">
                2
              </span>
              <h4 className="text-xs font-extrabold text-slate-900">Invite Bot to Parent Page</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                In Notion, create a page (e.g. <em>&quot;NEET Class Notes Library&quot;</em>). Click the <strong>...</strong> menu at the top right, select <strong>Connect to</strong>, and choose your bot.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <span className="w-6 h-6 rounded-full bg-[#0052CC] text-white flex items-center justify-center text-xs font-black">
                3
              </span>
              <h4 className="text-xs font-extrabold text-slate-900">Paste & Connect</h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Paste your secret and Parent Page ID in the form above. Click <strong>Connect</strong>. The platform will automatically verify connectivity and start syncing!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

