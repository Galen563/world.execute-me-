/* ============================================================================
   _tools/contact-sheet.js — one PNG showing the whole film.

   Samples the track at a fixed interval, renders each frame small, and tiles
   them into a single image with a time label under each. This is the fastest
   way to see whether the film has an ARC — whether it starts cold and ends
   warm, whether the density rises where it should, whether the last act looks
   different from the first. Individual frames tell you a composition works;
   the sheet tells you the piece works.

   Run:  node _tools/contact-sheet.js            (16 frames, 4 x 4)
         node _tools/contact-sheet.js 24 6       (24 frames, 6 across)
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { createEnv } = require('./stub-env');

/* reuse the rasteriser and PNG encoder from render-png.js */
const rpSrc = fs.readFileSync(path.join(__dirname, 'render-png.js'), 'utf8');
const cut = rpSrc.indexOf('/* ==========================================================================\n   MAIN');
const probe = path.join(__dirname, '.sheet-util.js');
fs.writeFileSync(probe, rpSrc.slice(0, cut) + '\nmodule.exports = { Raster, makeRecordingCtx, encodePNG };');
const { Raster, makeRecordingCtx, encodePNG } = require(probe);

const COUNT = parseInt(process.argv[2] || '16', 10);
const ACROSS = parseInt(process.argv[3] || '4', 10);

const env = createEnv({ quiet: true });
const EM = env.EM;

const TW = 200, TH = 112;                 /* tile size */
const GAP = 6, LABEL = 16;
const ROWS = Math.ceil(COUNT / ACROSS);
const SW = ACROSS * TW + (ACROSS + 1) * GAP;
const SH = ROWS * (TH + LABEL) + (ROWS + 1) * GAP;

const sheet = new Raster(SW, SH);
/* the sheet's own ground is a flat dark grey so the frames read as objects */
sheet.buf.fill(20);
for (let i = 3; i < sheet.buf.length; i += 4) sheet.buf[i] = 255;

const START = 1.5, END = EM.AUDIO_END - 2;

console.log('contact sheet: ' + COUNT + ' frames across ' + EM.AUDIO_END.toFixed(1) + ' s -> ' +
  SW + 'x' + SH);

for (let i = 0; i < COUNT; i++) {
  const t = START + (END - START) * (COUNT === 1 ? 0 : i / (COUNT - 1));
  const stats = { fills: 0, strokes: 0, text: 0, clips: 0 };

  /* render into a tile-sized raster, then blit it into the sheet */
  const tile = new Raster(TW, TH);
  const scale = Math.min(TW / 1600, TH / 900);
  const ox = (TW - 1600 * scale) / 2, oy = (TH - 900 * scale) / 2;
  const ctx = makeRecordingCtx(tile, scale, ox, oy, stats);
  ctx.setTransform(1, 0, 0, 1, 800, 450);

  const D = EM.D;
  const prev = D.ctx();
  D.bind(ctx, 1600, 900);
  EM.M.bindStage();
  const w = EM.World.at(t);
  w.time = t; w.pal = EM.World.palette(w); w.U = 1;
  EM.__pal = w.pal;
  try {
    EM.WorldLayer.draw(w, w.pal, t);
    const cue = EM.Lyrics.at(t);
    if (cue) EM.drawScene(cue.scene, w, t, cue);
  } catch (e) {
    console.log('  ! ' + t.toFixed(1) + ' s threw: ' + e.message);
  }
  D.bind(prev, 1600, 900);

  const col = i % ACROSS, row = Math.floor(i / ACROSS);
  const bx = GAP + col * (TW + GAP);
  const by = GAP + row * (TH + LABEL + GAP);
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < TW; x++) {
      const si = ((by + y) * SW + (bx + x)) * 4;
      const ti = (y * TW + x) * 4;
      sheet.buf[si] = tile.buf[ti];
      sheet.buf[si + 1] = tile.buf[ti + 1];
      sheet.buf[si + 2] = tile.buf[ti + 2];
      sheet.buf[si + 3] = 255;
    }
  }
  /* a one-pixel frame around each tile, so dark frames are still delimited */
  for (let x = -1; x <= TW; x++) {
    for (const yy of [by - 1, by + TH]) {
      const si = (yy * SW + bx + x) * 4;
      if (si >= 0 && si < sheet.buf.length) {
        sheet.buf[si] = 70; sheet.buf[si + 1] = 78; sheet.buf[si + 2] = 88;
      }
    }
  }
  for (let y = -1; y <= TH; y++) {
    for (const xx of [bx - 1, bx + TW]) {
      const si = ((by + y) * SW + xx) * 4;
      if (si >= 0 && si < sheet.buf.length) {
        sheet.buf[si] = 70; sheet.buf[si + 1] = 78; sheet.buf[si + 2] = 88;
      }
    }
  }
  /* the label: a bar of pixels roughly as wide as the time string */
  const cue = EM.Lyrics.at(t);
  const label = EM.fmtClock(t) + '  ' + (cue ? cue.scene : '');
  const lw = Math.min(TW, label.length * 5);
  for (let y = 3; y < 9; y++) {
    for (let x = 0; x < lw; x++) {
      const si = ((by + TH + 3 + y) * SW + bx + x) * 4;
      if (si >= 0 && si < sheet.buf.length) {
        sheet.buf[si] = 150; sheet.buf[si + 1] = 190; sheet.buf[si + 2] = 210;
      }
    }
  }
  console.log('  ' + EM.fmtTime(t) + '  ' + (cue ? cue.scene : ''));
}

const out = path.join(__dirname, '..', 'frames-out', 'contact-sheet.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, encodePNG(SW, SH, sheet.buf));
fs.unlinkSync(probe);
console.log('\nwrote ' + path.relative(path.join(__dirname, '..'), out) +
  '  (' + SW + 'x' + SH + ', ' + COUNT + ' frames)');
