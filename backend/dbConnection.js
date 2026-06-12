import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// A connection POOL (not a single Client). A lone shared Client can only run
// one transaction at a time — two concurrent requests doing BEGIN/COMMIT on the
// same connection would interleave and corrupt each other. The pool hands each
// transaction its own dedicated connection.
const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  max: 10,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PG client", err);
});

/**
 * Run a set of queries inside a single transaction on one dedicated client.
 * Commits on success, rolls back on any thrown error, and always releases the
 * client back to the pool. The callback receives that client.
 *
 *   const result = await withTransaction(async (client) => {
 *     await client.query("INSERT ...");
 *     return ...;
 *   });
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Default export keeps the existing `client.query(...)` call sites working for
// simple, non-transactional queries — pool.query() grabs and frees a connection
// automatically.
export default pool;
