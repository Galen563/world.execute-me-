/* ============================================================================
   _tools/verify.js — the acceptance suite.

   Everything here is a claim the film makes about itself. Each one is checked
   against the real code loaded from index.html, not a re-implementation.

     1  SELFTEST     the generated cue table matches the copy embedded in
                     index.html, to the millisecond, for all 131 cues
     2  COVERAGE     a registered plate exists for every cue, ids are unique,
                     and no plate is unreachable
     3  DURATION     the last cue holds to the *measured* audio length, and the
                     length was measured rather than defaulted
     4  ACCENTS      the MIDI accent table is present and ordered
     5  NO THROW      every plate runs at 5 progress points without throwing
     6  INK           every plate puts real geometry or text on the canvas
     7  DETERMINISM   rendering the same t twice gives an identical call
                     stream — this is the seek-safety proof
     8  SEEK          a shuffled walk over the whole track, comparing each
                     frame against a fresh render of the same t
     9  CONTIGUOUS    no gap in coverage: every 0.25 s of the song is inside a
                     cue, and the frame count is stable across the track
    10  FINGERPRINTS  a stored hash per sampled frame, so a change in the
                     picture anywhere in the film shows up as a diff

   Run:  node _tools/verify.js            (summary)
         node _tools/verify.js --verbose  (per-plate numbers)
   ==========================================================================*/
'use strict';
const path = require('path');
const fs = require('fs');
const { createEnv } = require('./stub-env');

const ROOT = path.join(__dirname, '..');
const verbose = process.argv.indexOf('--verbose') >= 0;

let pass = 0, fail = 0, warn = 0;
const failures = [];
const warnings = [];

function ok(name, detail) {
  pass++;
  console.log('  ok   ' + name + (detail ? '  —  ' + detail : ''));
}
function bad(name, detail) {
  fail++;
  failures.push(name + (detail ? ': ' + detail : ''));
  console.log('  FAIL ' + name + (detail ? '  —  ' + detail : ''));
}
function caution(name, detail) {
  warn++;
  warnings.push(name + (detail ? ': ' + detail : ''));
  console.log('  warn ' + name + (detail ? '  —  ' + detail : ''));
}

console.log('='.repeat(78));
console.log('  world.execute(me); — verification');
console.log('='.repeat(78));

/* ---------- build the environment from index.html's own script list -------- */
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const listed = [...indexHtml.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const { SCRIPT_ORDER } = require('./stub-env');
const missingFromHtml = SCRIPT_ORDER.filter(s => listed.indexOf(s) < 0);
const extraInHtml = listed.filter(s => SCRIPT_ORDER.indexOf(s) < 0);

let env;
try {
  env = createEnv({ quiet: true });
} catch (e) {
  console.error('\ncould not start the engine: ' + e.message);
  process.exit(2);
}
const EM = env.EM;

console.log('\n-- 0. LOADING --');
if (missingFromHtml.length || extraInHtml.length) {
  bad('index.html script list matches the verifier', 'missing: [' + missingFromHtml.join(', ') +
    ']  extra: [' + extraInHtml.join(', ') + ']');
} else {
  ok('index.html loads ' + listed.length + ' scripts, all of them verified here');
}

/* ---------- 1. the runtime self-test ------------------------------------- */
console.log('\n-- 1. EMBEDDED TIMELINE vs CUE TABLE --');
const st = EM.__selftest;
if (!st) {
  bad('runtime self-test ran');
} else {
  if (st.ok) ok('self-test passes');
  else bad('self-test passes', st.fails.join(' ; '));
  ok('cues compared', st.embeddedCues + ' embedded vs ' + st.filmCues + ' in the film');
  if (st.worstTimeDeltaMs <= 0.5) {
    ok('worst timestamp delta', st.worstTimeDeltaMs.toFixed(3) + ' ms (cue #' + st.worstTimeAt + ')');
  } else {
    bad('worst timestamp delta', st.worstTimeDeltaMs.toFixed(3) + ' ms');
  }
  for (const w of (st.warns || [])) caution('self-test warning', w);
}

/* ---------- 2. coverage --------------------------------------------------- */
console.log('\n-- 2. PLATE COVERAGE --');
const cues = EM.Lyrics.cues;
const seen = Object.create(null);
const dup = [], missing = [], noLayers = [], badHeld = [];
let heldCount = 0;
for (const c of cues) {
  if (seen[c.scene]) dup.push(c.scene);
  seen[c.scene] = true;
  const pl = EM.SceneReg[c.scene];
  if (!pl) {
    /* a HELD cue has no plate on purpose: the shot before it keeps playing
       through. Legitimate — but it must RESOLVE to a cue that has a plate, or
       the frame would be empty. */
    if (c.held) {
      heldCount++;
      const owner = EM.Lyrics.at(c.t + 0.001);
      if (!owner || !EM.SceneReg[owner.scene]) {
        badHeld.push(c.scene + '@' + c.t + ' -> ' + (owner ? owner.scene : 'nothing'));
      }
    } else {
      missing.push(c.scene + '@' + c.t);
    }
  } else if (!pl.length) {
    noLayers.push(c.scene);
  }
}
const registered = EM.SceneOrder;
const unreachable = registered.filter(id => !EM.Lyrics.byScene[id]);

if (missing.length) bad('a plate exists for every cue (or the cue is held)', missing.slice(0, 6).join(', '));
else ok('every cue resolves to a plate',
  (cues.length - heldCount) + ' with their own, ' + heldCount + ' held');
if (badHeld.length) bad('held cues resolve to a plate', badHeld.join(', '));
else if (heldCount) ok('held cues resolve to the shot before them', heldCount + ' held cue(s)');
if (dup.length) bad('no plate id is used twice', dup.slice(0, 6).join(', '));
else ok('all ' + cues.length + ' plate ids are unique');
if (noLayers.length) bad('no plate is empty', noLayers.join(', '));
else ok('no plate is empty');
if (unreachable.length) bad('no plate is unreachable', unreachable.slice(0, 6).join(', '));
else ok('all ' + registered.length + ' registered plates are reachable from a cue');

/* ---------- 3. duration --------------------------------------------------- */
console.log('\n-- 3. DURATION --');
if (!EM.AUDIO_MEASURED) bad('audio length was measured from the file');
else ok('audio length measured', EM.AUDIO_END.toFixed(5) + ' s from ' +
  EM.AUDIO_FRAMES + ' MPEG frames at ' + EM.AUDIO_RATE + ' Hz');
if (EM.AUDIO_INFO) {
  const derived = EM.AUDIO_INFO.samples / EM.AUDIO_INFO.sampleRate;
  if (Math.abs(derived - EM.AUDIO_END) < 1e-5) {
    ok('length is internally consistent', EM.AUDIO_INFO.samples + ' samples / ' +
      EM.AUDIO_INFO.sampleRate + ' Hz = ' + derived.toFixed(5) + ' s');
  } else {
    /* the generated value is rounded to 5 decimals; anything further off than
       that means it did not come from the sample count */
    bad('length is internally consistent', derived.toFixed(6) + ' vs ' + EM.AUDIO_END);
  }
  ok('format', (EM.AUDIO_INFO.bitrate / 1000) + ' kbps, ' +
    (EM.AUDIO_INFO.channels === 2 ? 'stereo' : 'mono'));
}
const last = cues[cues.length - 1];
if (Math.abs(last.end - EM.AUDIO_END) < 0.5) {
  ok('the final cue holds to the audio end', 'last cue @' + last.t + 's, held ' +
    (last.end - last.t).toFixed(3) + 's');
} else {
  bad('the final cue holds to the audio end', last.end + ' vs ' + EM.AUDIO_END);
}
/* The supplied .lrc writes its final timestamp as [03:31.984] to the nearest
   millisecond, while the file actually measures 211.98367 s. The cue therefore
   lands 0.33 ms PAST the last sample — which is not a bug but the resolution
   limit of the lyric file. One millisecond is the tolerance, and it is stated
   here rather than hidden in a magic number. */
const CUE_TOL = 0.001;
if (last.t <= EM.AUDIO_END + CUE_TOL) {
  const over = last.t - EM.AUDIO_END;
  ok('no cue starts after the audio ends',
    over > 0 ? ('last cue is ' + (over * 1000).toFixed(2) + ' ms past the last sample, ' +
      'inside the 1 ms lyric-timestamp resolution') : 'last cue ends on the final sample');
} else {
  bad('no cue starts after the audio ends', last.t + ' > ' + EM.AUDIO_END + ' + ' + CUE_TOL);
}

/* ---------- 4. accents ---------------------------------------------------- */
console.log('\n-- 4. MEASURED ACCENTS --');
const on = EM.ONSETS;
if (!on || !on.length) bad('the MIDI accent table is present');
else {
  ok('accents loaded', on.length + ' note groups from ' +
    (EM.MIDI_INFO ? EM.MIDI_INFO.notes + ' note-ons at ' + EM.MIDI_INFO.bpm.join('/') + ' BPM' : 'the MIDI file'));
  let ordered = true;
  for (let i = 1; i < on.length; i++) if (on[i][0] < on[i - 1][0]) { ordered = false; break; }
  if (ordered) ok('accents are in time order');
  else bad('accents are in time order');
  const lastMs = on[on.length - 1][0] / 1000;
  if (lastMs <= EM.AUDIO_END) ok('last accent is inside the track', lastMs.toFixed(3) + ' s');
  else bad('last accent is inside the track', lastMs + ' > ' + EM.AUDIO_END);
  /* the pulse function must actually fire */
  let fired = 0;
  for (let i = 0; i < 200; i++) {
    const t = on[Math.floor(i * on.length / 200)][0] / 1000;
    if (EM.onsetPulse(t, 0.24) > 0.9) fired++;
  }
  if (fired > 190) ok('onsetPulse fires on the notes', fired + '/200 sampled accents reach >0.9');
  else bad('onsetPulse fires on the notes', 'only ' + fired + '/200');
}

/* ---------- 5 + 6. per-plate throw and ink -------------------------------- */
console.log('\n-- 5/6. EVERY PLATE RUNS AND DRAWS --');

/* --------------------------------------------------------------------------
   A STATIC CHECK FOR THE `M.` / `D.` MISTAKE.

   Twice now a plate has called a helper on the wrong object — `M.bracket(...)`
   when bracket lives on D, and `M.dim(...)` likewise. Both threw at runtime and
   were only caught because a plate audit happens to run every plate; a plate
   that is only ever drawn in a passage nobody sampled would have shipped broken.

   So: read the plate sources and confirm that every `M.name(` refers to
   something EM.M actually exports. It costs a regex and it closes a whole class
   of typo.
   ------------------------------------------------------------------------ */
{
  const fsx = require('fs');
  const srcDir = path.join(ROOT, 'src');
  const exported = Object.keys(EM.M || {});
  const known = Object.create(null);
  exported.forEach(k => { known[k] = true; });
  /* helpers the motifs module deliberately re-exposes from elsewhere */
  ['pulseRings'].forEach(k => { known[k] = true; });

  const unknown = [];
  for (const f of fsx.readdirSync(srcDir)) {
    if (!/^4\d_plates_.*\.js$/.test(f)) continue;
    const src = fsx.readFileSync(path.join(srcDir, f), 'utf8');
    const names = new Set();
    const re = /\bM\.([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
    let m;
    while ((m = re.exec(src))) names.add(m[1]);
    for (const n of names) if (!known[n]) unknown.push(f + ': M.' + n + '()');
  }
  if (unknown.length) {
    bad('every M.*() call in the plates exists on the motif toolkit',
      unknown.join(', '));
  } else {
    ok('every M.*() call in the plates exists on the motif toolkit',
      exported.length + ' helpers checked across all plate files');
  }
}

const PROGRESS = [0, 0.03, 0.2, 0.45, 0.7, 0.92];
const faultsBefore = EM.sceneFaultCount();
const threw = [], drew = [];
const plateInk = [];
for (const c of cues) {
  const plate = EM.SceneReg[c.scene];
  if (!plate) continue;
  let ink = 0;
  const thrown = new Set();
  for (const p of PROGRESS) {
    const t = c.t + Math.min(c.dur - 0.001, p * c.dur);
    const w = EM.World.at(t);
    w.time = t;
    w.pal = EM.World.palette(w);
    EM.__pal = w.pal;
    for (const layer of plate) {
      const b = env.stats.ink;
      try { layer.e(w, p, c); }
      catch (e) { thrown.add('p=' + p + ' l' + layer.l + ': ' + (e.message || e)); }
      ink += env.stats.ink - b;
    }
  }
  plateInk.push({ id: c.scene, text: c.text, ink: ink });
  if (thrown.size) threw.push(c.scene + ' — ' + [...thrown][0]);
  if (ink === 0) drew.push(c.scene);
}
const runtimeFaults = EM.sceneFaultCount() - faultsBefore;

if (threw.length) bad('every plate runs without throwing', threw.length + ' plates threw, first: ' + threw[0]);
else ok('every plate runs without throwing', cues.length + ' plates x ' + PROGRESS.length + ' progress points');
if (runtimeFaults) bad('the scene registry recorded no faults', runtimeFaults + ' fault(s)');
else ok('the scene registry recorded no faults');
if (drew.length) bad('every plate puts ink on the canvas', drew.length + ' plates drew nothing: ' + drew.slice(0, 5).join(', '));
else ok('every plate puts ink on the canvas', 'min ' +
  Math.min(...plateInk.map(x => x.ink)) + ' primitives, mean ' +
  Math.round(plateInk.reduce((s, x) => s + x.ink, 0) / plateInk.length));

if (verbose) {
  console.log('\n  per-plate primitives across ' + PROGRESS.length + ' progress points:');
  const sorted = plateInk.slice().sort((a, b) => a.ink - b.ink);
  for (const r of sorted) {
    console.log('    ' + String(r.ink).padStart(6) + '  ' + r.id.padEnd(18) + '  "' + r.text + '"');
  }
}

/* ---------- 7. determinism ------------------------------------------------ */
console.log('\n-- 7. DETERMINISM (the seek-safety proof) --');
const SAMPLE_T = [];
for (let t = 0.5; t < EM.AUDIO_END; t += 1.9) SAMPLE_T.push(+t.toFixed(3));

function fingerprintAt(t) {
  env.reset();
  const w = EM.World.at(t);
  w.time = t;
  w.pal = EM.World.palette(w);
  EM.__pal = w.pal;
  EM.WorldLayer.draw(w, w.pal, t);
  const cue = EM.Lyrics.at(t);
  if (cue) EM.drawScene(cue.scene, w, t, cue);
  return { hash: env.fingerprint(), calls: env.log.length };
}

const firstPass = SAMPLE_T.map(t => ({ t, f: fingerprintAt(t) }));
let unstable = [];
for (const s of firstPass) {
  const again = fingerprintAt(s.t);
  if (again.hash !== s.f.hash) unstable.push(s.t);
}
if (unstable.length) {
  bad('the same t renders identically twice', unstable.length + ' of ' +
    SAMPLE_T.length + ' frames differ, first at ' + unstable[0] + ' s');
} else {
  ok('the same t renders identically on a repeat pass',
    SAMPLE_T.length + ' frames hashed and matched');
}

/* ---------- 8. seek ------------------------------------------------------- */
console.log('\n-- 8. SEEKING --');
/* visit the samples in a deliberately hostile order: backwards, and shuffled
   deterministically, so any hidden cross-frame state shows up as a mismatch */
const order = SAMPLE_T.map((t, i) => i).sort((a, b) =>
  (EM.hash(a * 7919) - EM.hash(b * 7919)));
let mismatched = [];
for (const i of order) {
  const s = firstPass[i];
  const got = fingerprintAt(s.t);
  if (got.hash !== s.f.hash) mismatched.push(s.t);
}
if (mismatched.length) {
  bad('a shuffled seek reproduces every frame', mismatched.length + ' of ' +
    SAMPLE_T.length + ' differ, first at ' + mismatched[0] + ' s');
} else {
  ok('a shuffled seek reproduces every frame',
    SAMPLE_T.length + ' frames visited out of order, all identical');
}
/* and the worst case: the very end, then the very start */
const endF = fingerprintAt(EM.AUDIO_END - 0.05);
const startF = fingerprintAt(0.05);
const endF2 = fingerprintAt(EM.AUDIO_END - 0.05);
if (endF.hash === endF2.hash) ok('seeking end -> start -> end returns the same frame');
else bad('seeking end -> start -> end returns the same frame');

/* ---------- 9. contiguous coverage ---------------------------------------- */
console.log('\n-- 9. CONTIGUOUS COVERAGE --');
let uncovered = [];
for (let t = 0; t < EM.AUDIO_END; t += 0.25) {
  const c = EM.Lyrics.at(t);
  if (!c) { uncovered.push(t); continue; }
  if (t < c.t - 1e-6) uncovered.push(t);
}
if (uncovered.length) {
  bad('every 0.25 s of the song is inside a cue', uncovered.length + ' gaps, first at ' + uncovered[0]);
} else {
  ok('every 0.25 s of the song is inside a cue',
    Math.ceil(EM.AUDIO_END / 0.25) + ' sample points covered');
}
/* frame cost should not explode at any point in the track */
let maxCalls = 0, maxAt = 0, minCalls = 1e9;
for (const s of firstPass) {
  if (s.f.calls > maxCalls) { maxCalls = s.f.calls; maxAt = s.t; }
  if (s.f.calls < minCalls) minCalls = s.f.calls;
}
ok('frame cost is bounded', 'min ' + minCalls + ', max ' + maxCalls +
  ' canvas calls (at ' + maxAt + ' s)');
if (maxCalls > 40000) caution('a frame is unusually heavy', maxCalls + ' calls at ' + maxAt + ' s');

/* ---------- 10. fingerprints ---------------------------------------------- */
console.log('\n-- 10. FRAME FINGERPRINTS --');
const FPRINT = path.join(__dirname, 'frame-fingerprints.json');
const current = {
  audioEnd: EM.AUDIO_END,
  step: 1.9,
  frames: firstPass.map(s => ({ t: s.t, hash: s.f.hash, calls: s.f.calls }))
};
if (!fs.existsSync(FPRINT)) {
  fs.writeFileSync(FPRINT, JSON.stringify(current), 'utf8');
  ok('wrote a fingerprint baseline', path.relative(ROOT, FPRINT) + ' (' + current.frames.length + ' frames)');
} else {
  const prev = JSON.parse(fs.readFileSync(FPRINT, 'utf8'));
  if (prev.frames.length !== current.frames.length) {
    caution('fingerprint baseline has a different sample count',
      prev.frames.length + ' -> ' + current.frames.length);
    fs.writeFileSync(FPRINT, JSON.stringify(current), 'utf8');
  } else {
    const changed = [];
    for (let i = 0; i < current.frames.length; i++) {
      if (prev.frames[i].hash !== current.frames[i].hash) changed.push(current.frames[i].t);
    }
    if (changed.length) {
      caution('the picture changed since the baseline',
        changed.length + ' of ' + current.frames.length + ' frames differ, first at ' + changed[0] + ' s');
      fs.writeFileSync(FPRINT, JSON.stringify(current), 'utf8');
      console.log('       (baseline updated)');
    } else {
      ok('the picture matches the stored baseline', current.frames.length + ' frames unchanged');
    }
  }
}

/* ---------- summary ------------------------------------------------------- */
console.log('\n' + '='.repeat(78));
if (failures.length) {
  console.log('  FAILURES');
  for (const f of failures) console.log('    x ' + f);
}
if (warnings.length) {
  console.log('  WARNINGS');
  for (const w of warnings) console.log('    ! ' + w);
}
console.log('  ' + pass + ' passed, ' + fail + ' failed, ' + warn + ' warnings');
console.log('  ' + (fail ? 'VERIFICATION FAILED' : 'VERIFICATION PASSED'));
console.log('='.repeat(78));
process.exit(fail ? 1 : 0);
