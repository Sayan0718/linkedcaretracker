const xlsx = require('xlsx');
const path = require('path');

const wb = xlsx.readFile(path.join(process.cwd(), 'Daily Log Sheet.xlsx'));
const data = xlsx.utils.sheet_to_json(wb.Sheets['Sayan']);

console.log('Sayan dates from Excel:');
const dates = new Set();
data.forEach(r => dates.add(r['Date']));
console.log(Array.from(dates));
