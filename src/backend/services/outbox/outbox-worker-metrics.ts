export type OutboxWorkerMetricsSnapshot = {
  polls: number;
  claimed: number;
  published: number;
  deduped: number;
  failed: number;
  deadLettered: number;
  lastPollAt: string | null;
  lastError: string | null;
};

export class OutboxWorkerMetrics {
  private snapshot: OutboxWorkerMetricsSnapshot = {
    polls: 0,
    claimed: 0,
    published: 0,
    deduped: 0,
    failed: 0,
    deadLettered: 0,
    lastPollAt: null,
    lastError: null,
  };

  recordPoll() {
    this.snapshot.polls += 1;
    this.snapshot.lastPollAt = new Date().toISOString();
  }

  recordClaimed(count: number) {
    this.snapshot.claimed += count;
  }

  recordPublished() {
    this.snapshot.published += 1;
  }

  recordDeduped() {
    this.snapshot.deduped += 1;
  }

  recordFailed(error: string) {
    this.snapshot.failed += 1;
    this.snapshot.lastError = error;
  }

  recordDeadLettered(error: string) {
    this.snapshot.deadLettered += 1;
    this.snapshot.lastError = error;
  }

  getSnapshot(): OutboxWorkerMetricsSnapshot {
    return { ...this.snapshot };
  }
}
