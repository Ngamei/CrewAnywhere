import { ProposalWorkflowTimeline } from '@/modules/proposals/components';
import { WorkflowStatusBadge } from '@/shared/components/operational';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default async function ProposalDetailShellPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Proposal detail</h2>
        <WorkflowStatusBadge status="applied" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workflow timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ProposalWorkflowTimeline proposalId={id} />
        </CardContent>
      </Card>
    </section>
  );
}
