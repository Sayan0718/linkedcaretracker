const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

function getMatchKey(name) {
  let key = name.toLowerCase().replace(/[.,&]/g, '');
  const words = key.split(/\s+/).filter(w => !['hospital', 'multispeciality', 'children', 'nursing', 'orthopaedic', 'maternity', 'healthcare', 'research', 'centre', 'trust', 'memorial', 'surgical', 'and', 'llp', 'care', 'home', 'laparoscopy', 'trauma', 'global', 'amreli'].includes(w));
  
  if (words.length > 0) {
    if (words[0] === 'shree' || words[0] === 'shreeji' || words[0] === 'sai' || words[0] === 'dp' || words[0] === 'shiv' || words[0] === 'holy') {
      return words.slice(0, 2).join(' ');
    }
    return words[0];
  }
  return '';
}

(async () => {
  const db = await open({filename: 'database.sqlite', driver: sqlite3.Database});
  
  const h = await db.all('SELECT name FROM hospitals');
  console.log(h.map(x => x.name + ' => ' + getMatchKey(x.name)));

  // Delete duplicates for Sayan on 16th and 17th
  const res = await db.run("DELETE FROM activities WHERE person = 'Sayan' AND date IN ('2026-08-16', '2026-08-17')");
  console.log('Deleted ' + res.changes + ' duplicate activities for Sayan.');
})()
