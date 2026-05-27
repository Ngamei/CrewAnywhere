import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form } from '@/shared/ui/form';

type ProfileFormShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Foundation layout for profile forms — domain pages compose fields inside.
 */
export function ProfileFormShell({ title, description, children, footer }: ProfileFormShellProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <Form>{children}</Form>
        {footer ? <div className="mt-6 border-t pt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
