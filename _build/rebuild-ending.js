/* ============================================================================
   rebuild-ending.js — replace everything from 03:13 to the end.

   WHAT IT WRITES, AND WHY

   The song's ending is: the machine did not get an answer, and it will loop
   forever without one. So the closing does two things and nothing else.

     1  inst.loop  — 12.4 s. THE MEMORY. Every note the film was cut to, laid
        out as one column, lit in the order it was played. This is the film's
        own central object (the lattice that accumulated a burn per note during
        the whole piece) shown once, whole, and calm — dense in information and
        quiet in tone, which is the combination the passage needs after the
        storm.

     2  ex.final  — the last EXECUTION, on the exact centre of the frame, and
        simultaneously the last cell being appended to that column. It is the
        one execution in the film that is not a threat.

     3  outro  — THE REVERSE. The lattice is replayed BACKWARD, cell by cell,
        from the last note to the first, while a rail at the bottom unrolls the
        song's three temperaments as three bands. A loop is what you get when
        you finish something without resolving it, and that is what the picture
        does: it walks back to the start.

     4  end  — one hand-drawn line over the completed rail, warm, and the title.

   The earlier version of this stretch ran an inventory of six elements with
   their read-outs. It measured well and read as clutter: the film's last
   impression was a table. This one has a single subject and a single motion.

   HOW IT WRITES
   -------------
   By line range, one contiguous span, with the new content held in an array. It
   proves the result parses before writing, and it leaves no filtering or
   text-matching anywhere — three earlier scripts in this repo failed on exactly
   that.

   Run:  node _build/rebuild-ending.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const startAt = lines.findIndex(l => l.indexOf("S('inst.loop'") >= 0);
if (startAt < 0) { console.error('inst.loop not found'); process.exit(1); }

/* everything from the inst.loop header comment down is replaced */
let headAt = startAt;
while (headAt > 0 && !/^\s*\/\* =+$/.test(lines[headAt - 1])) headAt--;
/* step back over the opening comment rule */
let from = headAt;
for (let i = startAt; i >= 0 && i > startAt - 8; i--) {
  if (/^\s*\/\* =+$/.test(lines[i])) { from = i; break; }
}

/* and the file ends with the IIFE close, which must be preserved */
let tailAt = lines.length;
for (let i = lines.length - 1; i >= 0; i--) {
  if (/\}\)\(window\.EM\);/.test(lines[i])) { tailAt = i; break; }
}
if (tailAt >= lines.length) { console.error('could not find the IIFE close'); process.exit(1); }

const NEW = [
  '  /* ==========================================================================',
  '     03:13.460 - 03:25.811 — (instrumental — open loop)                12.35 s',
  '',
  '     THE MEMORY.',
  '',
  '     The film\'s central object has been a 32 x 18 lattice, and every note in',
  '     the song has lit one of its cells and left a burn. For three minutes that',
  '     accumulation was something the viewer saw underneath everything else.',
  '     Here it is shown once, whole, and in order: all 615 notes as one column,',
  '     each cell lighting as its note is passed.',
  '',
  '     This replaces a harmonograph. The harmonograph was pretty and meant',
  '     nothing; the column is the film\'s own memory, and the passage before the',
  '     ending is the right place to finally look at it.',
  '',
  '     Dense in information, quiet in tone: after the execution storm this needs',
  '     to be legible rather than loud, and it needs to be one subject rather than',
  '     several.',
  '     ======================================================================== */',
  "  S('inst.loop', [",
  '    { l: 18, e: function (w, p) {',
  '      var a = vis(p, 0.10);',
  '      var total = EM.ONSETS.length;',
  '      var played = EM.WorldLayer.notesPlayed(w.time);',
  '',
  '      /* THE COLUMN. One row per note, ordered by time, so reading it top to',
  '         bottom is reading the song. The head travels down it as the film',
  '         plays, so by the end of the passage the whole column is lit. */',
  '      var x = -W * 0.10;',
  '      var yTop = -H * 0.42;',
  '      var span = H * 0.84;',
  '      var rowH = span / total;',
  '',
  '      /* the rail the column is written on */',
  '      D.lw(1);',
  '      D.strokeColour(rgba(PAL().grid, 0.30 * a));',
  '      D.line(x - 62, yTop, x - 62, yTop + span);',
  '      D.line(x + 62, yTop, x + 62, yTop + span);',
  '',
  '      for (var i = 0; i < total; i++) {',
  '        var on = i < played;',
  '        if (!on && i > played + 40) break;',
  '        var yy = yTop + i * rowH;',
  '        var o = EM.ONSETS[i];',
  '        /* the length carries the pitch; the brightness carries whether it',
  '           has been played yet */',
  '        var len = 18 + ((o[2] - 52) / 22) * 40;',
  '        var age = w.time - o[0] / 1000;',
  '        var burn = on ? Math.pow(1 - clamp(age / 200, 0, 1), 0.4) : 0;',
  '        var al = on ? (0.20 + burn * 0.55) : 0.07;',
  '        D.lw(on ? 1.3 : 1.0);',
  '        D.strokeColour(rgba(on ? (o[3] > 1 ? PAL().hot : PAL().accent) : PAL().grid, al * a));',
  '        D.line(x - len / 2, yy, x + len / 2, yy);',
  '        if (o[3] > 1 && on) {',
  '          D.fillColour(rgba(PAL().hot, 0.7 * a));',
  '          D.fcircle(x + len / 2 + 4, yy, 1.8 * U);',
  '        }',
  '      }',
  '',
  '      /* the head: the note being reached right now */',
  '      if (played > 0 && played <= total) {',
  '        var hy = yTop + (played - 1) * rowH;',
  '        D.lw(1.6);',
  '        D.strokeColour(rgba(PAL().hot, 0.85 * a));',
  '        D.line(x - 78, hy, x + 78, hy);',
  '        D.fillColour(rgba(PAL().hot, 0.9 * a));',
  '        D.fcircle(x - 78, hy, 3 * U);',
  '        D.fcircle(x + 78, hy, 3 * U);',
  '      }',
  '',
  '      /* the column\'s own scale, so its length is a measurement */',
  '      D.font(11);',
  '      D.ctx().textAlign = \'right\';',
  '      D.ctx().textBaseline = \'alphabetic\';',
  '      for (var k = 0; k <= 8; k++) {',
  '        var ty = yTop + (k / 8) * span;',
  '        D.lw(1);',
  '        D.strokeColour(rgba(PAL().grid, 0.30 * a));',
  '        D.line(x - 62, ty, x - 70, ty);',
  '        D.fillColour(rgba(PAL().grid, 0.5 * a));',
  '        D.text(String(Math.round(total * k / 8)), x - 76, ty + 3.5);',
  '      }',
  '      D.ctx().textAlign = \'left\';',
  '',
  '      M.register(\'notes\', played + \' / \' + total, W * 0.06, -H * 0.40,',
  '        { a: a, width: 300, px: 12.5, colour: rgba(PAL().accent, 0.95) });',
  '      M.register(\'elapsed\', (w.time - 193.460).toFixed(2), W * 0.06, -H * 0.40 + 20,',
  '        { a: a, width: 300, px: 12.5, unit: \'s\' });',
  '      M.register(\'remaining\', total - played, W * 0.06, -H * 0.40 + 40,',
  '        { a: a, width: 300, px: 12.5 });',
  '    } },',
  '',
  '    { l: 40, e: function (w, p) {',
  '      var a = vis(p, 0.10);',
  '      /* the read-out beside the column: what a note is, while one is sounding */',
  '      var near = EM.onsetNear(w.time, 0.6);',
  '      var x = W * 0.06, y0 = -H * 0.12;',
  '      if (near) {',
  '        var lit = clamp(1 - (w.time - near.t) / 0.8, 0, 1);',
  '        M.register(\'pitch\', near.lo + (near.hi > near.lo ? \'-\' + near.hi : \'\'),',
  '          x, y0, { a: a * lit, width: 260, px: 12.5, colour: rgba(PAL().hot, 0.95) });',
  '        M.register(\'velocity\', near.vel, x, y0 + 20, { a: a * lit, width: 260, px: 12.5 });',
  '        M.register(\'voices\', near.voices, x, y0 + 40, { a: a * lit, width: 260, px: 12.5 });',
  '        /* the cell it lit on the board, drawn as the cell it is */',
  '        D.lw(1.4);',
  '        D.strokeColour(rgba(PAL().accent, 0.55 * a * lit));',
  '        D.srect(x, y0 + 62, 34, 22);',
  '        D.fillColour(rgba(PAL().hot, 0.6 * a * lit));',
  '        D.frect(x + 1, y0 + 63, 32, 20);',
  '      }',
  '',
  '      /* the program, at the bottom, unchanged and still running */',
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
  '      M.banner(\'OPEN LOOP\', -W * 0.44, -H * 0.46,',
  '        { px: 14, a: a * 0.8, align: \'left\', track: 4 });',
  '    } }',
  '  ]);',
  '',
  '  /* ==========================================================================',
  '     03:25.811 — EXECUTION (the last one)',
  '',
  '     ON THE EXACT CENTRE OF THE FRAME, and it is the last cell being appended',
  '     to the column from the previous passage. Eighteen executions were rammed,',
  '     stamped, rasterised and burned into this film; the nineteenth is written',
  '     quietly at the origin, which is what makes it read as the machine having',
  '     stopped decorating and simply executed once more.',
  '     ======================================================================== */',
  "  S('ex.final', [",
  '    { l: 22, e: function (w, p) {',
  '      var a = vis(p, 0.20);',
  '      /* the crosshair that marks the centre of the picture */',
  '      var q = E.outCubic(clamp(p / 0.5, 0, 1));',
  '      D.lw(1);',
  '      D.strokeColour(rgba(PAL().grid, 0.30 * a * q));',
  '      var arm = 250 * U * q;',
  '      D.line(-arm, 0, -54 * U, 0);',
  '      D.line(54 * U, 0, arm, 0);',
  '      D.line(0, -arm * 0.62, 0, -44 * U);',
  '      D.line(0, 44 * U, 0, arm * 0.62);',
  '    } },',
  '',
  '    { l: 34, e: function (w, p) {',
  '      var a = vis(p, 0.18);',
  '      var pop = E.pop(clamp(p / 0.45, 0, 1));',
  '      D.ctx().save();',
  '      D.ctx().globalAlpha = a;',
  '      D.ctx().scale(lerp(1.08, 1.0, pop), lerp(1.08, 1.0, pop));',
  '      D.font(70, \'700\');',
  '      D.ctx().textAlign = \'center\';',
  '      D.ctx().textBaseline = \'middle\';',
  '      var tw = D.measure(\'EXECUTION\', 70, \'700\');',
  '      D.fillColour(rgba(PAL().ink, 0.95));',
  '      D.text(\'EXECUTION\', 0, 0);',
  '      D.lw(1);',
  '      D.strokeColour(rgba(PAL().hot, 0.55 * a));',
  '      D.line(-tw / 2 - 36 * U, 0, tw / 2 + 36 * U, 0);',
  '      D.ctx().restore();',
  '    } },',
  '',
  '    { l: 52, e: function (w, p) {',
  '      var a = vis(p, 0.20);',
  '      /* the read-outs stay at the frame edge: nothing is allowed inside the',
  '         middle third except the word */',
  '      M.register(\'call\', EM.WorldLayer.notesPlayed(w.time), -W * 0.46, -H * 0.42,',
  '        { a: a, width: 250, px: 12.5 });',
  '      M.register(\'of\', EM.ONSETS.length, -W * 0.46, -H * 0.42 + 20,',
  '        { a: a, width: 250, px: 12.5 });',
  '      M.register(\'identical to every other\', \'yes\', -W * 0.46, H * 0.40,',
  '        { a: a, width: 320, px: 12.5, colour: rgba(PAL().grid, 0.85) });',
  '      M.banner(\'NOTHING HAS CHANGED\', 0, H * 0.30,',
  '        { px: 13, a: a * 0.5, track: 4 });',
  '    } }',
  '  ]);',
  '',
  '  /* ==========================================================================',
  '     03:26.620 - 03:31.984 — (outro)',
  '',
  '     THE REVERSE.',
  '',
  '     A loop is what you get when you finish something without resolving it.',
  '     So the closing walks the film BACKWARD: the memory column from 03:13 is',
  '     replayed from its last cell to its first, and the rail at the bottom',
  '     unrolls the song\'s three temperaments as three bands — cold through the',
  '     theorems, hot through the execution, warm from LO-O-OVE to the end — with',
  '     a head travelling back across them.',
  '',
  '     What the earlier version did instead was list six elements and their',
  '     values. It measured well and read as a table; the film\'s last impression',
  '     was a spreadsheet. This has one subject and one motion, and it ends where',
  '     the film began.',
  '     ======================================================================== */',
  "  S('outro', [",
  '    { l: 16, e: function (w, p) {',
  '      var a = vis(p, 0.12);',
  '      var total = EM.ONSETS.length;',
  '',
  '      /* the column, read backward: cell n..0 in reverse order */',
  '      var x = -W * 0.10, yTop = -H * 0.42, span = H * 0.84, rowH = span / total;',
  '      /* the rewind head, sweeping from the last note to the first */',
  '      var back = clamp(p / 0.9, 0, 1);',
  '      var headIdx = (1 - back) * (total - 1);',
  '',
  '      D.lw(1);',
  '      D.strokeColour(rgba(PAL().grid, 0.26 * a));',
  '      D.line(x - 62, yTop, x - 62, yTop + span);',
  '      D.line(x + 62, yTop, x + 62, yTop + span);',
  '',
  '      for (var i = 0; i < total; i++) {',
  '        var yy = yTop + i * rowH;',
  '        var o = EM.ONSETS[i];',
  '        var len = 18 + ((o[2] - 52) / 22) * 40;',
  '        /* cells AHEAD of the rewind head have already been read back and go',
  '           dark; cells behind it are still lit. The column empties from the',
  '           bottom up, which is time running backward. */',
  '        var read = i > headIdx;',
  '        var fade = read ? 0.06 : 0.34;',
  '        D.lw(1.1);',
  '        D.strokeColour(rgba(read ? PAL().grid : (o[3] > 1 ? PAL().hot : PAL().accent),',
  '          fade * a));',
  '        D.line(x - len / 2, yy, x + len / 2, yy);',
  '      }',
  '',
  '      if (headIdx > 0) {',
  '        var hy = yTop + headIdx * rowH;',
  '        D.lw(1.8);',
  '        D.strokeColour(rgba(PAL().paper, 0.85 * a));',
  '        D.line(x - 78, hy, x + 78, hy);',
  '        D.fillColour(rgba(PAL().paper, 0.9 * a));',
  '        D.fcircle(x - 78, hy, 3 * U);',
  '        D.fcircle(x + 78, hy, 3 * U);',
  '      }',
  '',
  '      /* ---- THE RAIL: the song\'s three temperaments --------------------- */',
  '      var rx0 = -W * 0.44, rx1 = W * 0.44;',
  '      var ry = H * 0.34;',
  '      var bands = [',
  '        { t0: 0.0, t1: 74.0, c: PAL().accent, label: \'MONITOR BLUE\' },',
  '        { t0: 74.0, t1: 145.0, c: EM.mix(PAL().accent, PAL().warn, 0.6), label: \'GROWTH\' },',
  '        { t0: 145.0, t1: 178.0, c: PAL().hot, label: \'EXECUTION\' },',
  '        { t0: 178.0, t1: EM.AUDIO_END, c: PAL().paper, label: \'LOVE\' }',
  '      ];',
  '      D.lw(1);',
  '      D.strokeColour(rgba(PAL().grid, 0.30 * a));',
  '      D.line(rx0, ry, rx1, ry);',
  '      for (var b = 0; b < bands.length; b++) {',
  '        var bd = bands[b];',
  '        var u0 = bd.t0 / EM.AUDIO_END, u1 = bd.t1 / EM.AUDIO_END;',
  '        var bx0 = lerp(rx0, rx1, u0), bx1 = lerp(rx0, rx1, u1);',
  '        /* the band thickens as the rewind passes over it */',
  '        var touched = clamp((headIdx / total) <= (bd.t1 / EM.AUDIO_END) ? 1 : 0, 0, 1);',
  '        D.lw(6);',
  '        D.strokeColour(rgba(bd.c, (0.25 + touched * 0.45) * a));',
  '        D.line(bx0, ry, bx1, ry);',
  '        D.lw(1);',
  '        D.strokeColour(rgba(PAL().grid, 0.4 * a));',
  '        D.line(bx0, ry - 9, bx0, ry + 9);',
  '        D.font(10.5);',
  '        D.ctx().textAlign = \'left\';',
  '        D.ctx().textBaseline = \'top\';',
  '        D.fillColour(rgba(PAL().grid, 0.6 * a));',
  '        D.text(bd.label, bx0 + 5, ry + 13);',
  '      }',
  '',
  '      /* the rewind head on the rail */',
  '      var hx = lerp(rx0, rx1, headIdx / total);',
  '      D.lw(1.6);',
  '      D.strokeColour(rgba(PAL().paper, 0.9 * a));',
  '      D.line(hx, ry - 16, hx, ry + 16);',
  '',
  '      /* the clock, going down */',
  '      D.font(15);',
  '      D.ctx().textAlign = \'center\';',
  '      D.ctx().textBaseline = \'alphabetic\';',
  '      D.fillColour(rgba(PAL().ink, 0.9 * a));',
  '      D.text(EM.fmtTime(headIdx / total * EM.AUDIO_END), hx, ry - 26);',
  '',
  '      M.banner(\'REWIND\', -W * 0.44, -H * 0.46,',
  '        { px: 15, a: a * 0.85, align: \'left\', track: 5 });',
  '      M.register(\'cell\', Math.round(headIdx), W * 0.06, -H * 0.40,',
  '        { a: a, width: 300, px: 12.5, colour: rgba(PAL().paper, 0.95) });',
  '      M.register(\'of\', total, W * 0.06, -H * 0.40 + 20, { a: a, width: 300, px: 12.5 });',
  '    } },',
  '',
  '    { l: 30, e: function (w, p) {',
  '      var a = vis(p, 0.12);',
  '      /* the frame cools toward warm paper as the rewind completes */',
  '      var q = clamp((p - 0.55) / 0.45, 0, 1);',
  '      if (q > 0.01) {',
  '        D.ctx().save();',
  '        D.ctx().globalAlpha = q * 0.12;',
  '        D.fillColour(rgba(EM.mix(PAL().paper, PAL().accent, 0.22), 1));',
  '        D.frect(-W / 2, -H / 2, W, H);',
  '        D.ctx().restore();',
  '      }',
  '      /* and the one line it never answered */',
  '      var lq = clamp((p - 0.62) / 0.22, 0, 1);',
  '      if (lq > 0.01) {',
  '        D.ctx().globalAlpha = a * lq;',
  '        D.font(24);',
  '        D.ctx().textAlign = \'center\';',
  '        D.ctx().textBaseline = \'alphabetic\';',
  '        D.fillColour(rgba(EM.mix(PAL().paper, PAL().grid, 0.35), 0.9));',
  '        D.text(\'no answer found\', 0, H * 0.16);',
  '        D.ctx().globalAlpha = 1;',
  '      }',
  '    } }',
  '  ]);',
  '',
  '  /* ==========================================================================',
  '     03:31.984 — the last frame',
  '',
  '     `end` sits on the final timestamp and has a duration of zero, so only the',
  '     very last frame reaches it. It draws the one mark in the film that a',
  '     machine did not make, and it draws it rather than presenting it.',
  '     NOTE the parameter is `prog`, not `p`: `p` would shadow PAL().',
  '     ======================================================================== */',
  "  S('end', [",
  '    { l: 40, e: function (w, prog) {',
  '      var a = clamp(1 - prog * 0.28, 0.65, 1);',
  '      var grow = E.outCubic(clamp(prog / 0.55, 0, 1));',
  '      var xa = lerp(0, -W * 0.30, grow), xb = lerp(0, W * 0.30, grow);',
  '      M.handCurve([',
  '        [xa, 30], [lerp(xa, xb, 0.33), 18], [lerp(xa, xb, 0.66), 26], [xb, 14]',
  '      ], 1.414, {',
  '        wobble: 3.4, width: 2.0,',
  '        colour: rgba(EM.mix(PAL().paper, PAL().accent, 0.30), 0.85 * a)',
  '      });',
  '      D.ctx().globalAlpha = a * 0.85;',
  '      D.font(18);',
  '      D.ctx().textAlign = \'center\';',
  '      D.ctx().textBaseline = \'alphabetic\';',
  '      D.fillColour(rgba(EM.mix(PAL().paper, PAL().grid, 0.40), 0.85));',
  '      D.text(\'world.execute(me);\', 0, 68 * U);',
  '      D.ctx().globalAlpha = 1;',
  '    } }',
  '  ]);',
  ''
];

const out = lines.slice(0, from).concat(NEW).concat(lines.slice(tailAt));
const src = out.join('\n');

try { new (require('vm').Script)(src, { filename: FILE }); }
catch (e) {
  fs.writeFileSync(path.join(__dirname, '..', 'frames-out', 'ending-candidate.js'), src, 'utf8');
  console.error('refusing to write: candidate does not parse — ' + e.message);
  process.exit(1);
}

fs.writeFileSync(FILE, src, 'utf8');
console.log('replaced lines ' + (from + 1) + '-' + tailAt +
  ' (' + (tailAt - from) + ' lines) with ' + NEW.length + ' lines');
console.log('  inst.loop  the memory column');
console.log('  ex.final   the last cell, on the centre');
console.log('  outro      the rewind');
console.log('  end        one hand-drawn line');
