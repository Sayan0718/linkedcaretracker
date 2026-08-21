const desc = 'Connected with Dr. Lajja (Junior Doctor) for her first-time login at KK Surgical Hospital and explained the complete dashboard and consultation workflow. Also explained the difference between Doctor and Junior Doctor access, including that Junior Doctors can perform consultations but prescriptions are sent to the concerned doctor for approval.';
const db = [
  { id: 1, name: 'Doctors For You' },
  { id: 2, name: 'KK Surgical Hospital' }
];

let bestMatch = null;
let maxMatchLength = 0;

for (const h of db) {
  const normalizedName = h.name.toLowerCase().replace(/[.,&]/g, '');
  let normalizedDesc = desc.toLowerCase().replace(/aa/g, 'a');

  // 1. Try exact match of the full hospital name first
  if (normalizedDesc.includes(normalizedName)) {
    if (normalizedName.length > maxMatchLength) {
      bestMatch = h;
      maxMatchLength = normalizedName.length;
    }
    continue;
  }
  
  // 2. Otherwise try the heuristic match (first unique word)
  const words = normalizedName.split(/\s+/).filter(w => !['hospital', 'multispeciality', 'children', 'nursing', 'orthopaedic', 'maternity', 'healthcare', 'research', 'centre', 'trust', 'memorial', 'surgical', 'and', 'llp', 'care', 'home', 'laparoscopy', 'trauma', 'global', 'amreli', 'women', 'doctor', 'doctors', 'dr', 'clinic', 'institute', 'for', 'you', 'to', 'the', 'of', 'in', 'at'].includes(w));
  
  let matchKey = '';
  if (words.length > 0) {
    if (['shree', 'shreeji', 'sai', 'dp', 'shiv', 'holy', 'sita'].includes(words[0]) && words.length > 1) {
      matchKey = words.slice(0, 2).join(' ');
    } else {
      matchKey = words[0];
    }
  } else {
    matchKey = normalizedName; // Fallback to full name if all words are generic
  }

  if (!matchKey) continue;

  const normalizedMatchKey = matchKey.replace(/aa/g, 'a');
  const escapedKey = normalizedMatchKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
  
  if (regex.test(normalizedDesc)) {
    if (matchKey.length > maxMatchLength) {
      bestMatch = h;
      maxMatchLength = matchKey.length;
    }
  }
}

console.log('BEST MATCH:', bestMatch ? bestMatch.name : 'None');
