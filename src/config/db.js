//src/db.js
import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
import fs from "fs";
import path from "path";
import { logInfo, logError, logDebug } from "../utils/logger.js";

const { Pool } = pg;

// Destructure env variables
const {
  DB_USER,
  DB_NAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME_TEST,
  NODE_ENV,
  DATABASE_URL,
} = process.env;

// 🔒 Validate DB config
// When DATABASE_URL is provided (e.g. Railway), individual DB_* vars are not required.
// When running without DATABASE_URL, require individual connection vars.
if (!DATABASE_URL) {
  const requiredVars = { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD };
  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    logError(
      `❌ Database environment variables are missing: ${missing.join(", ")}. ` +
      `Set them individually or provide DATABASE_URL.`
    );
    process.exit(1);
  }
}

// In test mode, also require DB_NAME_TEST
if (NODE_ENV === "test" && !DB_NAME_TEST) {
  logError("❌ DB_NAME_TEST is required when NODE_ENV=test.");
  process.exit(1);
}

// Determine which database name to use
const activeDbName = NODE_ENV === "test" ? DB_NAME_TEST : DB_NAME;

// Build the pool — prefer DATABASE_URL if available (Railway best practice),
// otherwise fall back to individual connection variables.
const poolConfig = DATABASE_URL
  ? {
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 5000,
      // Railway's internal Postgres uses self-signed certs in some setups
      ssl: DATABASE_URL.includes("railway.internal")
        ? false
        : { rejectUnauthorized: false },
    }
  : {
      user: DB_USER,
      host: DB_HOST,
      database: activeDbName,
      password: DB_PASSWORD,
      port: parseInt(DB_PORT, 10),
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

logInfo(`📦 Database is configured for: ${activeDbName || "(via DATABASE_URL)"}`);

// 🌱 Connection events
pool.on("connect", () => {
  logInfo(`🔗 Client connected (Pool size: ${pool.totalCount})`);
});
pool.on("error", (error) => {
  logError("🚨 Unexpected error on idle client", error);
  process.exit(-1);
});

// 🔌 Connect to the DB pool (used in app startup)
const connectToDb = async () => {
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      logInfo("✅ Database connection pool established");
      client.release();
      return; // success — exit the retry loop
    } catch (error) {
      logError(`❌ DB connection failed (attempt ${attempt})`, error);

      if (attempt === maxRetries) process.exit(1);
      await new Promise((res) => setTimeout(res, 3000));
      //wait 3seconds before retrying
    }
  }
};

// ✅ Ensures DB schema creation is safe, consistent, and non-concurrent

const initializeDbSchema = async () => {
 const client = await pool.connect();
 try {
   logInfo("⚙️  Applying schema from schema.sql...");
   const schemaPath = path.resolve("src", "config", "schema.sql");
   const schema = fs.readFileSync(schemaPath, "utf-8");

   await client.query("BEGIN");
   await client.query("SELECT pg_advisory_lock(20250424)"); //prevents two servers from initializing schema at once.
   await client.query(schema);
   await client.query("COMMIT");

   logInfo("🎉 Schema applied successfully!");
 } catch (error) {
   await client.query("ROLLBACK");
   logError("❌ Error applying schema", error);
   throw error;
 } finally {
   await client.query("SELECT pg_advisory_unlock(20250424)"); //So your DB won't get partial schema setups even if there's a crash.
   client.release();
 }
};

// 🛠️ Utility to run arbitrary SQL queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (NODE_ENV !== "production") {
      logDebug(`🧪 Query: ${text.slice(0, 80)}... | ${duration}ms`);
    }
    return result;
  } catch (error) {
    logError(`❌ Query failed: ${text.slice(0, 80)}...`, error);
    throw error;
  }
};

export { pool, connectToDb, query, initializeDbSchema };
