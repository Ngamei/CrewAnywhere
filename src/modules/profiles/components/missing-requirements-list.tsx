import { AlertCircle } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import type { ProfileCompletionSection } from '@/modules/profiles/types/profile-workflow';

type MissingRequirementsListProps = {
  sections: ProfileCompletionSection[];
  title?: string;
  className?: string;
};

export function MissingRequirementsList({
  sections,
  title = 'Missing requirements',
  className,
}: MissingRequirementsListProps) {
  const missing = sections.filter((section) => section.required && !section.complete);

  if (missing.length === 0) {
    return null;
  }

  return (
    <div className={className} role="status" aria-live="polite">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <AlertCircle className="size-4 text-amber-600" aria-hidden />
        {title}
      </div>
      <ul className="flex flex-wrap gap-2">
        {missing.map((section) => (
          <li key={section.key}>
            <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
              {section.label}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
