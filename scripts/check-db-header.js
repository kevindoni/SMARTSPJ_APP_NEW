const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'arkas', 'arkas.db');

console.log('Reading database header from:', dbPath);

const fd = fs.openSync(dbPath, 'r');
const buffer = Buffer.alloc(32);
fs.readSync(fd, buffer, 0, 32, 0);
fs.closeSync(fd);

console.log('\nFirst 32 bytes (hex):');
console.log(buffer.toString('hex'));

console.log('\nFirst 32 bytes (ascii):');
console.log(buffer.toString('ascii'));

console.log('\nSQLite header should start with: "SQLite format 3"');
const sqliteHeader = 'SQLite format 3';
const startsWithSqlite = buffer.toString('ascii').startsWith(sqliteHeader);
console.log('\nIs valid SQLite file:', startsWithSqlite);
