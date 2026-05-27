import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { ProposalStatus } from '@/shared/state/enums/proposal-status';
import type { ProposalRecord, ProposalTermsRecord } from '@/modules/proposals/types/proposal-records';

const PROPOSAL_COLUMNS =
  'id, job_id, event_id, company_profile_id, crew_user_id, status, status_version, cover_note, submitted_at, hired_at, created_at, updated_at, deleted_at';

const TERMS_COLUMNS =
  'id, proposal_id, rate_amount, rate_currency, starts_at, ends_at, terms, created_at, updated_at, deleted_at';

export class ProposalRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<ProposalRecord | null> {
    const { data, error } = await this.clients.read
      .from('proposals')
      .select(PROPOSAL_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as ProposalRecord | null;
  }

  async findByJobAndCrew(jobId: string, crewUserId: string): Promise<ProposalRecord | null> {
    const { data, error } = await this.clients.read
      .from('proposals')
      .select(PROPOSAL_COLUMNS)
      .eq('job_id', jobId)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as ProposalRecord | null;
  }

  async listByJob(jobId: string, status?: ProposalStatus): Promise<ProposalRecord[]> {
    let query = this.clients.read
      .from('proposals')
      .select(PROPOSAL_COLUMNS)
      .eq('job_id', jobId)
      .is('deleted_at', null)
      .order('submitted_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ProposalRecord[];
  }

  async listByCrew(crewUserId: string, status?: ProposalStatus): Promise<ProposalRecord[]> {
    let query = this.clients.read
      .from('proposals')
      .select(PROPOSAL_COLUMNS)
      .eq('crew_user_id', crewUserId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ProposalRecord[];
  }

  async insertProposal(input: {
    jobId: string;
    eventId: string;
    companyProfileId: string;
    crewUserId: string;
    coverNote?: string;
  }): Promise<ProposalRecord> {
    const { data, error } = await this.clients.write
      .from('proposals')
      .insert({
        job_id: input.jobId,
        event_id: input.eventId,
        company_profile_id: input.companyProfileId,
        crew_user_id: input.crewUserId,
        status: 'applied',
        cover_note: input.coverNote ?? null,
      })
      .select(PROPOSAL_COLUMNS)
      .single();

    if (error) throw error;
    return data as ProposalRecord;
  }

  async upsertTerms(
    proposalId: string,
    terms: { rateAmount?: number; rateCurrency?: string },
  ): Promise<ProposalTermsRecord> {
    const { data: existing } = await this.clients.write
      .from('proposal_terms')
      .select(TERMS_COLUMNS)
      .eq('proposal_id', proposalId)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.clients.write
        .from('proposal_terms')
        .update({
          rate_amount: terms.rateAmount ?? existing.rate_amount,
          rate_currency: terms.rateCurrency ?? existing.rate_currency,
        })
        .eq('proposal_id', proposalId)
        .select(TERMS_COLUMNS)
        .single();

      if (error) throw error;
      return data as ProposalTermsRecord;
    }

    const { data, error } = await this.clients.write
      .from('proposal_terms')
      .insert({
        proposal_id: proposalId,
        rate_amount: terms.rateAmount ?? null,
        rate_currency: terms.rateCurrency ?? 'USD',
      })
      .select(TERMS_COLUMNS)
      .single();

    if (error) throw error;
    return data as ProposalTermsRecord;
  }

  async findTerms(proposalId: string): Promise<ProposalTermsRecord | null> {
    const { data, error } = await this.clients.read
      .from('proposal_terms')
      .select(TERMS_COLUMNS)
      .eq('proposal_id', proposalId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as ProposalTermsRecord | null;
  }

  async markHired(proposalId: string): Promise<void> {
    const { error } = await this.clients.write
      .from('proposals')
      .update({ hired_at: new Date().toISOString() })
      .eq('id', proposalId)
      .is('deleted_at', null);

    if (error) throw error;
  }

  async listWorkflowEvents(proposalId: string, limit = 50) {
    const { data, error } = await this.clients.read
      .from('workflow_transition_events')
      .select(
        'workflow_event_id, entity_type, entity_id, from_status, to_status, transition_reason, transitioned_by, transition_source, idempotency_key, correlation_id, created_at',
      )
      .eq('entity_type', 'proposal')
      .eq('entity_id', proposalId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}
