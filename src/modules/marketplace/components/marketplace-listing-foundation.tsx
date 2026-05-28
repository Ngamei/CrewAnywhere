'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { isBusinessActor, isCrewActor } from '@/shared/auth/roles';
import { MarketplaceEmptyState } from '@/modules/onboarding';
import { ProposalSubmissionFormFoundation } from '@/modules/proposals/components/proposal-submission-form-foundation';
import { ProposalWorkflowTimeline } from '@/modules/proposals/components/proposal-workflow-timeline';
import { useProposalActivitySubscription } from '@/modules/proposals/hooks/use-proposal-activity-subscription';
import { useOperationalOnboarding } from '@/modules/onboarding/hooks/use-operational-onboarding';
import { MissingRequirementsList } from '@/modules/profiles/components/missing-requirements-list';
import { ReadinessIndicator } from '@/modules/profiles/components/readiness-indicator';
import { AsyncBoundary, RetryPanel, WorkflowStatusBadge } from '@/shared/components/operational';
import { OperationalTable, type OperationalTableColumn } from '@/shared/components/operational/operational-table';
import { useOperationalFetch } from '@/shared/hooks/use-operational-fetch';
import type { MarketplaceJobListingDto } from '@/modules/marketplace/types';
import type { ProposalDto, ProposalListItemDto } from '@/modules/proposals/types';
import type { ApiSuccess } from '@/shared/api/responses';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Badge } from '@/shared/ui/badge';
import { demoMarketplaceJobs, demoProposals } from '@/shared/demo/operational-demo-data';

const columns: OperationalTableColumn<MarketplaceJobListingDto>[] = [
  {
    id: 'title',
    header: 'Role',
    cell: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        <p className="text-xs text-muted-foreground">{row.companyName ?? 'Company'}</p>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: (row) => <WorkflowStatusBadge status={row.status} />,
  },
  {
    id: 'rate',
    header: 'Rate',
    hideOnMobile: true,
    cell: (row) => (row.rate_amount != null ? `${row.rate_currency} ${row.rate_amount}` : '—'),
  },
  {
    id: 'skills',
    header: 'Skills',
    hideOnMobile: true,
    cell: (row) => row.skills.map((s) => s.skill_name).join(', ') || '—',
  },
];

type JobProposalMap = Record<string, ProposalListItemDto | undefined>;
type MarketplaceDiscoveryResponse = { items: MarketplaceJobListingDto[]; total: number };

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

function JobCard({
  job,
  proposal,
  onOpen,
}: {
  job: MarketplaceJobListingDto;
  proposal?: ProposalListItemDto;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{job.title}</p>
          <p className="text-sm text-muted-foreground">{job.companyName ?? 'Company'}</p>
        </div>
        <WorkflowStatusBadge status={job.status} />
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{job.description ?? 'No description provided.'}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="outline">{job.rate_amount != null ? `${job.rate_currency} ${job.rate_amount}` : 'Rate TBD'}</Badge>
        <Badge variant="outline">Headcount: {job.headcount}</Badge>
        {proposal ? <Badge>Proposal: {proposal.status.replace('_', ' ')}</Badge> : null}
      </div>
    </button>
  );
}

export function MarketplaceListingFoundation() {
  const onboarding = useOperationalOnboarding();
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [skillName, setSkillName] = useState('');
  const [sort, setSort] = useState<'newest' | 'rate_desc' | 'rate_asc' | 'headcount_desc'>('newest');
  const [selectedJob, setSelectedJob] = useState<MarketplaceJobListingDto | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  useProposalActivitySubscription({
    enabled: true,
    proposalId: selectedProposalId,
    jobId: selectedJob?.id ?? null,
  });

  const marketplaceQuery = useOperationalFetch({
    queryKey: ['marketplace', 'jobs', city, countryCode, skillName, sort],
    fetcher: useCallback(async (): Promise<MarketplaceDiscoveryResponse> => {
      const params = new URLSearchParams();
      if (city.trim()) params.set('city', city.trim());
      if (countryCode.trim()) params.set('countryCode', countryCode.trim().toUpperCase());
      if (skillName.trim()) params.set('skillName', skillName.trim());
      params.set('sort', sort);
      params.set('limit', '50');
      const response = await fetch(`/api/v1/marketplace/jobs?${params.toString()}`, { credentials: 'include' });
      return parseApiData<MarketplaceDiscoveryResponse>(response);
    }, [city, countryCode, skillName, sort]),
  });

  const myProposalsQuery = useOperationalFetch({
    queryKey: ['proposal', 'list', 'crew'],
    fetcher: useCallback(async (): Promise<ProposalListItemDto[]> => {
      const response = await fetch('/api/v1/proposals', { credentials: 'include' });
      return parseApiData<ProposalListItemDto[]>(response);
    }, []),
    enabled: isCrewActor(onboarding.role),
  });

  const businessJobProposalsQuery = useOperationalFetch({
    queryKey: ['proposal', 'list', 'job', selectedJob?.id ?? 'none'],
    fetcher: useCallback(async (): Promise<ProposalListItemDto[]> => {
      if (!selectedJob) return [];
      const response = await fetch(`/api/v1/jobs/${selectedJob.id}/proposals`, { credentials: 'include' });
      return parseApiData<ProposalListItemDto[]>(response);
    }, [selectedJob]),
    enabled: isBusinessActor(onboarding.role) && Boolean(selectedJob),
  });

  const proposalByJob = useMemo<JobProposalMap>(() => {
    const entries = myProposalsQuery.data?.length ? myProposalsQuery.data : demoProposals;
    const map: JobProposalMap = {};
    for (const proposal of entries) {
      map[proposal.job_id] = proposal;
    }
    return map;
  }, [myProposalsQuery.data]);

  const jobs = marketplaceQuery.data?.items?.length ? marketplaceQuery.data.items : demoMarketplaceJobs;
  const readinessSnapshot = onboarding.snapshot;
  const profileNotReady = isCrewActor(onboarding.role) && Boolean(readinessSnapshot && !readinessSnapshot.marketplaceReady);
  const missingSections = readinessSnapshot?.completion.sections ?? [];

  const selectedBusinessProposal = useMemo(() => {
    if (!selectedProposalId) return null;
    const proposals =
      businessJobProposalsQuery.data?.length && selectedJob
        ? businessJobProposalsQuery.data
        : demoProposals.filter((proposal) => !selectedJob || proposal.job_id === selectedJob.id);
    return proposals.find((proposal) => proposal.id === selectedProposalId) ?? null;
  }, [businessJobProposalsQuery.data, selectedJob, selectedProposalId]);

  const statusCounts = useMemo(() => {
    const proposals =
      businessJobProposalsQuery.data?.length && selectedJob
        ? businessJobProposalsQuery.data
        : demoProposals.filter((proposal) => !selectedJob || proposal.job_id === selectedJob.id);
    return {
      applied: proposals.filter((item) => item.status === 'applied').length,
      offer_sent: proposals.filter((item) => item.status === 'offer_sent').length,
      offer_accepted: proposals.filter((item) => item.status === 'offer_accepted').length,
      declined: proposals.filter((item) => item.status === 'declined').length,
      hired: proposals.filter((item) => item.status === 'hired').length,
    };
  }, [businessJobProposalsQuery.data, selectedJob]);

  const performProposalAction = async (proposalId: string, action: 'offer' | 'decline' | 'hire') => {
    setActionError(null);
    setIsActing(true);
    try {
      if (action === 'offer') {
        await fetch(`/api/v1/proposals/${proposalId}/offer`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reason: 'Shortlisted from marketplace pipeline' }),
        }).then(parseApiData<ProposalDto>);
      } else if (action === 'decline') {
        await fetch(`/api/v1/proposals/${proposalId}/decline`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mode: 'application', reason: 'Not a fit for this role' }),
        }).then(parseApiData<ProposalDto>);
      } else {
        await fetch(`/api/v1/proposals/${proposalId}/hire`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ reason: 'Approved for hire from marketplace review' }),
        }).then(parseApiData<{ proposal: ProposalDto }>);
      }
      businessJobProposalsQuery.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to run hiring action');
    } finally {
      setIsActing(false);
    }
  };

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketplace filters</CardTitle>
          <CardDescription>Search by location, skill, and sort preference.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City" />
          <Input
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
            placeholder="Country code (e.g. US)"
          />
          <Input value={skillName} onChange={(event) => setSkillName(event.target.value)} placeholder="Skill name" />
          <Input
            value={sort}
            onChange={(event) => setSort(event.target.value as 'newest' | 'rate_desc' | 'rate_asc' | 'headcount_desc')}
            placeholder="Sort: newest, rate_desc..."
          />
        </CardContent>
      </Card>

      {profileNotReady ? (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="text-base">Profile readiness required before applying</CardTitle>
            <CardDescription>
              Complete required onboarding milestones to unlock proposal submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {readinessSnapshot ? <ReadinessIndicator snapshot={readinessSnapshot} /> : null}
            {readinessSnapshot ? <MissingRequirementsList sections={missingSections} /> : null}
            <Button asChild variant="outline" size="sm">
              <Link href={'/dashboard/profile/crew' as Route}>Complete crew profile</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <AsyncBoundary isLoading={marketplaceQuery.isLoading} error={marketplaceQuery.error} onRetry={marketplaceQuery.reload}>
        <div className="grid gap-3 md:hidden">
          {jobs.length === 0 ? (
            <MarketplaceEmptyState />
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                proposal={proposalByJob[job.id]}
                onOpen={() => {
                  setSelectedJob(job);
                  setSelectedProposalId(proposalByJob[job.id]?.id ?? null);
                }}
              />
            ))
          )}
        </div>

        <div className="hidden md:block">
          <OperationalTable
            caption="Marketplace jobs"
            columns={columns}
            data={jobs}
            getRowId={(row) => row.id}
            emptyState={<MarketplaceEmptyState />}
            emptyMessage="No open jobs match your filters."
            onRowClick={(row) => {
              setSelectedJob(row);
              setSelectedProposalId(proposalByJob[row.id]?.id ?? null);
            }}
          />
        </div>
      </AsyncBoundary>

      <Sheet open={Boolean(selectedJob)} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{selectedJob?.title ?? 'Job detail'}</SheetTitle>
            <SheetDescription>
              {selectedJob?.companyName ?? 'Company'} - {selectedJob?.eventTitle ?? 'Operational event'}
            </SheetDescription>
          </SheetHeader>

          {selectedJob ? (
            <div className="mt-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Operational job detail</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>{selectedJob.description ?? 'No job description provided.'}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Headcount: {selectedJob.headcount}</Badge>
                    <Badge variant="outline">
                      Rate: {selectedJob.rate_amount != null ? `${selectedJob.rate_currency} ${selectedJob.rate_amount}` : 'TBD'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Skills: {selectedJob.skills.map((skill) => skill.skill_name).join(', ') || 'No required skills'}
                  </p>
                </CardContent>
              </Card>

              {isCrewActor(onboarding.role) ? (
                <>
                  <ProposalSubmissionFormFoundation
                    jobId={selectedJob.id}
                    disabled={profileNotReady}
                    onSubmitted={(proposal) => {
                      setSelectedProposalId(proposal.id);
                      myProposalsQuery.reload();
                    }}
                  />
                  {selectedProposalId ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Proposal timeline</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ProposalWorkflowTimeline proposalId={selectedProposalId} />
                      </CardContent>
                    </Card>
                  ) : null}
                </>
              ) : null}

              {isBusinessActor(onboarding.role) ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Applicant pipeline</CardTitle>
                    <CardDescription>Review, shortlist, reject, and hire proposals for this role.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">Applied: {statusCounts.applied}</Badge>
                      <Badge variant="secondary">Offer sent: {statusCounts.offer_sent}</Badge>
                      <Badge variant="secondary">Offer accepted: {statusCounts.offer_accepted}</Badge>
                      <Badge variant="secondary">Hired: {statusCounts.hired}</Badge>
                    </div>

                    {businessJobProposalsQuery.error ? (
                      <RetryPanel
                        errorMessage={businessJobProposalsQuery.error.message}
                        onRetry={businessJobProposalsQuery.reload}
                      />
                    ) : businessJobProposalsQuery.isLoading ? (
                      <p className="text-sm text-muted-foreground">Loading applicants...</p>
                    ) : (businessJobProposalsQuery.data?.length
                        ? businessJobProposalsQuery.data
                        : demoProposals.filter((proposal) => proposal.job_id === selectedJob.id)
                      ).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No applicants yet for this job.</p>
                    ) : (
                      <div className="space-y-2">
                        {(businessJobProposalsQuery.data?.length
                          ? businessJobProposalsQuery.data
                          : demoProposals.filter((proposal) => proposal.job_id === selectedJob.id)
                        ).map((proposal) => (
                          <div
                            key={proposal.id}
                            className="rounded-lg border border-border p-3"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedProposalId(proposal.id)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                setSelectedProposalId(proposal.id);
                              }
                            }}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-medium">Applicant {proposal.crew_user_id.slice(0, 8)}</span>
                              <WorkflowStatusBadge status={proposal.status} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Submitted {new Date(proposal.submitted_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedBusinessProposal ? (
                      <div className="space-y-3 rounded-lg border border-border p-3">
                        <p className="text-sm font-medium">Proposal detail</p>
                        <p className="text-xs text-muted-foreground">
                          Cover note preview: {selectedBusinessProposal.coverNotePreview ?? 'No note provided'}
                        </p>
                        {actionError ? <p className="text-xs text-destructive">{actionError}</p> : null}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing || selectedBusinessProposal.status !== 'applied'}
                            onClick={() => performProposalAction(selectedBusinessProposal.id, 'offer')}
                          >
                            Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing || selectedBusinessProposal.status === 'declined'}
                            onClick={() => performProposalAction(selectedBusinessProposal.id, 'decline')}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            disabled={isActing || selectedBusinessProposal.status !== 'offer_accepted'}
                            onClick={() => performProposalAction(selectedBusinessProposal.id, 'hire')}
                          >
                            Hire
                          </Button>
                        </div>
                        <ProposalWorkflowTimeline proposalId={selectedBusinessProposal.id} />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}
