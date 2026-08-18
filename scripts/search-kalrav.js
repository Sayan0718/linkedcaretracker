const xlsx = require('xlsx');
const path = require('path');

const wb = xlsx.readFile(path.join(process.cwd(), 'Daily Log Sheet.xlsx'));
console.log('Sheet names:', wb.SheetNames);

wb.SheetNames.forEach(name => {
  const data = xlsx.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
  let found = false;
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (typeof cell === 'string' && cell.toLowerCase().includes('kal')) {
        console.log(`Found in sheet '${name}', Row ${rowIndex}, Col ${colIndex}:`, cell);
        found = true;
      }
    });
  });
});
