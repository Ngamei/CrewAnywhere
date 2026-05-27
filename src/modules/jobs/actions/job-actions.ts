import type { AuthenticatedServiceContext } from '@/backend/services/service-context';
import { JobService } from '@/modules/jobs/services';
import type {
  CreateJobInput,
  TransitionJobStatusInput,
  UpdateJobInput,
} from '@/modules/jobs/schemas';

export async function listEventJobs(context: AuthenticatedServiceContext, eventId: string) {
  return new JobService(context).listJobsByEvent(eventId);
}

export async function getJob(context: AuthenticatedServiceContext, jobId: string) {
  return new JobService(context).getJob(jobId);
}

export async function createJob(context: AuthenticatedServiceContext, input: CreateJobInput) {
  return new JobService(context).createJob(input);
}

export async function updateJob(
  context: AuthenticatedServiceContext,
  jobId: string,
  input: UpdateJobInput,
) {
  return new JobService(context).updateJob(jobId, input);
}

export async function transitionJobStatus(
  context: AuthenticatedServiceContext,
  jobId: string,
  input: TransitionJobStatusInput,
) {
  return new JobService(context).transitionJobStatus(jobId, input);
}

export async function getJobReadiness(context: AuthenticatedServiceContext, jobId: string) {
  return new JobService(context).getJobReadiness(jobId);
}
