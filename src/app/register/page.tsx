// ============================================================
// Register Page
// ============================================================

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { registerSchema } from '@/lib/validators';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse({ fullName, email, password, confirmPassword });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Account created! You can now sign in.');
      router.push('/login');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create account</h1>
          <p className="text-muted">Sign up to start booking flights</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-surface border border-border p-8 space-y-4">
          <Input
            id="register-name"
            label="Full Name"
            placeholder="Dhruv Mohan Shukla"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setErrors({}); }}
            error={errors.fullName}
            autoComplete="name"
            required
          />
          <Input
            id="register-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Input
            id="register-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <Input
            id="register-confirm"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setErrors({}); }}
            error={errors.confirmPassword}
            autoComplete="new-password"
            required
          />
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
