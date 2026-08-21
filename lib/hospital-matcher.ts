import { openDb } from './db';

export async function matchAndCreateDiscussion(date: string, description: string) {
  const db = await openDb();
  const hospitals = await db.all('SELECT id, name FROM hospitals');
  
  let bestMatch = null;
  let maxMatchLength = 0;

  for (const h of hospitals) {
    const normalizedName = h.name.toLowerCase().replace(/[.,&]/g, '');
    let normalizedDesc = description.toLowerCase().replace(/aa/g, 'a');

    // 1. Try exact match of the full hospital name first
    if (normalizedDesc.includes(normalizedName)) {
      if (normalizedName.length > maxMatchLength) {
        bestMatch = h;
        maxMatchLength = normalizedName.length;
      }
      continue;
    }
    
    // 2. Otherwise try the heuristic match (first unique word)
    const words = normalizedName.split(/\s+/).filter((w: string) => !['hospital', 'multispeciality', 'children', 'nursing', 'orthopaedic', 'maternity', 'healthcare', 'research', 'centre', 'trust', 'memorial', 'surgical', 'and', 'llp', 'care', 'home', 'laparoscopy', 'trauma', 'global', 'amreli', 'women', 'doctor', 'doctors', 'dr', 'clinic', 'institute', 'for', 'you', 'to', 'the', 'of', 'in', 'at'].includes(w));
    
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

  // Hardcoded rule for Kashiba
  const descLower = description.toLowerCase();
  if (descLower.includes('kashiba')) {
    if (descLower.includes('kamrej')) {
      const kashibaKamrej = hospitals.find((h: any) => h.name === 'Kashiba Multispeciality Hospital');
      if (kashibaKamrej) bestMatch = kashibaKamrej;
    } else {
      const kashibaAmreli = hospitals.find((h: any) => h.name === 'Kashiba Multispeciality Hospital, Amreli');
      if (kashibaAmreli) bestMatch = kashibaAmreli;
    }
  }

  if (bestMatch) {
    const existing = await db.get(
      'SELECT 1 FROM discussions WHERE hospital_id = ? AND date = ? AND summary = ?',
      [bestMatch.id, date, description]
    );
    
    if (!existing) {
      await db.run(
        'INSERT INTO discussions (hospital_id, date, summary) VALUES (?, ?, ?)',
        [bestMatch.id, date, description]
      );
    }
    return bestMatch.id;
  }
  return null;
}
