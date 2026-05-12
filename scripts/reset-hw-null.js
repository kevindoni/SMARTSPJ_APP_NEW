const { neon } = require('../license-service/node_modules/@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_S0BzYjieNpE2@ep-aged-rain-ao7wnfhj-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function run() {
  await sql`UPDATE licenses SET hardware_id = NULL, activated_at = NULL WHERE npsn = '70007889'`;
  const row = await sql`SELECT id, npsn, license_key, status, hardware_id, activated_at FROM licenses WHERE npsn = '70007889'`;
  console.log('Reset:', JSON.stringify(row[0], null, 2));
}
run();
