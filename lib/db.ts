import "server-only";
import { Pool } from "pg";
import { SCHEMA_SQL } from "./db-schema";

// ─────────────────────────────────────────────────────────────────────────────
// Insights database (self-hosted Docker Postgres — see /docker). Entirely
// optional: with DATABASE_URL unset every helper no-ops, and a database outage
// must never cost a visitor their result or the clinic a lead, so callers go
// through `tryDb`, which swallows and logs failures.
// ─────────────────────────────────────────────────────────────────────────────

const QUERY_TIMEOUT_MS = 4_000;

interface DbGlobal {
  hsaPool?: Pool;
  hsaSchemaReady?: Promise<void>;
}
// Survive dev HMR and reuse across requests on a warm Fluid Compute instance.
const globalDb = globalThis as typeof globalThis & DbGlobal;

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function pool(): Pool {
  if (!globalDb.hsaPool) {
    const connectionString = process.env.DATABASE_URL!.trim();
    const wantsTls = !/sslmode=disable/i.test(connectionString);
    globalDb.hsaPool = new Pool({
      // pg would otherwise treat sslmode=require as verify-full and reject the
      // container's self-signed certificate; TLS is configured explicitly below.
      connectionString: connectionString.replace(/([?&])sslmode=[^&]*&?/i, "$1"),
      ssl: wantsTls ? { rejectUnauthorized: false } : false,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: QUERY_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
      statement_timeout: QUERY_TIMEOUT_MS,
    });
    globalDb.hsaPool.on("error", (err) =>
      console.error("[db] idle client error:", err.message),
    );
  }
  return globalDb.hsaPool;
}

async function ready(): Promise<Pool> {
  const p = pool();
  if (!globalDb.hsaSchemaReady) {
    globalDb.hsaSchemaReady = p
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((err) => {
        globalDb.hsaSchemaReady = undefined; // retry on the next request
        throw err;
      });
  }
  await globalDb.hsaSchemaReady;
  return p;
}

export async function query<Row extends Record<string, unknown>>(
  text: string,
  values: unknown[] = [],
): Promise<Row[]> {
  const p = await ready();
  const result = await p.query(text, values);
  return result.rows as Row[];
}

/** Run a write that must never break the request. Returns null on any failure. */
export async function tryDb<T>(
  label: string,
  work: () => Promise<T>,
): Promise<T | null> {
  if (!dbConfigured()) return null;
  try {
    return await work();
  } catch (err) {
    console.error(
      `[db] ${label} failed:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
