import Link from 'next/link';
import type { Route } from 'next';
import { Building2, UserCircle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default function ProfileShellPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Manage business company profiles or your crew marketplace profile.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href={'/dashboard/profile/company' as Route} className="block">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader>
              <Building2 className="mb-2 h-8 w-8 text-muted-foreground" />
              <CardTitle className="text-lg">Company profile</CardTitle>
              <CardDescription>
                Business identity, KYB verification readiness, and operational flags.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href={'/dashboard/profile/crew' as Route} className="block">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader>
              <UserCircle className="mb-2 h-8 w-8 text-muted-foreground" />
              <CardTitle className="text-lg">Crew profile</CardTitle>
              <CardDescription>
                Skills, experience, KYC readiness, and marketplace publish state.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </section>
  );
}
