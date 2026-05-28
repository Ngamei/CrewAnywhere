'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AuthFormFeedback } from '@/modules/onboarding/components/auth-form-feedback';
import { useSignupAuth } from '@/modules/onboarding/hooks/use-email-auth';
import { asAppRoute, AUTH_ROUTES } from '@/modules/onboarding/lib/routes';
import { signupFormSchema, type SignupFormValues } from '@/modules/onboarding/schemas/auth.schema';
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

const initialValues: SignupFormValues = {
  email: '',
  password: '',
  confirmPassword: '',
};

export function SignupForm() {
  const { submit, isSubmitting, formError, clearError } = useSignupAuth();
  const [values, setValues] = useState<SignupFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignupFormValues, string>>>({});

  const handleChange = (field: keyof SignupFormValues, value: string) => {
    clearError();
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = signupFormSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof SignupFormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string') {
          nextErrors[key as keyof SignupFormValues] = issue.message;
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
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Start onboarding in a few steps — crew or business.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          <AuthFormFeedback error={formError} className="mb-4" />

          <FormField id="signup-email">
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

          <FormField id="signup-password">
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage>{fieldErrors.password}</FormMessage>
            </FormItem>
          </FormField>

          <FormField id="signup-confirm-password">
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(event) => handleChange('confirmPassword', event.target.value)}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage>{fieldErrors.confirmPassword}</FormMessage>
            </FormItem>
          </FormField>

          <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <InlineLoadingSpinner label="Creating account" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href={asAppRoute(AUTH_ROUTES.login)}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
