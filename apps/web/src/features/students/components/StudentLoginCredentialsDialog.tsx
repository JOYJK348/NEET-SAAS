'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check, Eye, EyeOff, Download, Printer, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface ParentPortalCredentialsInfo {
  existingAccount: boolean;
  email?: string;
  generatedPassword?: string;
  message?: string;
}

interface StudentLoginCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  studentEmail: string;
  studentPassword?: string;
  parentPortalInfo?: ParentPortalCredentialsInfo | null;
}

export function StudentLoginCredentialsDialog({
  open,
  onOpenChange,
  studentName,
  studentEmail,
  studentPassword,
  parentPortalInfo,
}: StudentLoginCredentialsDialogProps) {
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTextForCopy = () => {
    let text = `=== STUDENT CREDENTIALS ===\nName: ${studentName}\nEmail: ${studentEmail}\nPassword: ${studentPassword || 'N/A'}\n`;

    if (parentPortalInfo) {
      text += `\n=== PARENT PORTAL CREDENTIALS ===\n`;
      text += `Email: ${parentPortalInfo.email || 'N/A'}\n`;
      if (parentPortalInfo.existingAccount) {
        text += `Note: Linked to existing parent account.\n`;
      } else if (parentPortalInfo.generatedPassword) {
        text += `Password: ${parentPortalInfo.generatedPassword}\n`;
      }
    }
    return text;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatTextForCopy());
      setCopied(true);
      toast.success('Credentials copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownload = () => {
    const text = formatTextForCopy();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${studentName.replace(/\s+/g, '_')}_Credentials.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Credentials file downloaded');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Credentials - ${studentName}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111827; line-height: 1.6; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #fafafa; }
            h2 { color: #7c3aed; margin-top: 0; }
            .label { font-weight: bold; font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .value { font-family: monospace; font-size: 16px; margin-bottom: 12px; font-weight: bold; }
            .alert { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 8px; font-size: 13px; }
          </style>
        </head>
        <body>
          <h2>Account Credentials</h2>
          <p class="alert">⚠️ Please save these login credentials safely. Password will not be shown again.</p>

          <div class="card">
            <h3>🎓 Student Credentials</h3>
            <div class="label">Student Name</div>
            <div class="value">${studentName}</div>
            <div class="label">Email</div>
            <div class="value">${studentEmail}</div>
            <div class="label">Password</div>
            <div class="value">${studentPassword || 'N/A'}</div>
          </div>

          ${
            parentPortalInfo
              ? `
          <div class="card">
            <h3>👨‍👩‍👧 Parent Portal Credentials</h3>
            <div class="label">Parent Email</div>
            <div class="value">${parentPortalInfo.email || 'N/A'}</div>
            ${
              parentPortalInfo.existingAccount
                ? `<div class="value" style="color: #059669;">Linked to existing parent account</div>`
                : `<div class="label">Password</div><div class="value">${parentPortalInfo.generatedPassword || 'N/A'}</div>`
            }
          </div>
          `
              : ''
          }
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
        <DialogHeader className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto">
            <Check className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Student Registered Successfully!
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Account credentials generated for{' '}
            <strong className="text-slate-800 dark:text-slate-200">{studentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>⚠️</span> Important Notice
            </p>
            <p>
              Please copy or download these credentials now. Passwords will not be displayed again
              after closing.
            </p>
          </div>

          {/* Student Credentials */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎓</span> Student Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Email</span>
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {studentEmail}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Password</span>
                <div className="flex items-center gap-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                  <span>{showStudentPassword ? studentPassword : '••••••••••'}</span>
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    {showStudentPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Parent Credentials if present */}
          {parentPortalInfo && (
            <div className="p-4 rounded-xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 space-y-3">
              <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Parent Portal Credentials
              </h4>

              {parentPortalInfo.existingAccount ? (
                <div className="text-xs text-teal-800 dark:text-teal-300">
                  <p className="font-semibold">Linked to Existing Parent Account</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Parent Email: <strong className="font-mono">{parentPortalInfo.email}</strong>.
                    Parent's existing password remains unchanged.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Parent Email</span>
                    <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                      {parentPortalInfo.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Password</span>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                      <span>
                        {showParentPassword ? parentPortalInfo.generatedPassword : '••••••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowParentPassword(!showParentPassword)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {showParentPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Copy, Download, Print */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="gap-1.5 h-10 text-xs font-semibold"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-teal-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="gap-1.5 h-10 text-xs font-semibold"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="gap-1.5 h-10 text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
          >
            Done & Return to Students
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
