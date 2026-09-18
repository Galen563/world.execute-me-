/* ============================================================================
   _tools/check-plates.js — do the plates actually DRAW?

   This exists because of a real failure mode. A version of this project
   reported "131 plates registered, coverage 100%" while every single plate was
   throwing a ReferenceError and putting nothing on the canvas — the per-plate
   catch swallowed it and coverage only ever proved that plates were
   *registered*. So:

     - every plate is run at several progress points
     - any throw is recorded and reported
     - real geometry and text must appear, not just save/restore bookkeeping
     - the canvas save/restore nesting must come back balanced

   Run:  node _tools/check-plates.js            (all plates)
         node _tools/check-plates.js th         (only ids starting with "th")
   ==========================================================================*/
'use strict';
const { createEnv } = require('./stub-env');

const filter = process.argv[2] || null;
/* p = 0 is included on purpose: it is the instant a line switches on, and
   `vis(p)` is exactly zero there, so a plate that multiplies everything by a
   bare `vis(p, a)` draws nothing at its own first frame. */
const PROGRESS = [0, 0.03, 0.2, 0.45, 0.7, 0.92];
const MIN_INK = 20;              /* primitives per plate, per progress point */

let env;
try {
  env = createEnv({ quiet: true, requireAll: true });
} catch (e) {
  console.error('could not build the environment: ' + e.message);
  process.exit(2);
}

const EM = env.EM;
const cues = EM.Lyrics.cues;
const faultsBefore = EM.sceneFaultCount();

let checked = 0, empty = 0, thin = 0, unbalanced = 0, threw = 0, held = 0;
const emptyList = [], thinList = [], throwList = [], unbalancedList = [];
const rows = [];

for (let i = 0; i < cues.length; i++) {
  const cue = cues[i];
  const id = cue.scene;
  if (filter && id.indexOf(filter) !== 0) continue;
  checked++;

  const plate = EM.SceneReg[id];
  if (!plate) {
    /* a HELD cue has no plate of its own: the shot before it keeps playing
       through. Not a fault — but it must resolve to a plate, so check that. */
    if (cue.held) {
      const owner = EM.Lyrics.at(cue.t + 0.001);
      if (owner && EM.SceneReg[owner.scene]) { held++; continue; }
      throwList.push(id + ': held but resolves to no plate');
      threw++;
      continue;
    }
    throwList.push(id + ': NO PLATE REGISTERED');
    threw++;
    continue;
  }

  let ink = 0, calls = 0, maxDepth = 0;
  const thrown = new Set();

  for (const p of PROGRESS) {
    const t = cue.t + Math.min(cue.dur - 0.001, p * cue.dur);
    const w = EM.World.at(t);
    w.time = t;
    w.pal = EM.World.palette(w);
    w.U = 1;
    EM.__pal = w.pal;

    for (const layer of plate) {
      const b = { calls: env.stats.calls, ink: env.stats.ink, max: env.stats.maxDepth };
      try {
        layer.e(w, p, cue);
      } catch (e) {
        thrown.add('p=' + p + ' layer' + layer.l + ': ' + (e && e.message ? e.message : String(e)));
        continue;
      }
      ink += env.stats.ink - b.ink;
      calls += env.stats.calls - b.calls;
      if (env.stats.maxDepth - b.max > maxDepth) maxDepth = env.stats.maxDepth - b.max;
    }
  }

  if (thrown.size) {
    threw++;
    throwList.push(id + '  (cue #' + cue.i + ' "' + cue.text + '")');
    for (const m of [...thrown].slice(0, 2)) throwList.push('      ' + m);
  }
  if (ink === 0) { empty++; emptyList.push(id); }
  else if (ink < MIN_INK * PROGRESS.length * 0.5) {
    thin++;
    thinList.push(id + ' (' + ink + ' primitives)');
  }
  if (maxDepth > 4) { unbalanced++; unbalancedList.push(id + ' (depth ' + maxDepth + ')'); }

  rows.push({ id, cue, ink, calls });
}

/* --------------------------------------------------------------------------
   report
   ------------------------------------------------------------------------ */
console.log('='.repeat(78));
console.log('  PLATE AUDIT' + (filter ? '  (filter: "' + filter + '")' : '  (all plates)'));
console.log('='.repeat(78));

const byInk = rows.slice().sort((a, b) => a.ink - b.ink);
console.log('\nfaintest 8 plates (fewest primitives across ' + PROGRESS.length + ' progress points):');
for (const r of byInk.slice(0, 8)) {
  console.log('  ' + String(r.ink).padStart(6) + '  ' + r.id.padEnd(20) + '  "' + r.cue.text + '"');
}
const byInkDesc = byInk.slice().reverse();
console.log('\nrichest 4 plates:');
for (const r of byInkDesc.slice(0, 4)) {
  console.log('  ' + String(r.ink).padStart(6) + '  ' + r.id.padEnd(20) + '  "' + r.cue.text + '"');
}

const totalInk = rows.reduce((s, r) => s + r.ink, 0);
console.log('\nplates checked      : ' + (checked - held) + ' / ' + (cues.length - held) +
  ' cues with their own plate   (+' + held + ' held cue(s) using the shot before them)');
console.log('total primitives    : ' + totalInk);
console.log('mean per plate      : ' + (checked ? Math.round(totalInk / checked) : 0));
console.log('runtime plate faults: ' + (EM.sceneFaultCount() - faultsBefore));

let bad = 0;
if (threw) {
  console.log('\n-- PLATES THAT THREW (' + threw + ') --');
  for (const m of throwList) console.log('  x ' + m);
  bad++;
}
if (empty) {
  console.log('\n-- PLATES THAT DREW NOTHING (' + empty + ') --');
  for (const m of emptyList) console.log('  x ' + m);
  bad++;
}
if (thin) {
  console.log('\n-- SUSPICIOUSLY THIN PLATES (' + thin + ') --');
  for (const m of thinList) console.log('  ! ' + m);
}
if (unbalanced) {
  console.log('\n-- DEEP CONTEXT NESTING (' + unbalanced + ') --');
  for (const m of unbalancedList) console.log('  ! ' + m);
}

const runtimeFaults = EM.sceneFaults();
if (runtimeFaults.length) {
  console.log('\n-- FAULTS RECORDED BY THE SCENE REGISTRY --');
  for (const f of runtimeFaults.slice(0, 12)) console.log('  x ' + f);
  bad++;
}

console.log('\n' + (bad ? 'PLATE AUDIT FAILED' : 'PLATE AUDIT PASSED') +
  '  (' + checked + ' plates, ' + totalInk + ' primitives, ' +
  (empty + threw) + ' unusable)');
process.exit(bad ? 1 : 0);
