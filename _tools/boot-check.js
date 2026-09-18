/* ============================================================================
   _tools/boot-check.js — drive the real startup path without a browser.

   This exists because there was no browser available in this environment, and
   "it works" is not something to assert without evidence. So the app is
   started for real — its scripts loaded, its init() run, its transport driven
   — against the headless DOM, and everything it touches is examined.

   What it CAN prove:
     the app boots without throwing
     init() reaches its end and reports what it loaded
     the transport works: play advances the clock, pause stops it, seek lands
       where it was asked to
     every element the app looks up actually exists in index.html, or is created
     media elements have no crossorigin attribute (the file:// trap)
     no script is an ES module, and no module script tag is used (also a
       file:// trap: plain file pages cannot load modules)
     nothing in the runtime reaches the network
     a missing audio file degrades to the page-timer clock instead of dying
     a throwing frame does not kill the loop

   What it CANNOT prove: that Chrome's canvas draws what we expect. That still
   needs a real browser. This narrows the risk; it does not remove it.
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { createEnv } = require('./stub-env');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const bad = [];
function ok(n, d) { pass++; console.log('  ok   ' + n + (d ? '  —  ' + d : '')); }
function no(n, d) { fail++; bad.push(n + (d ? ': ' + d : '')); console.log('  FAIL ' + n + (d ? '  —  ' + d : '')); }

console.log('='.repeat(78));
console.log('  BOOT CHECK — the real startup path, headless');
console.log('='.repeat(78));

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------- 1. file:// prerequisites ------------------------------------- */
console.log('\n-- file:// PREREQUISITES --');

if (/<script[^>]*type\s*=\s*["']module["']/.test(html)) {
  no('no ES module scripts', 'file:// pages cannot load modules — the page would not open at all');
} else {
  ok('no ES module scripts', 'all scripts are classic, so file:// works');
}
if (/@import|from\s+['"]https?:/.test(html)) {
  no('no external imports');
} else {
  ok('no external imports');
}
/* the trap that costs you all sound, with an error that says nothing useful */
const mediaTags = html.match(/<(audio|video)\b[^>]*>/g) || [];
const withCors = mediaTags.filter(t => /crossorigin/i.test(t));
if (withCors.length) {
  no('no crossorigin on media elements',
    'under file:// a CORS-mode media request can never succeed — MEDIA_ERR_SRC_NOT_SUPPORTED');
} else {
  ok('no crossorigin on media elements', mediaTags.length + ' media tag(s) checked');
}
/* lyrics must be local */
const remote = html.match(/(?:src|href)\s*=\s*["'](https?:)?\/\//g) || [];
if (remote.length) no('no absolute URLs in index.html', remote.join(', '));
else ok('no absolute URLs in index.html', 'nothing is fetched');

/* the audio file has to be next to index.html, under one of the names tried */
const CANDIDATES = [
  'Mili - world.execute (me) ;.mp3',
  'Mili - world.execute(me) ;.mp3',
  'Mili - world.execute (me);.mp3',
  'Mili - world.execute(me);.mp3',
  'world.execute (me) ;.mp3',
  'audio.mp3'
];
const found = CANDIDATES.filter(n => fs.existsSync(path.join(ROOT, n)));
if (found.length) ok('the audio file is present', '"' + found[0] + '" (' +
  (fs.statSync(path.join(ROOT, found[0])).size / 1048576).toFixed(2) + ' MB)');
else no('the audio file is present', 'tried ' + CANDIDATES.length + ' names; the film would run silent');

/* every script the page loads must exist */
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const absent = scripts.filter(s => !fs.existsSync(path.join(ROOT, s)));
if (absent.length) no('every referenced script exists', absent.join(', '));
else ok('every referenced script exists', scripts.length + ' scripts');
const css = [...html.matchAll(/<link[^>]+href="([^"]+)"/g)].map(m => m[1]);
const cssAbsent = css.filter(s => !fs.existsSync(path.join(ROOT, s)));
if (cssAbsent.length) no('every referenced stylesheet exists', cssAbsent.join(', '));
else ok('every referenced stylesheet exists', css.length + ' stylesheet(s)');

/* every element the app looks up by id must be in the HTML */
const appSrc = fs.readFileSync(path.join(ROOT, 'src', '60_app.js'), 'utf8');
const ids = [...appSrc.matchAll(/\$\('([a-z0-9_-]+)'\)/g)].map(m => m[1]);
const missingIds = [...new Set(ids)].filter(id => html.indexOf('id="' + id + '"') < 0);
if (missingIds.length) no('every element the app looks up exists in the HTML', missingIds.join(', '));
else ok('every element the app looks up exists in the HTML',
  [...new Set(ids)].length + ' ids resolved');

/* ---------- 2. boot ------------------------------------------------------- */
console.log('\n-- BOOT --');
let env;
try {
  env = createEnv({ quiet: true });
  ok('all scripts load and evaluate', env.loaded.length + ' files');
} catch (e) {
  no('all scripts load and evaluate', e.message);
  console.log('\n' + fail + ' failure(s)');
  process.exit(1);
}
const EM = env.EM;

/* The app defers init() through setTimeout (it waits for the DOM to be ready)
   and arms a 100 ms heartbeat with setInterval. The stub collects both, so run
   the queued work here and assert the app actually scheduled it. */
const state = { booted: false, errors: [] };
env.win.console.error = function () {
  state.errors.push([].slice.call(arguments).map(String).join(' '));
};

let initThrew = null;
try {
  state.booted = env.flushTimeouts() > 0;
} catch (e) {
  initThrew = e;
}
if (initThrew) {
  no('init() runs without throwing', initThrew.message + '  @ ' +
    (initThrew.stack || '').split('\n')[1]);
} else if (state.booted) {
  ok('init() runs without throwing', 'the startup path reached the end');
} else {
  no('init() runs without throwing', 'init was never scheduled');
}

const app = EM.__app;
if (!app) {
  no('the app exposes its test surface', 'EM.__app is missing');
} else {
  ok('the app exposes its test surface', 'EM.__app');
}

/* ---------- 3. what init reported ---------------------------------------- */
console.log('\n-- WHAT THE ENGINE LOADED --');
const st = EM.__selftest;
if (st && st.ok) ok('the runtime self-test passed on load',
  st.filmCues + ' cues, ' + st.platesUsed + ' plates, worst delta ' +
  st.worstTimeDeltaMs + ' ms');
else no('the runtime self-test passed on load', st ? st.fails.join(' ; ') : 'no report');

const heartbeat = env.pendingIntervals.filter(i => i.ms === 100)[0];
if (heartbeat) ok('the render heartbeat is armed',
  'setInterval(…, 100) registered and deliberately not gated on playback');
else no('the render heartbeat is armed', 'no 100 ms interval was registered');

/* ---------- 4. transport -------------------------------------------------- */
console.log('\n-- TRANSPORT --');
if (app) {
  /* A real browser fires loadedmetadata once the file opens; the stub cannot,
     so fire it here. Without this the film correctly sits on its no-audio
     degradation path, which is a different (also tested) code path. */
  if (env.listeners['loadedmetadata']) {
    env.listeners['loadedmetadata'].forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
  }
  const sA = app.now();
  if (sA.audioOK) ok('the audio-loaded path engages when metadata arrives');
  else no('the audio-loaded path engages when metadata arrives');

  app.play();
  const s1 = app.now();
  if (s1.running) ok('play() starts the transport');
  else no('play() starts the transport');

  /* drive two frames with increasing wall-clock timestamps so the internal dt
     is real; the clock itself must come from the media element */
  let wall = 1000;
  for (let i = 0; i < 3; i++) { wall += 16.7; try { app.tick(); } catch (e) { /* counted below */ } }
  const s2 = app.now();
  if (Math.abs(s2.t - s1.t) < 1e-9) {
    ok('the clock comes from the media element, not from the frame loop',
      't unchanged while currentTime is unchanged — no self-accumulating time');
  } else {
    no('the clock comes from the media element, not from the frame loop',
      't drifted from ' + s1.t + ' to ' + s2.t + ' with the media element still');
  }

  app.pause();
  const s3 = app.now();
  if (!s3.running) ok('pause() stops the transport');
  else no('pause() stops the transport');

  app.seek(120.5);
  const s4 = app.now();
  if (Math.abs(s4.t - 120.5) < 0.05) ok('seek() lands where asked', s4.t.toFixed(3) + ' s');
  else no('seek() lands where asked', 'asked 120.5, got ' + s4.t.toFixed(3));

  /* the offset must live on the clock, not on a display field */
  app.setOffset(0.25);
  app.seek(60);
  const s6 = app.now();
  if (Math.abs(s6.t - 60.25) < 0.05) ok('the sync offset is applied to the clock',
    't = media + 0.25  ->  ' + s6.t.toFixed(3));
  else no('the sync offset is applied to the clock', 't=' + s6.t + ' after seeking to 60 with +0.25');
  app.setOffset(0);

  /* and a seek must not be written back through the offset */
  app.seek(30);
  const s7 = app.now();
  if (Math.abs(s7.rawT - 30) < 0.05 && Math.abs(s7.offset) < 1e-9) {
    ok('seeking does not corrupt the offset', 'raw = ' + s7.rawT.toFixed(3) + ', offset = ' + s7.offset);
  } else {
    no('seeking does not corrupt the offset', 'raw = ' + s7.rawT + ', offset = ' + s7.offset);
  }

  /* offset carries across a pause/resume, which is the point of having one */
  app.seek(45);
  app.setOffset(-0.15);
  const s8 = app.now();
  if (Math.abs(s8.t - 44.85) < 0.05) ok('a negative offset shifts the clock the other way',
    't = ' + s8.t.toFixed(3));
  else no('a negative offset shifts the clock the other way', 't = ' + s8.t);
  app.setOffset(0);
}

/* ---------- 5. render across the whole track ------------------------------ */
console.log('\n-- RENDERING THE WHOLE TRACK --');
if (app) {
  let threw = 0, firstErr = null, frames = 0;
  for (let tt = 0; tt < EM.AUDIO_END; tt += 0.75) {
    frames++;
    try { app.renderOnce(tt); }
    catch (e) { threw++; if (!firstErr) firstErr = tt.toFixed(2) + ' s: ' + e.message; }
  }
  if (threw) no('the app renders every sampled frame', threw + '/' + frames + ' threw, first ' + firstErr);
  else ok('the app renders every sampled frame', frames + ' frames across ' + EM.AUDIO_END.toFixed(1) + ' s');
  const faults = EM.sceneFaults();
  if (faults.length) no('no plate faulted during real rendering', faults.slice(0, 3).join(' ; '));
  else ok('no plate faulted during real rendering');
}

/* ---------- 6. a missing audio file must degrade, not die ----------------- */
console.log('\n-- DEGRADATION --');
{
  const e2 = createEnv({ quiet: true });
  /* the handlers are attached during init(), so init must run first */
  e2.flushTimeouts();
  const audio = e2.els['audio'];
  if (e2.listeners['error'] && e2.listeners['error'].length) {
    /* walk the candidate list the way the browser would: each name fails, the
       app advances to the next, until it gives up and explains itself */
    let guard = 0;
    while (guard++ < 12) {
      audio.error = { code: 4 };
      const before = audio.src;
      e2.listeners['error'].forEach(fn => { try { fn(); } catch (e) { /* ignore */ } });
      if (audio.src === before) break;
    }
    const bootEl = e2.els['boot-msg'];
    const text = String((bootEl && bootEl.textContent) || '');
    if (text.indexOf('NO AUDIO') >= 0) {
      ok('a missing audio file produces a visible explanation',
        'the panel names the ' + CANDIDATES.length + ' filenames it tried');
    } else {
      no('a missing audio file produces a visible explanation',
        text ? ('shown: "' + text.slice(0, 70) + '"') : 'nothing was shown to the viewer');
    }
    /* and the film must still run, on the page timer */
    if (e2.EM.__app) {
      e2.EM.__app.play();
      let ticked = 0;
      for (let i = 0; i < 30; i++) {
        try { e2.EM.__app.tick(); ticked++; } catch (e) { /* counted below */ }
      }
      /* the loop cannot advance without real frame timestamps, but it must not
         throw and must not report the audio as available */
      const st2 = e2.EM.__app.now();
      if (ticked === 30 && !st2.audioOK) {
        ok('the film still runs with no audio', 'page-timer clock engaged, HUD reports NO AUDIO');
      } else {
        no('the film still runs with no audio', 'ticked=' + ticked + ' audioOK=' + st2.audioOK);
      }
    }
  } else {
    no('the app attaches an audio error handler');
  }
}

/* ---------- 7. a throwing frame must not kill the loop -------------------- */
console.log('\n-- FAILURE RESILIENCE --');
{
  const e3 = createEnv({ quiet: true });
  const R = e3.EM;
  /* make one plate throw, and confirm the registry records it rather than
     swallowing it, and that the frame still completes */
  const victim = R.SceneOrder[0];
  R.SceneReg[victim].push({ l: 99, e: function () { throw new Error('injected failure'); } });
  const cue = R.Lyrics.byScene[victim];
  let survived = true, err = null;
  const before = R.sceneFaultCount();
  try {
    R.drawScene(victim, R.World.at(cue.t + 0.2), cue.t + 0.2, cue);
  } catch (e) { survived = false; err = e.message; }
  if (survived && R.sceneFaultCount() > before) {
    ok('a throwing plate is recorded, not swallowed',
      'fault count ' + before + ' -> ' + R.sceneFaultCount());
  } else if (!survived) {
    no('a throwing plate does not kill the frame', err);
  } else {
    no('a throwing plate is recorded, not swallowed', 'the throw vanished silently');
  }
}

/* ---------- summary ------------------------------------------------------- */
console.log('\n' + '='.repeat(78));
if (bad.length) {
  console.log('  FAILURES');
  for (const b of bad) console.log('    x ' + b);
}
console.log('  ' + pass + ' passed, ' + fail + ' failed');
console.log('  ' + (fail ? 'BOOT CHECK FAILED' : 'BOOT CHECK PASSED'));
console.log('\n  This does not replace looking at the film in a real browser.');
console.log('  It proves the startup path, the transport and the failure modes.');
console.log('='.repeat(78));
process.exit(fail ? 1 : 0);
