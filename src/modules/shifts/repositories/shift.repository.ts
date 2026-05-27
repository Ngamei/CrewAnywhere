import { BaseRepository } from '@/backend/repositories/base-repository';
import type { DomainRepositoryClients } from '@/backend/repositories/domain-repository-clients';
import type { ShiftRecord } from '@/modules/shifts/types/shift-records';

const SHIFT_COLUMNS =
  'id, assignment_id, event_id, job_id, company_profile_id, crew_user_id, supervisor_business_user_id, status, status_version, starts_at, ends_at, check_in_at, check_out_at, created_at, updated_at, deleted_at';

export class ShiftRepository extends BaseRepository {
  constructor(private readonly clients: DomainRepositoryClients) {
    super(clients.read);
  }

  async findById(id: string): Promise<ShiftRecord | null> {
    const { data, error } = await this.clients.read
      .from('shifts')
      .select(SHIFT_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) throw error;
    return data as ShiftRecord | null;
  }

  async listByAssignmentId(assignmentId: string): Promise<ShiftRecord[]> {
    const { data, error } = await this.clients.read
      .from('shifts')
      .select(SHIFT_COLUMNS)
      .eq('assignment_id', assignmentId)
      .is('deleted_at', null)
      .order('starts_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ShiftRecord[];
  }

  async insertFromAssignment(input: {
    assignmentId: string;
    eventId: string;
    jobId: string;
    companyProfileId: string;
    crewUserId: string;
    startsAt: string;
    endsAt: string;
    supervisorBusinessUserId?: string;
  }): Promise<ShiftRecord> {
    const { data, error } = await this.clients.write
      .from('shifts')
      .insert({
        assignment_id: input.assignmentId,
        event_id: input.eventId,
        job_id: input.jobId,
        company_profile_id: input.companyProfileId,
        crew_user_id: input.crewUserId,
        supervisor_business_user_id: input.supervisorBusinessUserId ?? null,
        status: 'scheduled',
        starts_at: input.startsAt,
        ends_at: input.endsAt,
      })
      .select(SHIFT_COLUMNS)
      .single();

    if (error) throw error;
    return data as ShiftRecord;
  }

  async recordCheckIn(
    shiftId: string,
    checkInAt: string,
  ): Promise<ShiftRecord> {
    const { data, error } = await this.clients.write
      .from('shifts')
      .update({ check_in_at: checkInAt })
      .eq('id', shiftId)
      .is('deleted_at', null)
      .select(SHIFT_COLUMNS)
      .single();

    if (error) throw error;
    return data as ShiftRecord;
  }

  async recordCheckOut(
    shiftId: string,
    checkOutAt: string,
  ): Promise<ShiftRecord> {
    const { data, error } = await this.clients.write
      .from('shifts')
      .update({ check_out_at: checkOutAt })
      .eq('id', shiftId)
      .is('deleted_at', null)
      .select(SHIFT_COLUMNS)
      .single();

    if (error) throw error;
    return data as ShiftRecord;
  }

  async listWorkflowEvents(shiftId: string, limit = 50) {
    const { data, error } = await this.clients.read
      .from('workflow_transition_events')
      .select(
        'workflow_event_id, entity_type, entity_id, from_status, to_status, transition_reason, transitioned_by, transition_source, idempotency_key, correlation_id, metadata, created_at',
      )
      .eq('entity_type', 'shift')
      .eq('entity_id', shiftId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  }
}
