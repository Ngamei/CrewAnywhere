'use client';

import { Building2, HardHat } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { OnboardingAccountType } from '@/modules/onboarding/types';

const OPTIONS: Array<{
  value: OnboardingAccountType;
  title: string;
  description: string;
  icon: typeof HardHat;
}> = [
  {
    value: 'crew',
    title: 'Crew member',
    description: 'Find shifts, manage assignments, and track payouts in your wallet.',
    icon: HardHat,
  },
  {
    value: 'business',
    title: 'Business',
    description: 'Publish jobs, hire crew, and run events with operational controls.',
    icon: Building2,
  },
];

type AccountTypeSelectorProps = {
  value: OnboardingAccountType | null;
  onChange: (value: OnboardingAccountType) => void;
  disabled?: boolean;
};

export function AccountTypeSelector({ value, onChange, disabled }: AccountTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Account type">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-[8.5rem] flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isSelected
                ? 'border-primary bg-primary/5 shadow-xs'
                : 'border-border bg-card hover:border-primary/40 hover:bg-accent/40',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            <span
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-lg',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="space-y-1">
              <span className="block text-sm font-semibold">{option.title}</span>
              <span className="block text-sm leading-5 text-muted-foreground">{option.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
