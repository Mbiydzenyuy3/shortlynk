//src/db.js
import dotenv from "dotenv";
dotenv.config();
import pg from "pg";
import fs from "fs"
import path from "path"
import { logInfo, logError, logDebug } from "../utils/logger.js";

const { Pool } = pg;

//Destructure env variables

const {
  DB_USER,
  DB_NAME,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  DB_NAME_TEST,
  NODE_ENV,
} = process.env;

// 🔒 Validate DB config
if (
  !DB_NAME ||
  !DB_HOST ||
  !DB_USER ||
  !DB_PASSWORD ||
  !DB_PORT ||
  !DB_NAME_TEST
) {
  logError(
    "❌ Database environment variables are missing! Check your .env file."
  );

  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  connectionTimeoutMillis: 2000,
});

logInfo(
  `📦 Database is configured for: ${
    NODE_ENV === "test" ? DB_NAME_TEST : DB_NAME
  }`
);

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
   await client.query("SELECT pg_advisory_unlock(20250424)"); //So your DB won’t get partial schema setups even if there's a crash.
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
