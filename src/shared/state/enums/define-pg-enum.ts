import { z } from 'zod';

/**
 * Canonical Postgres enum shape for CrewAnywhere2.0.
 * Values use snake_case to match `schema.sql` / Supabase types exactly.
 */
export type PgEnumDefinition<
  TPgType extends string,
  TValues extends readonly string[],
> = {
  readonly pgType: TPgType;
  readonly values: TValues;
};

export type PgEnumValue<T extends PgEnumDefinition<string, readonly string[]>> =
  T['values'][number];

/**
 * Single factory for database-aligned enum constants.
 * Keeps runtime sets, type guards, and Zod schemas in one place per enum.
 */
export function definePgEnum<
  const TPgType extends string,
  const TValues extends readonly [string, ...string[]],
>(definition: PgEnumDefinition<TPgType, TValues>) {
  const valueSet = new Set<string>(definition.values);

  const schema = z.enum(definition.values);

  return {
    pgType: definition.pgType,
    values: definition.values,
    schema,
    is(value: string): value is TValues[number] {
      return valueSet.has(value);
    },
    parse(value: string): TValues[number] | undefined {
      return valueSet.has(value) ? (value as TValues[number]) : undefined;
    },
    assert(value: string): asserts value is TValues[number] {
      if (!valueSet.has(value)) {
        throw new Error(`Invalid ${definition.pgType} value: ${value}`);
      }
    },
    includes<const TValue extends TValues[number]>(
      value: TValue,
    ): value is TValue {
      return valueSet.has(value);
    },
  } as const;
}

export type DefinedPgEnum = ReturnType<typeof definePgEnum>;
