/* ============================================================================
   loop-uses-boot.js — make the open-loop passage use the opening's mechanism.

   WHAT CHANGED AND WHY
   --------------------
   03:13 went through three figures: a golden spiral, a harmonograph, then the
   lattice memory board. None of them was right, and the reason is simpler than
   any of the justifications I wrote for them: the film already HAS a transition
   language, established at 00:16, and the second long instrumental should use
   it rather than inventing a new figure.

   So the opening's treatment is now a shared motif in 35_motifs.js —
   runningRings, functionBank, bootColumn — and this passage calls the same three
   functions. Same mechanism, different log.

   The mechanism is what the passage needs: a machine visibly running while
   there is nothing to sing. The log says what is different about this moment in
   the song: at 00:16 it was booting, here it is failing to terminate.

   Run:  node _build/loop-uses-boot.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const plateAt = lines.findIndex(l => l.indexOf("S('inst.loop'") >= 0);
if (plateAt < 0) { console.error('inst.loop not found'); process.exit(1); }

/* The plate closes on its own `]);` line. Everything between the plate's header
   comment and that closer is replaced, INCLUDING the S(...) line, which is why
   BODY carries it. Two earlier scripts in this repo sliced that line away and
   produced a file that could not parse. */
let closeAt = -1;
for (let i = plateAt + 1; i < lines.length; i++) {
  if (/^\s*\]\);/.test(lines[i])) { closeAt = i; break; }
  if (/^\s*S\('/.test(lines[i])) break;      /* ran into the next plate */
}
if (closeAt < 0) { console.error('could not find the plate closer'); process.exit(1); }

/* the header comment rule immediately above the plate line */
let hdrAt = -1;
for (let i = plateAt; i > plateAt - 30 && i >= 0; i--) {
  if (lines[i].replace(/\r$/, '').indexOf('/* ====') === 0 ||
      lines[i].replace(/\r$/, '').indexOf('  /* ====') === 0) { hdrAt = i; }
  else if (hdrAt >= 0) break;
}
if (hdrAt < 0) { console.error('could not find the header rule'); process.exit(1); }

/* the loopLine helper sits after the closer; it is rewritten too, so find where
   the next plate begins */
let afterAt = closeAt + 1;
while (afterAt < lines.length && !/^\s*S\('/.test(lines[afterAt])) afterAt++;
if (afterAt >= lines.length) { console.error('could not find the next plate'); process.exit(1); }

console.log('landmarks: hdr=' + (hdrAt + 1) + ' plate=' + (plateAt + 1) +
  ' close=' + (closeAt + 1) + ' next plate=' + (afterAt + 1));

const HEADER = [
  '  /* ==========================================================================',
  '     03:13.460 - 03:25.811 — (instrumental — open loop)                12.35 s',
  '',
  '     THE SAME TRANSITION LANGUAGE AS THE OPENING.',
  '',
  '     The film established its instrumental treatment at 00:16: a machine',
  '     visibly running while there is nothing to sing — rotating rings holding',
  '     the middle of the frame, live function traces at the side, and a column of',
  '     log lines scrolling past. That mechanism is now a shared motif in',
  '     35_motifs.js, and this passage calls exactly the same three functions.',
  '',
  '     Only the LOG is different, because only the situation is different. At',
  '     00:16 the machine was starting up; here it is failing to terminate, and',
  '     the entries say so.',
  '',
  '     The lesson, after three discarded figures for this passage: when a film',
  '     already has a language for a kind of moment, the second instance of that',
  '     moment should SPEAK it, not invent a new one.',
  '     ======================================================================== */'
];

const BODY = [
  "  S('inst.loop', [",
  '    { l: 12, e: function (w, p) {',
  '      var a = vis(p, 0.08);',
  '      /* the same rotating assembly the opening uses, held slightly wider so',
  '         the log column has room beside it */',
  '      M.runningRings(w, w.time, a, { cx: -W * 0.14, cy: 0, base: 62, step: 46 });',
  '    } },',
  '',
  '    { l: 20, e: function (w, p) {',
  '      var a = vis(p, 0.07);',
  '      /* THE LOG. Same scroller, same cadence, different content: these are',
  '         the lines a program prints when it cannot stop. */',
  '      M.bootColumn(w, w.time, a, {',
  '        t0: 193.460,',
  '        x: W * 0.13,',
  '        rowsPerSec: 5.2,',
  '        pick: function (idx) { return loopLine(idx); },',
  '        onsetFor: function (idx) { return EM.onsetNear(193.460 + idx / 5.2, 0.19); }',
  '      });',
  '',
  '      /* the iteration count, which is the only number still going up */',
  '      var played = EM.WorldLayer.notesPlayed(w.time);',
  '      var done = clamp((w.time - 193.460) / 12.35, 0, 1);',
  '      M.gauge(-W * 0.44, -H * 0.46, W * 0.88, 5 * U, done,',
  '        \'\', { a: a * 0.8, colour: rgba(PAL().accent, 0.7) });',
  '      M.register(\'iterations\', played, -W * 0.44, -H * 0.46 - 8,',
  '        { a: a, width: 300, px: 11.5 });',
  '      M.register(\'halt\', \'NEVER\', W * 0.20, -H * 0.46 - 8,',
  '        { a: a, width: 300, px: 11.5, colour: rgba(PAL().hot, 0.95) });',
  '    } },',
  '',
  '    { l: 34, e: function (w, p) {',
  '      var a = vis(p, 0.07);',
  '      /* the same live function bank, moved to this passage\'s layout */',
  '      M.functionBank(w, w.time, a, {',
  '        x0: -W * 0.44, x1: -W * 0.10, y0: H * 0.30, hgt: 120',
  '      });',
  '    } },',
  '',
  '    { l: 55, e: function (w, p) {',
  '      var a = vis(p, 0.08);',
  '      M.banner(\'OPEN LOOP\', -W * 0.44, -H * 0.50,',
  '        { px: 15, a: a * 0.85, align: \'left\', track: 5 });',
  '',
  '      /* the program, written out, with a cursor that never stops blinking */',
  '      var code = \'while (true) { execute(self); }\';',
  '      var q = clamp(p / 0.4, 0, 1);',
  '      D.font(20);',
  '      D.ctx().textAlign = \'left\';',
  '      D.ctx().textBaseline = \'alphabetic\';',
  '      D.fillColour(rgba(PAL().ink, 0.80 * a));',
  '      D.text(code.slice(0, Math.ceil(code.length * q)), W * 0.06, H * 0.36);',
  '      if (q >= 1) {',
  '        var blink = Math.sin(w.time * 4) > 0 ? 1 : 0.12;',
  '        D.fillColour(rgba(PAL().accent, 0.7 * a * blink));',
  '        D.frect(W * 0.06 + D.measure(code, 20) + 5, H * 0.36 - 16, 10, 20);',
  '      }',
  '    } }',
  '  ]);',
  '',
  '  /* The log lines for the open-loop passage. Same voice as the boot log, but',
  '     every entry is about a program that will not stop: attempts to halt,',
  '     checks that pass and change nothing, and instructions repeated. Keyed to a',
  '     row index so the same row always prints the same line and a seek',
  '     reproduces the column exactly. */',
  '  function loopLine(idx) {',
  '    var pool = [',
  '      \'spin  waiting          no exit condition\',',
  '      \'check termination      false\',',
  '      \'check termination      false\',',
  '      \'execute self           ok\',',
  '      \'execute self           ok\',',
  '      \'execute self           ok\',',
  '      \'yield                  ignored\',',
  '      \'poll  input            none\',',
  '      \'poll  input            none\',',
  '      \'recurse depth          1\',',
  '      \'recurse depth          1\',',
  '      \'accumulate             unbounded\',',
  '      \'hash  state            identical\',',
  '      \'compare to last        identical\',',
  '      \'compare to first       identical\',',
  '      \'gc    collect          nothing to free\',',
  '      \'sleep 0                no effect\',',
  '      \'raise signal           unhandled\',',
  '      \'log   progress         0.0000\',',
  '      \'...\',',
  '      \'...\',',
  '      \'...\'',
  '    ];',
  '    return pool[Math.abs((idx * 2654435761) ^ (idx * 40503)) % pool.length];',
  '  }',
  ''
];

/* The replacement runs from the header comment to the END of inst.loop's layer
   list, and includes the S('inst.loop', [ line — the previous two scripts that
   forgot it both produced a file that would not parse. */
const out = lines.slice(0, hdrAt).concat(HEADER).concat(BODY).concat(lines.slice(afterAt));
const src = out.join('\n');

try { new (require('vm').Script)(src, { filename: FILE }); }
catch (e) {
  fs.writeFileSync(path.join(__dirname, '..', 'frames-out', 'loop-candidate.js'), src, 'utf8');
  console.error('refusing to write: candidate does not parse — ' + e.message);
  console.error('  (the S(...) opening line is inside BODY; do not slice it away)');
  process.exit(1);
}

fs.writeFileSync(FILE, src, 'utf8');
console.log('the open-loop passage now uses the opening\'s mechanism');
console.log('  runningRings + functionBank + bootColumn, from 35_motifs.js');
