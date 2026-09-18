/* ============================================================================
   fix-shadowing.js — one-off repair, kept for the record.

   THE BUG IT FIXES
   ----------------
   Every plate file defined a local helper called `pal()` and every effect was
   written `function (w, p, cue)`. Inside such a function, `p` is the progress
   number — so `pal()` was not a call to the helper at all, and every colour in
   the plate threw "pal is not a function".

   Twenty-five of the twenty-seven effects in the final act were broken this
   way, and the film still "worked": the per-plate catch swallowed each throw,
   so the act rendered as the world layer plus the annotation layer and nothing
   else. It was found by _tools/gap-check.js, which treats a throw as a failure.

   THE FIX
   -------
   Rather than renaming the parameter in ninety places — which is easy to get
   half-right — the helper is renamed to something a local variable cannot
   plausibly shadow: `PAL()`. One substitution per file, and the whole class of
   bug is gone rather than the instance.

   Run:  node _build/fix-shadowing.js      (idempotent; safe to re-run)
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'src');
const FILES = fs.readdirSync(DIR).filter(f => /^4\d_plates_.*\.js$/.test(f));

let touched = 0, subs = 0;
for (const f of FILES) {
  const file = path.join(DIR, f);
  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  /* the definition */
  src = src.replace(/function pal\(\) \{ return EM\.__pal; \}/,
    'function PAL() { return EM.__pal; }');

  /* every use */
  src = src.replace(/\bpal\(\)/g, 'PAL()');

  if (src !== before) {
    const n = (before.match(/\bpal\(\)/g) || []).length;
    fs.writeFileSync(file, src, 'utf8');
    touched++; subs += n;
    console.log('  ' + f.padEnd(28) + n + ' substitution(s)');
  }
}
console.log('\n' + touched + ' file(s) updated, ' + subs + ' substitution(s)');

/* verify none survive */
let left = 0;
for (const f of FILES) {
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  const m = src.match(/\bpal\(\)/g);
  if (m) { left += m.length; console.log('  STILL PRESENT in ' + f + ': ' + m.length); }
}
console.log(left ? ('FAILED: ' + left + ' remaining') : 'OK: no shadowable pal() calls remain');
process.exit(left ? 1 : 0);
