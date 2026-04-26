const { neon } = require('@neondatabase/serverless');

let sqlInstance = null;
let initialized = false;

function getSql() {
  if (!sqlInstance) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING;

    if (!connectionString) throw new Error('DATABASE_URL or POSTGRES_URL not set. Check Neon integration in Vercel dashboard.');
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

async function ensureTable() {
  if (initialized) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS licenses (
      id SERIAL PRIMARY KEY,
      order_id VARCHAR(100) UNIQUE,
      npsn VARCHAR(20) NOT NULL,
      tier VARCHAR(20) NOT NULL DEFAULT 'basic',
      license_key TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      amount INTEGER,
      customer_email TEXT,
      customer_name TEXT,
      hardware_id TEXT,
      midtrans_transaction_id TEXT,
      payment_type VARCHAR(30),
      payment_time TIMESTAMP,
      activated_at TIMESTAMP,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  initialized = true;
}

module.exports = { getSql, ensureTable };
