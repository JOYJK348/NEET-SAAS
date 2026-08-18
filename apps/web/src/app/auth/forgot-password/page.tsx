'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Loader2,
  AlertCircle,
  GraduationCap,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
  }
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
    return `http://${hostname}:3000/api/v1`;
  }
  return 'http://127.0.0.1:3000/api/v1';
}

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Direct fetch call - Security best practice (no React-Query persistent caching for security token requests)
      const res = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a minute before trying again.');
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to send reset link.');
      }

      setIsSubmitted(true);
      toast.success('Reset link dispatched!', {
        description: 'Check your Gmail inbox for password reset instructions.',
      });
    } catch (err: any) {
      const msg = err?.message || 'An unexpected error occurred. Please try again.';
      setError(msg);
      toast.error('Request failed', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-md">
        <div className="login-page__card shadow-2xl border border-secondary bg-secondary dark:bg-zinc-900/95 backdrop-blur-md p-8 rounded-2xl">
          
          {/* Header Branding */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg mb-4">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Reset Your Password
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Enter your email address and we&apos;ll send you a password reset link.
            </p>
          </div>

          {isSubmitted ? (
            <div className="space-y-6 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-6 rounded-xl text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      Reset Link Sent
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                      If an account exists with this email address, you will receive a password reset link shortly. Please check your inbox and spam folder.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full h-11 border-indigo-200 dark:border-zinc-700 font-semibold"
                >
                  <Link href="/auth/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <div>
                    <AlertTitle className="text-sm font-medium">Error</AlertTitle>
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </div>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={cn('pl-11 h-11', errors.email && 'border-red-500 focus-visible:ring-red-500')}
                    disabled={isSubmitting}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-500/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  'Send Reset Link 📩'
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Return to Sign In
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
