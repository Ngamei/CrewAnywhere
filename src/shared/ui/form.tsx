'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/shared/lib/cn';
import { Label } from '@/shared/ui/label';

type FormFieldContextValue = {
  id: string;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error('useFormField must be used within <FormField>');
  }
  return context;
}

const Form = React.forwardRef<HTMLFormElement, React.FormHTMLAttributes<HTMLFormElement>>(
  ({ className, ...props }, ref) => (
    <form ref={ref} className={cn('space-y-6', className)} noValidate {...props} />
  ),
);
Form.displayName = 'Form';

const FormField = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <FormFieldContext.Provider value={{ id }}>{children}</FormFieldContext.Provider>
);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('space-y-2', className)} {...props} />,
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { id } = useFormField();
  return <Label ref={ref} className={className} htmlFor={id} {...props} />;
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { id } = useFormField();
    return <Slot ref={ref} id={id} aria-describedby={`${id}-description ${id}-message`} {...props} />;
  },
);
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { id } = useFormField();
    return (
      <p ref={ref} id={`${id}-description`} className={cn('text-sm text-muted-foreground', className)} {...props} />
    );
  },
);
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { id } = useFormField();
    if (!children) return null;
    return (
      <p ref={ref} id={`${id}-message`} className={cn('text-sm font-medium text-destructive', className)} {...props}>
        {children}
      </p>
    );
  },
);
FormMessage.displayName = 'FormMessage';

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField };
