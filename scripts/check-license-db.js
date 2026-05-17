const { neon } = require('../license-service/node_modules/@neondatabase/serverless');
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

async function run() {
  const rows = await sql`SELECT id, npsn, license_key, status, hardware_id, activated_at, expires_at FROM licenses WHERE npsn = '70007889' ORDER BY id DESC`;
  console.log('All licenses for NPSN 70007889:');
  rows.forEach(r => console.log(JSON.stringify(r, null, 2)));
  
  const key = 'SMARTSPJ-4E6NW-Z62LB-LZSZL-SBXH';
  const specific = await sql`SELECT * FROM licenses WHERE license_key = ${key} AND status = 'active'`;
  console.log('\nLicense with key and status=active:', specific.length ? specific[0] : 'NOT FOUND');
}
run();
