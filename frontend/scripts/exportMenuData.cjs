#!/usr/bin/env node

/**
 * Export menuData.ts to JSON for seeding MongoDB.
 *
 * Usage:
 *   node frontend/scripts/exportMenuData.cjs
 *     → writes backend/storage/app/menu_seed_data.json
 *
 *   node frontend/scripts/exportMenuData.cjs --stdout
 *     → prints JSON to stdout (pipe to curl, etc.)
 *
 * Then seed via:
 *   php artisan menu:seed-from-data
 */

const fs = require('fs');
const path = require('path');

const tsPath = path.resolve(__dirname, '../src/data/menuData.ts');
const tsContent = fs.readFileSync(tsPath, 'utf-8');

// Use a Function constructor to evaluate the array literal safely.
// We strip the TS import/export lines and extract just the array.
const arrayMatch = tsContent.match(/export const menuData[^=]*=\s*(\[[\s\S]*?\n\];)/);
if (!arrayMatch) {
  console.error('Could not find menuData export in menuData.ts');
  process.exit(1);
}

let arrayLiteral = arrayMatch[1];

// Remove the trailing semicolon
arrayLiteral = arrayLiteral.replace(/;\s*$/, '');

// Evaluate the JS array literal (it's valid JS, just not JSON)
let items;
try {
  items = new Function('return ' + arrayLiteral)();
} catch (e) {
  console.error('Failed to evaluate menuData array:', e.message);
  process.exit(1);
}

// Strip frontend-only fields — MongoDB manages _id, created_at, updated_at
const cleaned = items.map(({ _id, created_at, updated_at, ...rest }) => rest);

if (process.argv.includes('--stdout')) {
  process.stdout.write(JSON.stringify(cleaned, null, 2));
} else {
  const outPath = path.resolve(__dirname, '../../backend/storage/app/menu_seed_data.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(cleaned, null, 2), 'utf-8');
  console.log(`✅ Exported ${cleaned.length} menu items to ${outPath}`);
  console.log('   Run: php artisan menu:seed-from-data');
}
