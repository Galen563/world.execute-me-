/* ============================================================================
   grid-the-memory.js — make the closing memory the actual lattice.

   WHY
   ---
   The first version of 03:13 laid all 615 notes out as one vertical column, one
   row per note. 615 rows in 756 pixels is 1.2 px each: they merged into a solid
   bar and the figure carried no information at all — the opposite of what the
   passage is for.

   The lattice in 30_world.js is 32 x 18 = 576 cells. So the memory is drawn as
   THAT grid, with cells lit in the order the song played them. It is then
   literally the film's own board with the whole performance written on it, which
   is what the passage should show, and it is legible at a glance.

   The rewind in `outro` uses the same grid and is included here so both passages
   agree on what the board is.

   Run:  node _build/grid-the-memory.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', '46_plates_love.js');
const lines = fs.readFileSync(FILE, 'utf8').split('\n');

const plateAt = lines.findIndex(l => l.indexOf("S('inst.loop'") >= 0);
if (plateAt < 0) { console.error('inst.loop not found'); process.exit(1); }
const nextAt = lines.findIndex((l, i) => i > plateAt && /^\s*S\('/.test(l));
const layer40 = lines.findIndex((l, i) =>
  i > plateAt && i < nextAt && /^\s*\{\s*l:\s*40\s*,/.test(l));
const layer18 = lines.findIndex((l, i) =>
  i > plateAt && i < layer40 && /^\s*\{\s*l:\s*18\s*,/.test(l));
if (layer18 < 0 || layer40 < 0) {
  console.error('landmarks: layer18=' + layer18 + ' layer40=' + layer40);
  process.exit(1);
}

/* the layer-18 block runs from its opening line up to (not including) layer 40 */
const BLOCK = [
  '    { l: 18, e: function (w, p) {',
  '      var a = vis(p, 0.10);',
  '      var total = EM.ONSETS.length;',
  '      var played = EM.WorldLayer.notesPlayed(w.time);',
  '',
  '      /* THE BOARD, WHOLE.',
  '',
  '         This is the same 32 x 18 lattice the world layer has been drawing',
  '         underneath everything since 00:00, shown once at full size with the',
  '         entire performance written on it: cells light in the order the song',
  '         played them, so the finished board IS the song\'s shape.',
  '',
  '         An earlier version laid the notes out as one tall column, one row per',
  '         note. 615 rows into 756 pixels is 1.2 px each — they merged into a',
  '         bar and told the viewer nothing. The grid is the object the film',
  '         actually has. */',
  '      var cols = EM.WorldLayer.COLS, rows = EM.WorldLayer.ROWS;',
  '      var cw = W * 0.78 / cols, ch = H * 0.72 / rows;',
  '      var ox = -W * 0.39, oy = -H * 0.36;',
  '',
  '      /* every cell, empty or not, so the board reads as a board */',
  '      D.lw(0.8);',
  '      for (var r = 0; r < rows; r++) {',
  '        for (var cc = 0; cc < cols; cc++) {',
  '          D.strokeColour(rgba(PAL().grid, 0.10 * a));',
  '          D.srect(ox + cc * cw + cw * 0.12, oy + r * ch + ch * 0.12,',
  '                  cw * 0.76, ch * 0.76);',
  '        }',
  '      }',
  '',
  '      /* the lit cells, in the order they were played */',
  '      for (var i = 0; i < total; i++) {',
  '        if (i > played + 80) break;',
  '        var tile = EM.WorldLayer.tileOf(i);',
  '        var o = EM.ONSETS[i];',
  '        var cx = ox + tile.c * cw + cw * 0.5;',
  '        var cy = oy + tile.r * ch + ch * 0.5;',
  '        var on = i < played;',
  '        if (!on) {',
  '          /* the next few, as an outline: what is about to be written */',
  '          D.lw(1);',
  '          D.strokeColour(rgba(PAL().grid, 0.22 * a));',
  '          D.srect(ox + tile.c * cw + cw * 0.12, oy + tile.r * ch + ch * 0.12,',
  '                  cw * 0.76, ch * 0.76);',
  '          continue;',
  '        }',
  '        var age = w.time - o[0] / 1000;',
  '        var burn = Math.pow(1 - clamp(age / 210, 0, 1), 0.35);',
  '        /* a chord burns harder; the pitch shifts it toward hot */',
  '        var heat01 = clamp((o[2] - 55) / 18, 0, 1);',
  '        var col = EM.mix(PAL().accent, PAL().hot, heat01 * 0.55);',
  '        D.fillColour(rgba(col, (0.10 + burn * 0.42) * a));',
  '        D.frect(ox + tile.c * cw + cw * 0.12, oy + tile.r * ch + ch * 0.12,',
  '                cw * 0.76, ch * 0.76);',
  '        if (o[3] > 1) {',
  '          /* a chord gets a ring: the one thing on the board that is not a',
  '             single event */',
  '          D.lw(1);',
  '          D.strokeColour(rgba(PAL().hot, (0.35 + burn * 0.4) * a));',
  '          D.scircle(cx, cy, cw * 0.42);',
  '        }',
  '      }',
  '',
  '      /* the head: the cell being written right now, and the ruler that says',
  '         how far through the song the board is */',
  '      if (played > 0 && played <= total) {',
  '        var ht = EM.WorldLayer.tileOf(played - 1);',
  '        var hx = ox + ht.c * cw + cw * 0.5;',
  '        var hy = oy + ht.r * ch + ch * 0.5;',
  '        D.lw(1.6);',
  '        D.strokeColour(rgba(PAL().paper, 0.85 * a));',
  '        D.srect(ox + ht.c * cw, oy + ht.r * ch, cw, ch);',
  '        D.fillColour(rgba(PAL().paper, 0.75 * a));',
  '        D.fcircle(hx, hy, 2.4 * U);',
  '      }',
  '',
  '      /* the frame of the board, and its extent */',
  '      D.lw(1.4);',
  '      D.strokeColour(rgba(PAL().grid, 0.45 * a));',
  '      D.srect(ox, oy, W * 0.78, H * 0.72);',
  '      M.sub(cols + \' x \' + rows + \' cells\', ox, oy + H * 0.72 + 16,',
  '        { px: 11.5, a: a * 0.7, align: \'left\' });',
  '',
  '      M.register(\'notes\', played + \' / \' + total, W * 0.06, -H * 0.40,',
  '        { a: a, width: 300, px: 12.5, colour: rgba(PAL().accent, 0.95) });',
  '      M.register(\'written\', ((played / total) * 100).toFixed(1), W * 0.06, -H * 0.40 + 20,',
  '        { a: a, width: 300, px: 12.5, unit: \'%\' });',
  '      M.register(\'remaining\', total - played, W * 0.06, -H * 0.40 + 40,',
  '        { a: a, width: 300, px: 12.5 });',
  '    } },'
];

const out = lines.slice(0, layer18).concat(BLOCK).concat(lines.slice(layer40));
const src = out.join('\n');
try { new (require('vm').Script)(src, { filename: FILE }); }
catch (e) { console.error('refusing to write: does not parse — ' + e.message); process.exit(1); }

fs.writeFileSync(FILE, src, 'utf8');
console.log('the memory is now the 32 x 18 lattice (' + BLOCK.length + ' lines)');
