'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mapSupabaseAuthError } from '@/modules/onboarding/lib/supabase-auth-errors';
import { asAppRoute, ONBOARDING_ROUTES } from '@/modules/onboarding/lib/routes';
import type { LoginFormValues, SignupFormValues } from '@/modules/onboarding/schemas/auth.schema';
import { createSupabaseBrowserClient } from '@/shared/supabase/browser';
import { useOperationalRefresh } from '@/shared/hooks/use-operational-refresh';

function resolveSafeNextPath(next: string | null) {
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    return next;
  }

  return null;
}

export function useLoginAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { invalidate } = useOperationalRefresh();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = useCallback(
    async (values: LoginFormValues) => {
      setIsSubmitting(true);
      setFormError(null);

      try {
        const supabase = createSupabaseBrowserClient();
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) {
          setFormError(mapSupabaseAuthError(error.message));
          return;
        }

        invalidate(['auth', 'session']);
        router.refresh();
        const next = resolveSafeNextPath(searchParams.get('next'));
        router.push(asAppRoute(next ?? ONBOARDING_ROUTES.start));
      } catch (cause) {
        setFormError(cause instanceof Error ? cause.message : 'Unable to sign in.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [invalidate, router, searchParams],
  );

  return {
    submit,
    isSubmitting,
    formError,
    clearError: () => setFormError(null),
  };
}

export function useSignupAuth() {
  const router = useRouter();
  const { invalidate } = useOperationalRefresh();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = useCallback(
    async (values: SignupFormValues) => {
      setIsSubmitting(true);
      setFormError(null);

      try {
        const supabase = createSupabaseBrowserClient();
        const emailRedirectTo =
          typeof window !== 'undefined' ? `${window.location.origin}${ONBOARDING_ROUTES.start}` : undefined;

        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: emailRedirectTo ? { emailRedirectTo } : undefined,
        });

        if (error) {
          setFormError(mapSupabaseAuthError(error.message));
          return;
        }

        if (data.session) {
          invalidate(['auth', 'session']);
          router.refresh();
          router.push(asAppRoute(ONBOARDING_ROUTES.start));
          return;
        }

        setFormError(
          'Check your email to confirm your account, then return here to sign in and continue onboarding.',
        );
      } catch (cause) {
        setFormError(cause instanceof Error ? cause.message : 'Unable to create your account.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [invalidate, router],
  );

  return {
    submit,
    isSubmitting,
    formError,
    clearError: () => setFormError(null),
  };
}
