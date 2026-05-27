import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Supabase authentication is wired at the foundation level. Provider-specific flows can be added later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This placeholder exists only to support protected-route redirects during foundation setup.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
