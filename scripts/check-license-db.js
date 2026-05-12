const { neon } = require('../license-service/node_modules/@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_S0BzYjieNpE2@ep-aged-rain-ao7wnfhj-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

async function run() {
  const rows = await sql`SELECT id, npsn, license_key, status, hardware_id, activated_at, expires_at FROM licenses WHERE npsn = '70007889' ORDER BY id DESC`;
  console.log('All licenses for NPSN 70007889:');
  rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
  
  const key = 'SMARTSPJ-4E6NW-Z62LB-LZSZL-SBXH';
  const specific = await sql`SELECT * FROM licenses WHERE license_key = ${key} AND status = 'active'`;
  console.log('\nLicense with key and status=active:', specific.length ? specific[0] : 'NOT FOUND');
}
run();
