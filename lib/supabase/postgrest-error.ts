import type { PostgrestError } from "@supabase/supabase-js";

export function logPostgrestError(context: string, error: PostgrestError | null): void {
  if (!error) {
    return;
  }

  const payload = {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  };

  console.error(`[${context}] failed`, JSON.stringify(payload));
}

/** PostgREST cannot embed a relation when the FK column is absent (e.g. migration not applied). */
export function isMissingRelationshipError(error: PostgrestError): boolean {
  return (
    error.code === "PGRST200" ||
    /could not find a relationship|without specifying a foreign key/i.test(error.message ?? "")
  );
}

/** Schema/cache mismatch: missing column, table, or embed target (migration not applied yet). */
export function isSchemaMismatchError(error: PostgrestError): boolean {
  if (isMissingRelationshipError(error)) {
    return true;
  }

  const message = error.message ?? "";

  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /could not find the .* column|column .* does not exist|relation .* does not exist|schema cache/i.test(
      message,
    )
  );
}
