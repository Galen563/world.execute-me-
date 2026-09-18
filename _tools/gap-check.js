/* ============================================================================
   _tools/gap-check.js — is there ever a moment with nothing happening?

   The film is not allowed to sit still. "Nothing happening" is not a matter of
   taste here, it is measurable: at any instant, either the world layer or the
   current plate must be putting NOVEL geometry on the canvas, and it must be
   DIFFERENT from a moment ago. A frame that repeats the previous frame is a
   still frame, and a stretch of still frames is the gap the film must not have.

   So this walks the whole track at a fine step and, for each sample, asks two
   questions:

     INK     did anything draw at all? (below the floor = an empty frame)
     MOTION  is this frame's call stream different from the previous sample's?

   A run of consecutive samples with no motion is reported with its time range,
   so a dead stretch is named rather than felt.

   Run:  node _tools/gap-check.js
         node _tools/gap-check.js 0.2      sample step in seconds
   ==========================================================================*/
'use strict';
const { createEnv } = require('./stub-env');

const STEP = parseFloat(process.argv[2] || '0.2');
const MIN_INK = 25;            /* primitives below which a frame counts as empty */
const MIN_CHANGED = 0.02;      /* fraction of the call stream that must differ */

const env = createEnv({ quiet: true });
const EM = env.EM;

/* --------------------------------------------------------------------------
   A stable digest of the frame's call stream, so "did it change" is a
   comparison of pictures rather than of a counter.
   ------------------------------------------------------------------------ */
function digest(lines) {
  let h1 = 2166136261 >>> 0, h2 = 5381 >>> 0;
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i];
    for (let k = 0; k < s.length; k++) {
      const c = s.charCodeAt(k);
      h1 = ((h1 ^ c) * 16777619) >>> 0;
      h2 = ((h2 * 33) ^ c) >>> 0;
    }
  }
  return h1 + ':' + h2;
}

function sample(t) {
  env.reset();
  const w = EM.World.at(t);
  w.time = t;
  w.pal = EM.World.palette(w);
  w.U = 1;
  EM.__pal = w.pal;
  EM.M.bindStage();
  const cue = EM.Lyrics.at(t);
  let err = null;
  /* World, annotation and plate are sampled SEPARATELY so a throw is attributed
     to the layer that produced it instead of being blamed on the cue. */
  try {
    EM.WorldLayer.draw(w, w.pal, t);
  } catch (e) {
    err = { where: 'world', msg: e.message, stack: (e.stack || '').split('\n')[1] };
  }
  if (!err && cue) {
    try { EM.drawSequence(cue, w, t); }
    catch (e) { err = { where: 'plate', msg: e.message, stack: (e.stack || '').split('\n')[1] }; }
  }
  return { ink: env.stats.ink, calls: env.log.length, digest: digest(env.log), cue: cue, err: err };
}

console.log('='.repeat(78));
console.log('  GAP CHECK — walking the whole track at ' + STEP + ' s steps');
console.log('='.repeat(78));

const samples = [];
const errs = [];
for (let t = 0; t <= EM.AUDIO_END - 0.05; t += STEP) {
  const tt = +t.toFixed(4);
  const s = sample(tt);
  s.t = tt;
  samples.push(s);
  if (s.err) errs.push({ t: tt, where: s.err.where, msg: s.err.msg,
                         stack: s.err.stack, scene: s.cue ? s.cue.scene : '?' });
}

if (errs.length) {
  console.log('\n-- THROWS --');
  console.log('  ' + errs.length + ' sampled frames threw:');
  const seen = Object.create(null);
  for (const e of errs) {
    const key = e.where + ' | ' + e.scene + ' | ' + e.msg;
    if (seen[key]) { seen[key].n++; seen[key].last = e.t; continue; }
    seen[key] = { n: 1, first: e.t, last: e.t, scene: e.scene, msg: e.msg,
                  where: e.where, stack: e.stack };
  }
  for (const k of Object.keys(seen)) {
    const r = seen[k];
    console.log('    [' + r.where + '] ' + r.scene.padEnd(18) + ' x' + String(r.n).padStart(3) +
      '  ' + EM.fmtTime(r.first) + '..' + EM.fmtTime(r.last) + '  ' + r.msg);
    if (r.stack) console.log('        ' + r.stack.trim());
  }
}

/* --------------------------------------------------------------------------
   INK — empty frames
   ------------------------------------------------------------------------ */
const empty = samples.filter(s => s.ink < MIN_INK);
console.log('\n-- INK --');
if (empty.length) {
  console.log('  frames below the ink floor (' + MIN_INK + ' primitives): ' + empty.length);
  for (const s of empty.slice(0, 12)) {
    console.log('    ' + EM.fmtTime(s.t) + '  ink=' + s.ink + '  ' +
      (s.cue ? s.cue.scene + '  "' + s.cue.text + '"' : '(no cue)'));
  }
  if (empty.length > 12) console.log('    … ' + (empty.length - 12) + ' more');
} else {
  const min = samples.reduce((a, s) => Math.min(a, s.ink), Infinity);
  console.log('  ok   no empty frames.  min ink ' + min + ', mean ' +
    Math.round(samples.reduce((a, s) => a + s.ink, 0) / samples.length));
}

/* --------------------------------------------------------------------------
   MOTION — runs of frames identical to their predecessor
   ------------------------------------------------------------------------ */
const still = [];
for (let i = 1; i < samples.length; i++) {
  if (samples[i].digest === samples[i - 1].digest) still.push(samples[i].t);
}

console.log('\n-- MOTION --');
console.log('  samples                : ' + samples.length);
console.log('  identical to previous  : ' + still.length +
  '  (' + (still.length / samples.length * 100).toFixed(1) + '%)');

/* group the still samples into runs, which is what a viewer would perceive */
const runs = [];
for (const t of still) {
  const last = runs[runs.length - 1];
  if (last && Math.abs(t - last.end) < STEP * 1.5) last.end = t;
  else runs.push({ start: t, end: t });
}

const DEAD = 0.6;              /* a run longer than this reads as a freeze */
const deadRuns = runs.filter(r => r.end - r.start >= DEAD - STEP * 0.5);
if (deadRuns.length) {
  console.log('\n  STILL STRETCHES of ' + DEAD + ' s or more: ' + deadRuns.length);
  for (const r of deadRuns) {
    const mid = (r.start + r.end) / 2;
    const cue = EM.Lyrics.at(mid);
    console.log('    ' + EM.fmtTime(r.start) + ' .. ' + EM.fmtTime(r.end) +
      '  (' + (r.end - r.start + STEP).toFixed(1) + ' s)  ' +
      (cue ? cue.scene : '?'));
  }
} else {
  console.log('  ok   no still stretch of ' + DEAD + ' s or more anywhere in the film');
}
if (runs.length) {
  console.log('\n  all still runs (' + runs.length + '), longest first:');
  runs.slice().sort((a, b) => (b.end - b.start) - (a.end - a.start)).slice(0, 8)
    .forEach(r => console.log('    ' + (r.end - r.start + STEP).toFixed(2) + ' s at ' +
      EM.fmtTime(r.start) + '  ' + (EM.Lyrics.at(r.start) || {}).scene));
}

/* --------------------------------------------------------------------------
   THE LONG INSTRUMENTAL, reported on its own because it is the section most at
   risk: 13.7 s with no lyric over it.
   ------------------------------------------------------------------------ */
console.log('\n-- THE 13.7 s INSTRUMENTAL (16.0 - 29.7 s) --');
const inst = samples.filter(s => s.t >= 16 && s.t <= 29.7);
if (!inst.length) {
  console.log('  not sampled');
} else {
  let stillHere = 0;
  for (let i = 1; i < inst.length; i++) if (inst[i].digest === inst[i - 1].digest) stillHere++;
  const minInk = inst.reduce((a, s) => Math.min(a, s.ink), Infinity);
  console.log('  samples      : ' + inst.length);
  console.log('  min ink      : ' + minInk);
  console.log('  still frames : ' + stillHere);
  console.log('  ' + (stillHere === 0 && minInk >= MIN_INK
    ? 'ok   every sampled frame in it is drawn AND different from the last'
    : 'FAIL something in this section is not moving'));
}

console.log('\n' + '='.repeat(78));
const bad = empty.length + deadRuns.length + (errs.length ? 1 : 0);
console.log('  ' + (bad ? 'GAP CHECK FAILED (' + bad + ' problem(s))' : 'GAP CHECK PASSED'));
console.log('='.repeat(78));
process.exit(bad ? 1 : 0);
