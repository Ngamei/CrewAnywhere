import { ProposalsReviewTableFoundation } from '@/modules/proposals/components';

export default function ProposalsShellPage() {
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Proposals</h2>
        <p className="text-sm text-muted-foreground">
          Business review queue — <code className="text-xs">GET /api/v1/jobs/:id/proposals</code>
        </p>
      </div>
      <ProposalsReviewTableFoundation />
    </section>
  );
}
