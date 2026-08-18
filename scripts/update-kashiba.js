const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  const res = await db.run("UPDATE hospitals SET handled_by = 'Avnish' WHERE name LIKE '%Kashiba Multispeciality Hospital, Amreli%'");
  console.log('Updated', res.changes);
})()
