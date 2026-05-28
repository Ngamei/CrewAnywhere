'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthFormFeedback } from '@/modules/onboarding/components/auth-form-feedback';
import { useLoginAuth } from '@/modules/onboarding/hooks/use-email-auth';
import { asAppRoute, AUTH_ROUTES } from '@/modules/onboarding/lib/routes';
import { loginFormSchema, type LoginFormValues } from '@/modules/onboarding/schemas/auth.schema';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { InlineLoadingSpinner } from '@/shared/components/operational/loading-states';

const initialValues: LoginFormValues = {
  email: '',
  password: '',
};

export function LoginForm() {
  const { submit, isSubmitting, formError, clearError } = useLoginAuth();
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof LoginFormValues, string>>>({});

  const handleChange = (field: keyof LoginFormValues, value: string) => {
    clearError();
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginFormSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof LoginFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') {
          nextErrors[key as keyof LoginFormValues] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    await submit(parsed.data);
  };

  return (
    <Card className="w-full max-w-md border-border shadow-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your CrewAnywhere workspace with email and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          <AuthFormFeedback error={formError} className="mb-4" />

          <FormField id="login-email">
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  disabled={isSubmitting}
                  placeholder="you@company.com"
                />
              </FormControl>
              <FormMessage>{fieldErrors.email}</FormMessage>
            </FormItem>
          </FormField>

          <FormField id="login-password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={values.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage>{fieldErrors.password}</FormMessage>
            </FormItem>
          </FormField>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <InlineLoadingSpinner label="Signing in" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to CrewAnywhere?{' '}
          <Link
            href={asAppRoute(AUTH_ROUTES.signup)}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
