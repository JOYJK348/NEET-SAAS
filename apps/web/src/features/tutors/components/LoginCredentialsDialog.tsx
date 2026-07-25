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
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface LoginCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password: string;
  name: string;
}

export function LoginCredentialsDialog({
  open,
  onOpenChange,
  email,
  password,
  name,
}: LoginCredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
      setCopied(true);
      toast.success('Credentials copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white text-[#111827] rounded-[28px] p-8 border-[#E5E7EB] shadow-2xl">
        <DialogHeader className="space-y-2 pb-2">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-2">
            <Check className="h-7 w-7 text-green-600" />
          </div>
          <DialogTitle className="text-xl font-extrabold tracking-tight text-center text-gray-900">
            Tutor Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-medium text-muted-foreground">
            Login credentials have been generated for <strong className="text-gray-800">{name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              ⚠ Important
            </p>
            <p className="text-xs font-medium text-amber-800">
              Please copy these credentials now. The password will not be shown again after closing this dialog.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</label>
              <div className="flex items-center justify-between bg-gray-50 border border-[#E5E7EB] rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-[#111827] font-mono">{email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="flex items-center justify-between bg-gray-50 border border-[#E5E7EB] rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-[#111827] font-mono">
                  {showPassword ? password : '••••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCopy}
            className="w-full rounded-xl h-12 gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Credentials
              </>
            )}
          </Button>
        </div>

        <div className="border-t border-[#E5E7EB] pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl h-11"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
