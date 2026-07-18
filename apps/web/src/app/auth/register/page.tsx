'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff, Building2 } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
      instituteId: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        instituteId: data.instituteId,
      });
      toast.success('Account created!', {
        description: 'Welcome to NEET Platform. Please sign in.',
      });
      router.push('/auth/login');
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast.error('Registration failed', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>Enter your details to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="pl-10"
                  {...register('name')}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
              </div>
              {errors.name && (
                <p id="name-error" className="text-sm text-red-500" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register('email')}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('password')}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500" role="alert">
                  {errors.password.message}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters with uppercase, lowercase, number, and special
                character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  {...register('confirmPassword')}
                  disabled={isSubmitting || authLoading}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" className="text-sm text-red-500" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                {...register('role')}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                disabled={isSubmitting || authLoading}
                aria-invalid={!!errors.role}
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
                <option value="PARENT">Parent</option>
              </select>
              {errors.role && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instituteId">Institute (Optional)</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="instituteId"
                  type="text"
                  placeholder="Institute ID (if applicable)"
                  className="pl-10"
                  {...register('instituteId')}
                  disabled={isSubmitting || authLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading message="Loading registration form..." />}>
      <RegisterForm />
    </Suspense>
  );
}
