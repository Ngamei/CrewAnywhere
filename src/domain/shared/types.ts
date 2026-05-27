export type EntityId = string;
export type ISODateTime = string;

export type AuditFields = {
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type LifecycleTransition<TStatus extends string> = {
  from: TStatus;
  to: TStatus;
  reason?: string;
};
