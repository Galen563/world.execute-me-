/* ============================================================================
   swap-loop-figure.js — replace the golden spiral with a harmonograph.

   WHY
   ---
   The golden spiral was geometrically correct and pictorially wrong: a single
   heavy stroke parked in the centre of the frame for twelve seconds, dense and
   static at the same time. A harmonograph — two oscillators on orthogonal axes
   in the irrational ratio PHI, with slight damping — traces many fine lines
   that never close and never repeat, which is what a loop actually looks like
   when it is drawn, and it reads as air rather than as ink.

   HOW IT EDITS, AND WHY IT TOOK FOUR TRIES
   ----------------------------------------
   · v1 matched the block by comment text. Failed: three-minute-old comments
     have spacing nobody remembers.
   · v2 edited by line number but searched for the header AFTER the plate line,
     when it is before.
   · v3 swept leftover "spiral" text with a regex filter — and deleted CODE,
     because a variable named `spiral` existed in the block it was rewriting.
   · v4 (this one) replaces ONE contiguous line range, found from two plate
     landmarks, with content held in a variable. It filters nothing, so it
     cannot delete anything it was not aimed at, and it proves the result parses
     before writing.

   The pattern is the one this project keeps relearning: narrow the edit, then
   check the OUTCOME rather than trusting the guard.

   Run:  node _build/swap-loop-figure.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const plateAt = lines.findIndex(l => l.indexOf("S('inst.loop'") >= 0);
if (plateAt < 0) { console.error('inst.loop not found'); process.exit(1); }
const nextAt = lines.findIndex((l, i) => i > plateAt && /^\s*S\('/.test(l));
const layer38 = lines.findIndex((l, i) =>
  i > plateAt && i < nextAt && /^\s*\{\s*l:\s*38\s*,/.test(l));
const layer20 = lines.findIndex((l, i) =>
  i > plateAt && i < layer38 && /^\s*\{\s*l:\s*20\s*,/.test(l));
const hdrStart = lines.findIndex((l, i) =>
  i < plateAt && i > plateAt - 24 && /THE SPIRAL IS THE FIX/.test(l));

if (plateAt < 0 || nextAt < 0 || layer38 < 0 || layer20 < 0 || hdrStart < 0) {
  console.error('landmarks: plate=' + plateAt + ' next=' + nextAt +
    ' layer38=' + layer38 + ' layer20=' + layer20 + ' hdr=' + hdrStart);
  process.exit(1);
}

/* sanity: the ranges must be ordered and the spiral must actually be there */
if (!(hdrStart < plateAt && plateAt < layer20 && layer20 < layer38 && layer38 < nextAt)) {
  console.error('landmarks are out of order; refusing to touch the file');
  process.exit(1);
}
if (!/spiral/i.test(lines.slice(layer20, layer38).join('\n'))) {
  console.error('the layer-20 block does not look like the spiral; refusing');
  process.exit(1);
}

const HEADER = [
  '     THE HARMONOGRAPH IS THE FIX. Two pendulums on orthogonal axes, in a',
  '     frequency ratio of PHI, trace a figure that never closes and never',
  '     repeats — which is what a loop actually looks like when it is drawn, and,',
  '     unlike a spiral, it is made of many fine lines rather than one heavy one,',
  '     so the passage reads as air instead of as ink. Driven by elapsed film',
  '     time, so it is still drawing on the final frame.',
  '     ======================================================================== */',
  "  S('inst.loop', ["
];

const LAYER = [
  '    { l: 20, e: function (w, p) {',
  '      var a = vis(p, 0.10);',
  '      var PHI = (1 + Math.sqrt(5)) / 2;',
  '',
  '      /* TWO PENDULUMS, ONE PEN.',
  '',
  '         This replaced a golden spiral, which was geometrically right — a curve',
  '         that grows and never closes — but pictorially wrong: one heavy stroke',
  '         parked in the middle of the frame for twelve seconds, dense and static',
  '         at the same time.',
  '',
  '         A harmonograph is what the passage wants. Two oscillators on orthogonal',
  '         axes whose frequencies are in the ratio PHI; because PHI is irrational',
  '         the figure NEVER closes, so it keeps re-drawing itself slightly',
  '         differently forever. That is the visual definition of',
  '         `while (true) { execute(self); }`, and unlike a spiral it is many fine',
  '         lines rather than one thick one, so the frame reads as air. The damping',
  '         term pulls it inward so it stays on the page.',
  '',
  '         Driven by elapsed FILM time, so it is still drawing on the last frame. */',
  '      var elapsed = w.time - 193.460;',
  '      var decay = Math.exp(-clamp(elapsed, 0, 60) * 0.055);',
  '      var ax = W * 0.30 * decay;',
  '      var ay = H * 0.30 * decay;',
  '      var c = D.ctx();',
  '',
  '      /* how much of the figure has been traced: it unrolls across the cue */',
  '      var frac = clamp(elapsed / 11.0, 0.12, 1);',
  '      var N = 900;',
  '',
  '      D.ctx().save();',
  '      D.ctx().globalAlpha = clamp(a, 0, 1);',
  '',
  '      /* the primary trace */',
  '      D.lw(1.0);',
  '      D.strokeColour(rgba(EM.mix(PAL().accent, PAL().paper, 0.25), 0.55));',
  '      c.beginPath();',
  '      for (var i = 0; i <= N * frac; i++) {',
  '        var u = (i / N) * 12.6;',
  '        var x = Math.sin(u) * ax + Math.sin(u * PHI * 0.5 + 1.1) * ax * 0.42;',
  '        var y = Math.sin(u * PHI * 0.5) * ay + Math.sin(u + 0.4) * ay * 0.48;',
  '        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);',
  '      }',
  '      c.stroke();',
  '',
  '      /* the counter-trace: the pen going back over its own work, at a',
  '         different rate so the two never coincide */',
  '      D.lw(0.9);',
  '      D.strokeColour(rgba(EM.mix(PAL().accent, PAL().love, 0.5), 0.26));',
  '      c.beginPath();',
  '      for (i = 0; i <= N * frac; i++) {',
  '        var u2 = (i / N) * 12.6;',
  '        var x2 = Math.sin(u2 + 0.9) * ax * 0.80 + Math.sin(u2 * PHI * 0.5 + 2.2) * ax * 0.30;',
  '        var y2 = Math.sin(u2 * PHI * 0.5 + 1.7) * ay * 0.80 + Math.sin(u2 + 2.6) * ay * 0.34;',
  '        if (i === 0) c.moveTo(x2, y2); else c.lineTo(x2, y2);',
  '      }',
  '      c.stroke();',
  '',
  '      /* the pen head: where the trace currently is, moving continuously */',
  '      var uH = 12.6 * frac;',
  '      var hx = Math.sin(uH) * ax + Math.sin(uH * PHI * 0.5 + 1.1) * ax * 0.42;',
  '      var hy = Math.sin(uH * PHI * 0.5) * ay + Math.sin(uH + 0.4) * ay * 0.48;',
  '      D.lw(1.6);',
  '      D.strokeColour(rgba(PAL().hot, 0.80));',
  '      D.scircle(hx, hy, 7 * U);',
  '      D.fillColour(rgba(PAL().hot, 0.95));',
  '      D.fcircle(hx, hy, 2.6 * U);',
  '',
  '      /* the two pendulums, at the margins, visibly swinging */',
  '      for (var s = 0; s < 2; s++) {',
  '        var ppx = s === 0 ? -W * 0.44 : W * 0.44;',
  '        var ppy = -H * 0.30;',
  '        var piv = s === 0 ? uH : uH * PHI * 0.5;',
  '        var amp = (s === 0 ? 40 : 26) * U;',
  '        D.lw(1);',
  '        D.strokeColour(rgba(PAL().grid, 0.40));',
  '        D.line(ppx, ppy, ppx + Math.sin(piv) * amp, ppy + 76 * U);',
  '        D.fillColour(rgba(PAL().accent, 0.70));',
  '        D.fcircle(ppx + Math.sin(piv) * amp, ppy + 76 * U, 4 * U);',
  '        M.sub(s === 0 ? \'pendulum x\' : \'pendulum y\', ppx, ppy - 12,',
  '          { px: 10.5, a: a * 0.70 });',
  '      }',
  '      D.ctx().restore();',
  '',
  '      /* the ratio, and the fact that it never closes */',
  '      M.register(\'ratio\', \'1 : \' + PHI.toFixed(6), -W * 0.44, -H * 0.42,',
  '        { a: a, width: 300, px: 12, colour: rgba(PAL().paper, 0.95) });',
  '      M.register(\'periods\', (frac * 2).toFixed(3), -W * 0.44, -H * 0.42 + 20,',
  '        { a: a, width: 300, px: 12 });',
  '      M.register(\'closure\', \'NEVER   irrational\', -W * 0.44, -H * 0.42 + 40,',
  '        { a: a, width: 340, px: 12, colour: rgba(PAL().hot, 0.90) });',
  '      M.register(\'amplitude\', (decay * 100).toFixed(1), -W * 0.44, -H * 0.42 + 60,',
  '        { a: a, width: 300, px: 12, unit: \'%\' });',
  '    } },'   /* closes the effect function, then the layer object literal */
];

/* ONE contiguous replacement: [hdrStart, layer38).
   No extra slice of the old lines is carried over — the header comment runs
   right up to the plate line, so HEADER + LAYER replaces the whole span. */
const out = lines.slice(0, hdrStart)
  .concat(HEADER)
  .concat(LAYER)
  .concat(lines.slice(layer38));

const src = out.join('\n');

/* outcome check, not a guard: does the result parse? On failure, write the
   candidate to a scratch file PARSED BY NODE ITSELF, which reports the exact
   line — a vm.Script stack was reporting a line number that did not correspond
   to the text being looked at, which cost several rounds. */
const CANDIDATE = path.join(__dirname, '..', 'frames-out', 'swap-candidate.js');
fs.mkdirSync(path.dirname(CANDIDATE), { recursive: true });
fs.writeFileSync(CANDIDATE, src, 'utf8');

/* The parse check runs IN-PROCESS. A nested spawnSync with piped stdio returns
   status null under this sandbox (EPERM on the pipe), which reads as "does not
   parse" while the file is fine — the second time this project has been caught
   by that boundary. vm.Script needs no pipe.

   The candidate is also left on disk on failure so node --check can be run
   against it directly, which reports the line number reliably. */
try {
  new (require('vm').Script)(src, { filename: CANDIDATE });
} catch (e) {
  fs.writeFileSync(CANDIDATE, src, 'utf8');
  console.error('refusing to write: candidate does not parse — ' + e.message);
  console.error('run:  node --check ' + CANDIDATE);
  process.exit(1);
}

fs.writeFileSync(FILE, src, 'utf8');
console.log('replaced lines ' + (hdrStart + 1) + '-' + layer38 +
  ' with a harmonograph (' + (HEADER.length + LAYER.length) + ' lines)');
