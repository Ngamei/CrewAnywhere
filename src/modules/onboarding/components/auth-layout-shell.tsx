import type { ReactNode } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/shared/config/site';
import { AuthMarketingPanel } from '@/modules/onboarding/components/auth-marketing-panel';

type AuthLayoutShellProps = {
  children: ReactNode;
  marketingTitle: string;
  marketingDescription: string;
};

export function AuthLayoutShell({ children, marketingTitle, marketingDescription }: AuthLayoutShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-5 py-4 md:px-8">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          {APP_NAME}
        </Link>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-8 md:px-8 lg:grid-cols-[1fr_1.1fr] lg:py-12">
        <AuthMarketingPanel title={marketingTitle} description={marketingDescription} />
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
}
