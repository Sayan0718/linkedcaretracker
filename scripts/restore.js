const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  // Restore Kalrav Children Hospital
  try {
    await db.run("INSERT INTO hospitals (id, name, onboarding_stage) VALUES (34, 'Kalrav Children Hospital', 'N/A')");
    console.log('Restored Kalrav Children Hospital (ID 34)');
  } catch(e) {
    console.log('Already exists or error:', e.message);
  }

  // Move back discussions that belong to Kalrav Children Hospital
  // Any discussion currently in ID 36 that mentions 'Children' goes to 34
  const res1 = await db.run("UPDATE discussions SET hospital_id = 34 WHERE hospital_id = 36 AND summary LIKE '%Children%'");
  console.log('Moved ' + res1.changes + ' discussions back to Kalrav Children Hospital');

  // Also move back activities? No, activities don't have hospital_id, they are text.
  // The user's main complaint was merging the two hospitals.
  
})()
