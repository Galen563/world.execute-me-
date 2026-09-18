/* ============================================================================
   repair-encoding.js — one-off recovery script.

   WHAT HAPPENED
   -------------
   A bulk find-and-replace was run through PowerShell in this checkout:

       (Get-Content f -Raw) -replace 'A', 'B' | Set-Content f

   In Windows PowerShell 5.1 that is not a text edit, it is a re-encoding:
   Get-Content -Raw reads a UTF-8 file as the ANSI code page and Set-Content
   writes it back the same way, so every non-ASCII character is double-encoded.
   Em dashes became U+9225 followed by U+003F.

   The lesson is the one this project keeps relearning about its own tooling:
   check the tool before trusting its output.

   WHAT THIS DOES
   --------------
   Reverses that exact damage in the one file it touched. It is deliberately
   narrow — it rewrites only the known bad sequence, and writes with an explicit
   UTF-8 encoding — so it cannot affect anything else.

   NOTE ON THIS FILE'S OWN HISTORY: the first two versions of this script were
   themselves broken. One had a guard that rejected ordinary comment
   continuation lines; the next had a guard that mishandled one-line block
   comments; and the third put a comment terminator inside its own block
   comment and failed to parse. Three rewrites of a twelve-line repair, which is
   its own small argument for keeping repairs narrow and verifying each one.

   Run:  node _build/repair-encoding.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');

/* the exact double-encoded em dash: U+9225 then U+003F */
const BAD = new RegExp(String.fromCharCode(0x9225) + '\\?', 'g');
const GOOD = String.fromCharCode(0x2014);

/* any of the known mojibake lead characters, for the detection sweep */
const ANY_BAD = new RegExp('[' +
  String.fromCharCode(0x9225) + String.fromCharCode(0x951B) +
  String.fromCharCode(0x923B) + String.fromCharCode(0x951F) + ']');

let src = fs.readFileSync(FILE, 'utf8');
const count = (src.match(BAD) || []).length;
if (!count) {
  console.log('nothing to repair in ' + path.basename(FILE));
  process.exit(0);
}

/* Rather than trying to prove each occurrence is commented out — which three
   successive versions of this guard failed to do correctly, because tracking
   block-comment state across continuation lines is fiddly — the repair is
   proved by consequence: apply it in memory, PARSE the result, and only write
   if it still parses. If an occurrence had been inside a string literal, the
   rewrite could not change a string into invalid syntax, but if the rewrite
   damaged code the parse would fail; and the parse is the thing that actually
   matters.

   A guard that is easy to get wrong is worse than an outcome check that is
   impossible to get wrong. */
const patched = src.replace(BAD, GOOD);
try {
  new (require('vm').Script)(patched, { filename: FILE });
} catch (e) {
  console.error('refusing to write: the repaired file does not parse — ' + e.message);
  process.exit(1);
}

fs.writeFileSync(FILE, patched, 'utf8');

const back = fs.readFileSync(FILE, 'utf8');
const remaining = (back.match(ANY_BAD) || []).length;
const dashes = (back.match(new RegExp(GOOD, 'g')) || []).length;
console.log('repaired ' + count + ' sequence(s); ' + remaining + ' bad lead char(s) left, ' +
  dashes + ' em dash(es) present, reparse ok');
process.exit(remaining ? 1 : 0);
