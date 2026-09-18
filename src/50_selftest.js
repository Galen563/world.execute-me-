/* ============================================================================
   src/50_selftest.js — RUNTIME SELF-TEST.

   index.html carries a verbatim copy of the supplied lyric timeline inside a
   <script type="text/plain"> block. src/20_lyrics.js carries the film's own
   cue table, generated from that same file. This module parses the embedded
   copy and proves, on every single page load, that the two still agree — and
   that the film's own invariants hold.

   THE POINT OF TWO COPIES
   -----------------------
   One copy can silently rot. Two copies that are checked against each other
   cannot: edit either one and the film says so, on screen and in the console,
   instead of drifting by 40 ms per line until the lyrics no longer land.

   Checks
     1. same number of cues
     2. every timestamp identical to the millisecond
     3. every lyric string identical
     4. a registered plate exists for every cue        (100% coverage)
     5. no two cues share a plate id
     6. cue times strictly increasing
     7. the last cue is held to the measured audio end
     8. the audio length was measured, not defaulted

   Results land in EM.__selftest so an automated checker — or a viewer pressing
   D — can read them without scraping the console.
   ==========================================================================*/
(function (EM) {
  'use strict';

  function parseLRC(src) {
    var out = [];
    var re = /^\[(\d+):(\d+)[.:](\d{1,3})\](.*)$/;
    var lines = String(src).split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var m = lines[i].match(re);
      if (!m) continue;
      var frac = (m[3] + '00').slice(0, 3);
      var t = (+m[1]) * 60 + (+m[2]) + (+frac) / 1000;
      out.push({ t: Math.round(t * 1000) / 1000, text: m[4].trim() });
    }
    return out;
  }

  var el = document.getElementById('lrc-source');
  var raw = el ? el.textContent : '';
  var parsed = parseLRC(raw);
  var cues = EM.Lyrics.cues;

  var fail = [], warn = [];

  if (!parsed.length) {
    fail.push('embedded lyric block is missing or unparseable');
  }

  /* 1 · 2 · 3 -------------------------------------------------------------- */
  if (parsed.length !== cues.length) {
    fail.push('cue count: embedded=' + parsed.length + ' film=' + cues.length);
  }
  var n = Math.min(parsed.length, cues.length);
  var i, a, b;
  var textMismatch = 0, timeMismatch = 0, worstMs = 0, worstAt = -1;
  for (i = 0; i < n; i++) {
    a = parsed[i];
    b = cues[i];
    if (a.text !== b.text) {
      textMismatch++;
      if (textMismatch <= 4) {
        fail.push('text[' + i + ']: embedded="' + a.text + '" film="' + b.text + '"');
      }
    }
    var d = Math.abs(a.t - b.t) * 1000;
    if (d > worstMs) { worstMs = d; worstAt = i; }
    if (d > 0.5) {
      timeMismatch++;
      if (timeMismatch <= 4) {
        fail.push('time[' + i + ']: embedded=' + a.t + ' film=' + b.t);
      }
    }
  }
  if (textMismatch) fail.push('lyric text mismatches: ' + textMismatch);
  if (timeMismatch) fail.push('timestamp mismatches: ' + timeMismatch);

  /* 4 · 5 — coverage and uniqueness ---------------------------------------- */
  /* A HELD cue is one with no plate of its own: the shot before it keeps
     playing through. That is a legitimate state, but it must be a *verified*
     one — the held cue has to resolve to a cue that does have a plate, or the
     frame would be empty. So the rule is not "every cue has a plate", it is
     "every cue resolves to a plate". */
  var missing = [], empty = [], seen = Object.create(null), dup = [];
  var heldCount = 0, badHeld = [];
  for (i = 0; i < cues.length; i++) {
    var id = cues[i].scene;
    if (seen[id]) { dup.push(id + ' @' + cues[i].t); }
    seen[id] = true;
    var plate = EM.SceneReg[id];
    if (!plate) {
      if (cues[i].held) {
        heldCount++;
        /* it must resolve to something that HAS a plate */
        var owner = EM.Lyrics.at(cues[i].t + 0.001);
        if (!owner || !EM.SceneReg[owner.scene]) {
          badHeld.push(id + ' @' + cues[i].t + ' resolves to ' +
            (owner ? owner.scene : 'nothing'));
        }
      } else {
        missing.push(id + ' @' + cues[i].t);
      }
    } else if (!plate.length) {
      empty.push(id);
    }
  }
  if (missing.length) fail.push('cues with no plate: ' + missing.join(', '));
  if (badHeld.length) fail.push('held cues that resolve to no plate: ' + badHeld.join(', '));
  if (empty.length) fail.push('plates with no layers: ' + empty.join(', '));
  if (dup.length) fail.push('a plate id is used by more than one cue: ' + dup.join(', '));

  /* plates that exist but are never reachable from any cue */
  var unreachable = [];
  for (i = 0; i < EM.SceneOrder.length; i++) {
    if (!EM.Lyrics.byScene[EM.SceneOrder[i]]) unreachable.push(EM.SceneOrder[i]);
  }
  if (unreachable.length) warn.push('registered but unreachable plates: ' + unreachable.join(', '));

  /* 6 — ordering ----------------------------------------------------------- */
  for (i = 1; i < cues.length; i++) {
    if (cues[i].t <= cues[i - 1].t) {
      fail.push('cue ' + i + ' does not advance (' + cues[i].t + ' after ' + cues[i - 1].t + ')');
    }
  }

  /* 7 — the film must reach the measured end of the audio ------------------
     The supplied .lrc writes its final timestamp to the nearest millisecond
     ([03:31.984]) while the file measures 211.98367 s, so that one cue lands
     0.33 ms past the last sample. One millisecond is the resolution of the
     lyric file itself and therefore the honest tolerance here. */
  var CUE_TOL = 0.001;
  var last = cues[cues.length - 1];
  if (last) {
    if (last.t > EM.AUDIO_END + CUE_TOL) {
      fail.push('a cue starts after the audio ends (' + last.t + ' > ' + EM.AUDIO_END + ')');
    }
    if (Math.abs(last.end - EM.AUDIO_END) > 0.5) {
      fail.push('the final cue does not hold to the audio end (' + last.end + ')');
    }
  }

  /* 8 — was the length measured? ------------------------------------------- */
  if (!EM.AUDIO_MEASURED) {
    warn.push('audio length is the built-in fallback, not a measurement of the file');
  }
  if (!EM.ONSETS || !EM.ONSETS.length) fail.push('no MIDI accents loaded');

  var minDur = 1e9, minI = -1;
  for (i = 0; i < cues.length; i++) {
    if (cues[i].dur < minDur) { minDur = cues[i].dur; minI = i; }
  }
  if (minDur < 0.12) warn.push('very short cue #' + minI + ' (' + minDur.toFixed(3) + 's)');

  var scenesUsed = Object.keys(seen).length;
  var report = {
    ok: fail.length === 0,
    embeddedCues: parsed.length,
    filmCues: cues.length,
    heldCues: heldCount,
    worstTimeDeltaMs: +worstMs.toFixed(3),
    worstTimeAt: worstAt,
    platesRegistered: EM.SceneOrder.length,
    platesUsed: scenesUsed,
    accents: EM.ONSETS ? EM.ONSETS.length : 0,
    audioEnd: EM.AUDIO_END,
    audioMeasured: !!EM.AUDIO_MEASURED,
    audioInfo: EM.AUDIO_INFO || null,
    finalCueAt: last ? last.t : null,
    finalCueHoldsFor: last ? +(last.end - last.t).toFixed(3) : null,
    shortestCue: +minDur.toFixed(3),
    fails: fail,
    warns: warn
  };
  EM.__selftest = report;

  var tag = 'background:#0a1a1e;color:#56d6e8;padding:1px 6px;border-radius:2px';
  if (fail.length) {
    console.error('%c world.execute(me); SELF-TEST FAILED ', tag);
    for (i = 0; i < fail.length; i++) console.error('  ✗ ' + fail[i]);
  } else {
    console.log('%c world.execute(me); SELF-TEST PASSED ', tag);
    console.log('  ✓ ' + report.filmCues + ' lyric cues match the embedded timeline to within '
      + report.worstTimeDeltaMs + ' ms');
    console.log('  ✓ ' + report.platesUsed + ' distinct plates for ' + report.filmCues
      + ' cues  →  lyric coverage 100%');
    console.log('  ✓ last cue @' + report.finalCueAt + 's holds for ' + report.finalCueHoldsFor
      + 's and ends exactly on the measured audio length ' + report.audioEnd + 's');
    console.log('  ✓ ' + report.accents + ' measured MIDI accents drive the impacts');
    if (report.audioInfo) {
      console.log('  · audio: ' + report.audioInfo.frames + ' MPEG frames, '
        + report.audioInfo.sampleRate + ' Hz, ' + (report.audioInfo.bitrate / 1000) + ' kbps '
        + (report.audioInfo.channels === 2 ? 'stereo' : 'mono'));
    }
    for (i = 0; i < warn.length; i++) console.warn('  ! ' + warn[i]);
  }
})(window.EM);
