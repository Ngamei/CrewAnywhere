import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { AssignmentRecord } from '@/modules/assignments/types/assignment-records';

const ASSIGNMENT_COLUMNS =
  'id, proposal_id, job_id, event_id, company_profile_id, crew_user_id, status, status_version, scheduled_start_at, scheduled_end_at, activated_at, completed_at, cancelled_at, created_at, updated_at, deleted_at';

export class AssignmentRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<AssignmentRecord | null> {
    const { data, error } = await this.clients.read
      .from('assignments')
      .select(ASSIGNMENT_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as AssignmentRecord | null;
  }

  async findByProposalId(proposalId: string): Promise<AssignmentRecord | null> {
    const { data, error } = await this.clients.read
      .from('assignments')
      .select(ASSIGNMENT_COLUMNS)
      .eq('proposal_id', proposalId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as AssignmentRecord | null;
  }

  async insertFromProposal(input: {
    proposalId: string;
    jobId: string;
    eventId: string;
    companyProfileId: string;
    crewUserId: string;
    scheduledStartAt?: string;
    scheduledEndAt?: string;
  }): Promise<AssignmentRecord> {
    const { data, error } = await this.clients.write
      .from('assignments')
      .insert({
        proposal_id: input.proposalId,
        job_id: input.jobId,
        event_id: input.eventId,
        company_profile_id: input.companyProfileId,
        crew_user_id: input.crewUserId,
        status: 'scheduled',
        scheduled_start_at: input.scheduledStartAt ?? null,
        scheduled_end_at: input.scheduledEndAt ?? null,
      })
      .select(ASSIGNMENT_COLUMNS)
      .single();

    if (error) throw error;
    return data as AssignmentRecord;
  }

  async listWorkflowEvents(assignmentId: string, limit = 50) {
    const { data, error } = await this.clients.read
      .from('workflow_transition_events')
      .select(
        'workflow_event_id, entity_type, entity_id, from_status, to_status, transition_reason, transitioned_by, transition_source, idempotency_key, correlation_id, created_at',
      )
      .eq('entity_type', 'assignment')
      .eq('entity_id', assignmentId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}
