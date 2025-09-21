import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { sql } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

// Allow running without database for development/fallback
let dbAvailable = true;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - running in fallback mode without database");
  dbAvailable = false;
}

let pool: Pool | null = null;
let db: any = null;

if (dbAvailable && process.env.DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // 30 seconds idle timeout
      connectionTimeoutMillis: 2000, // 2 seconds connection timeout
      maxUses: 7500, // Maximum uses per connection before closing
    });
    db = drizzle({ client: pool, schema });
    console.log("Database connection initialized");
  } catch (error) {
    console.warn("Failed to initialize database connection:", error);
    dbAvailable = false;
  }
}

// Simple health check function
export async function isDatabaseHealthy(): Promise<boolean> {
  if (!dbAvailable || !db) return false;
  
  try {
    await db.execute('SELECT 1');
    return true;
  } catch (error) {
    console.warn("Database health check failed:", error);
    return false;
  }
}

export { db, dbAvailable };
