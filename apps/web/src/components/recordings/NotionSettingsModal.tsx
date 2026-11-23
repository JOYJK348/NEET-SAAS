'use client';

import { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  KeyRound,
  FileText,
  ShieldCheck,
  Unlink,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectionChanged?: () => void;
}

interface NotionConnectionStatus {
  isConnected: boolean;
  workspaceName?: string;
  botId?: string;
  destinationParentPageId?: string;
  destinationParentPageTitle?: string;
  destinationParentPageUrl?: string;
  connectedAt?: string;
}

export function NotionSettingsModal({
  isOpen,
  onClose,
  onConnectionChanged,
}: NotionSettingsModalProps) {
  const [status, setStatus] = useState<NotionConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [parentPageId, setParentPageId] = useState('');
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
    if (isOpen) {
      fetchStatus();
      setShowConfirmDisconnect(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      onConnectionChanged?.();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect to Notion');
    } finally {
      setConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await api.post<{ success: boolean; message: string }>('/integrations/notion/test');
      if (result.success) {
        toast.success(result.message || 'Notion connection verified successfully!');
      } else {
        toast.error(result.message || 'Connection test failed');
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
      toast.success('Notion integration disconnected');
      setShowConfirmDisconnect(false);
      await fetchStatus();
      onConnectionChanged?.();
    } catch (err: any) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect Notion');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              N
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0B2447]">
                Notion Content Synchronization
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Sync faculty-approved lecture notes directly to your institute's Notion workspace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-3 text-slate-500 text-xs font-semibold">
              <Loader2 className="w-4 h-4 text-[#0052CC] animate-spin" />
              Loading Notion connection details...
            </div>
          ) : status?.isConnected ? (
            /* Connected State */
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-extrabold text-emerald-950 flex items-center gap-2">
                      Active Notion Connection
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Connected
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium">
                      Study notes approved and published in NEET SaaS will automatically sync to this Notion workspace.
                    </p>
                  </div>
                </div>
              </div>

              {/* Workspace Details Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Workspace</span>
                  <span className="font-extrabold text-[#0B2447]">{status.workspaceName || 'Notion Workspace'}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Destination Parent Page</span>
                  <div className="flex items-center gap-1.5 font-bold text-[#0052CC]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{status.destinationParentPageTitle || 'Parent Page'}</span>
                    {status.destinationParentPageUrl && (
                      <a
                        href={status.destinationParentPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-[#0052CC]"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {status.connectedAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Connected On</span>
                    <span className="text-slate-600 font-mono">
                      {new Date(status.connectedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Security Banner */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-2.5 text-xs text-blue-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#0052CC] shrink-0 mt-0.5" />
                <span>
                  Your Notion integration token is encrypted at rest using AES-256-GCM. It is never exposed in browser responses or logs.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={cn('w-3.5 h-3.5', testing && 'animate-spin')} />
                  {testing ? 'Testing Connection...' : 'Test Connection'}
                </button>

                {!showConfirmDisconnect ? (
                  <button
                    onClick={() => setShowConfirmDisconnect(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" /> Disconnect
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-rose-600 font-bold">Are you sure?</span>
                    <button
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {disconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
                    </button>
                    <button
                      onClick={() => setShowConfirmDisconnect(false)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Not Connected State / Setup Form */
            <form onSubmit={handleConnect} className="space-y-5">
              {/* Guidance Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h3 className="font-extrabold text-[#0B2447] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0052CC]" /> How to connect Notion
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 font-medium">
                  <li>
                    Go to{' '}
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0052CC] font-bold underline inline-flex items-center gap-0.5"
                    >
                      notion.so/my-integrations <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    and create an <strong>Internal Integration</strong>.
                  </li>
                  <li>Copy your <strong>Internal Integration Secret</strong> (starts with <code>secret_</code>).</li>
                  <li>
                    In Notion, navigate to the parent page where you want lecture notes placed. Click the top-right{' '}
                    <code>...</code> &rarr; <strong>Connections</strong> &rarr; Add your integration.
                  </li>
                  <li>Copy the Page ID or URL of that destination page and paste it below.</li>
                </ol>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#0B2447] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500" /> Notion Integration Secret
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-[#0B2447] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent bg-white shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    Stored securely with AES-256-GCM encryption. Never shared with students.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-[#0B2447] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" /> Destination Parent Page ID or URL
                  </label>
                  <input
                    type="text"
                    value={parentPageId}
                    onChange={(e) => setParentPageId(e.target.value)}
                    placeholder="e.g. 1a2b3c4d5e6f... or https://notion.so/..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-[#0B2447] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent bg-white shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">
                    The parent page under which structured lecture notes will be created.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-extrabold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying & Connecting...
                    </>
                  ) : (
                    'Connect Notion Workspace'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

