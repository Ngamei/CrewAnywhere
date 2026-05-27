# Migration Structure

Current database-first migration:

```txt
schema.sql
supabase/
  migrations/
    0001_unified_database_architecture.sql
```

`schema.sql` is the canonical reviewed schema. The Supabase migration entrypoint references it so the first database baseline remains aligned with the reviewed architecture.

For production migration history, use this sequence:

```txt
supabase/migrations/
  0001_unified_database_architecture.sql
  0002_storage_buckets.sql
  0003_seed_reference_data.sql
  0004_rls_write_policies.sql
```

Future migrations must be additive and domain-scoped. Do not create a second user model or duplicate the `business_users` / `crew_users` split.
