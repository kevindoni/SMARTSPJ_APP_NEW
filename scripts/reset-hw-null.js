const { neon } = require('../license-service/node_modules/@neondatabase/serverless');
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`UPDATE licenses SET hardware_id = NULL, activated_at = NULL WHERE npsn = '70007889'`;
  const row = await sql`SELECT id, npsn, license_key, status, hardware_id, activated_at FROM licenses WHERE npsn = '70007889'`;
  console.log('Reset:', JSON.stringify(row[0], null, 2));
}
run();
