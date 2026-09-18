/* ============================================================================
   grid-the-rewind.js — make the outro's rewind use the same lattice.

   The memory passage now draws the board as the real 32 x 18 lattice. The
   rewind has to agree, or the film's final minute contradicts the minute before
   it: it would be un-writing a column that was never drawn.

   So the rewind reads the SAME grid, from the last cell back to the first, and
   the power band it is currently passing over comes from the actual timestamp of
   the note being un-written — not from a hand-drawn table.

   Run:  node _build/grid-the-rewind.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const plateAt = lines.findIndex(l => l.indexOf("S('outro'") >= 0);
if (plateAt < 0) { console.error('outro not found'); process.exit(1); }
const nextAt = lines.findIndex((l, i) => i > plateAt && /^\s*S\('/.test(l));
const layer16 = lines.findIndex((l, i) =>
  i > plateAt && i < nextAt && /^\s*\{\s*l:\s*16\s*,/.test(l));
const layer30 = lines.findIndex((l, i) =>
  i > plateAt && i < nextAt && /^\s*\{\s*l:\s*30\s*,/.test(l));
if (layer16 < 0 || layer30 < 0) {
  console.error('landmarks: layer16=' + layer16 + ' layer30=' + layer30);
  process.exit(1);
}

const BLOCK = [
  '    { l: 16, e: function (w, p) {',
  '      var a = vis(p, 0.12);',
  '      var total = EM.ONSETS.length;',
  '',
  '      /* THE SAME BOARD, BEING UN-WRITTEN.',
  '',
  '         The rewind walks the identical 32 x 18 lattice the previous passage',
  '         wrote, from the last cell back to the first. Because both passages',
  '         read the same EM.WorldLayer tile mapping, the closing minute cannot',
  '         contradict the minute before it.',
  '',
  '         The band the head is currently passing over is taken from the',
  '         TIMESTAMP of the note being erased, so the colour on screen is the',
  '         colour that part of the song actually had. */',
  '      var back = clamp(p / 0.9, 0, 1);',
  '      var headIdx = (1 - back) * (total - 1);',
  '      var headT = EM.ONSETS[Math.max(0, Math.round(headIdx))][0] / 1000;',
  '',
  '      var cols = EM.WorldLayer.COLS, rows = EM.WorldLayer.ROWS;',
  '      var cw = W * 0.78 / cols, ch = H * 0.72 / rows;',
  '      var ox = -W * 0.39, oy = -H * 0.36;',
  '',
  '      D.lw(0.8);',
  '      for (var r = 0; r < rows; r++) {',
  '        for (var cc = 0; cc < cols; cc++) {',
  '          D.strokeColour(rgba(PAL().grid, 0.09 * a));',
  '          D.srect(ox + cc * cw + cw * 0.12, oy + r * ch + ch * 0.12,',
  '                  cw * 0.76, ch * 0.76);',
  '        }',
  '      }',
  '',
  '      for (var i = 0; i < total; i++) {',
  '        if (i > headIdx + 60) break;',
  '        var tile = EM.WorldLayer.tileOf(i);',
  '        var o = EM.ONSETS[i];',
  '        var bx = ox + tile.c * cw + cw * 0.12;',
  '        var by = oy + tile.r * ch + ch * 0.12;',
  '        var read = i > headIdx;',
  '        if (read) {',
  '          /* already un-written: only the frame of the cell remains */',
  '          D.lw(1);',
  '          D.strokeColour(rgba(PAL().grid, 0.14 * a));',
  '          D.srect(bx, by, cw * 0.76, ch * 0.76);',
  '          continue;',
  '        }',
  '        var heat01 = clamp((o[2] - 55) / 18, 0, 1);',
  '        var col = EM.mix(PAL().accent, PAL().hot, heat01 * 0.55);',
  '        D.fillColour(rgba(col, 0.34 * a));',
  '        D.frect(bx, by, cw * 0.76, ch * 0.76);',
  '      }',
  '',
  '      /* the head of the rewind */',
  '      var ht = EM.WorldLayer.tileOf(Math.max(0, Math.round(headIdx)));',
  '      D.lw(1.6);',
  '      D.strokeColour(rgba(PAL().paper, 0.85 * a));',
  '      D.srect(ox + ht.c * cw, oy + ht.r * ch, cw, ch);',
  '',
  '      D.lw(1.4);',
  '      D.strokeColour(rgba(PAL().grid, 0.40 * a));',
  '      D.srect(ox, oy, W * 0.78, H * 0.72);',
  '',
  '      /* ---- THE RAIL: the song\'s temperaments, from its own palette ----- */',
  '      var rx0 = -W * 0.44, rx1 = W * 0.44;',
  '      var ry = H * 0.33;',
  '      var bands = [',
  '        { t0: 0.0, t1: 74.0, c: PAL().accent, label: \'MONITOR BLUE\' },',
  '        { t0: 74.0, t1: 145.0, c: EM.mix(PAL().accent, PAL().phosphor, 0.55), label: \'GROWTH\' },',
  '        { t0: 145.0, t1: 178.0, c: PAL().hot, label: \'EXECUTION\' },',
  '        { t0: 178.0, t1: EM.AUDIO_END, c: PAL().paper, label: \'LOVE\' }',
  '      ];',
  '      D.lw(1);',
  '      D.strokeColour(rgba(PAL().grid, 0.28 * a));',
  '      D.line(rx0, ry, rx1, ry);',
  '      for (var b = 0; b < bands.length; b++) {',
  '        var bd = bands[b];',
  '        var bx0 = lerp(rx0, rx1, bd.t0 / EM.AUDIO_END);',
  '        var bx1 = lerp(rx0, rx1, bd.t1 / EM.AUDIO_END);',
  '        /* a band is lit while the rewind is still inside it */',
  '        var active = headT >= bd.t0 && headT <= bd.t1;',
  '        var passed = headT < bd.t0;',
  '        D.lw(active ? 9 : 6);',
  '        D.strokeColour(rgba(bd.c, (passed ? 0.16 : (active ? 0.80 : 0.38)) * a));',
  '        D.line(bx0, ry, bx1, ry);',
  '        D.lw(1);',
  '        D.strokeColour(rgba(PAL().grid, 0.4 * a));',
  '        D.line(bx0, ry - 10, bx0, ry + 10);',
  '        D.font(10.5);',
  '        D.ctx().textAlign = \'left\';',
  '        D.ctx().textBaseline = \'top\';',
  '        D.fillColour(rgba(passed ? PAL().grid : bd.c, (passed ? 0.45 : 0.85) * a));',
  '        D.text(bd.label, bx0 + 5, ry + 14);',
  '      }',
  '',
  '      /* the rewind head on the rail, and the clock running down */',
  '      var hx = lerp(rx0, rx1, headT / EM.AUDIO_END);',
  '      D.lw(1.8);',
  '      D.strokeColour(rgba(PAL().paper, 0.9 * a));',
  '      D.line(hx, ry - 18, hx, ry + 18);',
  '      D.font(15);',
  '      D.ctx().textAlign = \'center\';',
  '      D.ctx().textBaseline = \'alphabetic\';',
  '      D.fillColour(rgba(PAL().ink, 0.9 * a));',
  '      D.text(EM.fmtTime(headT), hx, ry - 28);',
  '',
  '      M.banner(\'REWIND\', -W * 0.44, -H * 0.46,',
  '        { px: 15, a: a * 0.85, align: \'left\', track: 5 });',
  '      M.register(\'cell\', Math.round(headIdx), W * 0.06, -H * 0.40,',
  '        { a: a, width: 300, px: 12.5, colour: rgba(PAL().paper, 0.95) });',
  '      M.register(\'of\', total, W * 0.06, -H * 0.40 + 20, { a: a, width: 300, px: 12.5 });',
  '      M.register(\'position\', EM.fmtTime(headT), W * 0.06, -H * 0.40 + 40,',
  '        { a: a, width: 300, px: 12.5 });',
  '    } },'
];

const out = lines.slice(0, layer16).concat(BLOCK).concat(lines.slice(layer30));
const src = out.join('\n');
try { new (require('vm').Script)(src, { filename: FILE }); }
catch (e) { console.error('refusing to write: does not parse — ' + e.message); process.exit(1); }

fs.writeFileSync(FILE, src, 'utf8');
console.log('the rewind now reads the same lattice (' + BLOCK.length + ' lines)');
