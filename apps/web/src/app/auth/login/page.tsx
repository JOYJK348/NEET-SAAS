'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  GraduationCap,
  Target,
  TrendingUp,
  Building2,
  Bot,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const features = [
  {
    name: 'NEET Practice',
    description: 'Mock tests & previous year questions',
    icon: Target,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    name: 'Student Analytics',
    description: 'Performance insights for students & parents',
    icon: TrendingUp,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    name: 'Academy Management',
    description: 'Admissions, batches & fee management',
    icon: Building2,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    name: 'AI Mentor',
    description: 'Instant doubts & concept explanations',
    icon: Bot,
    color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await login(data.email, data.password, data.rememberMe);
      toast.success('Welcome back!', { description: 'You have been signed in successfully.' });
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      let errorMessage = 'Invalid email or password. Please try again.';
      if (err && typeof err === 'object') {
        if (
          'response' in err &&
          err.response &&
          typeof err.response === 'object' &&
          'data' in err.response
        ) {
          const responseData = err.response.data as { message?: string | string[] };
          if (responseData && responseData.message) {
            errorMessage = Array.isArray(responseData.message)
              ? responseData.message[0]
              : responseData.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      toast.error('Sign in failed', { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoadingOrSubmitting = isLoading || isSubmitting;

  return (
    <div className="login-page bg-gradient-to-br from-slate-50 via-gray-100 to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="login-page__layout flex-col lg:flex-row">
        {/* Mobile Header - Branding on top for mobile */}
        <div className="login-page__mobile-brand">
          <div className="login-page__mobile-brand-content">
            <div className="login-page__mobile-logo">
              <GraduationCap className="h-8 w-8" aria-hidden="true" />
            </div>
            <h1 className="login-page__mobile-name">NEET Academy Management Platform</h1>
            <p className="login-page__mobile-tagline">
              AI-Powered Platform for Modern NEET Coaching Institutes
            </p>
            <div className="login-page__mobile-features" role="list" aria-label="Platform features">
              {features.map((feature, index) => (
                <div key={index} className="login-page__mobile-feature">
                  <div className="login-page__mobile-feature-icon">
                    <feature.icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <span className="login-page__mobile-feature-text">{feature.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Branding (Desktop only, now on right due to flex-row-reverse) */}
        <aside className="login-page__brand" aria-label="Brand information">
          <div className="login-page__brand-content">
            <div className="login-page__logo">
              <GraduationCap className="h-10 w-10" aria-hidden="true" />
            </div>
            <h1 className="login-page__name">NEET Academy Management Platform</h1>
            <p className="login-page__tagline">
              AI-Powered Platform for Modern NEET Coaching Institutes
            </p>
            <div className="login-page__features" role="list" aria-label="Platform features">
              {features.map((feature, index) => (
                <div key={index} className="login-page__feature">
                  <div className="login-page__feature-icon">
                    <feature.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{feature.name}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Left Panel - Login Form (Desktop only, now on left due to flex-row-reverse) */}
        <main
          className="login-page__form-section bg-gradient-to-br from-accent/30 via-background to-secondary/30 dark:from-muted/20 dark:via-background dark:to-secondary/10"
          role="main"
        >
          <div className="login-page__card shadow-2xl border border-border/80 bg-white/95 dark:bg-card/95 backdrop-blur-md">
            <div className="login-page__header">
              <h2 className="login-page__title">Welcome back</h2>
              <p className="login-page__subtitle">Sign in to your account to continue</p>
            </div>

            <div className="pt-0">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <AlertTitle className="text-sm font-medium">Sign in failed</AlertTitle>
                    <AlertDescription className="text-sm">{error}</AlertDescription>
                  </div>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="login-page__form" noValidate>
                <div className="login-page__field">
                  <Label htmlFor="email" className="login-page__label">
                    Email address
                  </Label>
                  <div className="login-page__input-wrapper">
                    <Mail className="login-page__input-icon" aria-hidden="true" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={cn('pl-12 pr-4', errors.email && 'input-error')}
                      disabled={isLoadingOrSubmitting}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p
                      id="email-error"
                      className="text-sm text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="login-page__field">
                  <div className="login-page__field-options">
                    <Label htmlFor="password" className="login-page__label">
                      Password
                    </Label>
                    <Link href="/auth/forgot-password" className="login-page__forgot-link">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="login-page__input-wrapper">
                    <Lock className="login-page__input-icon" aria-hidden="true" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={cn('pl-12 pr-12', errors.password && 'input-error')}
                      disabled={isLoadingOrSubmitting}
                      aria-invalid={errors.password ? 'true' : 'false'}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      {...register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="login-page__toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      disabled={isLoadingOrSubmitting}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p
                      id="password-error"
                      className="text-sm text-red-600 dark:text-red-400"
                      role="alert"
                    >
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="login-page__field-options">
                  <div className="login-page__checkbox-wrapper">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      className="login-page__checkbox"
                      {...register('rememberMe')}
                      disabled={isLoadingOrSubmitting}
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="login-page__checkbox-label cursor-pointer"
                    >
                      Remember me
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="login-page__submit"
                  disabled={isLoadingOrSubmitting || !isValid}
                  aria-busy={isLoadingOrSubmitting}
                >
                  {isLoadingOrSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>
            </div>

            <div className="items-center p-6 flex flex-col space-y-4 pt-6 border-t border-border mt-6">
              <p className="text-center text-xs text-muted-foreground">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                  Privacy Policy
                </Link>
              </p>
              <p className="text-center text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function LoginPageContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
            aria-label="Loading..."
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return <LoginPageContent />;
}
