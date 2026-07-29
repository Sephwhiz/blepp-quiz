// split-boss-setA.js  — splits ONLY the 4 Set A masters into 3 chunks of 50 each.
// Safe by design: hardcoded file list (never touches setB), reads full content
// into memory BEFORE writing, and refuses to touch any master that holds < 100 Q.
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public', 'data');
const CHUNK = 50;
const EXPECTED = 150;

// The ONLY files this script will ever read as a source.
const MASTERS = [
  'boss-drills-setA-abpsy-1.json',
  'boss-drills-setA-devpsy-1.json',
  'boss-drills-setA-iopsy-1.json',
  'boss-drills-setA-psyas-1.json',
];

// drop commas that sit right before ] or } (string-aware)
function removeTrailingCommas(s) {
  let out = '', inStr = false, esc = false, k = 0;
  const ws = c => c === ' ' || c === '\t' || c === '\n' || c === '\r';
  while (k < s.length) {
    const c = s[k];
    if (inStr) {
      out += c;
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      k++;
    } else if (c === '"') { inStr = true; out += c; k++; }
    else if (c === ',') {
      let j = k + 1;
      while (j < s.length && ws(s[j])) j++;
      if (j < s.length && (s[j] === ']' || s[j] === '}')) k++;   // drop the comma
      else { out += c; k++; }
    } else { out += c; k++; }
  }
  return out;
}

// index of the ] that matches the [ at openIdx (string-aware)
function findMatchingClose(s, openIdx) {
  let depth = 0, inStr = false, esc = false;
  for (let k = openIdx; k < s.length; k++) {
    const c = s[k];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) return k; }
  }
  return -1;
}

// pull every top-level [ ... ] array out of the raw text (skips the filename labels)
function extractArrays(raw) {
  const arrays = [];
  let i = 0;
  while (i < raw.length) {
    const start = raw.indexOf('[', i);
    if (start === -1) break;
    const end = findMatchingClose(raw, start);
    if (end === -1) { console.warn(`   ⚠️  Unbalanced brackets at char ${start}; stopping.`); break; }
    const piece = removeTrailingCommas(raw.substring(start, end + 1));
    try {
      const parsed = JSON.parse(piece);
      if (Array.isArray(parsed)) arrays.push(parsed);
      else console.warn('   ⚠️  A block parsed but was not an array; skipped.');
    } catch (e) { console.warn(`   ⚠️  Could not parse one block: ${e.message}`); }
    i = end + 1;
  }
  return arrays;
}

// trim whitespace off object keys only ("id " -> "id")
function trimKeys(v) {
  if (Array.isArray(v)) return v.map(trimKeys);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k.trim()] = trimKeys(v[k]);
    return o;
  }
  return v;
}

function main() {
  if (!fs.existsSync(dataDir)) { console.error('❌ data dir not found:', dataDir); return; }

  for (const masterName of MASTERS) {
    const masterPath = path.join(dataDir, masterName);
    if (!fs.existsSync(masterPath)) {
      console.log(`\n❌ ${masterName} → FILE NOT FOUND. Create/restore it first.`);
      continue;
    }

    // 1) READ THE WHOLE FILE INTO MEMORY FIRST (this is what makes overwriting -1.json safe)
    const raw = fs.readFileSync(masterPath, 'utf8');
    const arrays = extractArrays(raw);
    const flat = arrays.reduce((a, b) => a.concat(b), []).map(trimKeys);

    console.log(`\n📦 ${masterName}  → found ${flat.length} Q in ${arrays.length} glued block(s)`);

    // 2) SAFETY GUARD: if it's already a single 50-Q chunk (damaged/already-split), DO NOTHING
    if (flat.length < 100) {
      console.error(`   🛑 INCOMPLETE/ALREADY-SPLIT: only ${flat.length} Q (need ${EXPECTED}). Nothing written.`);
      continue;
    }
    if (flat.length !== EXPECTED) {
      console.warn(`   ⚠️  Expected ${EXPECTED} Q but found ${flat.length} → splitting what we have.`);
    }

    // 3) WRITE CHUNKS (read already happened above, so overwriting -1.json is safe)
    const baseName = masterName.replace('.json', '').replace(/-\d+$/, ''); // e.g. boss-drills-setA-abpsy
    const chunks = Math.ceil(flat.length / CHUNK);
    for (let c = 0; c < chunks; c++) {
      const slice = flat.slice(c * CHUNK, (c + 1) * CHUNK);
      if (!slice.length) break;
      const outName = `${baseName}-${c + 1}.json`;
      fs.writeFileSync(path.join(dataDir, outName), JSON.stringify(slice, null, 2));
      console.log(`   ✅ ${outName}  (${slice.length} Q)`);
    }

    // 4) remove any stale higher-numbered chunks from old runs
    for (let n = chunks + 1; n <= 9; n++) {
      const stale = path.join(dataDir, `${baseName}-${n}.json`);
      if (fs.existsSync(stale)) { fs.unlinkSync(stale); console.log(`   🗑️  removed stale ${baseName}-${n}.json`); }
    }
  }

  console.log('\n✨ Set A split complete. (Set B was never touched.)');
}

main();