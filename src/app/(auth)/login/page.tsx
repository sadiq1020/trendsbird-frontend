"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, ShieldAlert } from 'lucide-react';

import { loginSchema, LoginInput } from '@/lib/schemas/auth.schema';
import { authApi } from '@/lib/api/auth';
import { useSessionStore } from '@/lib/stores/session-store';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const fetchSession = useSessionStore((state) => state.fetchSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await authApi.login(data);
      if (response.success) {
        toast.success('Logged in successfully!');
        await fetchSession();
        router.push('/dashboard');
      } else {
        const errorMsg = response.message || 'Invalid credentials';
        setServerError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.details || 'Login failed. Please check your credentials.';
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const fillTestAccount = (email: string) => {
    form.setValue('email', email);
    form.setValue('password', 'Password123!');
    setServerError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Trends Bird
          </h1>
          <p className="text-sm text-slate-400">
            Admin Dashboard Access Control
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 text-slate-100 backdrop-blur shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center font-semibold">Sign In</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serverError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="admin@trendsbird.com"
                            className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="••••••••"
                            className="pl-9 bg-slate-950/60 border-slate-800 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                            disabled={isSubmitting}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-all"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-400">
                  Quick Test Credentials
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-300 text-xs"
                onClick={() => fillTestAccount('admin@trendsbird.com')}
              >
                Super Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-800 bg-slate-950/50 hover:bg-slate-800 text-slate-300 text-xs"
                onClick={() => fillTestAccount('catalog@trendsbird.com')}
              >
                Catalog Manager
              </Button>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-slate-800/60 pt-4 text-xs text-slate-500">
            Trends Bird Control Panel &copy; 2026
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
