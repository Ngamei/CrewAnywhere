import type { WorkflowStatusTone } from '@/shared/design/tokens/colors';

const successPattern = /^(approved|verified|completed|paid|released|hired|accepted|active|confirmed)$/i;
const dangerPattern = /^(rejected|failed|cancelled|canceled|declined|blocked|suspended|revoked)$/i;
const warningPattern = /^(pending|review|under_review|processing|offer_sent|escrow|held)$/i;
const activePattern = /^(in_progress|open|assigned|scheduled|started|applied)$/i;

export function resolveWorkflowStatusTone(status: string): WorkflowStatusTone {
  const normalized = status.trim().toLowerCase();

  if (successPattern.test(normalized)) return 'success';
  if (dangerPattern.test(normalized)) return 'danger';
  if (warningPattern.test(normalized)) return 'warning';
  if (activePattern.test(normalized)) return 'active';
  if (normalized.includes('draft') || normalized.includes('withdrawn')) return 'neutral';
  return 'pending';
}

export function formatWorkflowStatusLabel(status: string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
