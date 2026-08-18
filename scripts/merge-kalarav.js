const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  // 1. Move all discussions from Kalrav Children Hospital (id=34) to Kalarav Hospital (id=36)
  await db.run('UPDATE discussions SET hospital_id = 36 WHERE hospital_id = 34');
  console.log('Moved discussions to Kalarav Hospital (ID 36)');

  // 2. Delete Kalrav Children Hospital
  await db.run('DELETE FROM hospitals WHERE id = 34');
  console.log('Deleted Kalrav Children Hospital (ID 34)');

  // 3. Fix typos in activities
  const res = await db.run("UPDATE activities SET description = REPLACE(description, 'Kalrav', 'Kalarav') WHERE description LIKE '%Kalrav%'");
  console.log('Fixed ' + res.changes + ' typos in activities table');
  
  // Also fix lowercase
  await db.run("UPDATE activities SET description = REPLACE(description, 'kalrav', 'Kalarav') WHERE description LIKE '%kalrav%'");

})()
