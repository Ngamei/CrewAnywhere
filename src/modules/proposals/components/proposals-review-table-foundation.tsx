'use client';

import { useCallback, useMemo, useState } from 'react';
import { isBusinessActor, isCrewActor } from '@/shared/auth/roles';
import { useOperationalOnboarding } from '@/modules/onboarding/hooks/use-operational-onboarding';
import { ProposalsEmptyState } from '@/modules/onboarding';
import { ProposalWorkflowTimeline } from '@/modules/proposals/components/proposal-workflow-timeline';
import { useProposalActivitySubscription } from '@/modules/proposals/hooks/use-proposal-activity-subscription';
import { AsyncBoundary, WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';
import type { ProposalListItemDto } from '@/modules/proposals/types';
import type { ApiSuccess } from '@/shared/api/responses';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { demoProposals } from '@/shared/demo/operational-demo-data';

const columns: OperationalTableColumn<ProposalListItemDto>[] = [
  {
    id: 'crew',
    header: 'Crew',
    cell: (row) => <span className="font-mono text-xs">{row.crew_user_id.slice(0, 8)}…</span>,
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'submitted',
    header: 'Submitted',
    hideOnMobile: true,
    cell: (row) => new Date(row.submitted_at).toLocaleDateString(),
  },
  {
    id: 'note',
    header: 'Cover note',
    hideOnMobile: true,
    cell: (row) => row.coverNotePreview ?? '—',
  },
];

async function parseApiData<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | ApiSuccess<T>
    | { error?: { message?: string } }
    | null;
  if (!response.ok || !body || !('data' in body)) {
    throw new Error(
      (body && 'error' in body && body.error?.message) || `Request failed (${response.status})`,
    );
  }
  return body.data;
}

export function ProposalsReviewTableFoundation() {
  const onboarding = useOperationalOnboarding();
  const [selectedProposal, setSelectedProposal] = useState<ProposalListItemDto | null>(null);
  const [jobIdFilter, setJobIdFilter] = useState('');
  const proposalsQuery = useOperationalFetch({
    queryKey: ['proposal', 'dashboard', onboarding.role, jobIdFilter],
    fetcher: useCallback(async (): Promise<ProposalListItemDto[]> => {
      if (isBusinessActor(onboarding.role) && jobIdFilter.trim()) {
        const response = await fetch(`/api/v1/jobs/${jobIdFilter.trim()}/proposals`, { credentials: 'include' });
        return parseApiData<ProposalListItemDto[]>(response);
      }
      const response = await fetch('/api/v1/proposals', { credentials: 'include' });
      return parseApiData<ProposalListItemDto[]>(response);
    }, [jobIdFilter, onboarding.role]),
  });

  useProposalActivitySubscription({ proposalId: selectedProposal?.id ?? null, enabled: true });

  const pipeline = useMemo(() => {
    const data = proposalsQuery.data?.length ? proposalsQuery.data : demoProposals;
    return {
      total: data.length,
      applied: data.filter((item) => item.status === 'applied').length,
      offer_sent: data.filter((item) => item.status === 'offer_sent').length,
      offer_accepted: data.filter((item) => item.status === 'offer_accepted').length,
      hired: data.filter((item) => item.status === 'hired').length,
    };
  }, [proposalsQuery.data]);

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isCrewActor(onboarding.role) ? 'My proposal pipeline' : 'Applicant review pipeline'}
          </CardTitle>
          <CardDescription>
            {isCrewActor(onboarding.role)
              ? 'Track lifecycle changes from application to final hiring decisions.'
              : 'Review incoming applications and monitor operational hiring movement.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">Total: {pipeline.total}</Badge>
          <Badge variant="secondary">Applied: {pipeline.applied}</Badge>
          <Badge variant="secondary">Offer sent: {pipeline.offer_sent}</Badge>
          <Badge variant="secondary">Offer accepted: {pipeline.offer_accepted}</Badge>
          <Badge variant="secondary">Hired: {pipeline.hired}</Badge>
        </CardContent>
      </Card>

      {isBusinessActor(onboarding.role) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter by job</CardTitle>
            <CardDescription>
              Enter a job ID to inspect one hiring queue. Leave empty to keep crew-facing proposal feed behavior.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={jobIdFilter}
              onChange={(event) => setJobIdFilter(event.target.value)}
              placeholder="Job ID (UUID)"
            />
          </CardContent>
        </Card>
      ) : null}

      <AsyncBoundary isLoading={proposalsQuery.isLoading} error={proposalsQuery.error} onRetry={proposalsQuery.reload}>
        <OperationalTable
          caption="Proposals for review"
          columns={columns}
          data={proposalsQuery.data?.length ? proposalsQuery.data : demoProposals}
          getRowId={(row) => row.id}
          emptyState={<ProposalsEmptyState />}
          emptyMessage="No proposals to review."
          onRowClick={(row) => setSelectedProposal(row)}
        />
      </AsyncBoundary>

      <Sheet open={Boolean(selectedProposal)} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Proposal detail</SheetTitle>
            <SheetDescription>
              Proposal {selectedProposal?.id.slice(0, 8)} from job {selectedProposal?.job_id.slice(0, 8)}
            </SheetDescription>
          </SheetHeader>
          {selectedProposal ? (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operational status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <WorkflowStatusBadge status={selectedProposal.status} />
                  <p className="text-muted-foreground">
                    Submitted {new Date(selectedProposal.submitted_at).toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    Last updated {new Date(selectedProposal.updated_at).toLocaleString()}
                  </p>
                  <p>{selectedProposal.coverNotePreview ?? 'No cover note provided.'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProposalWorkflowTimeline proposalId={selectedProposal.id} />
                </CardContent>
              </Card>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
