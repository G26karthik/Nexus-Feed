import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

let _client: Client | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export function getClient(): Client {
  if (!_client) {
    const url = requireEnv("TURSO_DATABASE_URL");
    const authToken = requireEnv("TURSO_AUTH_TOKEN");
    _client = createClient({ url, authToken });
  }
  return _client;
}

export function getDb() {
  if (!_db) {
    _db = drizzle(getClient(), { schema });
  }
  return _db;
}
