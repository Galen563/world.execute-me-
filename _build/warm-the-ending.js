/* ============================================================================
   warm-the-ending.js — one-off palette pass, kept for the record.

   THE PROBLEM
   -----------
   `w.love` reaches 1.0 at 03:11 and the world's keyframe curve HOLDS it there
   to the end. Anything keyed only on that state therefore switches on and never
   switches off. Two things did: the drifting heart glyphs, and every one of the
   three-and-a-half minutes' worth of `PAL().love` mixes in the closing plates.

   So the last half minute of the film was rose pink — over the outro, over the
   final inventory, over the closing line. In a piece whose palette is a cold
   monitor blue with exactly one warm turn near the end, that read as a
   different film.

   THE FIX
   -------
   The ending cools to warm PAPER instead. Pink survives only as a trace, mixed
   a little way into the paper so the closing still remembers the LOVE act
   without being made of it.

   Run:  node _build/warm-the-ending.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');
let src = fs.readFileSync(FILE, 'utf8');
const before = src;

/* exact-string edits, so this cannot touch anything it was not aimed at */
const EDITS = [
  /* the lattice replay at the close: pink -> warm paper, half way */
  ['D.fillColour(rgba(PAL().love, (0.05 + burn * 0.30)));',
   'D.fillColour(rgba(EM.mix(PAL().love, PAL().paper, 0.45), (0.05 + burn * 0.30)));'],
  ["colour: rgba(PAL().love, 0.95) });",
   "colour: rgba(EM.mix(PAL().love, PAL().paper, 0.45), 0.95) });"],
  /* the two gauges */
  ['colour: rgba(EM.mix(PAL().accent, PAL().love, 0.6), 0.9)',
   'colour: rgba(EM.mix(PAL().accent, PAL().paper, 0.65), 0.9)'],
  /* the closing washes: paper over accent, not paper over rose */
  ['D.fillColour(rgba(EM.mix(PAL().paper, PAL().love, 0.35), 1));',
   'D.fillColour(rgba(EM.mix(PAL().paper, PAL().accent, 0.25), 1));'],
  ['D.fillColour(rgba(EM.mix(PAL().paper, PAL().love, 0.3), 0.85));',
   'D.fillColour(rgba(EM.mix(PAL().paper, PAL().accent, 0.20), 0.85));'],
  ['D.fillColour(rgba(EM.mix(PAL().paper, PAL().love, 0.3), 0.9));',
   'D.fillColour(rgba(EM.mix(PAL().paper, PAL().accent, 0.20), 0.9));'],
  /* the hand-drawn closing line */
  ['colour: rgba(EM.mix(PAL().paper, PAL().love, 0.4), 0.8 * a)',
   'colour: rgba(EM.mix(PAL().paper, PAL().accent, 0.30), 0.8 * a)'],
  /* the last travelling pulse */
  ['D.strokeColour(rgba(PAL().love, 0.25 * a * beat));',
   'D.strokeColour(rgba(EM.mix(PAL().love, PAL().paper, 0.5), 0.22 * a * beat));']
];

let applied = 0, missed = [];
for (const [from, to] of EDITS) {
  if (src.indexOf(from) < 0) { missed.push(from.slice(0, 56)); continue; }
  const n = src.split(from).length - 1;
  src = src.split(from).join(to);
  applied += n;
}

if (missed.length) {
  console.error('these targets were not found (the file changed?):');
  for (const m of missed) console.error('  ' + m);
  process.exit(1);
}
if (src === before) {
  console.log('nothing to change (already warm)');
  process.exit(0);
}

fs.writeFileSync(FILE, src, 'utf8');
const left = (src.match(/PAL\(\)\.love/g) || []).length;
console.log('applied ' + applied + ' edit(s); ' + left +
  ' PAL().love reference(s) left in the love act (the LOVE plate palette row is intentional)');
