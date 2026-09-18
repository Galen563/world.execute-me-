/* ============================================================================
   hold-the-last-shot.js — delete the 03:27 plate and let the previous shot run
   to the end of the film.

   WHAT CHANGES
   ------------
   1  The `outro` plate is DELETED. The cue is kept as a held placeholder — it
      has no plate, and 20_lyrics.js gives its time to the cue before it, so the
      previous shot's duration now runs from 03:25.811 to 03:31.984 (6.17 s).

   2  `ex.final` is rewritten for that longer span. It is the centred EXECUTION,
      and an earlier version assumed 0.8 s: the fade-in reached full after 0.18 s
      and the fade-out began at 0.64 s. Over 6.17 s that would mean the word
      faded in and started leaving again while the shot was still meant to be
      holding. So the entrance is compressed into the first eighth of the span
      and the exit into the last sixth, and everything in between HOLDS.

   3  `end` is kept for the final frame. It sits on a timestamp where the audio
      stops, so it is reached once, at the very end.

   Run:  node _build/hold-the-last-shot.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

/* ---- delete the outro plate, whole --------------------------------------- */
let outroAt = lines.findIndex(l => l.indexOf("S('outro'") >= 0);
if (outroAt < 0) { console.error('outro plate not found'); process.exit(1); }
/* its header comment sits above it */
let outroHdr = outroAt;
for (let i = outroAt; i > outroAt - 30 && i >= 0; i--) {
  if (lines[i].replace(/\r$/, '').indexOf('/* ====') === 0 ||
      lines[i].replace(/\r$/, '').indexOf('  /* ====') === 0) { outroHdr = i; break; }
}
/* and it closes on its own `]);` */
let outroEnd = -1;
for (let i = outroAt + 1; i < lines.length; i++) {
  if (/^\s*\]\);/.test(lines[i])) { outroEnd = i; break; }
}
if (outroEnd < 0) { console.error('could not find the outro closer'); process.exit(1); }

/* ---- rewrite ex.final ---------------------------------------------------- */
const exAt = lines.findIndex(l => l.indexOf("S('ex.final'") >= 0);
if (exAt < 0) { console.error('ex.final not found'); process.exit(1); }

/* The plate may or may not still have a header comment: an earlier rewrite
   dropped it. So walk up over comment lines only, and stop at the first line
   that is not part of a comment block. Expecting a rule line was the bug that
   made this script refuse to run. */
let exHdr = exAt;
for (let i = exAt - 1; i >= 0 && i > exAt - 40; i--) {
  const s = lines[i].replace(/\r$/, '');
  const t = s.trim();
  const isComment = t.startsWith('/*') || t.startsWith('*') || t.endsWith('*/') ||
                    t.startsWith('//') || t === '';
  if (!isComment) break;
  exHdr = i;
}
/* trim leading blank lines so the new header sits tight against the plate */
while (exHdr < exAt && lines[exHdr].trim() === '') exHdr++;

let exEnd = -1;
for (let i = exAt + 1; i < lines.length; i++) {
  if (/^\s*\]\);/.test(lines[i])) { exEnd = i; break; }
}
if (exEnd < 0 || !(exHdr <= exAt && exAt < exEnd)) {
  console.error('ex.final landmarks are wrong: hdr=' + (exHdr + 1) +
    ' plate=' + (exAt + 1) + ' end=' + (exEnd + 1));
  process.exit(1);
}

const EX_HEADER = [
  '  /* ==========================================================================',
  '     03:25.811 - 03:31.984 — EXECUTION (the last one)                    6.17 s',
  '',
  '     THE LAST SHOT. It runs to the end of the film.',
  '',
  '     The cue is 0.81 s long, but the `outro` cue after it is a HELD',
  '     placeholder with no plate of its own, so 20_lyrics.js gives its time to',
  '     this one: the span is 03:25.811 to 03:31.984.',
  '',
  '     ON THE EXACT CENTRE OF THE FRAME. Eighteen executions were rammed,',
  '     stamped, rasterised and burned into this film; the nineteenth is written',
  '     quietly at the origin, level, with nothing beside it, and then it simply',
  '     stays there. That is what makes it read as the machine having stopped',
  '     decorating and executed once more, and then stopped.',
  '',
  '     The timing is built for the LONG span, not the short cue: the entrance is',
  '     compressed into the first eighth and the exit into the last sixth, and',
  '     everything between HOLDS. A plate written for 0.8 s would fade in, start',
  '     leaving, and sit half-faded for four seconds.',
  '     ======================================================================== */'
];

const EX_BODY = [
  "  S('ex.final', [",
  '    /* the crosshair that marks the centre of the picture. It draws itself in',
  '       over the first two seconds and then stays put. */',
  '    { l: 22, e: function (w, p) {',
  '      var a = vis(p, 0.10);',
  '      var q = E.outCubic(clamp(p / 0.14, 0, 1));',
  '      D.lw(1);',
  '      D.strokeColour(rgba(PAL().grid, 0.30 * a * q));',
  '      var arm = 250 * U * q;',
  '      D.line(-arm, 0, -54 * U, 0);',
  '      D.line(54 * U, 0, arm, 0);',
  '      D.line(0, -arm * 0.62, 0, -44 * U);',
  '      D.line(0, 44 * U, 0, arm * 0.62);',
  '      /* four corner ticks: the centre being measured, not merely occupied */',
  '      for (var sx = -1; sx <= 1; sx += 2) {',
  '        for (var sy = -1; sy <= 1; sy += 2) {',
  '          var cx0 = sx * 236 * U, cy0 = sy * 132 * U;',
  '          D.lw(1.4);',
  '          D.strokeColour(rgba(PAL().accent, 0.45 * a * q));',
  '          D.line(cx0, cy0, cx0 - sx * 30 * U, cy0);',
  '          D.line(cx0, cy0, cx0, cy0 - sy * 30 * U);',
  '        }',
  '      }',
  '    } },',
  '',
  '    /* THE WORD. In at the top of the shot, out at the very end, holding in',
  '       between. It is the only thing allowed inside the middle third. */',
  '    { l: 34, e: function (w, p) {',
  '      var a = vis(p, 0.10);',
  '      /* the entrance: settled by 8% of a 6.17 s shot */',
  '      var pop = E.pop(clamp(p / 0.06, 0, 1));',
  '      /* the exit: only in the last sixth, so it is still fully present while',
  '         the shot is holding, and it leaves rather than being cut */',
  '      var down = 1 - E.outCubic(clamp((p - 0.84) / 0.16, 0, 1)) * 0.55;',
  '      D.ctx().save();',
  '      D.ctx().globalAlpha = a * down;',
  '      D.ctx().scale(lerp(1.06, 1.0, pop), lerp(1.06, 1.0, pop));',
  '      D.font(70, \'700\');',
  '      D.ctx().textAlign = \'center\';',
  '      D.ctx().textBaseline = \'middle\';',
  '      var tw = D.measure(\'EXECUTION\', 70, \'700\');',
  '      D.fillColour(rgba(PAL().ink, 0.95));',
  '      D.text(\'EXECUTION\', 0, 0);',
  '      /* the rule through it breathes with the note, slowly, so the held shot',
  '         is alive rather than frozen */',
  '      var beat = EM.onsetPulse(w.time, 0.6);',
  '      D.lw(1 + beat * 0.8);',
  '      D.strokeColour(rgba(PAL().hot, (0.42 + beat * 0.35) * a * down));',
  '      D.line(-tw / 2 - 36 * U, 0, tw / 2 + 36 * U, 0);',
  '      D.ctx().restore();',
  '    } },',
  '',
  '    /* the read-outs stay at the frame edge: nothing is allowed inside the',
  '       middle third except the word */',
  '    { l: 52, e: function (w, p) {',
  '      var a = vis(p, 0.10);',
  '      M.register(\'call\', EM.WorldLayer.notesPlayed(w.time), -W * 0.46, -H * 0.42,',
  '        { a: a, width: 250, px: 12.5 });',
  '      M.register(\'of\', EM.ONSETS.length, -W * 0.46, -H * 0.42 + 20,',
  '        { a: a, width: 250, px: 12.5 });',
  '      M.register(\'identical to every other\', \'yes\', -W * 0.46, H * 0.40,',
  '        { a: a, width: 320, px: 12.5, colour: rgba(PAL().grid, 0.85) });',
  '      M.banner(\'NOTHING HAS CHANGED\', 0, H * 0.30,',
  '        { px: 13, a: a * 0.45, track: 4 });',
  '',
  '      /* the closing wash: over the last two seconds the frame settles toward',
  '         warm paper, so the film ends by cooling rather than by stopping */',
  '      var wash = clamp((p - 0.66) / 0.34, 0, 1);',
  '      if (wash > 0.01) {',
  '        D.ctx().save();',
  '        D.ctx().globalAlpha = wash * 0.13;',
  '        D.fillColour(rgba(EM.mix(PAL().paper, PAL().accent, 0.22), 1));',
  '        D.frect(-W / 2, -H / 2, W, H);',
  '        D.ctx().restore();',
  '      }',
  '    } }',
  '  ]);'
];

/* ---- assemble: everything before ex.final, the new ex.final, then `end` --- */
const out = lines.slice(0, exHdr)
  .concat(EX_HEADER)
  .concat(EX_BODY)
  .concat(lines.slice(outroEnd + 1));      /* drops the whole outro block */

const src = out.join('\n');
if (src.indexOf("S('outro'") >= 0) {
  console.error('refusing to write: an outro reference survived');
  process.exit(1);
}
try { new (require('vm').Script)(src, { filename: FILE }); }
catch (e) {
  fs.writeFileSync(path.join(__dirname, '..', 'frames-out', 'hold-candidate.js'), src, 'utf8');
  console.error('refusing to write: candidate does not parse — ' + e.message);
  process.exit(1);
}

fs.writeFileSync(FILE, src, 'utf8');
console.log('deleted the outro plate (lines ' + (outroHdr + 1) + '-' + (outroEnd + 1) + ')');
console.log('rewrote ex.final for a 6.17 s span');
