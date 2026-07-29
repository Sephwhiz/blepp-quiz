// split-warmup.js
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'public', 'data');

try {
  // --- SPLIT LEVEL 1 (Single Array) ---
  console.log('📦 Splitting Warm Up Level 1...');
  const lvl1Path = path.join(dataDir, 'warmup-lvl1.json');
  if (!fs.existsSync(lvl1Path)) throw new Error('warmup-lvl1.json not found!');
  
  const lvl1 = JSON.parse(fs.readFileSync(lvl1Path, 'utf8'));
  const domainsLvl1 = ['psyas', 'abpsy', 'devpsy', 'iopsy'];
  
  domainsLvl1.forEach((d, i) => {
    const start = i * 25;
    const subset = lvl1.slice(start, start + 25);
    const outPath = path.join(dataDir, `warmup-lvl1-${d}.json`);
    fs.writeFileSync(outPath, JSON.stringify(subset, null, 2));
    console.log(`   ✅ Created ${outPath} (${subset.length} questions)`);
  });

  // --- SPLIT LEVEL 2 (4 Separate Arrays) ---
  console.log('\n📦 Splitting Warm Up Level 2...');
  const lvl2Path = path.join(dataDir, 'warmup-lvl2.json');
  if (!fs.existsSync(lvl2Path)) throw new Error('warmup-lvl2.json not found!');
  
  const lvl2Raw = fs.readFileSync(lvl2Path, 'utf8');
  // Match top-level arrays. This regex finds [...] blocks.
  // Note: This assumes no nested arrays at the top level other than the domain blocks.
  const matches = lvl2Raw.match(/\[\s*\{[\s\S]*?\}\s*\]/g);
  
  if (!matches || matches.length < 4) {
    throw new Error(`Could not find 4 distinct arrays in warmup-lvl2.json. Found ${matches ? matches.length : 0}`);
  }

  const domainsLvl2 = ['abpsy', 'devpsy', 'iopsy', 'psyas'];
  
  domainsLvl2.forEach((d, i) => {
    const parsed = JSON.parse(matches[i]);
    const outPath = path.join(dataDir, `warmup-lvl2-${d}.json`);
    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
    console.log(`   ✅ Created ${outPath} (${parsed.length} questions)`);
  });

  console.log('\n✨ All files split successfully! You can now delete split-warmup.js');

} catch (e) {
  console.error('❌ Error:', e.message);
}