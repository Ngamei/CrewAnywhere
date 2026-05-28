import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form } from '@/shared/ui/form';

type ProfileSectionCardProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ProfileSectionCard({
  id,
  title,
  description,
  children,
  footer,
  className,
}: ProfileSectionCardProps) {
  return (
    <Card id={id} className={cn('scroll-mt-24', className)}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <Form>{children}</Form>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
