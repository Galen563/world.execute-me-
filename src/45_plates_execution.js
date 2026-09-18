/* ============================================================================
   src/45_plates_execution.js — ACT VI · EXECUTION        02:27.6 - 02:57.2

   "EXECUTION x16 in a row
    Ein, dos / Trois, ne / Fem, liù
    If I can / If I can give them all the EXECUTION
    Then I can / Then I can be your only EXECUTION
    If I can have you back / I will run the EXECUTION
    Though we are trapped / We are trapped, ah"

   The machine has stopped pleading. The conditionals are over; this is the part
   where the sentence is carried out. So the act has one subject and one verb,
   and the verb is the thing itself: the word EXECUTION is not a caption here,
   it is the machine's output, and the machine says it sixteen times because it
   has nothing else left to say.

   THE ONE IDEA THIS ACT IS BUILT ON
   ---------------------------------
   Sixteen identical lines is not sixteen pictures. It is ONE entity degrading
   in public, and the film has to be able to prove that on screen. So the word
   is drawn by a single shared layer — the word, the "call n / 16" read-out, and
   sixteen progress pips showing how far into the storm we are — and every one
   of the sixteen plates carries it unchanged. What changes from plate to plate
   is the *mechanism* doing it to the word: a gear, a ram, a stamp, a fuse, a
   hand, a crack, a raster. The counter is the film admitting, in its own voice,
   that this is a loop, and that the loop is running out.

   The 16 are therefore written as a parameterised factory (execPlate(repeat)),
   not as sixteen hand-copied plates. `heat` rises 0 -> 1 across the run and is
   used to make each mechanism progressively less able to do its job: the gear
   to skip a tooth, the stamp to leave a worse print, the raster to coarser.

   THE LINES ARE SHORT. 0.6 s, 0.8 s, sometimes 1.2 s. Nothing here may rely on
   a long entrance, so every picture is legible by p = 0.25 and the whole act
   dissolves rather than cuts.

   27 plates.  e(w, p, cue)   w = world state, p = 0..1 through this line
   ==========================================================================*/
(function (EM) {
  'use strict';

  var S = EM.Scenes, D = EM.D, E = EM.E, TAU = EM.TAU, M = EM.M;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var vis = EM.Life.vis, stag = EM.Life.stagger, between = EM.Life.between;
  /* used by the raster and dropout variants to make a mark stutter */
  var glitch = EM.Life.glitch;

  var W = 1600, H = 900, U = 1;

  function PAL() { return EM.__pal; }

  /* The one word this act is about. Every plate draws this string, from the
     same shared layer, at scales ranging from 1/22 of the stage to full bleed. */
  var WORD = 'EXECUTION';
  var RUN = 16;                       /* how many times the line is sung */

  /* --------------------------------------------------------------------------
     THE STORM'S OWN NOISE.

     Deterministic from the *time* rather than from p, so every layer inside one
     frame agrees about how broken this instant is, and so scrubbing backwards
     lands on exactly the same pixels. 1 when the plate is cold, falling toward
     (1 - amount) as `heat` rises.
     ------------------------------------------------------------------------ */
  function storm(w, heat, cell, amount) {
    var k = Math.floor(w.time / (cell || 0.06));
    return 1 - amount * hash(k * 977 + 11) * clamp(heat, 0, 1);
  }

  /* a list rendered as one monospace row — used by the counting plates at a
     size where M.sub would be too coarse to place */
  function seqRow(list, x, y, px, colour, align) {
    var w = D.measure(list, px);
    var x0 = align === 'center' ? x - w / 2 : (align === 'right' ? x - w : x);
    D.font(px);
    D.ctx().textAlign = 'left';
    D.fillColour(colour);
    D.text(list, x0, y);
    return { x0: x0, w: w };
  }

  /* every plate in the storm names its own mechanism, so the run reads as a
     sequence of attempted methods rather than sixteen identical shocks */
  var VARTAG = [
    'GEAR', 'RAM', 'STAMP', 'COUNT', 'WARN', 'NEST', 'FUSE', 'TYPE',
    'GRID', 'SIX', 'CRACK', 'RASTER', 'FAULT', 'BLEED', 'TEXTURE', 'LAST'
  ];

  /* ==========================================================================
     THE SHARED LAYER — the thing that makes the run read as one entity.

     Drawn identically by all sixteen plates: the word, the call read-out, and
     sixteen pips. When you watch the act, this is the part that stays still
     while everything around it comes apart.
     ======================================================================== */
  function stormShared(repeat, heat, w, p, a, wordFn) {
    var pl = PAL();
    var pu = EM.onsetPulse(w.time, 0.40);
    var sc = lerp(1.10, 0.94, heat) * (1 + pu * 0.035 * heat);
    var pos = [0, -6];
    if (wordFn) pos = wordFn(w, p, a, heat, pu) || pos;

    D.ctx().save();
    D.ctx().translate(0, pos[1]);
    D.ctx().scale(sc, sc);
    M.keyword(WORD, 0, pos[0], {
      a: a,
      px: lerp(64, 142, heat),
      weight: '700',
      fill: rgba(pl.ink, 0.95 * a),
      stroke: rgba(repeat >= 12 ? pl.hot : pl.accent, (0.25 + heat * 0.45) * a),
      strokeW: 1 + heat * 1.8,
      track: -0.12 + heat * 2.6,
      bracket: repeat % 3 === 2,
      measure: repeat % 4 === 3
    });
    D.ctx().restore();

    if (repeat === RUN - 1) {
      M.sub('last one', 0, pos[1] + 92 * U, { px: 13, a: a * 0.7 * glitch(p, 0.5, 9) });
    }

    /* ---------------------------------------------------------------------
       THE CALL READ-OUT: the run counted in the machine's own voice.
       ------------------------------------------------------------------- */
    M.banner('EXECUTION', 0, H * 0.355, { px: 15, a: a * 0.75, track: 4 });
    M.banner('CALL ' + (repeat + 1) + ' / ' + RUN, 0, H * 0.415,
      { px: 19, a: a, track: 3, colour: rgba(pl.hot, 0.95) });
    M.sub('fault ' + (heat * 100).toFixed(0) + '%', 0, H * 0.415 + 21 * U,
      { px: 12, a: a * 0.72, colour: rgba(pl.grid, 0.9) });
    M.sub('[' + repeat.toString(2).padStart(4, '0') + ']', W * 0.30, H * 0.415,
      { px: 12, a: a * 0.6, align: 'left' });

    /* ---------------------------------------------------------------------
       SIXTEEN PIPS. How far into the storm we are, and which one is firing.
       One of them is lit on every single plate of the act; that is the loop.
       ------------------------------------------------------------------- */
    var y = -H * 0.425;
    for (var k = 0; k < RUN; k++) {
      var x = (k - (RUN - 1) / 2) * 21 * U;
      if (k < repeat) {
        D.fillColour(rgba(pl.hot, 0.55 * a));
        D.frect(x - 7, y - 7, 14, 14);
      } else if (k === repeat) {
        var pulse = 0.6 + 0.4 * (EM.onsetPulse(w.time, 0.5) || 0.4);
        D.fillColour(rgba(pl.accent, 0.95 * a * pulse));
        D.frect(x - 9.5, y - 9.5, 19, 19);
      } else {
        D.lw(1);
        D.strokeColour(rgba(pl.grid, 0.5 * a));
        D.srect(x - 7, y - 7, 14, 14);
      }
    }
    D.lw(1);
    D.strokeColour(rgba(pl.grid, 0.35 * a));
    D.line(-H * 0.185, y, H * 0.185, y);
  }

  /* ==========================================================================
     THE FACTORY.

     One plate is a variant (the mechanism) plus the shared layer (the word,
     the counter, the pips). A variant receives (w, p, a, repeat, heat) and may
     return a [dx, dy] nudge for the word — that is how "the ram drives the word
     down" or "the stamp prints it lower" happens without the word ever being
     drawn by anything but the one shared layer.
     ======================================================================== */
  var VARIANTS = [

    /* 0. r01 — a gear starting to turn. Almost gentle: the teeth come round,
       the word is barely there, the frame is still cool. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var cx = -190 * U, cy = -90 * U, R = 150 * U;
      var spin = w.time * (0.35 + heat * 0.55);
      var teeth = 26;
      D.lw(2.2);
      D.strokeColour(rgba(pl.grid, (0.85 - heat * 0.35) * a));
      D.ctx().beginPath();
      for (var i = 0; i <= teeth; i++) {
        var u = i / teeth, ang = spin + u * TAU;
        var rr = R * (1 + 0.11 * (i % 2));
        var px = cx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr;
        if (i === 0) D.ctx().moveTo(px, py); else D.ctx().lineTo(px, py);
      }
      D.ctx().closePath();
      D.ctx().stroke();
      D.lw(1.4);
      D.strokeColour(rgba(pl.accent, 0.6 * a));
      D.scircle(cx, cy, R * 0.82);
      D.scircle(cx, cy, R * 0.22);
      D.fillColour(rgba(pl.accent, 0.22 * a));
      D.fcircle(cx, cy, R * 0.16);
      for (var s = 0; s < 6; s++) {
        var sa = spin * 1.2 + s / 6 * TAU;
        D.lw(1.2);
        D.strokeColour(rgba(pl.grid, 0.5 * a));
        D.line(cx + Math.cos(sa) * R * 0.24, cy + Math.sin(sa) * R * 0.24,
               cx + Math.cos(sa) * R * 0.78, cy + Math.sin(sa) * R * 0.78);
      }
      M.pulseRings(cx, cy, w.time, { a: a * 0.5, r0: R, spread: 260, rings: 1 });
      M.spray(31 + repeat, cx, cy, 7, R * 1.15, { size: 1.1 });
      M.callout(cx + R, cy - R * 0.4, cx + R + 170 * U, cy - R * 0.9,
        'teeth 26 / backlash ' + (0.10 + heat * 0.7).toFixed(2), { a: a * 0.8 });
      M.register('cycle', (p * 0.7 % 1).toFixed(2), -W * 0.42, H * 0.40,
        { a: a * 0.9, width: 220 });
      return [0, -8];
    },

    /* 1. r02 — a piston driving down onto the word. The ram has no opinion
       about what it is hitting; the word is what happens to be underneath. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var q = E.outCubic(clamp(p / 0.55, 0, 1));
      var y0 = -H * 0.34, y1 = -H * 0.02;
      var y = lerp(y0, y1, q);
      var half = 118 * U;
      D.lw(1.2);
      D.strokeColour(rgba(pl.grid, 0.55 * a));
      D.line(-half - 130, y0 - 40, -half - 130, H * 0.24);
      D.line(half + 130, y0 - 40, half + 130, H * 0.24);
      for (var t = 0; t < 9; t++) {
        var ty = y0 - 30 + t * 22 * U;
        D.strokeColour(rgba(pl.grid, 0.28 * a));
        D.line(-half - 138, ty, -half - 122, ty);
        D.line(half + 122, ty, half + 138, ty);
      }
      D.lw(3);
      D.strokeColour(rgba(pl.hot, 0.9 * a));
      D.line(0, y0 - 130, 0, y - 48);
      D.lw(2.2);
      D.strokeColour(rgba(pl.accent, 0.9 * a));
      D.srect(-half, y, half * 2, 62 * U);
      D.fillColour(rgba(pl.accent, (0.12 + heat * 0.16) * a));
      D.frect(-half, y, half * 2, 62 * U);
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.7 * a));
      for (var g = 1; g < 6; g++) {
        D.line(-half + g * half * 2 / 6, y, -half + g * half * 2 / 6, y + 62);
      }
      if (q > 0.92) {
        var im = (q - 0.92) / 0.08;
        M.spray(57 + repeat, 0, y + 62, 16, 40 + im * 150, { size: 1.5, line: true });
        D.lw(1.5);
        D.strokeColour(rgba(pl.hot, 0.8 * a * (1 - im)));
        D.line(-W * 0.44, y + 62, W * 0.44, y + 62);
      }
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.6 * a));
      D.dim(half + 190, y0, half + 190, y, 'stroke ' + (62 + Math.round(q * 40)) + 'mm', 0, 13);
      M.register('force', (1.2 + q * 8.8 * (1 + heat)).toFixed(1), -W * 0.42, H * 0.40,
        { a: a * 0.9, unit: 'kN', width: 210, colour: rgba(pl.hot, 0.95) });
      return [0, 16 * q];
    },

    /* 2. r03 — an official stamp coming down and leaving a print. Authority
       applied to a word until the word is furniture. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var fall = E.inCubic(clamp(p / 0.34, 0, 1));
      var rebound = p < 0.34 ? 0 : Math.exp(-(p - 0.34) * 9) * Math.cos((p - 0.34) * 34) * 16;
      var y = lerp(-H * 0.42, H * 0.02, fall) - rebound;
      var press = clamp((p - 0.30) / 0.10, 0, 1);
      D.lw(4);
      D.strokeColour(rgba(pl.grid, 0.8 * a));
      D.line(0, -H * 0.46, 0, y - 44);
      D.lw(2.6);
      D.strokeColour(rgba(pl.accent, 0.9 * a));
      D.fillColour(rgba(pl.accent, 0.10 * a));
      D.ctx().beginPath();
      D.ctx().rect(-172 * U, y - 44, 344 * U, 66 * U);
      D.ctx().fill();
      D.ctx().stroke();
      D.lw(3.4);
      D.strokeColour(rgba(pl.accent, 0.8 * a));
      D.line(-100 * U, y + 22, 100 * U, y + 22);
      if (press > 0.02) {
        var pu = E.outCubic(press);
        D.lw(lerp(4, 1, pu));
        D.strokeColour(rgba(pl.hot, (1 - pu * 0.5) * a * 0.85));
        D.srect(-190 * U - pu * 130, y + 22 - pu * 26, (380 + pu * 260) * U, (52 + pu * 52) * U);
        M.spray(101 + repeat, 0, y + 40, 12, 60 + pu * 190, { size: 1.2 });
        D.lw(1.4);
        D.strokeColour(rgba(pl.hot, 0.9 * a));
        D.srect(-150 * U, H * 0.02, 300 * U, 76 * U);
        M.banner('APPROVED', 0, H * 0.02 + 26 * U, { px: 22, a: a * 0.9, track: 5 });
        M.sub('for execution  ·  serial ' + (101 + repeat), 0, H * 0.02 + 50 * U,
          { px: 12, a: a * 0.75 });
        M.sub('print density ' + (0.9 - heat * 0.35).toFixed(2), 0, H * 0.02 + 68 * U,
          { px: 11, a: a * 0.6 });
      }
      M.register('seal', press > 0.5 ? 'SEALED' : 'PENDING', -W * 0.42, H * 0.40,
        { a: a * 0.9, width: 220, colour: press > 0.5 ? rgba(pl.hot, 0.95) : undefined });
      return [0, 10];
    },

    /* 3. r04 — counting dots accumulating in rows. The act's arithmetic kept as
       decoration: a tally nobody reads and the machine cannot stop making. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var cols = 8, rows = 4, cw = 92 * U, ch = 58 * U;
      var ox = W * 0.30 - (cols - 1) * cw / 2, oy = -H * 0.26;
      var total = cols * rows;
      var filled = E.outCubic(clamp(p / 0.8, 0, 1)) * total;
      for (var r = 0; r < rows; r++) {
        var seq = 0;
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          var on = clamp(filled - i, 0, 1);
          if (on <= 0.02) continue;
          seq++;
          var x = ox + c * cw, y = oy + r * ch;
          D.fillColour(rgba(pl.hot, (0.5 + heat * 0.3) * a * on));
          D.fcircle(x, y, (4 + on * 5 + (i === Math.floor(filled) ? 5 : 0)) * U);
          D.lw(1);
          D.strokeColour(rgba(pl.grid, 0.45 * a * on));
          D.scircle(x, y, 15 * U);
        }
        if (seq > 1) {
          D.lw(2);
          D.strokeColour(rgba(pl.accent, 0.6 * a));
          D.line(ox + 3 * cw, oy + r * ch + 26 * U, ox + 6 * cw, oy + r * ch - 26 * U);
        }
        M.sub('group ' + (r + 1) + '  ·  ' + (seq === 0 ? 'nothing counted' : 'five each') +
          '  ·  n=' + seq * 5,
          ox - 96 * U, oy + r * ch + 4 * U, { px: 12, a: a * 0.7, align: 'right' });
      }
      M.register('counted', Math.round(filled * 5) + ' / ' + (total * 5), -W * 0.42, H * 0.40,
        { a: a * 0.9, width: 240, colour: rgba(pl.hot, 0.95) });
      return [0, -14];
    },

    /* 4. r05 — a warning triangle, thickening. The frame has stopped asking for
       permission and started advising bystanders. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var R = lerp(200, 300, heat) * U, cy = -40 * U;
      var grow = E.outCubic(clamp(p / 0.55, 0, 1));
      D.ctx().save();
      D.ctx().beginPath();
      D.ctx().moveTo(0, cy - R);
      D.ctx().lineTo(R * 0.94, cy + R * 0.72);
      D.ctx().lineTo(-R * 0.94, cy + R * 0.72);
      D.ctx().closePath();
      D.ctx().clip();
      D.lw(2.4 + heat * 3.6);
      D.strokeColour(rgba(pl.hot, 0.9 * a));
      var hz = D.ctx();
      hz.beginPath();
      for (var hx = -R; hx < R; hx += 44 * U) hz.moveTo(hx, cy - R);
      for (hx = -R; hx < R; hx += 44 * U) hz.lineTo(hx + R * 1.6, cy + R);
      hz.stroke();
      D.ctx().restore();
      D.lw(2.4 + heat * 2);
      D.strokeColour(rgba(pl.hot, (0.7 + 0.3 * (EM.onsetPulse(w.time, 0.5) || 0)) * a));
      D.ctx().beginPath();
      D.ctx().moveTo(0, cy - R * grow);
      D.ctx().lineTo(R * 0.94 * grow, cy + R * 0.72 * grow);
      D.ctx().lineTo(-R * 0.94 * grow, cy + R * 0.72 * grow);
      D.ctx().closePath();
      D.ctx().stroke();
      D.lw(2.6);
      D.strokeColour(rgba(pl.ink, 0.9 * a));
      D.line(0, cy - R * 0.30, 0, cy + R * 0.26);
      D.fillColour(rgba(pl.ink, 0.9 * a));
      D.fcircle(0, cy + R * 0.44, 5.5 * U);
      M.callout(R * 0.44, cy - R * 0.30, R * 0.94 + 150 * U, cy - R * 0.74,
        'severity ' + (heat * 9.9).toFixed(1) + ' / 10', { a: a * 0.85 });
      M.banner('STAND CLEAR', 0, cy + R * 0.72 + 40 * U, { px: 15, a: a * 0.8, track: 4 });
      return [0, 34];
    },

    /* 5. r06 — the word nested inside repetitions of itself. A recursion with
       no base case, which is all a loop is once nobody stops it. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var levels = 5;
      for (var i = 0; i < levels; i++) {
        var q = clamp(p / 0.5 - i * 0.06, 0, 1);
        if (q <= 0.01) continue;
        var sc = 0.34 + i * 0.16;
        var span = clamp(0.06 - i * 0.007, 0.012, 0.1) + clamp(heat, 0, 1) * 0.006;
        D.ctx().save();
        D.ctx().rotate((i % 2 ? 1 : -1) * (i * 0.02 + heat * i * 0.012));
        D.ctx().scale(sc, sc);
        D.lw(2.4);
        D.strokeColour(rgba(i === levels - 1 ? pl.hot : pl.grid, (0.38 - i * 0.045) * a * q));
        D.ctx().beginPath();
        D.ctx().rect(-W * 0.36, -H * 0.27, W * 0.72, H * 0.54);
        D.ctx().stroke();
        D.lw(1.2);
        D.strokeColour(rgba(pl.grid, (0.4 - i * 0.05) * a * q));
        D.ctx().beginPath();
        D.ctx().rect(-W * 0.36 + span * W, -H * 0.27 + span * H * 2,
                     W * 0.72 - span * W * 2, H * 0.54 - span * H * 4);
        D.ctx().stroke();
        D.ctx().restore();
        M.sub('depth ' + i + ' / recursion depth exceeded',
          -W * 0.38, -H * 0.30 + i * 18 * U, { px: 11, a: a * 0.6 * q, align: 'left' });
      }
      for (var d = 0; d < 3; d++) {
        M.banner('EXECUTE(EXECUTE(EXECUTE()))', 0, H * 0.30 + d * 20 * U,
          { px: 12, a: a * (0.5 - d * 0.13), track: 2 });
      }
      M.register('depth', levels + ' / unbounded', -W * 0.42, H * 0.40,
        { a: a * 0.9, width: 210, colour: rgba(pl.hot, 0.95) });
      return [0, 0];
    },

    /* 6. r07 — a fuse burning along a wire toward the word. One of the few
       pictures in the act with an obvious direction of travel, which is why the
       film uses it twice. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var x0 = -W * 0.44, head = lerp(x0, W * 0.20, E.outCubic(clamp(p / 0.82, 0, 1)));
      D.lw(3);
      D.strokeColour(rgba(pl.grid, 0.75 * a));
      D.ctx().beginPath();
      for (var i = 0; i <= 96; i++) {
        var u = i / 96, x = lerp(x0, W * 0.44, u);
        var wob = Math.sin(u * 15 + w.time * 1.7) * 15 * (1 - u * 0.5);
        var yy = 210 * U + wob;
        if (i === 0) D.ctx().moveTo(x, yy); else D.ctx().lineTo(x, yy);
      }
      D.ctx().stroke();
      D.lw(3.4);
      D.strokeColour(rgba(pl.hot, 0.9 * a));
      D.line(x0, 210 * U, head, 210 * U);
      for (i = 0; i < 16; i++) {
        var bx = lerp(x0, head, i / 16);
        D.lw(1.2);
        D.strokeColour(rgba(pl.grid, 0.5 * a));
        D.line(bx, 210 * U, bx + 9 * U, 210 * U - 22 * U - (i % 3) * 7);
      }
      var live = clamp(1 - Math.abs(p - 0.82) / 0.25, 0, 1);
      D.fillColour(rgba(pl.ink, 0.95 * a));
      D.fcircle(head, 210 * U, (3 + live * 4) * U);
      D.lw(2);
      D.strokeColour(rgba(pl.hot, (0.6 + live * 0.4) * a));
      D.scircle(head, 210 * U, (9 + live * 16 + heat * 8) * U);
      M.spray(211 + repeat, head, 210 * U, 14, 34 + heat * 60, { size: 1.4, line: true });
      M.sub('burn ' + (p * 100).toFixed(0) + '%   ·   rate ' + (0.9 + heat * 1.6).toFixed(2) + ' m/s',
        head, 210 * U + 40 * U, { px: 12, a: a * 0.8 });
      M.register('fuse', (clamp(1 - p, 0, 1) * 3.2).toFixed(2), -W * 0.42, H * 0.40,
        { a: a * 0.9, unit: 'm left', width: 220 });
      return [0, 24];
    },

    /* 7. r08 — a hand typing it. The machine's sentence and a human keyboard
       meeting at the same word, which is the whole song in one image. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var cy = 150 * U;
      for (var i = 0; i < 22; i++) {
        var col = i % 11, row = (i / 11) | 0;
        var kx = (col - 5) * 54 * U, ky = cy + row * 44 * U;
        var hit = clamp(1 - Math.abs(p * 1.6 - (col / 11 + row * 0.22)) * 6, 0, 1);
        D.lw(1.2);
        D.strokeColour(rgba(pl.grid, (0.4 + hit * 0.5) * a));
        D.srect(kx - 22 * U, ky - 16 * U, 44 * U, 32 * U);
        if (hit > 0.15) {
          D.fillColour(rgba(pl.hot, 0.7 * a * hit));
          D.frect(kx - 22 * U, ky - 16 * U, 44 * U, 32 * U);
          D.lw(1.4);
          D.strokeColour(rgba(pl.hot, 0.65 * a * hit));
          D.scircle(kx, ky, 18 * U + (1 - hit) * 40);
        }
      }
      for (var hIdx = 0; hIdx < 2; hIdx++) {
        var dir = hIdx ? 1 : -1;
        var bob = Math.sin(w.time * 7.5 + hIdx * 2.1) * 7;
        var ox = dir * (120 + hIdx * 30) * U, oy = cy - 66 * U + bob;
        D.ctx().save();
        D.ctx().translate(ox, oy);
        D.ctx().scale(dir, 1);
        D.lw(1.8);
        D.strokeColour(rgba(pl.accent, 0.65 * a));
        D.path([
          [18, 0],
          [58, -10, 74, 10],
          [86, 26],
          [30, 34, -6, 22]
        ], true);
        D.lw(1.4);
        D.strokeColour(rgba(pl.grid, 0.6 * a));
        for (var f = 0; f < 4; f++) {
          var fx = -2 + f * 20;
          D.line(fx, 16, fx + 6, 44 + f * 5);
        }
        D.ctx().restore();
      }
      M.sub('input  ·  manual override  ·  keystroke ' + (repeat + 1) +
        '  ·  delay ' + (40 + heat * 260).toFixed(0) + 'ms', 0, cy + 116 * U, { px: 12, a: a * 0.75 });
      return [0, -30];
    },

    /* 8. r09 — a collapsing grid. Cells dropping out in hashed order, which is
       what a machine looks like when it can no longer hold a structure. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var cols = 7, rows = 5, cw = 138 * U, ch = 78 * U;
      var ox = -W * 0.30 - (cols - 1) * cw / 2, oy = -H * 0.28;
      var drop = E.outCubic(clamp(p / 0.7, 0, 1)) * (0.35 + heat * 0.45);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          var gone = hash(i * 7331 + 17) < drop;
          var x = ox + c * cw, y = oy + r * ch;
          D.lw(1);
          if (gone) {
            D.dash([3, 5]);
            D.strokeColour(rgba(pl.hot, 0.45 * a));
            D.srect(x - cw * 0.42, y - ch * 0.36, cw * 0.84, ch * 0.72);
            D.dash([]);
            var dx = (hash(i * 313 + 3) - 0.5) * 60 * (0.4 + heat);
            D.lw(1.6);
            D.strokeColour(rgba(pl.hot, 0.75 * a));
            D.line(x - 14 + dx, y - 12, x + 14 + dx, y + 12);
            D.line(x + 14 + dx, y - 12, x - 14 + dx, y + 12);
          } else {
            D.strokeColour(rgba(pl.accent, 0.28 * a));
            D.srect(x - cw * 0.42, y - ch * 0.36, cw * 0.84, ch * 0.72);
            D.lw(1.2);
            D.strokeColour(rgba(pl.grid, 0.5 * a));
            D.line(x - cw * 0.42, y + ch * 0.36, x + cw * 0.42, y + ch * 0.36);
            D.line(x + cw * 0.42, y + ch * 0.36, x + cw * 0.42 + 26 * U, y + ch * 0.36 + 20 * U);
          }
        }
      }
      M.register('cells lost', Math.round(drop * 35) + ' / 35', -W * 0.42, H * 0.40,
        { a: a * 0.9, width: 230, colour: rgba(pl.hot, 0.95) });
      M.spray(307 + repeat, -W * 0.30, 0, 10, 320, { size: 1.1 });
      return [0, 0];
    },

    /* 9. r10 — a six-language counting column in the middle of the storm. Six
       numeral systems counting the same seconds, none of them used by any later
       instruction: the act's one joke, and not a kind one. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var rows = 6, y0 = -H * 0.30, step = 62 * U, x = -W * 0.30;
      var idx = Math.floor(E.outCubic(clamp(p / 0.8, 0, 1)) * rows + 0.001);
      var names = ['ROMAN', 'ARABIC', 'TALLY', 'BINARY', 'DOTS', 'CUNEIFORM'];
      for (var i = 0; i < rows; i++) {
        var y = y0 + i * step;
        var act = idx === i;
        D.lw(1);
        D.strokeColour(rgba(pl.grid, (act ? 0.6 : 0.3) * a));
        D.dash([2, 4]);
        D.line(x - 40, y + 12, x + 380, y + 12);
        D.dash([]);
        M.sub(names[i], x - 60, y + 4, { px: 12, a: a * (act ? 0.95 : 0.6), align: 'right' });
        var col = rgba(act ? pl.hot : pl.accent, (act ? 0.95 : 0.6) * a);
        var s = 1 + i;
        if (i === 0) seqRow('I II III IV V VI VII', x, y, 19, col, 'left');
        else if (i === 1) seqRow((s * 7) + ', ' + (s * 7 + 1) + ', ' + (s * 7 + 2), x, y, 19, col, 'left');
        else if (i === 2) {
          for (var g = 0; g < 3; g++) {
            var bx = x + g * 70 * U;
            D.lw(2);
            D.strokeColour(col);
            for (var k = 0; k < 4; k++) D.line(bx + k * 9 * U, y + 8, bx + k * 9 * U, y - 18);
            D.line(bx - 3, y - 4, bx + 31, y - 12);
          }
        } else if (i === 3) seqRow('1011 1100 0101 0111', x, y, 19, col, 'left');
        else if (i === 4) {
          for (var d = 0; d < 3; d++) {
            for (var e2 = 0; e2 < 3; e2++) {
              D.fillColour(col);
              D.fcircle(x + d * 44 * U, y - 8 + e2 * 11 * U, 3.6 * U);
            }
          }
        } else {
          for (var cu = 0; cu < 4; cu++) {
            var cx2 = x + cu * 40 * U;
            D.lw(1.8);
            D.strokeColour(col);
            D.line(cx2, y - 18, cx2 + 20, y - 22);
            D.line(cx2, y - 6, cx2 + 20, y - 10);
            D.line(cx2, y + 6, cx2 + 20, y + 2);
            D.line(cx2, y - 20, cx2 + 20, y + 6);
          }
        }
      }
      M.sub('the count is not used by any later instruction', x, y0 + rows * step + 6 * U,
        { px: 12, a: a * 0.7, align: 'left' });
      return [0, -40];
    },

    /* 10. r11 — cracks spreading through the frame. M.fracture doing the film's
        signature job: breaking without falling apart. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var k = 3 + repeat;
      for (var i = 0; i < k; i++) {
        var q = clamp(p * 1.9 - i * 0.06, 0.08, 1);
        M.fracture(0, -30 * U, (300 + i * 42) * U, 41 + i * 13 + repeat, {
          segs: 6 + (i % 3),
          angle: i / k * TAU + w.time * 0.05,
          width: 1.6 + heat * 2,
          colour: rgba(pl.hot, 0.5 * a * q + 0.2 * a)
        });
      }
      D.lw(1.2);
      D.strokeColour(rgba(pl.grid, 0.4 * a));
      D.reticle(0, -30 * U, lerp(320, 380, heat) * U, w.time * 0.2);
      D.lw(1);
      D.strokeColour(rgba(pl.accent, 0.5 * a));
      D.scircle(0, -30 * U, (180 + Math.sin(w.time * 2) * 8) * U);
      M.spray(401 + repeat, 0, -30 * U, 12 + repeat, 380, { size: 1.2 });
      M.callout(120, -120, 470, -280, 'fault ' + (repeat + 1) + '  ·  propagation ' +
        (1.1 + heat * 2.4).toFixed(1) + ' km/s', { a: a * 0.85 });
      M.register('integrity', (1 - heat * 0.9).toFixed(3), -W * 0.42, H * 0.40,
        { a: a * 0.9, width: 230, colour: rgba(pl.hot, 0.95) });
      return [0, 0];
    },

    /* 11. r12 — the word rasterising into scanline bands. The most literal
        "the machine is losing the picture" plate in the film. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var bands = 30, disp = 22 + heat * 70;
      for (var i = 0; i < bands; i++) {
        var yy = -H * 0.30 + i * (H * 0.60 / bands);
        var r1 = hash(i * 977 + Math.floor(w.time / 0.05) * 13);
        var dx = (r1 - 0.5) * 2 * disp;
        var hgt = H * 0.60 / bands * 0.55;
        D.fillColour(rgba(r1 < 0.16 ? pl.hot : pl.accent, (r1 < 0.16 ? 0.30 : 0.12) * a));
        D.frect(-W * 0.46 + dx, yy, W * 0.92, hgt);
        D.lw(1);
        D.strokeColour(rgba(pl.grid, 0.22 * a));
        D.srect(-W * 0.46 + dx, yy, W * 0.92, hgt);
      }
      D.lw(1.2);
      D.strokeColour(rgba(pl.hot, 0.7 * a));
      D.line(-W * 0.46, -H * 0.30, W * 0.46, -H * 0.30);
      D.line(-W * 0.46, H * 0.30, W * 0.46, H * 0.30);
      M.sub('scan ' + Math.floor(w.time * 60) + '  ·  sync ' +
        (storm(w, heat, 0.05, 0.7) < 0.85 ? 'LOST' : 'OK'), W * 0.40, -H * 0.32,
        { px: 12, a: a * 0.7, align: 'right' });
      return [0, 0];
    },

    /* 12. r13 — the frame itself cracking: long jagged faults running all the
        way off the stage. The picture is no longer a window, it is a surface. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var n = 6;
      for (var i = 0; i < n; i++) {
        var q = clamp((p - i * 0.05) / 0.45, 0, 1);
        if (q <= 0.01) continue;
        M.fracture(0, 0, (600 + i * 90) * U, 71 + i * 17 + repeat * 3, {
          segs: 9,
          angle: i / n * TAU + 0.4,
          width: 1.4 + heat * 2.6,
          colour: rgba(i % 2 ? pl.hot : pl.accent, 0.45 * a * q)
        });
      }
      D.lw(4);
      D.strokeColour(rgba([8, 10, 14], 0.35 * a));
      D.line(-W * 0.5, -H * 0.30, W * 0.5, -H * 0.24);
      D.line(-W * 0.5, H * 0.36, W * 0.5, H * 0.30);
      M.spray(503 + repeat, 0, 0, 22, 720, { size: 1.4 });
      for (var g = 0; g < 3; g++) {
        M.sub('FAULT 0x' + (((repeat * 3 + g) * 40503) % 65536).toString(16).toUpperCase(),
          -W * 0.42 + g * 210 * U, H * 0.42, { px: 12, a: a * 0.65 });
      }
      return [0, 0];
    },

    /* 13. r14 — full bleed. The word enormous, the whole frame the letterforms.
        The act's one moment of pure volume. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      D.ctx().save();
      D.ctx().beginPath();
      D.ctx().rect(-W * 0.5, -H * 0.5, W, H);
      D.ctx().clip();
      D.fillColour(rgba(pl.hot, 0.05 * a));
      D.frect(-W * 0.5, -H * 0.5, W, H);
      var bw = D.measure(WORD, 300, '700');
      D.lw(120 + heat * 60);
      D.strokeColour(rgba(pl.hot, 0.16 * a));
      D.ctx().beginPath();
      D.ctx().rect(-bw / 2, -190 * U, bw, 380 * U);
      D.ctx().stroke();
      D.lw(2);
      D.strokeColour(rgba(pl.grid, 0.20 * a));
      for (var i = 0; i < 26; i++) {
        var yy = -H * 0.5 + i * (H / 26) + (w.time * 40) % (H / 26);
        D.line(-W * 0.5, yy, W * 0.5, yy);
      }
      D.ctx().restore();
      M.sub('scale 1:1  ·  bleed to edge  ·  no margin left', 0, H * 0.44,
        { px: 12, a: a * 0.6 });
      return [0, 0];
    },

    /* 14. r15 — repeated at increasing density until it is a texture. The word
        stops being a word and becomes the material the frame is made of. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var cols = 5, rows = 10, px = 16 + heat * 5;
      var cw = W * 0.88 / cols, ch = H * 0.80 / rows;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var on = clamp(p * 1.5 - (r + c) / (rows + cols) * 1.1, 0, 1);
          if (on <= 0.02) continue;
          var g = hash((r * cols + c) * 7331 + 7) < heat * 0.22 ? 0 : 1;
          var x = -W * 0.44 + (c + 0.5) * cw + (g ? 0 : (hash(r * 31 + c) - 0.5) * 18);
          var y = -H * 0.40 + (r + 0.5) * ch;
          D.font(px, '700');
          D.ctx().textAlign = 'center';
          D.fillColour(rgba(c % 3 === 0 ? pl.hot : pl.grid, (0.20 + heat * 0.30) * a * on * g));
          D.text(WORD, x, y);
        }
      }
      D.lw(1);
      D.strokeColour(rgba(pl.hot, 0.25 * a));
      for (var k = 0; k < 8; k++) {
        var yy = -H * 0.40 + k * (H * 0.80 / 8);
        D.line(-W * 0.46, yy, W * 0.46, yy);
      }
      M.sub('density ' + (2.0 + heat * 6).toFixed(2) + ' per cell  ·  50 instances',
        0, H * 0.44, { px: 12, a: a * 0.6 });
      return [0, 0];
    },

    /* 15. r16 — quiet and wide. One lit window in an otherwise black frame,
        after the storm has taken everything else. The last one, exhausted, and
        the only plate in the run that is not trying to be loud. */
    function (w, p, a, repeat, heat) {
      var pl = PAL();
      var warm = clamp(w.warm || 0, 0, 1);
      var wx = -W * 0.11, wy = -H * 0.05, ww = W * 0.055, wh = H * 0.095;
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.10 * a));
      D.srect(-W * 0.20, -H * 0.26, W * 0.40, H * 0.52);
      for (var r = 0; r < 6; r++) {
        D.strokeColour(rgba(pl.grid, 0.13 * a));
        D.line(-W * 0.20, -H * 0.26 + r * (H * 0.52 / 6), W * 0.20, -H * 0.26 + r * (H * 0.52 / 6));
      }
      for (var c = 1; c < 5; c++) {
        D.line(-W * 0.20 + c * (W * 0.40 / 5), -H * 0.26, -W * 0.20 + c * (W * 0.40 / 5), H * 0.26);
      }
      var lit = 0.55 + 0.45 * (EM.onsetPulse(w.time, 0.7) || 0.4);
      D.fillColour(rgba(pl.hot, 0.07 * a * lit));
      D.fcircle(wx + ww / 2, wy + wh / 2, ww * 5.5);
      D.fillColour(rgba([246, 236, 216], (0.30 + warm * 0.5) * a * lit));
      D.frect(wx, wy, ww, wh);
      D.lw(1.4);
      D.strokeColour(rgba(pl.grid, 0.5 * a));
      D.srect(wx, wy, ww, wh);
      D.lw(1);
      D.line(wx + ww / 2, wy, wx + ww / 2, wy + wh);
      D.line(wx, wy + wh * 0.45, wx + ww, wy + wh * 0.45);
      for (var i = 0; i < 20; i++) {
        var hx2 = hash(i * 331 + 11);
        if (hx2 < 0.8) continue;
        D.fillColour(rgba(pl.grid, 0.16 * a));
        D.frect(-W * 0.16 + hx2 * W * 0.30, -H * 0.18 + hash(i * 977 + 3) * H * 0.34, 16, 12);
      }
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.14 * a));
      D.line(-W * 0.42, H * 0.16, W * 0.42, H * 0.16);
      M.sub('one window still lit  ·  everyone else has gone', 0, H * 0.32,
        { px: 12, a: a * 0.6 });
      return [0, 60];
    }
  ];

  function execPlate(repeat) {
    var v = VARIANTS[repeat % VARIANTS.length];
    return [
      { l: 30, e: function (w, p, cue) {
        var a = 0.06 + 0.94 * vis(p, 0.10);
        if (a <= 0.004) return;
        v(w, p, a, repeat, clamp(repeat / (RUN - 1), 0, 1));
      } },
      { l: 14, e: function (w, p, cue) {
        var a = 0.06 + 0.94 * vis(p, 0.10);
        if (a <= 0.004) return;
        var heat = clamp(repeat / (RUN - 1), 0, 1);
        stormShared(repeat, heat, w, p, a, null);
      } },
      { l: 44, e: function (w, p, cue) {
        var a = 0.06 + 0.94 * vis(p, 0.10);
        if (a <= 0.004) return;
        var heat = clamp(repeat / (RUN - 1), 0, 1);
        var pl = PAL();
        M.register('mech', VARTAG[repeat % VARTAG.length], -W * 0.42, -H * 0.42,
          { a: a * 0.9, width: 250 });
        M.register('drift', (heat * 100).toFixed(0), -W * 0.42, -H * 0.42 + 20,
          { a: a * 0.9, width: 250, unit: '%', colour: rgba(pl.hot, 0.95) });
        M.banner('EXECUTION ' + (repeat + 1).toString().padStart(2, '0') + ' / 16',
          W * 0.42, -H * 0.42, { px: 13, a: a * 0.75, align: 'right', track: 3 });
        /* the trace of the storm so far, one line per execution, drawn off the
           shared noise field so all sixteen traces belong to one signal */
        var c2 = D.ctx();
        D.lw(1.4);
        D.strokeColour(rgba(pl.accent, 0.4 * a * storm(w, heat, 0.12, 0.5)));
        c2.beginPath();
        for (var i = 0; i <= 64; i++) {
          var x = -W * 0.46 + i / 64 * W * 0.92;
          var y = H * 0.30 + (noise(i * 0.08 + repeat * 3.1, w.time * 0.9) - 0.5) * (12 + heat * 54);
          if (i === 0) c2.moveTo(x, y); else c2.lineTo(x, y);
        }
        c2.stroke();
        D.fillColour(rgba(pl.hot, 0.7 * a));
        D.dot(0, H * 0.30 + (noise(repeat * 3.1, w.time * 0.9) - 0.5) * (12 + heat * 54), 2.6);
      } }
    ];
  }

  for (var r = 0; r < RUN; r++) {
    S('xs.r' + (r + 1).toString().padStart(2, '0'), execPlate(r));
  }

  /* ==========================================================================
     02:38.90 — Ein, dos / Trois, ne / Fem, liù
     Six languages count at once and none of them is the machine's language. The
     three plates are one picture continued: the same six rows, the same six
     registers, with the active register walking down the stack. The numbers are
     irrelevant to the machine — that is the joke, and the horror.
     ======================================================================== */
  function languages(active, title, sub) {
    return [
      { l: 20, e: function (w, p) {
        var a = 0.06 + 0.94 * vis(p, 0.10);
        if (a <= 0.004) return;
        var q = E.outCubic(clamp(p / 0.55, 0, 1));
        var x0 = -W * 0.36, x1 = W * 0.36;
        D.lw(2.4);
        D.strokeColour(rgba(PAL().grid, 0.7 * a));
        D.line(x0 - 40 * U, -H * 0.34 * q, x0 - 40 * U, H * 0.34 * q);
        D.line(x1 + 40 * U, -H * 0.34 * q, x1 + 40 * U, H * 0.34 * q);
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.35 * a));
        D.line(x0 - 40 * U, -H * 0.34 * q, x1 + 40 * U, -H * 0.34 * q);
        D.line(x0 - 40 * U, H * 0.34 * q, x1 + 40 * U, H * 0.34 * q);
      } },

      { l: 34, e: function (w, p) {
        var a = 0.06 + 0.94 * vis(p, 0.10);
        if (a <= 0.004) return;
        var pl = PAL();
        var rows = 6, y0 = -H * 0.26, step = 62 * U, x = -W * 0.34;
        var names = ['ROMAN', 'ARABIC', 'TALLY', 'BINARY', 'DOTS', 'CUNEIFORM'];
        for (var i = 0; i < rows; i++) {
          var on = stag(p, i, rows, 0.55);
          if (on <= 0.01) continue;
          var y = y0 + i * step;
          var act = i === active;
          D.ctx().globalAlpha = clamp(on, 0, 1);
          D.lw(1);
          D.strokeColour(rgba(pl.grid, (act ? 0.65 : 0.3) * a));
          D.dash([2, 4]);
          D.line(x - 60, y + 14, x + 420, y + 14);
          D.dash([]);
          M.sub(names[i], x - 80, y + 4, { px: 12, a: a * (act ? 0.95 : 0.55), align: 'right' });
          var col = rgba(act ? pl.hot : pl.accent, (act ? 0.95 : 0.55) * a);
          if (i === 0) seqRow('I II III IV V VI VII VIII', x, y, 19, col, 'left');
          else if (i === 1) seqRow('1, 2, 3, 4, 5, 6, 7, 8', x, y, 19, col, 'left');
          else if (i === 2) {
            for (var g = 0; g < 3; g++) {
              var bx = x + g * 74 * U;
              D.lw(2);
              D.strokeColour(col);
              for (var k = 0; k < 4; k++) D.line(bx + k * 9 * U, y + 8, bx + k * 9 * U, y - 18);
              D.line(bx - 3, y - 4, bx + 31, y - 12);
            }
          } else if (i === 3) seqRow('0001 0010 0011 0100', x, y, 19, col, 'left');
          else if (i === 4) {
            for (var d = 0; d < 4; d++) {
              for (var e2 = 0; e2 < 3; e2++) {
                D.fillColour(col);
                D.fcircle(x + d * 40 * U, y - 8 + e2 * 11 * U, 3.6 * U);
              }
            }
          } else {
            for (var cu = 0; cu < 5; cu++) {
              var cx2 = x + cu * 36 * U;
              D.lw(1.8);
              D.strokeColour(col);
              D.line(cx2, y - 18, cx2 + 18, y - 22);
              D.line(cx2, y - 6, cx2 + 18, y - 10);
              D.line(cx2, y + 6, cx2 + 18, y + 2);
              D.line(cx2, y - 20, cx2 + 18, y + 6);
            }
          }
          M.sub('group ' + ((i + 1) * 6) + '  ·  unused', x + 460, y + 4,
            { px: 11, a: a * 0.45, align: 'left' });
          D.ctx().globalAlpha = 1;
        }
        M.register('registers', rows + ' / ' + rows, -W * 0.42, H * 0.42,
          { a: a * 0.9, width: 240 });
      } },

      { l: 62, e: function (w, p) {
        var a = 0.06 + 0.94 * vis(p, 0.10);
        if (a <= 0.004) return;
        var pl = PAL();
        var pop = E.pop(clamp(p / 0.4, 0, 1));
        D.ctx().save();
        D.ctx().scale(lerp(1.2, 1, pop), lerp(1.2, 1, pop));
        M.keyword(title, 0, -H * 0.40, {
          a: a, px: 52, weight: '700',
          fill: rgba(pl.ink, 0.95 * a),
          stroke: rgba(pl.hot, 0.5 * a), strokeW: 1.4,
          track: 6
        });
        D.ctx().restore();
        M.sub(sub, 0, H * 0.42, { px: 13, a: a * 0.75 });
        M.banner('COUNTING IS NOT AN INSTRUCTION', 0, H * 0.46,
          { px: 12, a: a * 0.5, track: 3 });
      } }
    ];
  }

  S('xs.count1', languages(0, 'EIN, DOS', 'one, two  ·  the machine is not listening'));
  S('xs.count2', languages(2, 'TROIS, NE', 'three, four  ·  the machine is not listening'));
  S('xs.count3', languages(5, 'FEM, LIÙ', 'five, six  ·  the machine is not listening'));

  /* ==========================================================================
     02:42.63 — If I can
     The conditional has come back, and it has not survived the last three
     minutes. The same decision shape the film drew at 01:58, now in the alarm
     colour and visibly strained: the edges pull inward, the vertices disagree.
     ======================================================================== */
  S('xs.ifIcan4', [
    { l: 22, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var q = E.outCubic(clamp(p / 0.45, 0, 1));
      var rx = lerp(60, 250, q), ry = lerp(40, 160, q);
      var strain = 0.10 + clamp(w.heat, 0, 1) * 0.20;
      var pts = [[0, -ry], [rx, 0], [0, ry], [-rx, 0]];
      for (var i = 0; i < 4; i++) {
        var p0 = pts[i], p1 = pts[(i + 1) % 4];
        for (var k = 0; k < 8; k++) {
          var u = k / 8, u2 = (k + 1) / 8;
          var ax = lerp(p0[0], p1[0], u) + (hash(i * 97 + k * 13) - 0.5) * rx * strain;
          var ay = lerp(p0[1], p1[1], u) + (hash(i * 51 + k * 29) - 0.5) * ry * strain;
          var bx = lerp(p0[0], p1[0], u2) + (hash(i * 97 + (k + 1) * 13) - 0.5) * rx * strain;
          var by = lerp(p0[1], p1[1], u2) + (hash(i * 51 + (k + 1) * 29) - 0.5) * ry * strain;
          D.lw(2.2);
          D.strokeColour(rgba(pl.hot, (0.30 + k * 0.07) * a));
          D.line(ax, ay, bx, by);
        }
      }
      D.lw(3);
      D.strokeColour(rgba(pl.hot, 0.95 * a));
      D.ctx().beginPath();
      D.ctx().moveTo(pts[0][0], pts[0][1]);
      D.ctx().lineTo(pts[1][0], pts[1][1]);
      D.ctx().lineTo(pts[2][0], pts[2][1]);
      D.ctx().lineTo(pts[3][0], pts[3][1]);
      D.ctx().closePath();
      D.ctx().stroke();
      M.banner('IF', 0, -ry - 26 * U, { px: 22, a: a, track: 6, colour: rgba(pl.hot, 0.95) });
      M.banner('THEN', 0, ry + 40 * U, { px: 22, a: a, track: 6, colour: rgba(pl.hot, 0.95) });
      D.lw(2);
      D.strokeColour(rgba(pl.accent, 0.75 * a));
      D.line(-rx, 0, -rx - 70, 0);
      D.line(rx, 0, rx + 70, 0);
      D.fillColour(rgba(pl.accent, 0.75 * a));
      D.fcircle(-rx - 70, 0, 4);
      D.fcircle(rx + 70, 0, 4);
    } },

    { l: 36, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      M.fracture(0, 0, 90 * U, 17, {
        segs: 7, angle: 0.7, width: 2,
        colour: rgba(pl.hot, 0.85 * a)
      });
      M.pulseRings(0, 0, w.time, { a: a * 0.5, r0: 60, spread: 320 });
      M.spray(613, 0, 0, 14, 260, { size: 1.3, line: true });
      M.callout(0, -90, 340, -220, 'condition has not recovered', { a: a * 0.85 });
      M.register('eval', 'STRAINED', -W * 0.42, H * 0.42,
        { a: a, width: 250, colour: rgba(pl.hot, 0.95) });
    } },

    { l: 64, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      M.banner('IF I CAN', 0, H * 0.43, { px: 19, a: a * 0.9, track: 5 });
    } }
  ]);

  /* ==========================================================================
     02:43.32 — If I can give them all the
     A distribution. One source fanning out to many recipients: the machine
     offering the same thing to everyone, which is what it thinks generosity is.
     ======================================================================== */
  S('xs.givethem', [
    { l: 20, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var N = 12;
      var sx = -W * 0.42, sy = 0;
      var cx = -W * 0.22, cy = 0;
      D.lw(2.4);
      D.strokeColour(rgba(pl.accent, 0.9 * a));
      D.srect(sx, sy - 66, 30 * U, 132 * U);
      D.fillColour(rgba(pl.hot, 0.35 * a));
      D.frect(sx + 3, sy - 62, 24 * U, 124 * U);
      M.sub('source', sx - 6, sy + 92 * U, { px: 12, a: a * 0.8, align: 'left' });
      for (var i = 0; i < N; i++) {
        var q = clamp(p * 1.7 - i * 0.02, 0, 1);
        if (q <= 0.01) continue;
        var rx = W * 0.10 + (i % 3) * 170 * U;
        var ry = -180 * U + ((i / 3) | 0) * 120 * U;
        D.lw(1.1);
        D.strokeColour(rgba(pl.grid, 0.4 * a * q));
        D.line(sx + 30, sy, cx + (rx - cx) * q, cy + (ry - cy) * q);
        D.lw(1.4);
        D.strokeColour(rgba(q > 0.96 ? pl.hot : pl.grid, (q > 0.96 ? 0.9 : 0.5) * a));
        D.srect(rx - 62 * U, ry - 32 * U, 124 * U, 64 * U);
        if (q > 0.96) {
          D.fillColour(rgba(pl.hot, 0.22 * a));
          D.frect(rx - 62 * U, ry - 32 * U, 124 * U, 64 * U);
        }
        M.sub('' + (i + 1), rx - 62 * U, ry - 40 * U, { px: 11, a: a * 0.6, align: 'left' });
      }
    } },

    { l: 40, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var N = 12;
      var arrived = clamp(p * 1.7 - 1.0, 0, 1) * N;
      for (var i = 0; i < N; i++) {
        if (arrived <= i) continue;
        var rx = W * 0.10 + (i % 3) * 170 * U - 52 * U;
        var ry = -180 * U + ((i / 3) | 0) * 120 * U;
        D.font(13, '700');
        D.ctx().textAlign = 'left';
        D.fillColour(rgba(pl.ink, 0.9 * a));
        D.text(WORD, rx, ry + 5);
      }
      M.gauge(-W * 0.40, H * 0.34, W * 0.52, 12 * U, arrived / N,
        'distributed  ' + Math.round(arrived) + ' / ' + N + '  recipients',
        { a: a, colour: rgba(pl.hot, 0.9) });
    } },

    { l: 64, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      M.banner('IF I CAN GIVE THEM ALL THE', 0, -H * 0.42, { px: 17, a: a * 0.9, track: 5 });
      M.keyword(WORD, 0, H * 0.24, {
        a: a, px: 92, weight: '700',
        fill: rgba(pl.ink, 0.95 * a),
        stroke: rgba(pl.hot, 0.6 * a), strokeW: 2,
        track: 8
      });
    } }
  ]);

  /* ==========================================================================
     02:46.02 — Then I can
     The conclusion arrives stamped. The same word, the same sentence, and this
     time the machine has decided it has proved something.
     ======================================================================== */
  S('xs.thenIcan', [
    { l: 24, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var q = E.pop(clamp(p / 0.4, 0, 1));
      D.lw(3);
      D.strokeColour(rgba(pl.accent, 0.9 * a));
      D.srect(-W * 0.24, -H * 0.20, W * 0.48, H * 0.40);
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.4 * a));
      D.srect(-W * 0.24 + 14, -H * 0.20 + 14, W * 0.48 - 28, H * 0.40 - 28);
      D.ctx().save();
      D.ctx().scale(lerp(1.3, 1, q), lerp(1.3, 1, q));
      M.keyword('THEN I CAN', 0, -H * 0.24, {
        a: a, px: 44, weight: '700', fill: rgba(pl.ink, 0.95 * a), track: 4
      });
      D.ctx().restore();
    } },

    { l: 44, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var press = clamp((p - 0.28) / 0.12, 0, 1);
      D.ctx().save();
      D.ctx().rotate((1 - press) * 0.22 - 0.05);
      D.ctx().scale(lerp(1.4, 1, press), lerp(1.4, 1, press));
      D.lw(3.4);
      D.strokeColour(rgba(pl.hot, 0.92 * a));
      D.srect(-380 * U, -70 * U, 760 * U, 140 * U);
      M.banner('BE YOUR', 0, -34 * U, { px: 20, a: a * 0.9, track: 6 });
      M.banner(WORD, 0, 26 * U, { px: 30, a: a, track: 8, colour: rgba(pl.hot, 0.95) });
      M.sub('stamped  ·  registered  ·  no appeal', 0, 54 * U, { px: 12, a: a * 0.7 });
      D.ctx().restore();
      M.spray(719, 0, 0, 12, 300, { size: 1.2 });
    } },

    { l: 66, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      M.register('conclusion', 'STAMPED', -W * 0.42, H * 0.40,
        { a: a, width: 250, colour: rgba(pl.hot, 0.95) });
      M.sub('therefore, the sentence may be carried out', -W * 0.42, H * 0.40 + 20,
        { px: 12, a: a * 0.6, align: 'left' });
    } }
  ]);

  /* ==========================================================================
     02:47.02 — Then I can be your only
     Exclusivity as a cage. One shape holds the word; everything else in the
     frame is crossed out, padlocked and labelled as not selected.
     ======================================================================== */
  S('xs.only', [
    { l: 22, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var c = D.ctx();
      D.lw(1.6);
      D.strokeColour(rgba(pl.grid, 0.5 * a));
      c.beginPath();
      for (var i = 0; i < 6; i++) {
        var ang = -Math.PI / 2 + i / 6 * TAU;
        var nx = Math.cos(ang) * 330 * U, ny = Math.sin(ang) * 330 * U;
        if (i === 0) c.moveTo(nx, ny); else c.lineTo(nx, ny);
      }
      c.closePath();
      c.stroke();
      var others = [[-470, -230], [470, -230], [-470, 230], [470, 230]];
      for (i = 0; i < others.length; i++) {
        var o = others[i];
        D.lw(1.2);
        D.strokeColour(rgba(pl.grid, 0.45 * a));
        D.srect(o[0] - 78, o[1] - 42, 156, 84);
        D.lw(2);
        D.strokeColour(rgba(pl.hot, 0.85 * a));
        D.line(o[0] - 66, o[1] - 32, o[0] + 66, o[1] + 32);
        D.line(o[0] + 66, o[1] - 32, o[0] - 66, o[1] + 32);
        M.sub('excluded', o[0], o[1] + 62, { px: 11, a: a * 0.6 });
      }
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.35 * a));
      D.line(-W * 0.46, H * 0.26, W * 0.46, H * 0.26);
      M.sub('one holder only  ·  all other references invalidated', 0, H * 0.30,
        { px: 12, a: a * 0.65 });
    } },

    { l: 46, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var held = between(p, 0.30, 1.0);
      var rect = M.keyword(WORD, 0, 56 * U, {
        a: a, px: 74, weight: '700',
        fill: rgba(held > 0.4 ? pl.hot : pl.ink, 0.95 * a),
        stroke: rgba(pl.hot, 0.5 * a), strokeW: 1.6,
        bracket: true, measure: false
      });
      if (held > 0.02 && rect && rect.w) {
        var cage = lerp(rect.w + 300, rect.w + 56, held);
        D.lw(2.6);
        D.strokeColour(rgba(pl.hot, 0.85 * a * held));
        D.srect(-cage / 2, 56 * U - 62, cage, 124 * U);
        D.lw(1.2);
        D.strokeColour(rgba(pl.accent, 0.5 * a * held));
        D.line(-cage / 2, 56 * U - 62, -cage / 2 + 24, 56 * U - 62);
        D.line(cage / 2, 56 * U + 62, cage / 2 - 24, 56 * U + 62);
      }
      D.lw(1.4);
      D.strokeColour(rgba(pl.hot, 0.8 * a));
      D.scircle(0, 56 * U - 100, 26 * U);
      D.srect(-14 * U, 56 * U - 100, 28 * U, 26 * U);
      D.fillColour(rgba(pl.hot, 0.85 * a));
      D.fcircle(0, 56 * U - 108, 4.5 * U);
      M.register('exclusive', held > 0.5 ? 'TRUE' : 'PENDING', -W * 0.42, -H * 0.42,
        { a: a, width: 260, colour: rgba(pl.hot, 0.95) });
    } },

    { l: 66, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      M.banner('THEN I CAN BE YOUR ONLY', 0, -H * 0.42, { px: 17, a: a * 0.9, track: 5 });
      M.pulseRings(0, 56 * U, w.time, { a: a, r0: 90, spread: 420, rings: 3 });
    } }
  ]);

  /* ==========================================================================
     02:49.82 — If I can have you back
     The one genuinely tender line in the act, and the only plate here that is
     allowed to be slow. A reach toward something that is not there: the hand is
     drawn, the thing it is reaching for is an absence, and the frame has no
     value to put in it.
     ======================================================================== */
  S('xs.haveyouback', [
    { l: 20, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.16);
      if (a <= 0.004) return;
      var pl = PAL();
      var q = E.outCubic(clamp(p / 0.7, 0, 1));
      D.lw(1.2);
      D.strokeColour(rgba(pl.grid, 0.35 * a));
      D.dash([3, 6]);
      D.line(-W * 0.44, 120 * U, W * 0.44, 120 * U);
      D.dash([]);
      var hx = lerp(-W * 0.44, -W * 0.09, q);
      D.ctx().save();
      D.ctx().translate(hx, 90 * U);
      D.ctx().scale(1.55, 1.55);
      D.lw(2.2);
      D.strokeColour(rgba(pl.accent, 0.7 * a));
      D.path([
        [0, 0],
        [30, -22, 62, -6],
        [70, 18],
        [10, 26, -18, 12]
      ], true);
      D.lw(1.6);
      D.strokeColour(rgba(pl.accent, 0.6 * a));
      D.line(34, -18, 70, -30);
      D.line(48, -4, 88, -10);
      D.line(56, 12, 96, 8);
      D.line(40, 26, 76, 31);
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.5 * a));
      D.line(24, -6, 40, 20);
      D.line(44, -8, 56, 22);
      D.line(58, -6, 66, 23);
      D.ctx().restore();
      M.callout(hx + 120, 76, hx - 40, -40,
        'reach  ·  ' + (q * 100).toFixed(0) + '% of required span', { a: a * 0.7 });
    } },

    { l: 38, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.16);
      if (a <= 0.004) return;
      var pl = PAL();
      var app = E.outCubic(clamp(p / 0.8, 0, 1));
      M.voidHole(W * 0.28 * app, 70 * U, 200 * U, 150 * U,
        'value not found  ·  expected: you', { a: a * 0.95 });
      M.pulseRings(W * 0.28 * app, 70 * U, w.time, {
        a: a * 0.7, r0: 40, spread: 300, colour: pl.love
      });
      M.register('return', 'null', W * 0.30, -H * 0.40,
        { a: a, width: 250, colour: rgba(pl.love, 0.95) });
      M.sub('the variable resolved to nothing', W * 0.30, -H * 0.40 + 20,
        { px: 12, a: a * 0.6, align: 'left' });
    } },

    { l: 64, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.16);
      if (a <= 0.004) return;
      var pl = PAL();
      /* NOT a centred sentence. This is the one tender line inside the storm,
         and an earlier version set it as a big centred caption, which read as a
         title card dropped into the middle of the act. Instead the frame shows
         the RETRIEVAL: a search running across the lattice, following the path
         the notes took, and coming back with nothing. The words sit as a
         read-out at the margin, where the machine's words belong. */
      var c = D.ctx();
      var y0 = 40 * U;
      var sweep = E.outCubic(clamp(p / 0.75, 0, 1));
      var played = EM.WorldLayer.notesPlayed(w.time);

      /* the path the notes took, drawn as the address being walked */
      D.lw(1.2);
      D.strokeColour(rgba(pl.grid, 0.30 * a));
      c.beginPath();
      for (var k = 0; k < 32; k++) {
        var tile = EM.WorldLayer.tileOf(Math.max(0, played - 1 - k));
        var px = (tile.c + 0.5) / 32 * W - W / 2;
        var py = (tile.r + 0.5) / 18 * H - H / 2;
        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();

      /* the search itself: a bar scanning, then returning empty */
      var sx = lerp(-W * 0.42, W * 0.42, sweep);
      D.lw(2);
      D.strokeColour(rgba(pl.love, 0.75 * a));
      D.line(sx, -H * 0.30, sx, H * 0.30);
      /* a small reticle riding the scan */
      D.lw(1);
      D.strokeColour(rgba(pl.love, 0.5 * a));
      D.scircle(sx, y0, 26 * U);
      D.line(sx - 34 * U, y0, sx - 26 * U, y0);
      D.line(sx + 26 * U, y0, sx + 34 * U, y0);

      /* the hits: none. The frame counts them honestly. */
      M.register('scanning', (sweep * 100).toFixed(1) + '%', -W * 0.42, -H * 0.36,
        { a: a, width: 280, colour: rgba(pl.love, 0.95) });
      M.register('matches', '0', -W * 0.42, -H * 0.36 + 20,
        { a: a, width: 280, colour: rgba(pl.hot, 0.95) });
      M.register('expected', '1', -W * 0.42, -H * 0.36 + 40, { a: a, width: 280 });

      /* the words, at the margin, as a log line and not as a title */
      M.banner('IF I CAN HAVE YOU BACK', -W * 0.42, H * 0.36,
        { px: 15, a: a * 0.85, align: 'left', track: 3.2, rule: true });
      var done = clamp((p - 0.7) / 0.25, 0, 1);
      if (done > 0.01) {
        M.sub('result: not present in this frame', -W * 0.42, H * 0.36 + 26 * U,
          { px: 12, a: a * done * 0.8, align: 'left', colour: rgba(pl.hot, 0.9) });
      }
    } }
  ]);

  /* ==========================================================================
     02:51.87 — I will run the
     A command being issued. The keyboard from the eighth execution, this time
     as an interface: a prompt, a command, and a key landing on it.
     ======================================================================== */
  S('xs.runthe', [
    { l: 18, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var cy = 120 * U;
      for (var i = 0; i < 22; i++) {
        var col = i % 11, row = (i / 11) | 0;
        var kx = (col - 5) * 54 * U, ky = cy + row * 44 * U;
        D.lw(1.2);
        D.strokeColour(rgba(pl.grid, 0.45 * a));
        D.srect(kx - 22 * U, ky - 16 * U, 44 * U, 32 * U);
      }
      var fire = E.inCubic(clamp((p - 0.48) / 0.16, 0, 1));
      var kx2 = -54 * U, ky2 = cy + 44 * U;
      if (fire > 0.01) {
        D.fillColour(rgba(pl.hot, 0.75 * a * fire));
        D.frect(kx2 - 22 * U, ky2 - 16 * U, 44 * U, 32 * U);
        D.lw(1.6);
        D.strokeColour(rgba(pl.hot, 0.85 * a * fire));
        D.scircle(kx2, ky2, 18 + (1 - fire) * 46);
        M.spray(823, kx2, ky2, 12, 46, { size: 1.3 });
        D.fillColour(rgba(pl.ink, 0.9 * a * fire));
        D.font(15, '700');
        D.ctx().textAlign = 'center';
        D.text('E', kx2, ky2 + 5);
      }
    } },

    { l: 40, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      D.lw(1.6);
      D.strokeColour(rgba(pl.grid, 0.6 * a));
      D.srect(-W * 0.38, -H * 0.34, W * 0.76, 74 * U);
      M.sub('root@machine:~$', -W * 0.36, -H * 0.34 + 46 * U,
        { px: 22, a: a, align: 'left', colour: rgba(pl.accent, 0.95) });
      var typed = E.outCubic(clamp((p - 0.12) / 0.55, 0, 1));
      var cmd = 'RUN EXECUTION --all --no-return';
      var shown = cmd.slice(0, Math.max(0, Math.round(cmd.length * typed)));
      M.sub(shown, -W * 0.24, -H * 0.34 + 46 * U,
        { px: 22, a: a * 0.95, align: 'left', colour: rgba(pl.hot, 0.95) });
      if (Math.floor(w.time * 3.4) % 2 === 0) {
        D.fillColour(rgba(pl.hot, 0.85 * a));
        D.frect(-W * 0.24 + D.measure(shown, 22), -H * 0.34 + 26 * U, 12, 26);
      }
      M.register('mode', 'IRREVERSIBLE', -W * 0.38, H * 0.36,
        { a: a, width: 300, colour: rgba(pl.hot, 0.95) });
    } },

    { l: 66, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var pop = E.pop(clamp((p - 0.55) / 0.3, 0, 1));
      if (p > 0.55) {
        M.banner('COMMAND ACCEPTED', 0, -H * 0.42, {
          px: 22, a: a * pop, track: 6, colour: rgba(pl.hot, 0.95)
        });
      }
      M.banner('I WILL RUN THE', 0, H * 0.42, { px: 19, a: a * 0.9, track: 5 });
    } }
  ]);

  /* ==========================================================================
     02:53.64 — Though we are trapped
     The frame closing in. The trappings of the film's geometry — the boxes the
     machine has been drawing around things since 00:02 — finally get used on
     the viewer.
     ======================================================================== */
  S('xs.trapped', [
    { l: 16, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var q = E.inOutQuad(clamp(p / 0.85, 0, 1));
      var span = lerp(1.35, 0.72, q);
      for (var k = 0; k < 4; k++) {
        var s = span + k * 0.075;
        D.lw(1 + k * 0.5);
        D.strokeColour(rgba(pl.hot, (0.16 + k * 0.10) * a));
        D.dash([7, 5]);
        D.srect(-W * 0.5 * s, -H * 0.5 * s, W * s, H * s);
        D.dash([]);
      }
      D.lw(1.4);
      D.strokeColour(rgba(pl.grid, 0.4 * a));
      D.bracket(-W * 0.36 * span * 1.18, -H * 0.5 * span * 1.18,
                W * span * 1.18, H * span * 1.18, 30);
    } },

    { l: 42, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      var q = E.inOutQuad(clamp(p / 0.85, 0, 1));
      var span = lerp(1.35, 0.72, q);
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.5 * a));
      for (var i = 0; i < 24; i++) {
        var ang = i / 24 * TAU;
        D.line(Math.cos(ang) * span * W * 0.62, Math.sin(ang) * span * H * 1.05,
               Math.cos(ang) * span * W * 0.70, Math.sin(ang) * span * H * 1.20);
      }
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.65 * a));
      D.dim(-W * 0.5 * span, -H * 0.5 * span - 26, W * 0.5 * span, -H * 0.5 * span - 26,
        'enclosure ' + (span * W).toFixed(0) + ' u', -30, 14);
      M.register('volume', (span * span * 100).toFixed(0), -W * 0.42, -H * 0.42,
        { a: a, width: 250, unit: '% of frame' });
      M.sub('every wall in here was drawn earlier in this film', 0, H * 0.42,
        { px: 12, a: a * 0.6 });
    } },

    { l: 64, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.10);
      if (a <= 0.004) return;
      var pl = PAL();
      M.banner('THOUGH WE ARE TRAPPED', 0, -H * 0.40, {
        px: 20, a: a * 0.95, track: 5, colour: rgba(pl.hot, 0.95)
      });
      M.keyword('TRAPPED', 0, 40 * U, {
        a: a, px: 86, weight: '700',
        fill: rgba(pl.ink, 0.95 * a),
        stroke: rgba(pl.hot, 0.7 * a), strokeW: 2,
        track: 6, bracket: between(p, 0.4, 1.0) > 0.4
      });
    } }
  ]);

  /* ==========================================================================
     02:54.98 — We are trapped, ah
     The box closes completely — and then, in the last third of the line, the
     first hint of warmth in the whole act. The world's `warm` value starts to
     rise here and the film's last movement begins inside this plate: the alarm
     colour is already drifting toward paper at the moment the sentence ends.
     ======================================================================== */
  S('xs.trapped2', [
    { l: 14, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.14);
      if (a <= 0.004) return;
      var pl = PAL();
      var close = E.outCubic(clamp(p / 0.45, 0, 1));
      var un = clamp((p - 0.62) / 0.38, 0, 1);
      var m = 128 * U;
      for (var k = 3; k >= 0; k--) {
        var off = close * m + k * 22 * U + un * 60 * U;
        D.lw(2 + k);
        D.strokeColour(rgba(pl.hot, (0.35 - k * 0.07) * a * close * (1 - un * 0.5)));
        D.srect(-W * 0.5 + off, -H * 0.5 + off, W - off * 2, H - off * 2);
      }
      var s = 1 - close * 0.24;
      D.lw(2.4);
      D.strokeColour(rgba(pl.hot, 0.9 * a));
      D.bracket(-W * 0.5 * s, -H * 0.5 * s, W * s, H * s, 44);
      if (un > 0.01) {
        M.spray(929, 0, 0, 18, 560, {
          size: 1.5,
          colour: rgba([246, 236, 216], 0.35 * a * un)
        });
        D.lw(1.2);
        D.strokeColour(rgba(pl.love, 0.4 * a * un));
        D.scircle(0, 0, lerp(120, 560, un));
      }
    } },

    { l: 40, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.14);
      if (a <= 0.004) return;
      var pl = PAL();
      var warmth = clamp(w.warm || 0, 0, 1);
      var un = clamp((p - 0.62) / 0.38, 0, 1);
      M.keyword('TRAPPED, AH', 0, 20 * U, {
        a: a, px: lerp(74, 60, un), weight: '700',
        fill: rgba(pl.ink, 0.96 * a),
        stroke: rgba(un > 0.3 ? pl.paper : pl.hot, (0.6 - un * 0.2) * a),
        strokeW: 2,
        track: 6
      });
      D.lw(1);
      D.strokeColour(rgba(pl.grid, 0.35 * a));
      D.line(-H * 0.30, 90 * U, H * 0.30, 90 * U);
      M.sub('warm ' + warmth.toFixed(2) + '  ·  rising for the first time since 02:04',
        0, 116 * U, { px: 12, a: a * 0.7 });
    } },

    { l: 62, e: function (w, p) {
      var a = 0.06 + 0.94 * vis(p, 0.14);
      if (a <= 0.004) return;
      var pl = PAL();
      var warmth = clamp(w.warm || 0, 0, 1);
      var q = EM.onsetPulse(w.time, 0.6);
      M.gauge(-W * 0.30, -H * 0.42, W * 0.60, 12 * U, warmth,
        'warm ' + warmth.toFixed(2) + '  ·  something is still on in here',
        { a: a, colour: rgba(pl.love, 0.9) });
      if (q > 0.05) {
        D.lw(1.4);
        D.strokeColour(rgba(pl.love, 0.35 * a * q));
        D.scircle(0, 20 * U, lerp(60, 420, 1 - q));
      }
      M.banner('WE ARE TRAPPED, AH', 0, H * 0.42,
        { px: 17, a: a * 0.85, track: 6, colour: rgba(pl.love, 0.9) });
    } }
  ]);
})(window.EM);
