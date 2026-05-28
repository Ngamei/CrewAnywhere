import type { Route } from 'next';

/** Coerce onboarding/auth paths for Next.js typed routes. */
export function asAppRoute(path: string): Route {
  return path as Route;
}

export const AUTH_ROUTES = {
  login: '/login',
  signup: '/signup',
} as const;

export const ONBOARDING_ROUTES = {
  start: '/onboarding',
  accountType: '/onboarding/account-type',
  complete: '/onboarding/complete',
} as const;

export const DASHBOARD_ROUTES = {
  home: '/dashboard',
  crewProfile: '/dashboard/profile/crew',
  companyProfile: '/dashboard/profile/company',
} as const;

export function resolveDashboardEntry(accountType: 'crew' | 'business' | null | undefined) {
  if (accountType === 'crew') {
    return DASHBOARD_ROUTES.crewProfile;
  }

  if (accountType === 'business') {
    return DASHBOARD_ROUTES.companyProfile;
  }

  return DASHBOARD_ROUTES.home;
}
