import { APP_NAME } from '@/shared/config/site';

type AuthMarketingPanelProps = {
  title: string;
  description: string;
};

export function AuthMarketingPanel({ title, description }: AuthMarketingPanelProps) {
  return (
    <div className="relative hidden overflow-hidden rounded-2xl border border-border bg-primary p-8 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary-foreground/70">
          {APP_NAME}
        </p>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="max-w-sm text-sm leading-6 text-primary-foreground/80">{description}</p>
      </div>
      <ul className="space-y-2 text-sm text-primary-foreground/75">
        <li>Secure Supabase authentication</li>
        <li>Crew and business onboarding paths</li>
        <li>Operational dashboard when you are ready</li>
      </ul>
    </div>
  );
}
