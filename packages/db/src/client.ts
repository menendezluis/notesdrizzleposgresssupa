import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Missing POSTGRES_URL environment variable");
}

const client = postgres(connectionString, {
  prepare: false,
  ssl: "require",
});

export const db = drizzle(client, {
  schema,
  casing: "snake_case",
});
