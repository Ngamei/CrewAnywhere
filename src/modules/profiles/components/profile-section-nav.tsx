'use client';

import { cn } from '@/shared/lib/cn';
import { Badge } from '@/shared/ui/badge';
import type { ProfileCompletionSectionKey } from '@/modules/profiles/types/profile-workflow';

export type ProfileSectionNavItem = {
  key: ProfileCompletionSectionKey | string;
  label: string;
  complete?: boolean;
  required?: boolean;
};

type ProfileSectionNavProps = {
  sections: ProfileSectionNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  className?: string;
};

export function ProfileSectionNav({
  sections,
  activeKey,
  onSelect,
  className,
}: ProfileSectionNavProps) {
  return (
    <nav
      className={cn(
        'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      aria-label="Profile sections"
    >
      {sections.map((section) => {
        const isActive = section.key === activeKey;
        return (
          <button
            key={section.key}
            type="button"
            onClick={() => onSelect(section.key)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
              isActive
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
            aria-current={isActive ? 'step' : undefined}
          >
            <span>{section.label}</span>
            {section.complete !== undefined ? (
              <Badge variant={section.complete ? 'default' : 'outline'} className="text-[10px]">
                {section.complete ? 'Done' : section.required === false ? 'Optional' : 'Todo'}
              </Badge>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
