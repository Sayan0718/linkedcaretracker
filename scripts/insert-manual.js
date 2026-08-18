const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  await db.run("INSERT INTO activities (date, description, person) VALUES ('2026-08-17', 'Shared the renewal quotation to Dr. Mohd Ashique from Charitable Hospital, also tried connecting to him multiple times but no response from their side.', 'Sayan')");
  console.log('Inserted missing activity');
})()
