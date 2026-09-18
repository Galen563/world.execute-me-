/* ============================================================================
   src/41_plates_theorem.js — ACT I · THEOREM        00:29.7 - 00:59.2

   "If I'm a set of points / Then I will give you my DIMENSION / If I'm a circle
    / Then I will give you my CIRCUMFERENCE / ... / So deeply, so deeply"

   Eight conditional claims, sung as a proof. The machine is not describing
   itself here, it is DISMANTLING itself into measurable quantities and handing
   the parts over: here is my point set, here is its bounding box, here is the
   box's volume, here is my radius, here is my circumference unrolled so you can
   see that it is a length. Confident, ordered, and — in the small gap before
   every "then" — slightly pleading.

   So the act's grammar is: a claim is DRAWN, and then it is MEASURED. Every
   plate carries at least one dimension line, ruler or register row, and the
   lyric arrives as an annotation on a diagram more often than as a caption over
   wallpaper. The four one-word lines (DIMENSION, CIRCUMFERENCE, TANGENTS,
   LIMITATIONS) are the *objects* being claimed, so they get to be printed
   things instead.

   The two plates that are not geometry — blind, dizzy — are where the machine
   loses the ability to measure at all, and they are the hinge into the rest of
   the song. blind clips its own read-out away. dizzy cannot hold its own grid
   straight, and the axis is the thing that cracks.

   20 plates.  e(w, p, cue)   w = world state, p = 0..1 through this line
   ==========================================================================*/
(function (EM) {
  'use strict';

  var S = EM.Scenes, D = EM.D, E = EM.E, TAU = EM.TAU, M = EM.M;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var vis = EM.Life.vis, stag = EM.Life.stagger, between = EM.Life.between;

  /* Stage constants. Declared in every plate file on purpose: one stage unit is
     one drawing unit because the renderer has already applied the letterbox
     transform. A plate that referenced a constant it did not declare would
     throw, and the registry reports that instead of hiding it. */
  var W = 1600, H = 900, U = 1;

  /* The act's layer register, so every plate's draw order is explicit and the
     file reads the same way the boot act does:
       15 bed · 30 trace · 48 subject · 62 annotation · 80 word */
  var L_BED = 15, L_TRACE = 30, L_SUB = 48, L_ANN = 62, L_WORD = 80;

  function PAL() { return EM.__pal; }

  /* ==========================================================================
     LOCAL KIT — the extra marks this act draws with, on top of 35_motifs.js.
     Deliberately small and local: the act needs a ruler, a caged region, a live
     polar dimension and an isometric projection, and none of those belong in
     the shared vocabulary until a second act asks for them.
     ======================================================================== */

  /* an inscribed ruler: the frame admitting it is a measured surface */
  function rule(x0, x1, y, a, px) {
    D.lw(1.2);
    D.strokeColour(rgba(PAL().grid, 0.55 * a));
    D.line(x0, y, x1, y);
    for (var i = 0; i <= 16; i++) {
      var big = i % 4 === 0;
      var x = lerp(x0, x1, i / 16);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, (big ? 0.6 : 0.3) * a));
      D.line(x, y, x, y + (big ? 9 : 5));
      if (big && px) M.sub(String(i), x, y + 22 * U, { px: px, a: a * 0.65 });
    }
  }

  /* the act's ground: a hairline border and four corner ticks, so even a nearly
     empty plate reads as something sitting inside an instrument */
  function frameBed(a, inset) {
    var q = inset === undefined ? 26 : inset;
    var w2 = W / 2 - q, h2 = H / 2 - q;
    D.lw(1);
    D.strokeColour(rgba(PAL().grid, 0.18 * a));
    D.srect(-w2, -h2, w2 * 2, h2 * 2);
    D.lw(1.4);
    D.strokeColour(rgba(PAL().grid, 0.34 * a));
    var s = 20;
    D.line(-w2, -h2, -w2 + s, -h2); D.line(-w2, -h2, -w2, -h2 + s);
    D.line(w2, -h2, w2 - s, -h2); D.line(w2, -h2, w2, -h2 + s);
    D.line(-w2, h2, -w2 + s, h2); D.line(-w2, h2, -w2, h2 - s);
    D.line(w2, h2, w2 - s, h2); D.line(w2, h2, w2, h2 - s);
  }

  /* a stack of faint level lines: ruled paper, not a labelled ruler */
  function level(y0, y1, x0, x1, n, a, seed) {
    for (var i = 0; i <= n; i++) {
      var y = lerp(y0, y1, i / n);
      var s1 = hash(Math.floor((seed || 3) * 977) + i * 131);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, (0.14 + s1 * 0.14) * a));
      D.line(x0, y, x1, y);
    }
  }

  /* the act's workhorse: a dimension line that draws itself in. 35_motifs does
     not expose D.dim, and this act dimensions everything, so it lives here. */
  function dimLine(x1, y1, x2, y2, off, q, label, opt) {
    if (q <= 0.01) return;
    opt = opt || {};
    var a = opt.a === undefined ? 1 : opt.a;
    var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var ax1 = x1 + nx * off, ay1 = y1 + ny * off;
    var ax2 = x2 + nx * off, ay2 = y2 + ny * off;
    var mx = lerp(ax1, ax2, q), my = lerp(ay1, ay2, q);
    var la = E.outCubic(clamp((q - 0.82) / 0.18, 0, 1));

    D.lw(1);
    D.strokeColour(rgba(opt.colour || PAL().accent, 0.85 * a));
    D.line(ax1, ay1, mx, my);
    var wl = Math.min(14, Math.abs(off) * 0.9);
    if (wl > 1) {
      D.strokeColour(rgba(PAL().grid, 0.35 * a));
      D.line(x1, y1, ax1 + nx * Math.sign(off) * wl, ay1 + ny * Math.sign(off) * wl);
      D.line(x2, y2, ax2 + nx * Math.sign(off) * wl, ay2 + ny * Math.sign(off) * wl);
    }
    if (q > 0.94) {
      var sgn = Math.sign(off) || 1;
      D.strokeColour(rgba(opt.colour || PAL().accent, 0.9 * a));
      D.arrowHead(ax1, ay1, Math.atan2(-ny * sgn, -nx * sgn), 9);
      D.arrowHead(ax2, ay2, Math.atan2(ny * sgn, nx * sgn), 9);
    }
    if (label && la > 0.01) {
      var ang = Math.atan2(dy, dx);
      D.ctx().save();
      D.ctx().translate((ax1 + ax2) / 2, (ay1 + ay2) / 2);
      D.ctx().rotate(Math.abs(ang) > Math.PI / 2 ? ang + Math.PI : ang);
      M.sub(label, 0, (-Math.abs(off) * 0.22 - 5) * Math.sign(off) - 2,
        { px: opt.px || 12, a: a * la, colour: rgba(PAL().accent, 0.95) });
      D.ctx().restore();
    }
  }

  /* the live polar dimension: a radius being read while it turns */
  function polarDim(cx, cy, r, ang, q, label, a) {
    if (q <= 0.01) return;
    var x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
    D.lw(1.4);
    D.strokeColour(rgba(PAL().accent, 0.85 * a));
    D.line(cx, cy, x, y);
    if (q > 0.86) {
      D.lw(1.2);
      D.strokeColour(rgba(PAL().accent, 0.95 * a));
      D.arrowHead(x, y, ang, 9);
      D.arrowHead(cx, cy, ang + Math.PI, 7);
    }
    D.fillColour(rgba(PAL().hot, 0.95 * a));
    D.dot(cx, cy, 3.2 * U);
    if (q > 0.3) {
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.6 * a));
      D.arc(cx, cy, 34 * U, 0, ang, 1);
    }
    if (label && q > 0.4) {
      M.sub(label, (cx + x) / 2 + 10, (cy + y) / 2 - 12,
        { px: 12, a: a * clamp((q - 0.4) / 0.3, 0, 1), colour: rgba(PAL().accent, 0.95) });
    }
  }

  /* caged region: a closed ring of any aspect, as a sampled polygon so it needs
     nothing from the canvas beyond moveTo/lineTo. Returns nothing; the caller
     strokes it. */
  function ringPath(cx, cy, rx, ry, n, rot) {
    D.ctx().beginPath();
    for (var i = 0; i <= n; i++) {
      var t = i / n * TAU + (rot || 0);
      var x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry;
      if (i === 0) D.ctx().moveTo(x, y); else D.ctx().lineTo(x, y);
    }
    D.ctx().closePath();
  }

  /* the parameter this act reads out of the clock. Deterministic in w.time, so
     scrubbing backwards gives exactly the same frame. */
  function thetaAt(t, per) { return ((t % per) + per) % per / per * TAU; }

  /* isometric projection, for the one plate where the claim gains an axis */
  var ISO_X = [0.900, 0.360], ISO_Y = [-0.340, 0.900], ISO_Z = [0, -0.560];
  function isoP(x, y, z) {
    return [x * ISO_X[0] + y * ISO_Y[0] + z * ISO_Z[0],
            x * ISO_X[1] + y * ISO_Y[1] + z * ISO_Z[1]];
  }

  /* ==========================================================================
     00:29.709 — If I'm a set of points
     A point set is scattered onto the stage from its own seed; the frame then
     finds the minimum bounding box around the cloud and dimensions the box. The
     first claim of the act, so it is also where the act's measuring voice is
     set: nothing is shown without being enclosed and read.
     ======================================================================== */
  S('th.points', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a);
      level(-H * 0.36, H * 0.36, -W * 0.46, W * 0.46, 12, a, 5);
      M.registerBed(w, w.time, { a: a * 0.5 });
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var n = 44;
      var x0 = -W * 0.44, x1 = W * 0.44, y0 = -H * 0.26, y1 = H * 0.26;
      var bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      var found = 0;

      for (var i = 0; i < n; i++) {
        var q = stag(p, i, n, 0.48);
        if (q <= 0.001) continue;
        var x = lerp(x0, x1, hash(i * 131 + 17));
        var y = lerp(y0, y1, hash(i * 977 + 41));
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
        found++;
        D.fillColour(rgba(i % 9 === 0 ? PAL().hot : PAL().accent, (0.7 + q * 0.3) * a));
        D.dot(x, y, (1.6 + hash(i * 313 + 7) * 2.6) * U);
        /* the newest arrivals wear a ring: the frame noticing a point */
        if (q > 0.04 && q < 0.6) {
          D.lw(1);
          D.strokeColour(rgba(PAL().accent, 0.5 * (1 - q) * a));
          D.scircle(x, y, lerp(3, 20, q) * U);
        }
      }

      if (found > 4 && p > 0.5) {
        var q2 = E.outCubic(clamp((p - 0.5) / 0.34, 0, 1));
        var ex = 12 * U * q2, ey = 12 * U * q2;
        var bxx = bx0 - ex, byy = by0 - ey;
        var bww = (bx1 - bx0) + ex * 2, bhh = (by1 - by0) + ey * 2;

        D.lw(1.6);
        D.strokeColour(rgba(PAL().hot, 0.85 * a));
        D.srect(bxx, byy, bww, bhh);
        D.lw(1.2);
        D.strokeColour(rgba(PAL().hot, 0.9 * a));
        D.bracket(bxx, byy, bww, bhh, 22);

        dimLine(bxx, by1, bx1, by1, 56 * U, clamp((p - 0.6) / 0.32, 0, 1),
          '\u0394x ' + ((bx1 - bx0) / 10).toFixed(1), { a: a });
        dimLine(bx1, byy, bx1, by1, -46 * U, clamp((p - 0.72) / 0.24, 0, 1),
          '\u0394y ' + ((by1 - by0) / 10).toFixed(1), { a: a });
      }
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('IF I AM A SET OF POINTS', 0, -H * 0.42,
        { px: 19, a: a * 0.95, track: 5.4 });
      M.register('cardinality', '44', -W * 0.44, H * 0.36, { a: a, width: 230, unit: 'pts' });
      M.register('convex hull', p > 0.5 ? 'CLOSED' : 'open', -W * 0.44, H * 0.36 + 20,
        { a: a * clamp((p - 0.5) / 0.3, 0.05, 1), width: 230 });
      M.sub('a cloud is not yet a shape', W * 0.44, H * 0.36, { px: 12, a: a * 0.6, align: 'right' });
      M.sub('waiting for a frame to be put around it', W * 0.44, H * 0.36 + 20,
        { px: 12, a: a * 0.45, align: 'right' });
      if (p > 0.55 && p < 0.92) {
        M.callout(-W * 0.10, -H * 0.14, -W * 0.30, -H * 0.30, 'minimum bounding box',
          { a: a * between(p, 0.55, 0.92) });
      }
      M.pulseRings(0, 0, w.time, { r0: 60, spread: 520, a: a * 0.30, rings: 2 });
    } }
  ]);

  /* ==========================================================================
     00:31.116 — Then I will give you my
     The gap before DIMENSION, and a held breath. The box from the previous plate
     is already standing in the frame and a witness line is sweeping it, because
     the frame is about to extrude the thing it just measured.
     ======================================================================== */
  S('th.giveA', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.2);
      frameBed(a, 40);
      var q = E.outCubic(clamp(p / 0.5, 0, 1));
      D.lw(1.6);
      D.strokeColour(rgba(PAL().hot, 0.55 * a));
      D.srect(-W * 0.22, -H * 0.18, W * 0.44, H * 0.36);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.4 * a));
      D.bracket(-W * 0.22 - 10, -H * 0.18 - 10, W * 0.44 + 20, H * 0.36 + 20, 18);
      /* the witness line the extrusion will grow out of, sweeping live */
      var ry = -H * 0.18 + (H * 0.36) * q;
      D.lw(1.2);
      D.strokeColour(rgba(PAL().accent, 0.8 * a));
      D.line(-W * 0.22, ry, W * 0.22, ry);
      D.fillColour(rgba(PAL().accent, 0.9 * a));
      D.dot(W * 0.22, ry, 3 * U);
      D.dot(-W * 0.22, ry, 3 * U);
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('THEN I WILL GIVE YOU MY', 0, H * 0.34,
        { px: 17, a: a * 0.8, track: 4.6, rule: true });
      var q = clamp(p / 0.4, 0, 1);
      M.register('claim', 'PENDING', -W * 0.44, -H * 0.40,
        { a: a * (1 - q * 0.4), width: 240 });
      M.register('argument', 'point set', -W * 0.44, -H * 0.40 + 20, { a: a, width: 240 });
      M.register('returns', '\u2202 (dimension)', W * 0.44, -H * 0.40,
        { a: a * q, width: 240 });
      M.sub('one more axis and the claim is complete', 0, H * 0.34 + 26,
        { px: 12, a: a * 0.5 * between(p, 0.3, 0.95) });
    } },

    { l: L_WORD, e: function (w, p) {
      var a = vis(p, 0.26);
      var q = E.outExpo(clamp((p - 0.45) / 0.45, 0, 1));
      if (q <= 0.01) return;
      M.keyword('DIMENSION', 0, 0, {
        a: a * q * 0.5, px: 40, weight: '600',
        fill: rgba(PAL().ink, 0.5 * q), track: 8, measure: false
      });
    } }
  ]);

  /* ==========================================================================
     00:32.682 — DIMENSION
     The claim granted: 2D becomes 3D. The bounding box is extruded along Z while
     the object turns slowly about Y, a vertical dimension line measures the new
     extent, and the frame reads out a volume it did not have a moment ago.
     ======================================================================== */
  S('th.dimension', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      /* isometric construction rays, so the third axis exists before the body
         does: the frame drawing the direction it is about to move in */
      var L = 300 * U;
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.26 * a));
      D.dash([4, 6]);
      D.line(0, 0, -L * ISO_X[0], -L * ISO_X[1]);
      D.line(0, 0, -L * ISO_Y[0], -L * ISO_Y[1]);
      D.line(0, 0, -L * ISO_Z[0], -L * ISO_Z[1]);
      D.dash([]);
      M.sub('x', -L * ISO_X[0] * 0.86, -L * ISO_X[1] * 0.86, { px: 12, a: a * 0.6 });
      M.sub('y', -L * ISO_Y[0] * 0.86, -L * ISO_Y[1] * 0.86, { px: 12, a: a * 0.6 });
      M.sub('z', -L * ISO_Z[0] * 1.06 - 8, -L * ISO_Z[1] * 1.06, { px: 12, a: a * 0.6 });
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var grow = E.outCubic(clamp(p / 0.28, 0, 1));
      var s = lerp(52, 132, grow) * U;
      var ex = E.outCubic(clamp((p - 0.30) / 0.44, 0, 1));
      var th = Math.sin(w.time * 0.42) * 0.16;
      var i, ct = Math.cos(th), st = Math.sin(th);

      /* base ring, rotated, then the top ring projected up the Z axis. The
         blend from 0.25 keeps the growth continuous at the moment of extrusion,
         so nothing pops. */
      var B = [], T = [];
      for (i = 0; i < 4; i++) {
        var ox = (i === 0 || i === 3) ? -s : s;
        var oy = (i < 2) ? -s : s;
        var rx = ox * ct - oy * st, ry = ox * st + oy * ct;
        B.push([rx, ry]);
        var t3 = isoP(rx, ry, ex * s * 2);
        T.push([lerp(rx, t3[0], 0.25 + ex * 0.75), lerp(ry, t3[1], 0.25 + ex * 0.75)]);
      }

      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.ctx().beginPath();
      for (i = 0; i < 4; i++) { if (i === 0) D.ctx().moveTo(B[i][0], B[i][1]); else D.ctx().lineTo(B[i][0], B[i][1]); }
      D.ctx().closePath(); D.ctx().stroke();

      if (ex > 0.01) {
        D.lw(1.5);
        D.strokeColour(rgba(PAL().accent, 0.8 * a));
        D.ctx().beginPath();
        for (i = 0; i < 4; i++) { if (i === 0) D.ctx().moveTo(T[i][0], T[i][1]); else D.ctx().lineTo(T[i][0], T[i][1]); }
        D.ctx().closePath(); D.ctx().stroke();
        /* the sides: the extrusion actually happening, face by face */
        D.lw(1.2);
        D.strokeColour(rgba(PAL().accent, 0.5 * a));
        for (i = 0; i < 4; i++) D.line(B[i][0], B[i][1], T[i][0], T[i][1]);
        /* the hidden corner, dashed, because a machine draws its own back */
        D.dash([3, 4]);
        D.strokeColour(rgba(PAL().grid, 0.45 * a));
        D.line(0, 0, T[0][0], T[0][1]);
        D.dash([]);
      }

      if (ex > 0.2) {
        var qa = clamp((p - 0.5) / 0.4, 0, 1);
        dimLine(T[3][0], T[3][1], T[0][0], T[0][1], -50 * U, qa, 'x', { a: a });
        dimLine(T[1][0], T[1][1], T[2][0], T[2][1], 46 * U, qa, 'y', { a: a });
        dimLine(B[3][0], B[3][1], T[3][0], T[3][1], 54 * U, qa,
          'z ' + (ex * s * 2 / 10).toFixed(1), { a: a, colour: PAL().hot });
      }
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.16);
      var s = lerp(52, 132, E.outCubic(clamp(p / 0.28, 0, 1)));
      var ex = E.outCubic(clamp((p - 0.30) / 0.44, 0, 1));
      M.register('extent', (s * 2 / 10).toFixed(1) + ' \u00D7 ' + (s * 2 / 10).toFixed(1),
        -W * 0.44, -H * 0.36, { a: a, width: 250 });
      M.register('depth z', (ex * s * 2 / 10).toFixed(2), -W * 0.44, -H * 0.36 + 20,
        { a: a, width: 250, colour: rgba(PAL().hot, 0.95) });
      M.register('volume', (s * s * 4 * ex * s * 2 / 1000).toFixed(1), -W * 0.44, -H * 0.36 + 40,
        { a: a * clamp((p - 0.55) / 0.3, 0.05, 1), width: 250, unit: '\u00D710\u00B3 u\u00B3' });
      M.register('rank', ex > 0.5 ? '3' : '2', -W * 0.44, -H * 0.36 + 60,
        { a: a * clamp((p - 0.55) / 0.3, 0.05, 1), width: 250 });
      M.sub('a flat claim, given a third axis', W * 0.44, H * 0.36,
        { px: 12, a: a * 0.55, align: 'right' });
      if (p > 0.4) {
        M.keyword('DIMENSION', 0, -H * 0.40, {
          a: a * clamp((p - 0.4) / 0.28, 0, 1), px: 34, weight: '700',
          fill: rgba(PAL().ink, 0.95), track: 10, bracket: true, measure: false
        });
      }
    } }
  ]);

  /* ==========================================================================
     00:33.412 — If I'm a circle
     A circle constructed in front of the viewer: centre, then radius, then the
     radius swept through a full turn to become the circumference. The radius is
     drawn as a live polar dimension, so you watch the measurement make the
     shape rather than seeing a circle appear.
     ======================================================================== */
  S('th.circle', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      for (var i = 1; i <= 4; i++) {
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, (0.22 - i * 0.03) * a));
        D.scircle(0, 0, i * 52 * U);
      }
      /* the protractor ring, so the sweep has degrees to be read against */
      for (var k = 0; k < 24; k++) {
        var ang = k / 24 * TAU;
        var big = k % 6 === 0;
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, (big ? 0.55 : 0.28) * a));
        D.line(Math.cos(ang) * 208 * U, Math.sin(ang) * 208 * U,
               Math.cos(ang) * (208 + (big ? 14 : 7)) * U,
               Math.sin(ang) * (208 + (big ? 14 : 7)) * U);
      }
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var r = lerp(20, 150, E.outCubic(clamp(p / 0.3, 0, 1))) * U;
      var th = thetaAt(w.time, 17);
      var sweep = E.outCubic(clamp((p - 0.28) / 0.5, 0, 1));
      var end = sweep * TAU;

      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.6 * a));
      D.line(-r * 1.35, 0, r * 1.35, 0);
      D.line(0, -r * 1.35, 0, r * 1.35);
      D.fillColour(rgba(PAL().hot, 0.95 * a));
      D.dot(0, 0, 3 * U);

      if (end > 0.01) {
        D.lw(2.2);
        D.strokeColour(rgba(PAL().accent, 0.9 * a));
        D.circle(0, 0, r, -Math.PI / 2, -Math.PI / 2 + end);
        D.ctx().stroke();
        /* the head of the sweep, so the drawing reads as an instrument moving */
        D.fillColour(rgba(PAL().accent, 0.95 * a));
        D.dot(Math.cos(-Math.PI / 2 + end) * r, Math.sin(-Math.PI / 2 + end) * r, 3.6 * U);
      }

      polarDim(0, 0, r, th, clamp((p - 0.1) / 0.3, 0, 1), 'r = ' + (r / 10).toFixed(1), a);

      rule(-W * 0.42, -W * 0.42 + r * 2, H * 0.44, a * 0.8, 10);
      M.sub('diameter  ' + (2 * r / 10).toFixed(1) + ' u', 0, H * 0.44 - 14 * U,
        { px: 12, a: a * 0.8 });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('IF I AM A CIRCLE', 0, -H * 0.42, { px: 19, a: a * 0.95, track: 5.4 });
      var th = thetaAt(w.time, 17);
      M.register('radius', (lerp(20, 150, E.outCubic(clamp(p / 0.3, 0, 1))) / 10).toFixed(2),
        -W * 0.44, H * 0.36, { a: a, width: 240, unit: 'u' });
      M.register('centre', '0.00, 0.00', -W * 0.44, H * 0.36 + 20, { a: a, width: 240 });
      M.register('sweep', (th * 180 / Math.PI).toFixed(1), W * 0.44, H * 0.36,
        { a: a, width: 240, unit: '\u00B0' });
      M.register('eccentricity', '0.0000', W * 0.44, H * 0.36 + 20,
        { a: a * clamp((p - 0.5) / 0.3, 0.05, 1), width: 240 });
      M.sub('one point, one distance, held constant', 0, H * 0.42, { px: 12, a: a * 0.5 });
    } }
  ]);

  /* ==========================================================================
     00:34.646 — Then I will give you my
     The second gap. The circle is a finished object sitting in the frame and the
     machine is about to admit what it is actually worth: nothing but a length.
     ======================================================================== */
  S('th.giveB', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.2);
      frameBed(a, 40);
      var open = E.outCubic(clamp((p - 0.4) / 0.5, 0, 1));
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, lerp(0.5, 0.15, open) * a));
      D.scircle(0, 0, 150 * U);
      if (open > 0.01) {
        D.lw(2);
        D.strokeColour(rgba(PAL().accent, 0.75 * a * open));
        D.line(-W * 0.30, 0, -W * 0.30 + W * 0.60 * open, 0);
        D.fillColour(rgba(PAL().accent, 0.9 * a * open));
        D.dot(-W * 0.30, 0, 3 * U);
        D.dot(-W * 0.30 + W * 0.60 * open, 0, 3 * U);
      }
      polarDim(0, 0, 150 * U, thetaAt(w.time, 21), 0.75 - open * 0.5, '', a);
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('THEN I WILL GIVE YOU MY', 0, -H * 0.38,
        { px: 17, a: a * 0.8, track: 4.6, rule: true });
      M.register('object', 'circle', -W * 0.44, H * 0.36, { a: a, width: 230 });
      M.register('property', 'perimeter', -W * 0.44, H * 0.36 + 20, { a: a, width: 230 });
      M.register('length', (TAU * 15).toFixed(3), W * 0.44, H * 0.36,
        { a: a * clamp((p - 0.4) / 0.4, 0.05, 1), width: 230, unit: 'u' });
      M.sub('the same circle, opened out', 0, H * 0.42, { px: 12, a: a * 0.5 * between(p, 0.25, 0.95) });
    } },

    { l: L_WORD, e: function (w, p) {
      var a = vis(p, 0.26);
      var q = E.outExpo(clamp((p - 0.42) / 0.45, 0, 1));
      if (q <= 0.01) return;
      M.keyword('CIRCUMFERENCE', 0, 0, {
        a: a * q * 0.55, px: 58, weight: '700',
        fill: rgba(PAL().ink, 0.55 * q), track: 12, measure: false
      });
    } }
  ]);

  /* ==========================================================================
     00:36.287 — CIRCUMFERENCE
     The definition, performed. The circle is cut at one point and unrolled into
     a straight line of exactly the same length: equal tick counts on both, one
     dimension line labelled 2πr, because the only honest way to say what a
     circumference is, is to show that it is a length.
     ======================================================================== */
  S('th.circumference', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      level(-H * 0.20, H * 0.20, -W * 0.48, W * 0.48, 8, a, 9);
      /* the circle's ghost stays where it was, so the unrolling has a source */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.4 * a));
      D.scircle(-W * 0.26, -H * 0.06, 130 * U);
      M.sub('origin', -W * 0.26, -H * 0.06 + 156 * U, { px: 11, a: a * 0.55 });
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var cut = E.outCubic(clamp(p / 0.24, 0, 1));
      var out = E.outCubic(clamp((p - 0.18) / 0.5, 0, 1));
      var r = 130 * U;
      var L = TAU * r;
      var i;

      if (cut < 1) {
        D.lw(2);
        D.strokeColour(rgba(PAL().accent, 0.85 * a * (1 - cut * 0.75)));
        D.circle(-W * 0.26, -H * 0.06, r,
          -Math.PI / 2 + cut * 0.5, -Math.PI / 2 + TAU - cut * 0.5);
        D.ctx().stroke();
      }
      D.fillColour(rgba(PAL().hot, 0.95 * a));
      D.dot(-W * 0.26, -H * 0.06 - r, 4 * U);

      var x0 = -W * 0.08, y = H * 0.12;
      var x1 = x0 + L;
      if (out > 0.01) {
        D.lw(2.4);
        D.strokeColour(rgba(PAL().accent, 0.9 * a));
        D.line(x0, y, lerp(x0, x1, out), y);
        D.lw(1);
        D.strokeColour(rgba(PAL().hot, 0.9 * a));
        D.line(x0, y - 14 * U, x0, y + 14 * U);
        D.fillColour(rgba(PAL().hot, 0.95 * a));
        D.dot(lerp(x0, x1, out), y, 3.6 * U);
        D.dot(x0, y, 3.6 * U);
        /* the same sixteen divisions the circle was divided into */
        for (i = 1; i < 16; i++) {
          var xt = x0 + L * i / 16;
          if (xt > lerp(x0, x1, out)) break;
          D.lw(1);
          D.strokeColour(rgba(PAL().grid, 0.6 * a));
          D.line(xt, y - 8 * U, xt, y + 8 * U);
        }
        if (out > 0.97) {
          dimLine(x0, y, x1, y, 70 * U, clamp((p - 0.7) / 0.3, 0, 1),
            '2\u03C0r = ' + (L / 10).toFixed(2) + ' u', { a: a, px: 14 });
        }
      }
      /* the equation the plate is arguing */
      if (p > 0.55) {
        M.keyword('C = 2\u03C0r', W * 0.26, H * 0.30, {
          a: a * clamp((p - 0.55) / 0.3, 0, 1), px: 30, weight: '600',
          fill: rgba(PAL().accent, 0.95), track: 2, measure: false
        });
      }
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('MY CIRCUMFERENCE IS ONLY A LENGTH', 0, -H * 0.42,
        { px: 17, a: a * 0.9, track: 4.2 });
      M.register('radius', '13.00', -W * 0.44, -H * 0.34, { a: a, width: 240, unit: 'u' });
      M.register('turns', '1.000', -W * 0.44, -H * 0.34 + 20, { a: a, width: 240 });
      M.register('arc length', '81.681', W * 0.44, -H * 0.34,
        { a: a * clamp((p - 0.3) / 0.4, 0.05, 1), width: 240, unit: 'u' });
      M.register('thickness', '0.000', W * 0.44, -H * 0.34 + 20,
        { a: a * clamp((p - 0.6) / 0.3, 0.05, 1), width: 240, colour: rgba(PAL().hot, 0.95) });
      M.sub('unrolled, it is indistinguishable from a straight line', 0, H * 0.42,
        { px: 12, a: a * 0.55 });
    } }
  ]);

  /* ==========================================================================
     00:37.067 — If I'm a sine wave
     The claim drawn as a function: sin sampled across the stage, a rider point
     sliding along it, and the tangent at that point drawn live with its angle
     read out. This is the plate that has to make "you can sit on all my
     tangents" obvious before the word itself arrives.
     ======================================================================== */
  S('th.sine', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 26);
      level(-H * 0.22, H * 0.22, -W * 0.48, W * 0.48, 8, a, 13);
      for (var i = 0; i <= 16; i++) {
        var x = lerp(-W * 0.44, W * 0.44, i / 16);
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, (i % 4 === 0 ? 0.4 : 0.18) * a));
        D.line(x, -H * 0.24, x, H * 0.24);
      }
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(-W * 0.44, 0, W * 0.44, 0);
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var k = 2.2;
      var A = 150 * U, x0 = -W * 0.44, x1 = W * 0.44;
      var wSpan = x1 - x0;
      var K = TAU * k / wSpan;
      var f = function (x) { return -Math.sin((x - x0) * K) * A; };
      var df = function (x) { return -Math.cos((x - x0) * K) * A * K; };
      var drawn = E.outCubic(clamp(p / 0.35, 0, 1));
      var i, u, x;

      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.85 * a));
      D.ctx().beginPath();
      for (i = 0; i <= 160; i++) {
        u = i / 160;
        if (u > drawn) break;
        x = lerp(x0, x1, u);
        if (i === 0) D.ctx().moveTo(x, f(x)); else D.ctx().lineTo(x, f(x));
      }
      D.ctx().stroke();

      /* the rider and the tangent it is sitting on */
      var xr = lerp(x0, x1, 0.28 + 0.72 * ((w.time * 0.14) % 1));
      var yr = f(xr);
      var m = df(xr);
      var ang = Math.atan(m);
      var ext = wSpan;

      D.lw(1.6);
      D.strokeColour(rgba(PAL().hot, 0.8 * a));
      D.line(xr - ext, yr - m * ext, xr + ext, yr + m * ext);
      if (p > 0.2) {
        D.lw(1.2);
        D.strokeColour(rgba(PAL().hot, 0.95 * a));
        D.arrowHead(xr + (x1 - xr) * 0.7, yr + m * (x1 - xr) * 0.7, ang, 10);
      }
      D.lw(1);
      D.dash([3, 5]);
      D.strokeColour(rgba(PAL().grid, 0.6 * a));
      D.line(xr, 0, xr, yr);
      D.dash([]);
      D.fillColour(rgba(PAL().hot, 1 * a));
      D.dot(xr, yr, 4.4 * U);
      D.lw(1);
      D.strokeColour(rgba(PAL().hot, 0.6 * a));
      D.scircle(xr, yr, 12 * U);

      M.callout(xr, yr, xr + 130 * U, yr + (yr > 0 ? 84 : -84) * U,
        'tangent point  (' + (xr / 10).toFixed(1) + ', ' + (-yr / 10).toFixed(1) + ')',
        { a: a * between(p, 0.28, 0.97) });

      if (p > 0.5) {
        D.lw(1.4);
        D.strokeColour(rgba(PAL().accent, 0.7 * a));
        D.arc(xr, yr, 46 * U, ang, 0, 1);
        M.sub('\u03B8 ' + (ang * 180 / Math.PI).toFixed(1) + '\u00B0',
          xr + 62 * U, yr - 18 * U,
          { px: 12, a: a * clamp((p - 0.5) / 0.3, 0, 1), colour: rgba(PAL().hot, 0.95) });
      }
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('IF I AM A SINE WAVE', 0, -H * 0.42, { px: 19, a: a * 0.95, track: 5.4 });
      M.register('amplitude', '15.00', -W * 0.44, H * 0.36, { a: a, width: 250, unit: 'u' });
      M.register('period', '2.857', -W * 0.44, H * 0.36 + 20, { a: a, width: 250, unit: 's' });
      M.register('phase', ((w.time % 6.4) / 6.4 * 360).toFixed(1), W * 0.44, H * 0.36,
        { a: a, width: 250, unit: '\u00B0' });
      M.register('slope at rider', 'live', W * 0.44, H * 0.36 + 20,
        { a: a, width: 250, colour: rgba(PAL().hot, 0.95) });
      M.sub('every point on me has a line that touches once', 0, H * 0.42,
        { px: 12, a: a * 0.6 });
      M.pulseRings(0, 0, w.time, { r0: 40, spread: 380, a: a * 0.22, rings: 2 });
    } }
  ]);

  /* ==========================================================================
     00:38.596 — Then you can sit on all my
     The third gap, and the one with the most invitation in it. The wave keeps
     running at low contrast while three tangent lines are already laid against
     it, waiting — the frame showing you where you would sit before it says so.
     ======================================================================== */
  S('th.giveC', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.2);
      frameBed(a, 40);
      var x0 = -W * 0.40, x1 = W * 0.40;
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.ctx().beginPath();
      for (var i = 0; i <= 140; i++) {
        var x = lerp(x0, x1, i / 140);
        var y = -Math.sin(i / 140 * TAU * 1.5) * 90 * U;
        if (i === 0) D.ctx().moveTo(x, y); else D.ctx().lineTo(x, y);
      }
      D.ctx().stroke();
      /* three tangent lines already laid against it, arriving one by one */
      for (var k = 0; k < 3; k++) {
        var uu = 0.24 + k * 0.26;
        var xr = lerp(x0, x1, uu);
        var yr = -Math.sin(uu * TAU * 1.5) * 90 * U;
        var m = -Math.cos(uu * TAU * 1.5) * 90 * TAU * 1.5 / (x1 - x0);
        var q = clamp((p - k * 0.16) / 0.3, 0, 1);
        D.lw(1.2);
        D.strokeColour(rgba(PAL().accent, 0.5 * a * q));
        D.line(xr - 120, yr - m * 120, xr + 120, yr + m * 120);
        D.fillColour(rgba(PAL().accent, 0.85 * a * q));
        D.dot(xr, yr, 2.8 * U);
      }
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('THEN YOU CAN SIT ON ALL MY', 0, H * 0.34,
        { px: 17, a: a * 0.8, track: 4.6, rule: true });
      M.register('surface', 'smooth', -W * 0.44, -H * 0.40, { a: a, width: 230 });
      M.register('tangents available', '\u221E', -W * 0.44, -H * 0.40 + 20,
        { a: a, width: 230, colour: rgba(PAL().hot, 0.95) });
      M.register('instruction', 'sit anywhere', W * 0.44, -H * 0.40,
        { a: a * clamp((p - 0.3) / 0.4, 0.05, 1), width: 230 });
      M.sub('one line touches me at every single point', 0, H * 0.34 + 26,
        { px: 12, a: a * 0.55 * between(p, 0.25, 0.95) });
    } },

    { l: L_WORD, e: function (w, p) {
      var a = vis(p, 0.26);
      var q = E.outExpo(clamp((p - 0.45) / 0.45, 0, 1));
      if (q <= 0.01) return;
      M.keyword('TANGENTS', 0, 0, {
        a: a * q * 0.5, px: 54, weight: '700',
        fill: rgba(PAL().ink, 0.5 * q), track: 14, measure: false
      });
    } }
  ]);

  /* ==========================================================================
     00:40.049 — TANGENTS
     The word arrives and the picture becomes the thing it names: a family of
     straight tangent lines at every angle, and the curve appearing only as the
     envelope they leave behind. The act's one plate whose subject is made
     entirely out of its own annotations.
     ======================================================================== */
  S('th.tangents', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 26);
      level(-H * 0.30, H * 0.30, -W * 0.46, W * 0.46, 10, a, 17);
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var cx = 0, cy = 30 * U;
      var R = 230 * U, r = 62 * U;
      var N = 48;
      var live = Math.max(1, Math.floor(N * E.outCubic(clamp(p / 0.55, 0, 1))));
      var i, t;

      /* the tangent line at the ellipse point (R cos t, r sin t) is
         (cos t / R) x + (sin t / r) y = 1 — each one touches exactly once */
      for (i = 0; i < live; i++) {
        t = i / N * TAU;
        var x = cx + R * Math.cos(t), y = cy + r * Math.sin(t);
        var mx = Math.cos(t) / R, my = Math.sin(t) / r;
        var len = Math.hypot(mx, my) || 1e-6;
        var tx = mx / len, ty = my / len;
        var half = 640 * U;
        var q = clamp((p - i / N * 0.5) / 0.3, 0, 1);
        D.lw(lerp(1.7, 0.8, hash(i * 131)));
        D.strokeColour(rgba(PAL().accent, (0.15 + hash(i * 313) * 0.22) * a * q));
        D.line(x - tx * half, y - ty * half, x + tx * half, y + ty * half);
      }

      /* the envelope: the curve that only exists because the lines do */
      var eq = clamp((p - 0.35) / 0.35, 0, 1);
      D.lw(2.2);
      D.strokeColour(rgba(PAL().hot, 0.9 * a * eq));
      ringPath(cx, cy, R, r, 96, 0);
      D.ctx().stroke();
      D.lw(1);
      D.strokeColour(rgba(PAL().hot, 0.35 * a));
      D.dot(cx, cy, 3 * U);
      M.callout(cx + R * 0.70, cy + r * 0.68, cx + W * 0.24, cy - H * 0.22,
        'envelope of the tangent family', { a: a * eq });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.register('tangents drawn', String(Math.floor(48 * E.outCubic(clamp(p / 0.55, 0, 1)))),
        -W * 0.44, -H * 0.38, { a: a, width: 260, unit: '/ 48' });
      M.register('envelope', p > 0.45 ? 'CLOSED' : 'forming', -W * 0.44, -H * 0.38 + 20,
        { a: a, width: 260, colour: rgba(PAL().hot, 0.95) });
      M.register('curvature', (3000 * clamp(p, 0, 1)).toFixed(0), W * 0.44, -H * 0.38,
        { a: a * clamp((p - 0.4) / 0.3, 0.05, 1), width: 260, unit: '\u00B5' });
      M.sub('a shape made entirely of straight lines', 0, H * 0.40,
        { px: 12, a: a * 0.6 });
      M.sub('each one touches exactly once, and leaves', 0, H * 0.40 + 20,
        { px: 12, a: a * 0.42 });
    } },

    { l: L_WORD, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp((p - 0.3) / 0.3, 0, 1);
      if (q <= 0.01) return;
      M.keyword('TANGENTS', 0, -H * 0.36, {
        a: a * q * 0.9, px: 40, weight: '700',
        fill: rgba(PAL().ink, 0.95), track: 12, measure: false
      });
    } }
  ]);

  /* ==========================================================================
     00:40.706 — If I approach infinity
     A value climbing toward a limit bar and never filling it. M.gauge is exactly
     the right instrument, because a gauge is a bar that can be almost full — and
     "almost" is this plate's entire subject. The last 6% takes most of the line.
     ======================================================================== */
  S('th.infinity', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      level(-H * 0.26, H * 0.30, -W * 0.30, W * 0.30, 9, a, 23);
      /* the limit bar: dashed, because it is not a place the value can be */
      D.lw(1.6);
      D.dash([7, 6]);
      D.strokeColour(rgba(PAL().hot, 0.7 * a));
      D.line(-W * 0.30, -H * 0.26, W * 0.30, -H * 0.26);
      D.dash([]);
      M.sub('L = limit', W * 0.30 + 14, -H * 0.26 + 4,
        { px: 12, a: a * 0.8, align: 'left', colour: rgba(PAL().hot, 0.9) });
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var x0 = -W * 0.30, x1 = W * 0.30;
      var yTop = -H * 0.26, yBot = H * 0.30;
      var lim = 0.94;
      var prog = clamp(p / 0.86, 0, 1);
      var v = 1 - Math.exp(-7 * prog);
      var i;

      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.9 * a));
      D.ctx().beginPath();
      for (i = 0; i <= 140; i++) {
        var u = i / 140 * prog;
        var x = lerp(x0, x1, u);
        var y = lerp(yBot, yTop, (1 - Math.exp(-7 * u)) / lim);
        if (i === 0) D.ctx().moveTo(x, y); else D.ctx().lineTo(x, y);
      }
      D.ctx().stroke();

      var px = lerp(x0, x1, prog);
      var py = lerp(yBot, yTop, v / lim);
      D.fillColour(rgba(PAL().hot, 0.95 * a));
      D.dot(px, py, 4.4 * U);
      D.lw(1);
      D.dash([3, 4]);
      D.strokeColour(rgba(PAL().grid, 0.6 * a));
      D.line(px, py, px, yBot);
      D.line(px, py, x0, py);
      D.dash([]);

      for (var k = 0; k < 7; k++) {
        var uu = 0.16 * (k + 1);
        var xx = lerp(x0, x1, uu);
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.45 * a));
        D.line(xx, yBot, xx, yBot + 10);
        D.fillColour(rgba(PAL().accent, 0.85 * a));
        D.dot(xx, lerp(yBot, yTop, (1 - Math.exp(-7 * uu)) / lim), 2.6 * U);
      }

      M.gauge(-W * 0.30, H * 0.36, W * 0.60, 14 * U, v * 0.985,
        'value  ' + v.toFixed(4) + '   limit  ' + lim.toFixed(4) +
        '   difference never reaches zero',
        { a: a * clamp((p - 0.15) / 0.4, 0, 1), colour: rgba(PAL().accent, 0.9) });

      if (p > 0.5) {
        M.sub('n \u2192 \u221E', W * 0.30 + 14, yTop + 26,
          { px: 15, a: a * clamp((p - 0.5) / 0.3, 0, 1), align: 'left',
            colour: rgba(PAL().hot, 0.95) });
      }
      M.pulseRings(px, py, w.time, { r0: 6, spread: 180, a: a * 0.4, rings: 2 });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('IF I APPROACH INFINITY', 0, -H * 0.42, { px: 19, a: a * 0.95, track: 5.4 });
      M.register('term', '1 \u2212 e^(\u22127n)', -W * 0.44, -H * 0.36, { a: a, width: 270 });
      M.register('status', p > 0.86 ? 'ARRIVING, NEVER ARRIVED' : 'APPROACHING',
        -W * 0.44, -H * 0.36 + 20, { a: a, width: 270, colour: rgba(PAL().hot, 0.95) });
      M.sub('the gauge can be as full as you like', 0, H * 0.42, { px: 12, a: a * 0.55 });
    } }
  ]);

  /* ==========================================================================
     00:42.346 — Then you can be my
     The fourth gap, and the possessive one. The frame draws the boundary it is
     about to hand over: an outline that is not yet holding anything.
     ======================================================================== */
  S('th.bemine', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.2);
      frameBed(a, 40);
      var q = E.outCubic(clamp(p / 0.55, 0, 1));
      D.lw(1.4);
      D.dash([6, 6]);
      D.strokeColour(rgba(PAL().accent, 0.7 * a));
      ringPath(0, 0, 280 * q, 150 * q, 72, 0);
      D.ctx().stroke();
      D.dash([]);
      D.lw(1.4);
      D.strokeColour(rgba(PAL().accent, 0.55 * a));
      D.bracket(-280 * q, -150 * q, 560 * q, 300 * q, 26);
      M.sub('boundary established', 0, 194 * U, { px: 12, a: a * 0.6 });
      /* the curve is not inside it yet: one dot, arriving */
      D.fillColour(rgba(PAL().phosphor, 0.9 * a * q));
      D.dot(lerp(-W * 0.46, -W * 0.10, q), 0, 3 * U);
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('THEN YOU CAN BE MY', 0, -H * 0.40,
        { px: 17, a: a * 0.8, track: 4.6, rule: true });
      M.register('ownership', 'yours', -W * 0.44, H * 0.36,
        { a: a * clamp((p - 0.3) / 0.4, 0.05, 1), width: 230 });
      M.register('contents', 'none', -W * 0.44, H * 0.36 + 20, { a: a, width: 230 });
      M.sub('a cage is a position, not a punishment', 0, H * 0.42, { px: 12, a: a * 0.5 });
    } },

    { l: L_WORD, e: function (w, p) {
      var a = vis(p, 0.26);
      var q = E.outExpo(clamp((p - 0.45) / 0.45, 0, 1));
      if (q <= 0.01) return;
      M.keyword('LIMITATIONS', 0, 0, {
        a: a * q * 0.5, px: 50, weight: '700',
        fill: rgba(PAL().ink, 0.5 * q), track: 10, measure: false
      });
    } }
  ]);

  /* ==========================================================================
     00:43.507 — LIMITATIONS
     The possessive claim, drawn literally: the curve is caged, and the cage is an
     object the machine is holding out to you. The plate marks every point where
     the curve touches a bar, because those marks are the only evidence that the
     limit is doing anything at all.
     ======================================================================== */
  S('th.limits', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      /* the bar chart of everything the curve wanted, and did not get */
      var N = 36;
      for (var i = 0; i < N; i++) {
        var x = lerp(-W * 0.44, W * 0.44, i / (N - 1));
        var d = Math.abs(Math.sin(i * 0.7 + 0.4));
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.2 * a));
        D.line(x, H * 0.36, x, H * 0.36 - (1 - d) * H * 0.30);
      }
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var close = E.outCubic(clamp(p / 0.62, 0, 1));
      var half = lerp(230, 118, close) * U;
      var vhalf = lerp(168, 92, close) * U;
      var bars = 11, i, u, x;

      /* the enclosure the machine is drawing around the curve */
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.75 * a));
      ringPath(0, 0, W * 0.30, H * 0.33, 80, 0);
      D.ctx().stroke();

      /* the bars, standing inside it, so the cage reads as a volume */
      D.lw(1.6);
      D.strokeColour(rgba(PAL().accent, 0.8 * a));
      for (i = 0; i < bars; i++) {
        u = (i / (bars - 1)) * 2 - 1;
        var sq = Math.sqrt(Math.max(0, 1 - u * u));
        D.line(u * half, -vhalf * sq, u * half, vhalf * sq);
      }
      /* and the two caps: the cage closing on the curve */
      D.lw(2.4);
      D.strokeColour(rgba(PAL().hot, 0.85 * a * close));
      D.line(-half, -vhalf, half, -vhalf);
      D.line(-half, vhalf, half, vhalf);

      /* the curve, clamped: it keeps trying to leave and cannot */
      var f = function (x) { return -Math.sin(x / 100 + w.time * 0.7) * 112; };
      D.lw(2);
      D.strokeColour(rgba(PAL().phosphor, 0.85 * a));
      D.ctx().beginPath();
      for (i = 0; i <= 160; i++) {
        x = lerp(-W * 0.42, W * 0.42, i / 160);
        var y = clamp(f(x), -vhalf, vhalf);
        if (i === 0) D.ctx().moveTo(x, y); else D.ctx().lineTo(x, y);
      }
      D.ctx().stroke();

      /* every touch: the limit actually acting on the curve */
      for (i = 0; i <= 160; i++) {
        x = lerp(-W * 0.42, W * 0.42, i / 160);
        var raw = f(x);
        if (Math.abs(raw) > vhalf - 1 && Math.abs(x) < half) {
          D.fillColour(rgba(PAL().hot, 0.9 * a));
          D.dot(x, Math.sign(raw) * vhalf, 2.4 * U);
        }
      }
      M.callout(half, -vhalf, half + 80 * U, -vhalf - 80 * U,
        'bound on the deviation', { a: a * clamp((p - 0.35) / 0.35, 0, 1) });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      var close = E.outCubic(clamp(p / 0.62, 0, 1));
      M.register('limit \u03B5', lerp(2.30, 1.18, close).toFixed(3),
        -W * 0.44, -H * 0.38, { a: a, width: 270, unit: 'u' });
      M.register('deviation', 'clipped', -W * 0.44, -H * 0.38 + 20,
        { a: a, width: 270, colour: rgba(PAL().hot, 0.95) });
      M.register('escapes', '0', -W * 0.44, -H * 0.38 + 40,
        { a: a * clamp((p - 0.5) / 0.3, 0.05, 1), width: 270 });
      M.sub('you can be the reason I stop', 0, H * 0.42, { px: 12, a: a * 0.55 });
      if (p > 0.42) {
        M.keyword('LIMITATIONS', 0, H * 0.34, {
          a: a * clamp((p - 0.42) / 0.3, 0, 1), px: 36, weight: '700',
          fill: rgba(PAL().ink, 0.95), track: 11, measure: false
        });
      }
    } }
  ]);

  /* ==========================================================================
     00:44.452 — Switch my current
     A real switch being thrown, and the current it produces: squared-off DC
     compared against sinusoidal AC on one axis, with the live signal crossfading
     through the throw. Documentation, not metaphor — the waveform changes shape.
     ======================================================================== */
  S('th.current', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 26);
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(-W * 0.46, 0, W * 0.46, 0);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.3 * a));
      for (var i = -4; i <= 4; i++) {
        D.line(-W * 0.46, i * 42 * U, W * 0.46, i * 42 * U);
      }
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var x0 = -W * 0.44, x1 = W * 0.42;
      var A = 128 * U;
      var th = E.outCubic(clamp((p - 0.16) / 0.36, 0, 1));
      var blend = clamp((p - 0.34) / 0.30, 0, 1);
      var i, u, x;

      /* the DC trace, squared off, held as a ghost reference */
      D.lw(1.4);
      D.strokeColour(rgba(PAL().grid, 0.7 * a));
      D.ctx().beginPath();
      for (i = 0; i <= 40; i++) {
        u = i / 40; x = lerp(x0, x1, u);
        var sq = (Math.sin(u * TAU * 1.5) >= 0 ? 1 : -1) * A;
        if (i === 0) D.ctx().moveTo(x, -sq); else D.ctx().lineTo(x, -sq);
      }
      D.ctx().stroke();

      /* the live trace: crossfaded between the two regimes by the lever */
      D.lw(2.2);
      D.strokeColour(rgba(PAL().accent, 0.9 * a));
      D.ctx().beginPath();
      for (i = 0; i <= 220; i++) {
        u = i / 220; x = lerp(x0, x1, u);
        var dc = (Math.sin(u * TAU * 1.5) >= 0 ? 1 : -1) * A;
        var ac = Math.sin(u * TAU * 3 + w.time * 1.4) * A;
        var v = lerp(dc, ac, blend);
        if (i === 0) D.ctx().moveTo(x, -v); else D.ctx().lineTo(x, -v);
      }
      D.ctx().stroke();

      /* the switch, drawn the way a machine draws one: lever, two terminals and
         the arc the throw travels through */
      var sx = W * 0.06, sy = H * 0.30;
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.7 * a));
      D.dash([3, 4]);
      D.arc(sx, sy, 74 * U, Math.PI, TAU, 1);
      D.dash([]);
      D.fillColour(rgba(PAL().grid, 0.9 * a));
      D.dot(sx - 74 * U, sy, 4 * U);
      D.dot(sx + 74 * U, sy, 4 * U);
      var la = lerp(Math.PI, Math.PI * 1.62, th);
      D.lw(2.4);
      D.strokeColour(rgba(PAL().hot, 0.9 * a));
      D.line(sx, sy, sx + Math.cos(la) * 74 * U, sy + Math.sin(la) * 74 * U);
      D.fillColour(rgba(PAL().hot, 1 * a));
      D.dot(sx, sy, 3.4 * U);
      M.sub(th > 0.82 ? 'AC' : (th < 0.12 ? 'DC' : 'THROWING'), sx, sy + 26 * U,
        { px: 13, a: a * 0.9,
          colour: th > 0.82 ? rgba(PAL().accent, 0.95) : rgba(PAL().hot, 0.95) });
      M.callout(sx - 74 * U, sy, sx - 170 * U, sy - 80 * U, 'switch', { a: a * 0.9 });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('SWITCH MY CURRENT', 0, -H * 0.42, { px: 19, a: a * 0.95, track: 5.4 });
      var th = E.outCubic(clamp((p - 0.16) / 0.36, 0, 1));
      M.gauge(-W * 0.44, H * 0.36, W * 0.44, 12 * U, th, 'SPDT lever travel', { a: a });
      M.register('source', 'DC', W * 0.14, H * 0.36, { a: a, width: 200 });
      M.register('target', 'AC', W * 0.14, H * 0.36 + 20,
        { a: a * clamp((p - 0.3) / 0.3, 0.05, 1), width: 200, colour: rgba(PAL().hot, 0.95) });
      M.register('switching', th > 0.5 ? 'AC' : 'DC', W * 0.46, H * 0.36,
        { a: a, width: 200, colour: rgba(PAL().hot, 0.95) });
      M.register('freq', th > 0.5 ? (50 + 10 * Math.sin(w.time * 2)).toFixed(1) : '0.0',
        W * 0.46, H * 0.36 + 20, { a: a, width: 200, unit: 'Hz' });
    } }
  ]);

  /* ==========================================================================
     00:45.850 — To AC, to DC
     Both currents at once, beating against each other: the AC carrier rides on a
     squared-off DC level, their sum is drawn, and the envelope closes and opens
     like an instrument that has found a fault. Deliberately busier than the
     plate before it.
     ======================================================================== */
  S('th.acdc', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 24);
      level(-H * 0.28, H * 0.28, -W * 0.46, W * 0.46, 12, a, 29);
      M.sub('AC', -W * 0.44, -H * 0.34, { px: 13, a: a * 0.8, align: 'left',
        colour: rgba(PAL().accent, 0.9) });
      M.sub('DC', W * 0.44, -H * 0.34, { px: 13, a: a * 0.8, align: 'right',
        colour: rgba(PAL().hot, 0.9) });
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var x0 = -W * 0.44, x1 = W * 0.44, A = 140 * U;
      var i, u, x;

      /* DC: a held level, drawn at both rails */
      D.lw(1);
      D.dash([5, 5]);
      D.strokeColour(rgba(PAL().hot, 0.6 * a));
      D.line(x0, -A * 0.72, x1, -A * 0.72);
      D.line(x0, A * 0.72, x1, A * 0.72);
      D.dash([]);

      /* AC: the carrier */
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.85 * a));
      D.ctx().beginPath();
      for (i = 0; i <= 260; i++) {
        u = i / 260; x = lerp(x0, x1, u);
        var ac = Math.sin(u * TAU * 5 + w.time * 1.8) * A * 0.72;
        if (i === 0) D.ctx().moveTo(x, -ac); else D.ctx().lineTo(x, -ac);
      }
      D.ctx().stroke();

      /* the sum: where the two disagree, and the reason the frame is alarmed */
      D.lw(1.8);
      D.strokeColour(rgba(PAL().phosphor, 0.7 * a));
      D.ctx().beginPath();
      for (i = 0; i <= 260; i++) {
        u = i / 260; x = lerp(x0, x1, u);
        var s1 = Math.sin(u * TAU * 5 + w.time * 1.8) * A * 0.72;
        var s2 = (Math.sin(u * TAU * 2.5) >= 0 ? 1 : -1) * A * 0.28;
        if (i === 0) D.ctx().moveTo(x, -(s1 + s2)); else D.ctx().lineTo(x, -(s1 + s2));
      }
      D.ctx().stroke();

      /* the beat envelope, drawn as two curves closing on each other */
      D.lw(1.2);
      D.strokeColour(rgba(PAL().hot, 0.5 * a));
      for (var side = -1; side <= 1; side += 2) {
        D.ctx().beginPath();
        for (i = 0; i <= 120; i++) {
          u = i / 120; x = lerp(x0, x1, u);
          var env = A * 0.72 *
            lerp(0.35, 1, (1 + Math.sin(u * TAU * 1.5 + w.time * 0.9)) / 2) * side;
          if (i === 0) D.ctx().moveTo(x, env); else D.ctx().lineTo(x, env);
        }
        D.ctx().stroke();
      }

      var beat = (1 + Math.sin(w.time * 0.9)) / 2;
      D.fillColour(rgba(PAL().hot, 0.9 * a));
      D.dot(lerp(x0, x1, (w.time * 0.18) % 1), -A * 0.72 * beat, 3.6 * U);
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('TO AC, TO DC', 0, -H * 0.42, { px: 21, a: a * 0.95, track: 7 });
      var beat = (1 + Math.sin(w.time * 0.9)) / 2;
      M.gauge(-W * 0.30, H * 0.36, W * 0.60, 12 * U, beat,
        'envelope, beating against itself', { a: a, colour: rgba(PAL().hot, 0.9) });
      M.register('ac', '50.0', -W * 0.44, H * 0.30, { a: a, width: 200, unit: 'Hz' });
      M.register('dc', '0.0', -W * 0.44, H * 0.30 + 20, { a: a, width: 200, unit: 'Hz' });
      M.register('offset', (72 * beat).toFixed(1), W * 0.34, H * 0.30,
        { a: a, width: 210, unit: 'V', colour: rgba(PAL().phosphor, 0.95) });
      M.sub('both at once, and neither wins', 0, H * 0.42, { px: 12, a: a * 0.55 });
    } }
  ]);

  /* ==========================================================================
     00:47.672 — And then blind my vision
     Vision cut. An aperture closes, the eye flattens to a line, the signal is
     clipped to zero — and then the frame's own read-out is taken away. This is
     the one plate in the act that deliberately destroys its own annotation.
     ======================================================================== */
  S('th.blind', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      var shut = E.inOutQuad(clamp(p / 0.66, 0, 1));
      frameBed(a, 30);
      var rx = lerp(300, 320, shut) * U;
      var ry = lerp(210, 2.2, shut) * U;
      D.lw(2.4);
      D.strokeColour(rgba(PAL().accent, 0.85 * a));
      ringPath(0, 0, rx, ry, 80, 0);
      D.ctx().stroke();
      /* iris blades, so the closing reads as a mechanism and not a fade */
      for (var i = 0; i < 12; i++) {
        var ang = i / 12 * TAU;
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.45 * a));
        D.line(Math.cos(ang) * rx * 0.98, Math.sin(ang) * ry * 0.98,
               Math.cos(ang + 0.4) * rx * 0.45, Math.sin(ang + 0.4) * ry * 0.45);
      }
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.85 * a * shut));
      D.line(-rx, 0, rx, 0);
      if (shut > 0.3) {
        M.sub('aperture ' + (100 - shut * 100).toFixed(0) + '%', 0, ry + 46 * U,
          { px: 12, a: a * 0.7, colour: rgba(PAL().hot, 0.95) });
      }
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var x0 = -W * 0.42, x1 = W * 0.42, y = H * 0.26;
      var clipv = E.outCubic(clamp((p - 0.3) / 0.5, 0, 1));
      D.lw(1.4);
      D.strokeColour(rgba(PAL().accent, 0.7 * a * (1 - clipv * 0.7)));
      D.ctx().beginPath();
      for (var i = 0; i <= 200; i++) {
        var u = i / 200, x = lerp(x0, x1, u);
        var v = Math.sin(u * TAU * 6 + w.time * 1.2) * 40 * (1 - clipv);
        if (i === 0) D.ctx().moveTo(x, y - v); else D.ctx().lineTo(x, y - v);
      }
      D.ctx().stroke();
      D.lw(1.2);
      D.strokeColour(rgba(PAL().hot, 0.6 * a * clipv));
      D.line(x0, y, x1, y);
      /* the two clip rails the signal was allowed to swing inside */
      var rail = lerp(40, 1, clipv);
      D.lw(1);
      D.dash([4, 5]);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(x0, y - rail, x1, y - rail);
      D.line(x0, y + rail, x1, y + rail);
      D.dash([]);
      M.sub('clipped to 0.000', x1, y + 46 * U,
        { px: 12, a: a * clipv, align: 'right', colour: rgba(PAL().hot, 0.95) });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      var blank = clamp((p - 0.72) / 0.2, 0, 1);
      M.banner('AND THEN BLIND MY VISION', 0, -H * 0.42,
        { px: 19, a: a * 0.95 * (1 - blank * 0.9), track: 5.0 });
      M.register('aperture', blank > 0.5 ? 'CLOSED' : (100 - blank * 100).toFixed(0),
        -W * 0.44, -H * 0.38, { a: a * (1 - blank), width: 250, unit: '%' });
      M.register('illumination', (1 - blank).toFixed(3), -W * 0.44, -H * 0.38 + 20,
        { a: a * (1 - blank), width: 250, unit: 'lx' });
      M.register('signal', '\u2014', -W * 0.44, -H * 0.38 + 40,
        { a: a * (1 - blank * 0.85), width: 250 });
      M.register('sight', blank > 0.5 ? '\u2014' : 'OK', W * 0.44, -H * 0.38,
        { a: a * (1 - blank), width: 250 });
      /* the frame's own line, failing */
      if (blank > 0.12) {
        D.lw(1.6);
        D.strokeColour(rgba(PAL().hot, 0.45 * a * (1 - blank)));
        D.line(-W * 0.20, H * 0.40, -W * 0.20 + W * 0.40 * (1 - blank), H * 0.40);
        M.sub('NO DATA', 0, H * 0.40 - 20 * U,
          { px: 14, a: a * blank, colour: rgba(PAL().hot, 0.95) });
      }
      M.pulseRings(0, 0, w.time, { r0: 30, spread: 260, a: a * 0.18 * (1 - blank), rings: 2 });
    } }
  ]);

  /* ==========================================================================
     00:49.534 — So dizzy, so dizzy
     The frame cannot hold itself straight any more: the stage tilts, the grid
     goes with it, and the subject is drawn twice at two slightly different
     angles. M.fracture is used exactly once, on the axis — the tilt is damage,
     not a camera move, and the plate says so by cracking the line it measures
     against.
     ======================================================================== */
  S('th.dizzy', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      var th = lerp(0, 0.22, E.inOutQuad(clamp(p / 0.7, 0, 1))) + Math.sin(w.time * 1.7) * 0.055;
      D.ctx().save();
      D.ctx().rotate(th);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.26 * a));
      for (var i = -10; i <= 10; i++) {
        D.line(i * 90 * U, -H * 0.75, i * 90 * U, H * 0.75);
        D.line(-W * 0.75, i * 90 * U, W * 0.75, i * 90 * U);
      }
      /* the frame's own border tilts with it, which is the whole problem */
      D.lw(1.4);
      D.strokeColour(rgba(PAL().grid, 0.4 * a));
      D.srect(-W * 0.40, -H * 0.38, W * 0.80, H * 0.76);
      D.ctx().restore();
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var th = lerp(0, 0.22, E.inOutQuad(clamp(p / 0.7, 0, 1))) + Math.sin(w.time * 1.7) * 0.055;
      var wob = Math.sin(w.time * 2.3) * 0.03;
      var pass, i;

      /* the subject drawn twice: same curve, two angles, one of them late */
      for (pass = 0; pass < 2; pass++) {
        D.ctx().save();
        D.ctx().rotate(th * (pass === 0 ? 1 : 0.86) + (pass === 1 ? wob : 0));
        D.ctx().globalAlpha = clamp(a * (pass === 0 ? 0.9 : 0.4), 0, 1);
        D.lw(pass === 0 ? 2.2 : 1.4);
        D.strokeColour(rgba(pass === 0 ? PAL().accent : PAL().hot, 0.85));
        D.ctx().beginPath();
        for (i = 0; i <= 140; i++) {
          var u = i / 140, x = lerp(-W * 0.38, W * 0.38, u);
          var y = -Math.sin(u * TAU * 2 + w.time * 1.1 + pass * 0.22) * 96 * U;
          if (i === 0) D.ctx().moveTo(x, y); else D.ctx().lineTo(x, y);
        }
        D.ctx().stroke();
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.5));
        D.line(-W * 0.42, 0, W * 0.42, 0);
        D.ctx().restore();
        D.ctx().globalAlpha = 1;
      }

      /* the one crack, on the axis everything else is measured against */
      D.ctx().save();
      D.ctx().rotate(th);
      D.ctx().globalAlpha = clamp(a * between(p, 0.35, 0.95), 0, 1);
      M.fracture(0, 0, 260 * U, 3.7, { segs: 7, width: 1.6, wide: true });
      D.ctx().restore();
      D.ctx().globalAlpha = 1;

      /* A reticle that cannot settle on anything — but it SEE-SAWS rather than
         spinning. The phase was `w.time * 1.3`, which is a continuous rotation,
         and that is what read as the frame turning steadily clockwise. The line
         is "so dizzy", not "so rotating": dizziness is an oscillation that will
         not damp, so every motion here is a sine of time with no drift term —
         it rocks out and back, gaining nothing, settling nowhere. */
      D.ctx().save();
      D.ctx().translate(Math.sin(w.time * 1.9) * 90 * U, Math.cos(w.time * 2.2) * 54 * U);
      /* the rock, not a spin: two incommensurable periods so it never repeats
         exactly, and an eased profile so it hesitates at each extreme */
      var rock = Math.sin(w.time * 0.62) * 0.62 + Math.sin(w.time * 1.03 + 1.1) * 0.38;
      var rockEased = Math.sign(rock) * Math.pow(Math.abs(rock), 1.5);
      D.ctx().rotate(th * 1.4 + rockEased * 0.95);
      D.lw(1.2);
      D.strokeColour(rgba(PAL().hot, 0.7 * a));
      D.reticle(0, 0, 46 * U, rockEased * 0.9);
      D.ctx().restore();

      /* and the frame carries a bubble level on the same clock, so the rock is
         something the machine is measuring rather than merely doing */
      D.ctx().save();
      D.ctx().globalAlpha = clamp(a * 0.6, 0, 1);
      var arcR = 150 * U, arcY = H * 0.20;
      D.lw(1.2);
      D.strokeColour(rgba(PAL().accent, 0.55));
      D.ctx().beginPath();
      for (var k2 = 0; k2 <= 24; k2++) {
        var a2 = -0.42 + (k2 / 24) * 0.84;
        var px2 = Math.sin(a2) * arcR, py2 = arcY - (1 - Math.cos(a2)) * arcR;
        if (k2 === 0) D.ctx().moveTo(px2, py2); else D.ctx().lineTo(px2, py2);
      }
      D.ctx().stroke();
      /* the bubble on that arc: the rock, made readable */
      D.lw(2.4);
      D.strokeColour(rgba(PAL().hot, 0.9));
      var pa = rockEased * 0.42;
      D.line(Math.sin(pa) * arcR, arcY - (1 - Math.cos(pa)) * arcR,
             Math.sin(pa) * (arcR - 22 * U), arcY - (1 - Math.cos(pa)) * arcR + 22 * U);
      D.fillColour(rgba(PAL().hot, 0.85));
      D.fcircle(Math.sin(pa) * arcR, arcY - (1 - Math.cos(pa)) * arcR, 4 * U);
      D.ctx().restore();
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      var th = lerp(0, 0.22, E.inOutQuad(clamp(p / 0.7, 0, 1)));
      M.banner('SO DIZZY', -W * 0.42, -H * 0.42, { px: 21, a: a * 0.95, track: 6, align: 'left' });
      M.banner('SO DIZZY', W * 0.42, H * 0.42, { px: 21, a: a * 0.7, track: 6, align: 'right' });
      M.register('tilt', (th * 180 / Math.PI).toFixed(2), -W * 0.44, H * 0.34,
        { a: a, width: 240, unit: '\u00B0' });
      M.register('horizon', 'LOST', -W * 0.44, H * 0.34 + 20,
        { a: a * clamp((p - 0.3) / 0.3, 0.05, 1), width: 240, colour: rgba(PAL().hot, 0.95) });
      M.register('duplicates', '2', W * 0.44, H * 0.34, { a: a, width: 240 });
      M.register('vestibular', (98 - 40 * clamp(p, 0, 1)).toFixed(0), W * 0.44, H * 0.34 + 20,
        { a: a, width: 240, colour: rgba(PAL().hot, 0.95) });
    } }
  ]);

  /* ==========================================================================
     00:51.363 — Oh, we can travel
     A time axis with A.D. on one side and B.C. on the other, and a marker sliding
     across the zero it was never supposed to cross. The frame reads out the year
     it is passing through as it goes, without ceremony.
     ======================================================================== */
  S('th.travel', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      rule(-W * 0.44, W * 0.44, H * 0.10, a * 0.9, 11);
      M.sub('B.C.', -W * 0.40, H * 0.10 + 54 * U,
        { px: 20, a: a * 0.8, colour: rgba(PAL().accent, 0.9) });
      M.sub('A.D.', W * 0.40, H * 0.10 + 54 * U,
        { px: 20, a: a * 0.8, colour: rgba(PAL().accent, 0.9) });
      M.sub('0', 0, H * 0.10 + 54 * U,
        { px: 16, a: a * 0.9, colour: rgba(PAL().hot, 0.95) });
      D.lw(1.4);
      D.strokeColour(rgba(PAL().hot, 0.7 * a));
      D.line(0, H * 0.10 - 40 * U, 0, H * 0.10 + 40 * U);
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var x0 = -W * 0.44, x1 = W * 0.44, y = H * 0.10;
      var u = E.inOutQuad(clamp(p / 0.85, 0, 1));
      var span = (x1 - x0) * 0.86;
      var mx = lerp(-span / 2, span / 2, u);
      var k;

      /* the track already travelled: a trail of decaying echoes */
      for (k = 0; k < 14; k++) {
        var uu = u - k * 0.035;
        if (uu < 0) break;
        D.fillColour(rgba(PAL().accent, (0.55 - k * 0.035) * a));
        D.dot(lerp(-span / 2, span / 2, uu), y, (3.4 - k * 0.16) * U);
      }
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.9 * a));
      D.line(mx, y - 52 * U, mx, y + 52 * U);
      D.fillColour(rgba(PAL().hot, 1 * a));
      D.dot(mx, y, 5 * U);
      D.lw(1);
      D.strokeColour(rgba(PAL().hot, 0.5 * a));
      D.scircle(mx, y, 18 * U);

      var yr = (u - 0.5) * 4000;
      M.register('year', (yr >= 0 ? 'A.D. ' : 'B.C. ') + Math.abs(yr).toFixed(0),
        mx + 22 * U, y - 76 * U, { a: a, width: 210, colour: rgba(PAL().hot, 0.95) });
      M.register('zero crossing', u > 0.5 ? 'PASSED' : 'pending', mx + 22 * U, y - 56 * U,
        { a: a, width: 210 });
      M.callout(mx, y + 52 * U, mx + 160 * U, y + 120 * U, 'present', { a: a * 0.85 });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('OH, WE CAN TRAVEL', 0, -H * 0.42, { px: 19, a: a * 0.95, track: 5.2 });
      M.register('direction', 'retrograde', -W * 0.44, -H * 0.36, { a: a, width: 260 });
      M.register('rate', (-3.6).toFixed(1), -W * 0.44, -H * 0.36 + 20,
        { a: a, width: 260, unit: 'yr/s', colour: rgba(PAL().hot, 0.95) });
      M.sub('the axis does not care which way you go', 0, -H * 0.30,
        { px: 12, a: a * 0.5 });
    } }
  ]);

  /* ==========================================================================
     00:53.225 — To A.D., to B.C.
     Two timelines running in opposite directions past each other, with the offset
     between them measured live. Where the previous plate had one marker, this one
     has two, and they are not synchronised.
     ======================================================================== */
  S('th.adbc', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 24);
      level(-H * 0.22, H * 0.18, -W * 0.48, W * 0.48, 9, a, 31);
      M.sub('A.D. \u2192', -W * 0.46, -H * 0.22 - 22 * U,
        { px: 14, a: a * 0.85, align: 'left', colour: rgba(PAL().accent, 0.9) });
      M.sub('\u2190 B.C.', W * 0.46, H * 0.18 + 44 * U,
        { px: 14, a: a * 0.85, align: 'right', colour: rgba(PAL().hot, 0.9) });
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var x0 = -W * 0.44, x1 = W * 0.44;
      var yA = -H * 0.22, yB = H * 0.18;
      var u = clamp(p / 0.9, 0, 1);
      var i;

      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.85 * a));
      D.line(x0, yA, lerp(x0, x1, u), yA);
      D.strokeColour(rgba(PAL().hot, 0.85 * a));
      D.line(x1, yB, lerp(x1, x0, u), yB);

      var ax = lerp(x0, x1, u), bx = lerp(x1, x0, u);
      D.fillColour(rgba(PAL().accent, 1 * a));
      D.dot(ax, yA, 4.4 * U);
      D.fillColour(rgba(PAL().hot, 1 * a));
      D.dot(bx, yB, 4.4 * U);
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.7 * a));
      D.dash([4, 4]);
      D.line(ax, yA, bx, yB);
      D.dash([]);
      /* the zero both of them pass through, and only once */
      D.lw(1);
      D.strokeColour(rgba(PAL().phosphor, 0.5 * a));
      D.scircle(0, (yA + yB) / 2, 40 * U);

      for (i = 0; i <= 10; i++) {
        var xx = lerp(x0, x1, i / 10);
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.4 * a));
        D.line(xx, yA + 8, xx, yA + 20);
        D.line(xx, yB - 8, xx, yB - 20);
      }
      M.callout(bx, yB, bx + 90 * U, yB + 96 * U, 'B.C. head', { a: a * 0.85 });
      M.callout(ax, yA, ax - 90 * U, yA - 96 * U, 'A.D. head', { a: a * 0.85 });
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('TO A.D., TO B.C.', 0, -H * 0.42, { px: 21, a: a * 0.95, track: 6.4 });
      var u = clamp(p / 0.9, 0, 1);
      M.register('offset', ((u - 0.5) * 2 * W * 0.88 / 10).toFixed(1),
        -W * 0.44, H * 0.34, { a: a, width: 250, unit: 'u' });
      M.register('divergence', (u * 100).toFixed(0), -W * 0.44, H * 0.34 + 20,
        { a: a, width: 250, unit: '%', colour: rgba(PAL().hot, 0.95) });
      M.register('meeting', 'at zero only', W * 0.44, H * 0.34, { a: a, width: 250 });
      M.sub('two histories, one line, no agreement', 0, H * 0.42, { px: 12, a: a * 0.55 });
    } }
  ]);

  /* ==========================================================================
     00:55.083 — And we can unite
     Two shapes intersecting: a disc and a square are brought together, the
     intersection is filled through a clipping path so it can only exist where
     both shapes do, and its area is measured. The act's only true boolean, so it
     gets the loudest emphasis in the act.
     ======================================================================== */
  S('th.unite', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      level(-H * 0.30, H * 0.30, -W * 0.46, W * 0.46, 10, a, 37);
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var bring = E.inOutQuad(clamp(p / 0.55, 0, 1));
      var r = 170 * U;
      var sq = 130 * U;
      var cxA = lerp(-W * 0.26, -62 * U, bring);
      var cxB = lerp(W * 0.26, 62 * U, bring);
      var i;

      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.8 * a));
      D.scircle(cxA, 0, r);
      D.strokeColour(rgba(PAL().hot, 0.8 * a));
      D.srect(cxB - sq, -sq, sq * 2, sq * 2);

      /* the intersection: filled and then hatched, both clipped, so it exists
         only where the two operands overlap */
      if (bring > 0.3) {
        var q = clamp((p - 0.3) / 0.35, 0, 1);
        D.ctx().save();
        D.ctx().beginPath();
        D.ctx().rect(cxB - sq, -sq, sq * 2, sq * 2);
        D.ctx().clip();
        D.fillColour(rgba(PAL().phosphor, 0.22 * a * q));
        D.fcircle(cxA, 0, r);
        D.ctx().restore();

        D.ctx().save();
        D.ctx().beginPath();
        D.ctx().rect(cxB - sq, -sq, sq * 2, sq * 2);
        D.ctx().clip();
        D.ctx().beginPath();
        D.ctx().arc(cxA, 0, r, 0, TAU);
        D.ctx().clip();
        D.lw(1);
        D.strokeColour(rgba(PAL().phosphor, 0.35 * a * q));
        for (i = -14; i <= 14; i++) {
          D.line(cxA - r + i * 18, -r, cxA - r + i * 18 + r * 2, r);
        }
        D.ctx().restore();

        /* the arc of A that is actually inside B, re-stroked as emphasis */
        var dx = (cxB - sq) - cxA;
        if (dx < r && dx > -r) {
          var th = Math.acos(clamp(dx / r, -1, 1));
          D.lw(2.4);
          D.strokeColour(rgba(PAL().phosphor, 0.9 * a * q));
          D.arc(cxA, 0, r, -th, th, 2.4);
          var hy = Math.sqrt(Math.max(0, r * r - dx * dx));
          D.fillColour(rgba(PAL().phosphor, 0.95 * a));
          D.dot(cxB - sq, -hy, 3 * U);
          D.dot(cxB - sq, hy, 3 * U);
          M.callout(cxB - sq, -hy, cxB - sq + 140 * U, -hy - 96 * U, 'A \u2229 B',
            { a: a * clamp((p - 0.45) / 0.3, 0, 1) });
        }
      }
      D.fillColour(rgba(PAL().accent, 0.9 * a));
      D.dot(cxA, 0, 3 * U);
      D.fillColour(rgba(PAL().hot, 0.9 * a));
      D.dot(cxB, 0, 3 * U);
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('AND WE CAN UNITE', 0, -H * 0.42, { px: 21, a: a * 0.95, track: 5.6 });
      var bring = E.inOutQuad(clamp(p / 0.55, 0, 1));
      M.register('operator', '\u2229', -W * 0.44, H * 0.36, { a: a, width: 240 });
      M.register('intersection area', (Math.PI * 17 * 17 * 0.36 * bring).toFixed(1),
        -W * 0.44, H * 0.36 + 20,
        { a: a * clamp((p - 0.35) / 0.3, 0.05, 1), width: 240, unit: 'u\u00B2',
          colour: rgba(PAL().phosphor, 0.95) });
      M.register('shared', (bring * 100).toFixed(0), W * 0.44, H * 0.36,
        { a: a, width: 240, unit: '%' });
      M.register('remainder', ((1 - bring) * 100).toFixed(0), W * 0.44, H * 0.36 + 20,
        { a: a, width: 240 });
      M.sub('everything that is in both of us', 0, H * 0.42, { px: 12, a: a * 0.6 });
      M.pulseRings(0, 0, w.time, { r0: 60, spread: 320, a: a * 0.2 * bring, rings: 2 });
    } }
  ]);

  /* ==========================================================================
     00:56.916 — So deeply, so deeply
     The intersection again, but one inside the next: A∩B, then (A∩B)∩C, then
     again, each level smaller and dimmer, until the innermost one is the only
     thing still lit. "Deeply" as a recursion the frame performs for you, with the
     level counter running in the corner to make it a measurement.
     ======================================================================== */
  S('th.deeply', [
    { l: L_BED, e: function (w, p) {
      var a = vis(p, 0.16);
      frameBed(a, 30);
      level(-H * 0.28, H * 0.28, -W * 0.44, W * 0.44, 9, a, 41);
    } },

    { l: L_TRACE, e: function (w, p) {
      var a = vis(p, 0.16);
      var N = 5, i, k;
      for (i = 0; i < N; i++) {
        var q = stag(p, i, N, 0.6);
        if (q <= 0.001) continue;
        var rr = 300 * U * Math.pow(0.70, i) *
                 (1 + (noise(i * 3.1 + 0.5, w.time * 0.22) - 0.5) * 0.10);
        var rot = thetaAt(w.time, 30) * 0.10 + i * 0.28;

        D.ctx().save();
        D.ctx().rotate(rot);
        D.lw(lerp(2.2, 1, i / N));
        D.strokeColour(rgba(i === N - 1 ? PAL().hot : PAL().accent,
          (0.75 - i * 0.10) * a * q));
        /* each level is the previous level's operand: a shape inside a shape */
        if (i % 2 === 0) {
          ringPath(0, 0, rr, rr * 0.66, 72, 0);
          D.ctx().stroke();
        } else {
          D.srect(-rr * 0.82, -rr * 0.56, rr * 1.64, rr * 1.12);
        }
        /* the intersection at this level, filled and hatched deeper each time */
        if (q > 0.7) {
          D.fillColour(rgba(PAL().phosphor, (0.10 - i * 0.012) * a));
          ringPath(0, 0, rr * 0.82, rr * 0.52, 60, 0);
          D.ctx().fill();
          D.lw(1);
          D.strokeColour(rgba(PAL().phosphor, (0.30 - i * 0.04) * a));
          for (k = -6; k <= 6; k++) {
            D.line(k * rr * 0.16 - rr * 0.6, -rr * 0.5, k * rr * 0.16 + rr * 0.2, rr * 0.5);
          }
        }
        D.ctx().restore();
        M.sub('level ' + (i + 1), Math.cos(rot) * rr * 0.86,
          Math.sin(rot) * rr * 0.66 - 12 * U,
          { px: 11, a: a * q * (0.7 - i * 0.1) });
      }

      /* the arrow that makes the recursion a direction rather than a stack */
      var qz = clamp((p - 0.4) / 0.4, 0, 1);
      if (qz > 0.01) {
        D.lw(1.4);
        D.strokeColour(rgba(PAL().hot, 0.7 * a * qz));
        var ax0 = lerp(-W * 0.30, -W * 0.20, qz), ax1 = lerp(-W * 0.24, -W * 0.06, qz);
        D.line(ax0, H * 0.30, ax1, H * 0.30);
        D.arrowHead(ax1, H * 0.30, 0, 10);
        M.sub('n+1', -W * 0.20, H * 0.30 - 18 * U,
          { px: 12, a: a * qz, colour: rgba(PAL().hot, 0.95) });
      }
    } },

    { l: L_ANN, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('SO DEEPLY', 0, -H * 0.42, { px: 21, a: a * 0.95, track: 7 });
      M.register('depth', String(Math.floor(1 + 4 * clamp(p / 0.8, 0, 1))),
        -W * 0.44, H * 0.34, { a: a, width: 240, unit: 'levels' });
      M.register('innermost area', (Math.PI * 30 * 30 * Math.pow(0.70, 8) / 100).toFixed(3),
        -W * 0.44, H * 0.34 + 20,
        { a: a, width: 240, unit: 'u\u00B2', colour: rgba(PAL().hot, 0.95) });
      M.register('still contained', 'YES', W * 0.44, H * 0.34, { a: a, width: 240 });
      M.register('levels remaining', '\u221E', W * 0.44, H * 0.34 + 20, { a: a, width: 240 });
      M.sub('keep going and the intersection never empties', 0, H * 0.42,
        { px: 12, a: a * 0.6 });
      M.sub('so deeply, so deeply', 0, H * 0.42 + 20, { px: 12, a: a * 0.4 });
      M.pulseRings(0, 0, w.time, { r0: 40, spread: 300, a: a * 0.18, rings: 2 });
    } }
  ]);
})(window.EM);
