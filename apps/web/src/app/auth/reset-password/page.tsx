'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
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

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

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

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Missing password reset token in URL.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Direct fetch call - Security best practice (no React-Query persistent caching for security token requests)
      const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: data.newPassword,
        }),
      });

      if (res.status === 429) {
        throw new Error('Too many requests. Please wait a minute before trying again.');
      }

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(resData?.message || 'Invalid or expired password reset token.');
      }

      setIsSuccess(true);
      toast.success('Password updated successfully!', {
        description: 'Please sign in with your new password.',
      });

      setTimeout(() => {
        router.replace('/auth/login');
      }, 2500);
    } catch (err: any) {
      const msg = err?.message || 'Failed to reset password. Please try again.';
      setError(msg);
      toast.error('Reset failed', { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page__card shadow-2xl border border-secondary bg-secondary dark:bg-zinc-900/95 backdrop-blur-md p-8 rounded-2xl text-center space-y-6">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-2xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Invalid Reset Link
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed">
            This password reset link is invalid or incomplete. Please request a new password reset link.
          </p>
        </div>

        <Button asChild className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
          <Link href="/auth/forgot-password">
            Request New Reset Link &rarr;
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="login-page__card shadow-2xl border border-secondary bg-secondary dark:bg-zinc-900/95 backdrop-blur-md p-8 rounded-2xl">
      
      {/* Header Branding */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg mb-4">
          <GraduationCap className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Create New Password
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Enter a new secure password for your account.
        </p>
      </div>

      {isSuccess ? (
        <div className="space-y-6 text-center">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-6 rounded-xl text-left">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Password Reset Successfully!
                </h3>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                  Your password has been updated and all active device sessions have been revoked for your security. Redirecting you to sign in...
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              asChild
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              <Link href="/auth/login">
                Proceed to Sign In &rarr;
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
                <AlertTitle className="text-sm font-medium">Reset Failed</AlertTitle>
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* New Password Input */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn('pl-11 pr-11 h-11', errors.newPassword && 'border-red-500 focus-visible:ring-red-500')}
                disabled={isSubmitting}
                {...register('newPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Confirm New Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn('pl-11 pr-11 h-11', errors.confirmPassword && 'border-red-500 focus-visible:ring-red-500')}
                disabled={isSubmitting}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {errors.confirmPassword.message}
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
                Updating Password...
              </>
            ) : (
              'Update Password & Sign In'
            )}
          </Button>

          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Cancel & Return to Sign In
            </Link>
          </div>
        </form>
      )}

    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
