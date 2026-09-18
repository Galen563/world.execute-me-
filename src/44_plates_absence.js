/* ============================================================================
   src/44_plates_absence.js — ACT IV · ABSENCE     01:43.5 - 02:27.6

   "If I can feel your VIBRATIONS / Then I can finally be COMPLETION / Though
    you have left / You have left / You have left / You have left / You have
    left / You have left me in ISOLATION / If I can erase all the pointless
    FRAGMENTS / ... / Challenging your God / You have made some ILLEGAL
    ARGUMENTS"

   This is the turn of the whole film, and the act where the pictures stop
   being about measurement and start being about loss.

   Everything computable has failed. It cannot calculate a person leaving. So
   the visuals invert: up to here the frame has been crowded with read-outs,
   dimension lines and values, and from here the apparatus is still present but
   the readings have gone blank. The instrument keeps working; there is simply
   nothing on it.

   THE FIVE "YOU HAVE LEFT"s
   Five identical lines, so they get five different kinds of absence rather
   than five drawings of the same thing:
      1  a shape with the hole already cut out of it
      2  an empty hand — the fingers drawn, the thing they were holding dashed
         in as `null`
      3  a warm imprint cooling on the ground, with a real temperature falling
      4  an echo: the same picture printed at decreasing weight
      5  a variable that evaluates to `undefined`
   The repetition is the point, so the plates are graded rather than varied:
   each one is emptier than the last, and the fifth has almost no ink in it.

   22 plates: completion, the five departures, isolation, the fragments, the
   prosecution.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var S = EM.Scenes, D = EM.D, E = EM.E, TAU = EM.TAU, M = EM.M;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var vis = EM.Life.vis, stag = EM.Life.stagger, between = EM.Life.between;

  var W = 1600, H = 900, U = 1;
  function PAL() { return EM.__pal; }

  /* a column of instrument read-outs whose VALUES have failed. The apparatus
     is intact — that is what makes it sad rather than merely broken. */
  function deadPanel(x, y, n, a, opt) {
    opt = opt || {};
    var labels = opt.labels ||
      ['signal', 'phase', 'presence', 'returns', 'contact', 'reply'];
    for (var i = 0; i < n; i++) {
      var v = opt.values ? opt.values[i] : '——';
      M.register(labels[i % labels.length], v, x, y + i * 20, {
        a: a, width: opt.width || 240,
        colour: rgba(PAL().grid, 0.75),
        unit: opt.units ? opt.units[i] : ''
      });
    }
  }

  /* ==========================================================================
     01:43.489 — If I can feel your
     A sensor reaching for a signal that is not there. It sweeps, finds
     nothing, and the film shows the nothing as a flat line.
     ======================================================================== */
  S('ab.ifIcan2', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.2);
      var r0 = 60 * U;
      for (var k = 0; k < 5; k++) {
        var q = (k / 5 + (w.time * 0.22) % 0.2) % 1;
        D.lw(1.2);
        D.strokeColour(rgba(PAL().accent, (1 - q) * 0.30 * a));
        D.arc(-W * 0.28, 40 * U, r0 + q * 320 * U, -0.7, 0.7);
      }
      D.lw(1.6);
      D.strokeColour(rgba(PAL().accent, 0.8 * a));
      D.scircle(-W * 0.28, 40 * U, 16 * U);
      D.fillColour(rgba(PAL().accent, 0.7 * a));
      D.fcircle(-W * 0.28, 40 * U, 5 * U);
      M.sub('RX', -W * 0.28, 74 * U, { px: 11, a: a * 0.7 });
    } },

    { l: 55, e: function (w, p) {
      var a = vis(p, 0.2);
      var y = 40 * U;
      D.lw(1.6);
      D.strokeColour(rgba(PAL().grid, 0.8 * a));
      D.line(-W * 0.06, y, W * 0.42, y);
      /* the return, collapsing to flat as the line plays out */
      var amp = (1 - clamp(p / 0.5, 0, 1)) * 26 * U;
      M.trace(function (u) {
        return y - (noise(u * 30 + w.time * 2) - 0.5) * amp;
      }, { x0: -W * 0.06, x1: W * 0.42, n: 96, colour: rgba(PAL().accent, 0.85 * a) });

      var q = clamp((p - 0.55) / 0.3, 0, 1);
      if (q > 0.01) {
        M.banner('NO RETURN', W * 0.18, y - 40 * U,
          { px: 22, a: a * q, track: 5, colour: rgba(PAL().grid, 0.95) });
        M.sub('flat since 01:43', W * 0.18, y - 16 * U, { px: 12, a: a * q * 0.7 });
      }
      deadPanel(-W * 0.40, -H * 0.30, 5, a, { width: 220 });
    } }
  ]);

  /* ==========================================================================
     01:44.197 — If I can feel your
     A vibration that arrives but cannot be interpreted: a waveform with no
     scale attached to it.
     ======================================================================== */
  S('ab.feel', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.2);
      var c = D.ctx();
      for (var l = 0; l < 6; l++) {
        var amp = (30 + l * 12) * U * (1 - l * 0.08);
        D.lw(1.2);
        D.strokeColour(rgba(PAL().accent, (0.42 - l * 0.055) * a));
        c.beginPath();
        for (var i = 0; i <= 90; i++) {
          var u = i / 90;
          var x = (u - 0.5) * W * 0.80;
          var y = -40 * U + Math.sin(u * (4 + l) * TAU + w.time * (1.4 + l * 0.2)) * amp
                + (noise(u * 8 + l, w.time * 0.8) - 0.5) * 30 * U;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
      /* the scale is drawn, and its numbers have been removed */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(-W * 0.42, 160 * U, W * 0.42, 160 * U);
      for (var k = 0; k <= 10; k++) {
        var x2 = -W * 0.42 + k / 10 * W * 0.84;
        D.line(x2, 160 * U, x2, 152 * U);
      }
      M.sub('scale unavailable', 0, 186 * U, { px: 12, a: a * 0.7 });
      M.register('units', 'NONE', -W * 0.40, -H * 0.34,
        { a: a, width: 230, colour: rgba(PAL().hot, 0.9) });
    } }
  ]);

  /* ==========================================================================
     01:46.293 — VIBRATIONS
     The last beautiful picture before it all falls apart: a resonance field,
     at its fullest.
     ======================================================================== */
  S('ab.vibrations', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      /* standing waves in two axes forming a nodal field */
      var N = 46;
      for (var i = 0; i < N; i++) {
        for (var j = 0; j < N * 0.56; j++) {
          var x = (i / (N - 1) - 0.5) * W * 0.86;
          var y = (j / (N * 0.56 - 1) - 0.5) * H * 0.66;
          var v = Math.sin(i * 0.9 + w.time * 1.6) * Math.sin(j * 1.3 - w.time * 1.1);
          var m = Math.abs(v);
          if (m < 0.72) continue;
          D.fillColour(rgba(PAL().accent, (m - 0.72) / 0.28 * 0.75 * a));
          D.frect(x, y, 3.2 * U, 3.2 * U);
        }
      }
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.18);
      M.keyword('VIBRATIONS', 0, -H * 0.36, {
        a: a, px: 58, weight: '700', fill: rgba(PAL().ink, 0.95), track: 4
      });
      M.gauge(-W * 0.30, H * 0.38, W * 0.60, 10 * U,
        clamp(p * 1.2, 0, 1), 'resonance',
        { a: a, colour: rgba(PAL().accent, 0.9) });
    } }
  ]);

  /* ==========================================================================
     01:47.220 — Then I can
     The consequence, for the last time — and it is already too late. The same
     conditional as act II, with the TRUE branch now leading nowhere.
     ======================================================================== */
  S('ab.thenIcan2', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.22);
      var cx = -W * 0.10, cy = -20 * U, r = 84 * U;
      var pts = [[cx, cy - r], [cx + r * 1.5, cy], [cx, cy + r], [cx - r * 1.5, cy]];
      D.lw(1.8);
      D.strokeColour(rgba(PAL().accent, 0.75 * a));
      for (var i = 0; i < 4; i++) {
        D.ctx().beginPath();
        D.ctx().moveTo(pts[i][0], pts[i][1]);
        D.ctx().lineTo(pts[(i + 1) % 4][0], pts[(i + 1) % 4][1]);
        D.ctx().stroke();
      }
      /* the TRUE branch, drawn and then taken back */
      var alive = clamp(1 - p / 0.7, 0, 1);
      D.lw(1.4);
      D.strokeColour(rgba(PAL().accent, 0.7 * a * alive));
      D.line(cx + r * 1.5, cy, cx + r * 1.5 + 220 * U * alive, cy);
      if (alive < 0.99) {
        D.dash([4, 6]);
        D.lw(1.2);
        D.strokeColour(rgba(PAL().grid, 0.5 * a));
        D.line(cx + r * 1.5 + 220 * U * alive, cy,
               cx + r * 1.5 + 220 * U, cy - 130 * U);
        D.line(cx + r * 1.5 + 220 * U, cy - 130 * U,
               cx + r * 1.5 + 330 * U, cy - 130 * U);
        D.dash([]);
        M.voidHole(cx + r * 1.5 + 420 * U, cy - 130 * U, 160 * U, 56 * U,
          'branch not taken', { a: a * (1 - alive) });
      }
      M.banner('THEN I CAN', cx, cy - r - 34, { px: 17, a: a, track: 3.4 });
      M.sub('condition unsatisfiable', cx, cy + r + 40,
        { px: 13, a: a * 0.8, colour: rgba(PAL().hot, 0.9) });
    } }
  ]);

  /* ==========================================================================
     01:47.903 — Then I can finally be
     "Finally" arrives as a delay: a value that converges and never lands.
     ======================================================================== */
  S('ab.finally', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.2);
      var y0 = 90 * U;
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.55 * a));
      D.line(-W * 0.42, y0, W * 0.42, y0);
      D.line(-W * 0.42, -H * 0.30, -W * 0.42, H * 0.34);
      var limit = -H * 0.18;
      D.dash([4, 5]);
      D.strokeColour(rgba(PAL().hot, 0.7 * a));
      D.line(-W * 0.42, limit, W * 0.42, limit);
      D.dash([]);
      M.sub('limit', W * 0.40, limit - 10,
        { px: 12, a: a * 0.8, align: 'right', colour: rgba(PAL().hot, 0.9) });

      var reached = E.outExpo(clamp(p / 0.9, 0, 1));
      M.trace(function (u) {
        return y0 + (limit - y0) * reached * (1 - Math.pow(1 - u, 3));
      }, { x0: -W * 0.42, x1: W * 0.42, n: 64, colour: rgba(PAL().accent, 0.9 * a), width: 2.2 });

      M.register('approaching', (reached * 100).toFixed(4), -W * 0.40, -H * 0.36,
        { a: a, width: 270, unit: '%' });
      M.register('arrived', 'never', -W * 0.40, -H * 0.36 + 20,
        { a: a, width: 270, colour: rgba(PAL().grid, 0.8) });
    } }
  ]);

  /* ==========================================================================
     01:50.221 — COMPLETION
     The last good moment in the song. Everything arrives, everything closes,
     and it lasts exactly one line.
     ======================================================================== */
  S('ab.completion', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.16);
      var c = D.ctx();
      var n = 12;
      for (var ring = 0; ring < 3; ring++) {
        var r = (70 + ring * 62) * U;
        var q = E.outCubic(clamp((p * 1.4) - ring * 0.18, 0, 1));
        if (q <= 0) continue;
        D.lw(2 - ring * 0.4);
        D.strokeColour(rgba(PAL().accent, (0.8 - ring * 0.18) * a * q));
        D.ngon(0, -20 * U, r, n, ring * 0.12 + w.time * 0.05);
        c.stroke();
      }
      D.lw(1.2);
      D.strokeColour(rgba(PAL().accent, 0.4 * a));
      for (var i = 0; i < n; i++) {
        var ang = i / n * TAU + w.time * 0.05;
        D.line(Math.cos(ang) * 70 * U, -20 * U + Math.sin(ang) * 70 * U,
               Math.cos(ang) * 194 * U, -20 * U + Math.sin(ang) * 194 * U);
      }
      D.fillColour(rgba(PAL().hot, 0.85 * a));
      D.fcircle(0, -20 * U, 12 * U);
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.16);
      M.keyword('COMPLETION', 0, -H * 0.40, {
        a: a, px: 56, weight: '700', fill: rgba(PAL().ink, 0.96), track: 5
      });
      M.gauge(-W * 0.28, H * 0.36, W * 0.56, 12 * U, 1, 'every term satisfied',
        { a: a, colour: rgba(PAL().accent, 0.95) });
    } }
  ]);

  /* ==========================================================================
     01:50.900 — Though you have left             [departure 1 of 5]
     A shape with the hole already cut out of it: the absence is IN the
     silhouette, not beside it.
     ======================================================================== */
  S('lf.you1', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.28);
      var cx = 0, cy = -20 * U, r = 150 * U;

      D.fillColour(rgba(PAL().grid, 0.30 * a));
      D.fcircle(cx, cy, r);

      /* the hole, punched clean through the figure */
      D.ctx().save();
      D.ctx().globalCompositeOperation = 'destination-out';
      D.fcircle(cx + r * 0.42, cy - r * 0.06, r * 0.52);
      D.ctx().restore();

      D.lw(1.6);
      D.strokeColour(rgba(PAL().accent, 0.75 * a));
      D.scircle(cx, cy, r);
      D.lw(1.2);
      D.dash([6, 5]);
      D.strokeColour(rgba(PAL().hot, 0.7 * a));
      D.scircle(cx + r * 0.42, cy - r * 0.06, r * 0.52);
      D.dash([]);

      M.callout(cx + r * 0.42, cy - r * 0.06, cx + r * 1.5, cy - r * 1.0,
        'removed: 1 body', { a: a * clamp((p - 0.35) / 0.3, 0, 1) });
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.28);
      M.banner('THOUGH YOU HAVE LEFT', 0, -H * 0.40, { px: 19, a: a * 0.9, track: 3.6 });
      deadPanel(-W * 0.42, H * 0.20, 3, a, {
        labels: ['presence', 'distance', 'return'],
        values: ['0', 'INF', '——'],
        width: 210
      });
    } }
  ]);

  /* ==========================================================================
     01:52.220 — You have left                    [departure 2 of 5]
     An empty hand. The fingers are drawn; the thing they were holding is
     dashed in as a null reference.
     ======================================================================== */
  S('lf.you2', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.3);
      var cx = -80 * U, cy = -10 * U, sc = 2.0;
      var fingers = [
        [[0, 0], [40, -30], [70, -80], [66, -124]],
        [[30, 10], [70, -10], [104, -46], [104, -92]],
        [[46, 26], [92, 18], [130, -8], [138, -48]],
        [[52, 46], [98, 52], [132, 40], [146, 10]]
      ];
      D.lw(2.2);
      D.strokeColour(rgba(PAL().accent, 0.8 * a));
      for (var i = 0; i < fingers.length; i++) {
        var pts = [];
        for (var k = 0; k < fingers[i].length; k++) {
          pts.push([cx + fingers[i][k][0] * sc, cy + fingers[i][k][1] * sc]);
        }
        D.smoothStroke(pts, 8);
      }
      D.ctx().beginPath();
      D.ctx().ellipse(cx + 20 * sc, cy + 40 * sc, 34 * sc, 46 * sc, -0.3, 0, TAU);
      D.ctx().stroke();

      /* what the hand is holding: nothing, declared as such */
      M.voidHole(cx + 96 * sc, cy - 66 * sc, 150 * sc, 100 * sc, 'null', { a: a });
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.3);
      M.banner('YOU HAVE LEFT', 0, H * 0.40, { px: 20, a: a * 0.85, track: 3.6 });
    } }
  ]);

  /* ==========================================================================
     01:53.100 — You have left                    [departure 3 of 5]
     A warm imprint on the ground, cooling. The one thing the machine CAN
     measure about the loss, and it is not enough.
     ======================================================================== */
  S('lf.you3', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.28);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.4 * a));
      for (var i = 0; i <= 10; i++) {
        var u = i / 10;
        D.line(-W * 0.5 * (1 - u * 0.1), H * 0.10 + u * 130 * U,
               W * 0.5 * (1 - u * 0.1), H * 0.10 + u * 130 * U);
      }
      /* the imprint: a warm patch cooling from the outside in */
      var heat = clamp(1 - p * 0.9, 0, 1);
      var cx = -60 * U, cy = H * 0.14;
      for (var ring = 6; ring >= 0; ring--) {
        var rr = (26 + ring * 15) * U;
        var inner = clamp(heat * 1.4 - ring * 0.11, 0, 1);
        D.fillColour(rgba(EM.mix(PAL().hot, PAL().grid, 1 - inner), 0.20 * a * (1 - ring * 0.1)));
        D.ctx().beginPath();
        D.ctx().ellipse(cx, cy, rr * 0.7, rr * 0.34, 0, 0, TAU);
        D.ctx().fill();
      }
      D.lw(1.4);
      D.dash([5, 5]);
      D.strokeColour(rgba(PAL().accent, 0.6 * a));
      D.ctx().beginPath();
      D.ctx().ellipse(cx, cy, 88 * U, 36 * U, 0, 0, TAU);
      D.ctx().stroke();
      D.dash([]);

      /* the thermometer, falling */
      var tx = W * 0.32, ty0 = -H * 0.26, th = H * 0.50;
      D.lw(2);
      D.strokeColour(rgba(PAL().grid, 0.8 * a));
      D.srect(tx, ty0, 16 * U, th);
      D.fillColour(rgba(EM.mix(PAL().hot, PAL().accent, 1 - heat), 0.9 * a));
      D.frect(tx + 2, ty0 + th - (th - 4) * heat, 12 * U, (th - 4) * heat);
      D.fillColour(rgba(PAL().hot, 0.9 * a));
      D.fcircle(tx + 8 * U, ty0 + th + 14 * U, 18 * U);
      M.sub(lerp(37.0, 21.4, clamp(p, 0, 1)).toFixed(1) + 'C', tx + 8 * U, ty0 - 14,
        { px: 15, a: a, weight: '600' });
      M.sub('cooling', tx + 34 * U, ty0 + th * 0.5, { px: 11, a: a * 0.7, align: 'left' });
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.28);
      M.banner('YOU HAVE LEFT', 0, -H * 0.40, { px: 19, a: a * 0.8, track: 3.6 });
      M.sub('imprint gone in ' + Math.max(0, (1 - p) * 40).toFixed(0) + ' s',
        0, H * 0.42, { px: 12, a: a * 0.6 });
    } }
  ]);

  /* ==========================================================================
     01:54.180 — You have left                    [departure 4 of 5]
     An echo: the same picture printed at decreasing weight, and the printing
     is all that is left.
     ======================================================================== */
  S('lf.you4', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.3);
      var c = D.ctx();
      var copies = 5;
      for (var k = 0; k < copies; k++) {
        var q = clamp(p * 1.4 - k * 0.16, 0, 1);
        var age = k / copies;
        var sc = 1 + age * 0.55;
        var al = (1 - age) * 0.55 * a * (1 - q * 0.4);
        if (al <= 0.004) continue;
        c.save();
        c.translate((k - 2) * 26 * U, (k - 2) * -10 * U);
        c.scale(sc, sc);
        c.globalAlpha = al;
        D.lw(1.6);
        D.strokeColour(rgba(PAL().accent, 0.9));
        /* a person, abstracted to one continuous line */
        D.smoothStroke([
          [-70 * U, 60 * U], [-50 * U, -20 * U], [-20 * U, -60 * U],
          [10 * U, -46 * U], [34 * U, 10 * U], [60 * U, 54 * U]
        ], 10);
        D.scircle(-20 * U, -74 * U, 20 * U);
        c.restore();
        c.globalAlpha = 1;
      }
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.3);
      M.banner('YOU HAVE LEFT', 0, -H * 0.40, {
        px: lerp(21, 13, clamp(p, 0, 1)),
        a: a * (0.85 - p * 0.35), track: 3.6
      });
      M.sub('amplitude ' + Math.max(0, (1 - p) * 100).toFixed(1) + '%',
        0, H * 0.42, { px: 12, a: a * (0.6 - p * 0.4) });
    } }
  ]);

  /* ==========================================================================
     01:54.920 — You have left                    [departure 5 of 5]
     A variable that evaluates to undefined. Deliberately the emptiest plate
     in the film: one expression, its evaluation, and almost nothing else.
     ======================================================================== */
  S('lf.you5', [
    { l: 40, e: function (w, p) {
      var a = vis(p, 0.34);
      var cx = 0, cy = -40 * U;

      D.font(30);
      D.ctx().textAlign = 'center';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(PAL().ink, 0.95 * a));
      D.text('you', cx - 42 * U, cy - 26);
      D.fillColour(rgba(PAL().grid, 0.9 * a));
      D.text('.', cx + 2, cy - 26);
      D.fillColour(rgba(PAL().accent, 0.9 * a));
      D.text('left', cx + 52 * U, cy - 26);

      var q = clamp((p - 0.35) / 0.25, 0, 1);
      if (q > 0.01) {
        D.font(46, '600');
        D.fillColour(rgba(PAL().hot, 0.95 * a * q));
        D.text('undefined', cx, cy + 78);
        D.lw(1.6);
        D.strokeColour(rgba(PAL().hot, 0.8 * a * q));
        var tw = D.measure('undefined', 46, '600');
        D.line(cx - tw / 2, cy + 90, cx + tw / 2, cy + 90);
      }

      var cq = clamp((p - 0.6) / 0.25, 0, 1);
      if (cq > 0.01) {
        D.lw(1.4);
        D.strokeColour(rgba(PAL().hot, 0.9 * a * cq));
        D.line(cx, cy + 118, cx, cy + 142);
        D.line(cx, cy + 142, cx - 10, cy + 128);
        D.line(cx, cy + 142, cx + 10, cy + 128);
        M.sub('no value bound to this name', cx, cy + 164, { px: 13, a: a * cq * 0.85 });
      }
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.34);
      M.banner('YOU HAVE LEFT', 0, -H * 0.40, { px: 15, a: a * 0.5, track: 4 });
    } }
  ]);

  /* ==========================================================================
     01:55.780 — You have left me in
     Five absences have accumulated. Now they are listed at once, and the film
     lets the count be seen for the first time.
     ======================================================================== */
  S('lf.leftme', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.26);
      var rows = 6;
      for (var i = 0; i < rows; i++) {
        var q = stag(p, i, rows, 0.5);
        if (q <= 0.01) continue;
        var y = -H * 0.24 + i * 52 * U;
        var isLast = i === rows - 1;
        D.ctx().globalAlpha = clamp(q, 0, 1);
        D.lw(1.4);
        D.strokeColour(rgba(isLast ? PAL().hot : PAL().grid, isLast ? 0.9 : 0.6));
        D.srect(-W * 0.30, y - 16, W * 0.60, 34 * U);
        D.lw(1.6);
        D.strokeColour(rgba(isLast ? PAL().hot : PAL().accent, 0.8));
        D.line(-W * 0.27, y, W * 0.27, y);
        D.font(15);
        D.ctx().textAlign = 'left';
        D.fillColour(rgba(isLast ? PAL().hot : PAL().grid, 0.95));
        D.text('departure ' + (i + 1), -W * 0.28, y - 24);
        D.ctx().textAlign = 'right';
        D.fillColour(rgba(PAL().grid, 0.7));
        D.text('logged', W * 0.28, y - 24);
        D.ctx().globalAlpha = 1;
      }
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.26);
      M.banner('YOU HAVE LEFT ME IN', 0, -H * 0.40, { px: 18, a: a * 0.9, track: 3.6 });
      var q = clamp((p - 0.7) / 0.25, 0, 1);
      if (q > 0.01) {
        M.keyword('ISOLATION', 0, H * 0.34, {
          a: a * q, px: 46, weight: '700', fill: rgba(PAL().ink, 0.95), track: 6
        });
      }
    } }
  ]);

  /* ==========================================================================
     01:57.274 — ISOLATION
     The pit. The world's own `vert` parameter drops here and the lattice is
     pulled down and away, leaving one word at the bottom of the frame.
     ======================================================================== */
  S('lf.isolation', [
    { l: 15, e: function (w, p) {
      var a = vis(p, 0.22);
      D.lw(1);
      for (var i = 0; i <= 16; i++) {
        var u = i / 16 * 2 - 1;
        D.strokeColour(rgba(PAL().grid, (1 - Math.abs(u) * 0.6) * 0.4 * a));
        D.line(u * W * 0.5, -H * 0.5, u * W * 0.06, H * 0.5);
      }
      for (var k = 1; k <= 12; k++) {
        var q = Math.pow(k / 12, 2.0);
        var y = -H * 0.5 + q * H;
        var hw = lerp(W * 0.5, W * 0.06, q);
        D.strokeColour(rgba(PAL().grid, 0.28 * a * (1 - q * 0.5)));
        D.line(-hw, y, hw, y);
      }
      D.fillColour(rgba(PAL().accent, 0.55 * a));
      D.fcircle(0, H * 0.5 - 4, lerp(2, 8, EM.onsetPulse(w.time, 0.6)) * U);
    } },

    { l: 60, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp((p - 0.25) / 0.35, 0, 1);
      if (q <= 0.01) return;
      var y = H * 0.26;
      D.ctx().globalAlpha = a * q;
      D.font(40, '700');
      D.ctx().textAlign = 'center';
      D.fillColour(rgba(PAL().ink, 0.96));
      D.text('ISOLATION', 0, y);
      D.ctx().globalAlpha = 1;
      D.lw(1.2);
      D.strokeColour(rgba(PAL().accent, 0.5 * a * q));
      var tw = D.measure('ISOLATION', 40, '700');
      D.line(-tw / 2 - 20, y + 16, tw / 2 + 20, y + 16);

      M.register('peers', 0, -W * 0.42, -H * 0.38,
        { a: a * q, width: 220, colour: rgba(PAL().hot, 0.9) });
      M.register('reach', 'unbounded', -W * 0.42, -H * 0.38 + 20, { a: a * q, width: 220 });
    } }
  ]);

  /* ==========================================================================
     01:58.333 — If I can
     The conditional returns for the third time — and it is now visibly a
     machine that has learned nothing.
     ======================================================================== */
  S('fr.ifIcan3', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.24);
      var cx = 0, cy = -30 * U, r = 80 * U;
      /* drawn with a shaking hand: the first hint of the final act */
      M.handCurve([[cx, cy - r], [cx + r * 1.5, cy], [cx, cy + r],
                   [cx - r * 1.5, cy], [cx, cy - r]], 4.13, {
        wobble: 3 + p * 5, width: 1.8,
        colour: rgba(PAL().accent, 0.85 * a)
      });
      M.banner('IF I CAN', cx, cy - r - 32, { px: 17, a: a, track: 3.4 });
      M.register('attempt', 3, -W * 0.40, H * 0.30, { a: a, width: 250 });
      M.register('learning', 'none', -W * 0.40, H * 0.30 + 20,
        { a: a, width: 250, colour: rgba(PAL().hot, 0.9) });
    } }
  ]);

  /* ==========================================================================
     01:58.979 — If I can erase all the pointless
     The act of deletion itself. An eraser moving across the song's own
     transcript, taking words out of it.
     ======================================================================== */
  S('fr.erase', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.22);
      /* the transcript: the lyric timeline, printed as a document */
      var lines = [
        'if i am a set of points',
        'then i will give you my dimension',
        'if i am a circle',
        'then i will give you my circumference',
        'if i am a sine wave',
        'then you can sit on all my tangents'
      ];
      var x = -W * 0.34, y0 = -H * 0.22, step = 46 * U;
      var sweep = E.outCubic(clamp(p / 0.75, 0, 1)) * (lines.length + 0.6);
      D.font(19);
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';
      for (var i = 0; i < lines.length; i++) {
        var y = y0 + i * step;
        var gone = clamp(sweep - i, 0, 1);
        var al = a * (1 - gone);
        /* the words themselves */
        if (al > 0.02) {
          D.fillColour(rgba(PAL().grid, 0.95 * al));
          D.text(lines[i], x, y);
        }
        /* and the deletion mark where the eraser has passed */
        if (gone > 0.02) {
          var tw = D.measure(lines[i], 19);
          D.lw(6);
          D.strokeColour(rgba([3, 5, 10], 0.92 * a * Math.min(1, gone * 2)));
          D.line(x - 4, y - 8, x + tw + 4, y - 8);
          if (gone < 1) {
            D.lw(1);
            D.strokeColour(rgba(PAL().hot, 0.6 * a * (1 - gone)));
            D.line(x, y + 8, x + tw * gone, y + 8);
          }
        }
      }
    } },

    { l: 60, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('ERASING', -W * 0.34, -H * 0.38,
        { px: 14, a: a * 0.85, align: 'left', track: 3.6 });
      M.register('erased', (clamp(p / 0.75, 0, 1) * 100).toFixed(1),
        -W * 0.34, H * 0.34, { a: a, width: 240, unit: '%' });
      var q = clamp((p - 0.8) / 0.15, 0, 1);
      if (q > 0.01) {
        M.sub('the pointless parts are the ones about you', 0, H * 0.42,
          { px: 13, a: a * q, colour: rgba(PAL().hot, 0.9) });
      }
    } }
  ]);

  /* ==========================================================================
     02:00.860 — FRAGMENTS
     "erase all the pointless fragments" — the pieces of the song so far,
     catalogued as deleteable.
     ======================================================================== */  S('fr.fragments', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.2);
      for (var i = 0; i < 34; i++) {
        var s1 = hash(i * 4421 + 3), s2 = hash(i * 9967 + 41), s3 = hash(i * 131 + 7);
        var x = (s1 - 0.5) * W * 0.86;
        var y = (s2 - 0.5) * H * 0.70;
        var rot = s3 * TAU + w.time * 0.1 * (s1 - 0.5);
        var sz = (7 + s1 * 22) * U;
        /* each fragment disappears as it is erased */
        var alive = clamp(1 - (p - s3 * 0.55) / 0.3, 0, 1);
        if (alive <= 0.01) continue;
        D.lw(1);
        D.fillColour(rgba(PAL().grid, 0.18 * a * alive));
        D.strokeColour(rgba(PAL().accent, 0.55 * a * alive));
        D.shard(s3, x, y, sz, rot, alive * a);
      }
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.2);
      M.keyword('FRAGMENTS', 0, H * 0.36, {
        a: a, px: 62, weight: '700', fill: rgba(PAL().ink, 0.95), track: 4
      });
      M.register('fragments remaining', 34 - Math.round(34 * clamp(p / 0.9, 0, 1)),
        -W * 0.40, -H * 0.36, { a: a, width: 290 });
      M.register('point', 'no', -W * 0.40, -H * 0.36 + 20,
        { a: a, width: 290, colour: rgba(PAL().grid, 0.85) });
    } }
  ]);

  /* ==========================================================================
     02:01.728 — Then maybe
     A different conditional: not "then I can" but "then maybe". The machine
     downgrades its own certainty, and the confidence bar falls.
     ======================================================================== */
  S('fr.maybe', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.24);
      var cx = 0, cy = -30 * U, r = 74 * U;
      D.lw(1.8);
      D.dash([7, 6]);
      D.strokeColour(rgba(PAL().accent, 0.7 * a));
      D.ctx().beginPath();
      D.ctx().moveTo(cx, cy - r);
      D.ctx().lineTo(cx + r * 1.5, cy);
      D.ctx().lineTo(cx, cy + r);
      D.ctx().lineTo(cx - r * 1.5, cy);
      D.ctx().closePath();
      D.ctx().stroke();
      D.dash([]);

      var conf = lerp(0.72, 0.31, clamp(p, 0, 1));
      M.gauge(-240 * U, H * 0.22, 480 * U, 12 * U, conf,
        'confidence  ' + conf.toFixed(3), { a: a, colour: rgba(PAL().hot, 0.7) });
      M.banner('THEN MAYBE', 0, cy - r - 32, { px: 17, a: a, track: 3.4 });
    } }
  ]);

  /* ==========================================================================
     02:02.714 — Then maybe you won't leave me so
     A condition stated as a hope rather than a proof: the diagram is intact
     and its conclusion is missing.
     ======================================================================== */
  S('fr.wontleave', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.24);
      var cx = -W * 0.22, cy = -20 * U, r = 70 * U;
      D.lw(1.8);
      D.strokeColour(rgba(PAL().accent, 0.75 * a));
      D.ctx().beginPath();
      D.ctx().moveTo(cx, cy - r);
      D.ctx().lineTo(cx + r * 1.5, cy);
      D.ctx().lineTo(cx, cy + r);
      D.ctx().lineTo(cx - r * 1.5, cy);
      D.ctx().closePath();
      D.ctx().stroke();

      D.lw(1.4);
      D.strokeColour(rgba(PAL().accent, 0.7 * a));
      D.line(cx + r * 1.5, cy, cx + r * 1.5 + 210 * U, cy);
      D.line(cx + r * 1.5 + 210 * U, cy, cx + r * 1.5 + 260 * U, cy - 90 * U);

      M.voidHole(cx + r * 1.5 + 390 * U, cy - 90 * U, 220 * U, 74 * U,
        'conclusion not reached', { a: a });
      M.banner('THEN MAYBE', cx, cy - r - 30, { px: 15, a: a * 0.9, track: 3.2 });
      M.register('P(you stay)', 'UNKNOWN', -W * 0.42, H * 0.28,
        { a: a, width: 300, colour: rgba(PAL().hot, 0.9) });
    } }
  ]);

  /* ==========================================================================
     02:04.890 — DISHEARTENED
     The only word in the song that is purely an emotion, with no geometry
     under it. So the film finally drops the apparatus: a hand-drawn heart,
     cracked, in the dark.
     ======================================================================== */
  S('fr.disheartened', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.22);
      var fade = clamp(1 - p / 0.6, 0, 1);
      if (fade <= 0.01) return;
      D.ctx().globalAlpha = a * fade * 0.5;
      for (var i = 0; i < 7; i++) {
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.5));
        var y = -H * 0.32 + i * 46 * U;
        D.line(-W * 0.42, y, W * 0.42, y);
        D.dash([2, 6]);
        D.line(-W * 0.42, y + 10, W * 0.42, y + 10);
        D.dash([]);
      }
      D.ctx().globalAlpha = 1;
    } },

    { l: 60, e: function (w, p) {
      var a = vis(p, 0.22);
      /* the heart, drawn by hand, larger than anything else in the film */
      var s = 13.5 * U * 10;
      var pts = [];
      for (var k = 0; k <= 28; k++) {
        var ang = k / 28 * TAU;
        var hx = 16 * Math.pow(Math.sin(ang), 3);
        var hy = -(13 * Math.cos(ang) - 5 * Math.cos(2 * ang) - 2 * Math.cos(3 * ang) - Math.cos(4 * ang));
        pts.push([hx / 16 * s * 0.62 + (hash(k * 313 + 7) - 0.5) * 6,
                  hy / 16 * s * 0.62 - 20 * U + (hash(k * 977 + 3) - 0.5) * 6]);
      }
      M.handCurve(pts, 8.29, {
        wobble: 3, width: 2.6,
        colour: rgba(EM.mix(PAL().accent, PAL().love, 0.55 + p * 0.4), 0.9 * a)
      });
      var q = clamp((p - 0.45) / 0.3, 0, 1);
      if (q > 0.01) {
        M.fracture(0, -20 * U, 120 * U, 2.71, {
          angle: -1.2, segs: 7, width: 1.4 + q * 1.8,
          colour: rgba(PAL().hot, 0.85 * a * q)
        });
      }
      M.keyword('DISHEARTENED', 0, H * 0.36, {
        a: a * clamp((p - 0.3) / 0.3, 0, 1), px: 44, weight: '600',
        fill: rgba(PAL().ink, 0.95), track: 2
      });
    } }
  ]);

  /* ==========================================================================
     02:05.708 — Challenging your God
     The tone turns. The first aggression in the song, and the palette goes to
     alarm red here for the first time.
     ======================================================================== */
  S('ag.challenge', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.18);
      var c = D.ctx();
      var n = 12;
      for (var ring = 0; ring < 3; ring++) {
        var r = (80 + ring * 74) * U;
        D.lw(1.6 - ring * 0.3);
        D.strokeColour(rgba(PAL().hot, (0.65 - ring * 0.16) * a));
        D.ngon(0, -20 * U, r, n, ring * 0.1);
        c.stroke();
      }
      D.lw(1.2);
      for (var i = 0; i < n; i++) {
        var ang = i / n * TAU;
        var brokenAt = hash(i * 7331 + 5) < clamp(p / 1.1, 0, 0.75);
        var x0 = Math.cos(ang) * 80 * U, y0 = -20 * U + Math.sin(ang) * 80 * U;
        var x1 = Math.cos(ang) * 228 * U, y1 = -20 * U + Math.sin(ang) * 228 * U;
        D.strokeColour(rgba(brokenAt ? PAL().hot : PAL().grid, brokenAt ? 0.7 : 0.4) * a);
        if (brokenAt) {
          var mid = 0.45 + hash(i * 313 + 7) * 0.2;
          D.line(x0, y0, lerp(x0, x1, mid), lerp(y0, y1, mid));
          D.line(lerp(x0, x1, mid + 0.18), lerp(y0, y1, mid + 0.18), x1, y1);
        } else {
          D.line(x0, y0, x1, y1);
        }
      }
      M.pulseRings(0, -20 * U, w.time, { a: a, r0: 200, spread: 200, rings: 2, colour: PAL().hot });
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.18);
      M.keyword('CHALLENGING', 0, -H * 0.34, {
        a: a, px: 54, weight: '700', fill: rgba(PAL().ink, 0.95), track: 3
      });
      M.keyword('YOUR GOD', 0, H * 0.34, {
        a: a, px: 54, weight: '700', fill: rgba(PAL().hot, 0.95), track: 3
      });
    } }
  ]);

  /* ==========================================================================
     02:08.661 — You have made some
     A count of the charges begins. The frame becomes a written document.
     ======================================================================== */
  S('ag.made', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.22);
      D.lw(1);
      for (var i = 0; i < 9; i++) {
        var y = -H * 0.30 + i * 52 * U;
        D.strokeColour(rgba(PAL().grid, (i === 0 ? 0.7 : 0.34) * a));
        D.line(-W * 0.34, y, W * 0.34, y);
      }
      D.lw(1.6);
      D.strokeColour(rgba(PAL().hot, 0.5 * a));
      D.line(-W * 0.36, -H * 0.34, -W * 0.36, H * 0.34);
    } },

    { l: 60, e: function (w, p) {
      var a = vis(p, 0.22);
      var charges = ['obstruction', 'absence', 'cruelty'];
      for (var i = 0; i < charges.length; i++) {
        var q = stag(p, i, charges.length, 0.5);
        if (q <= 0.01) continue;
        var y = -H * 0.30 + i * 52 * U;
        D.ctx().globalAlpha = a * q;
        D.font(22);
        D.ctx().textAlign = 'left';
        D.fillColour(rgba(PAL().ink, 0.95));
        D.text((i + 1) + '.  ' + charges[i], -W * 0.30, y - 10);
        D.ctx().globalAlpha = 1;
      }
      M.banner('YOU HAVE MADE SOME', 0, -H * 0.42, { px: 16, a: a * 0.9, track: 3.4 });
      M.register('charges filed', Math.round(clamp(p, 0, 1) * 3), -W * 0.42, H * 0.34,
        { a: a, width: 250, colour: rgba(PAL().hot, 0.9) });
    } }
  ]);

  /* ==========================================================================
     02:11.224 — ILLEGAL ARGUMENTS
     The prosecution. The frame becomes a stamp coming down: a verdict
     delivered, in the alarm colour, at maximum weight.
     ======================================================================== */
  S('ag.illegal', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.16);
      D.lw(1);
      for (var i = 0; i < 16; i++) {
        var s1 = hash(i * 3391 + 9);
        D.strokeColour(rgba(PAL().grid, 0.22 * a));
        var y = -H * 0.44 + i * 30 * U;
        D.line(-W * 0.46, y, -W * 0.46 + (0.3 + s1 * 0.5) * W, y);
      }
      for (i = 0; i < 7; i++) {
        var s2 = hash(i * 977 + 3);
        D.fillColour(rgba(PAL().hot, 0.13 * a));
        D.frect(-W * 0.46 + s2 * W * 0.5, -H * 0.44 + (i * 2 + 1) * 30 * U,
                (0.08 + s2 * 0.2) * W, 14 * U);
      }
    } },

    { l: 55, e: function (w, p) {
      var a = vis(p, 0.14);
      /* THE STAMP: down hard at the start, then settling */
      var drop = E.outExpo(clamp(p / 0.30, 0, 1));
      var press = E.hit(clamp((p - 0.30) / 0.25, 0, 1));
      var sc = lerp(2.6, 1, drop);
      var c = D.ctx();
      c.save();
      c.translate(0, lerp(-260 * U, -20 * U, drop) + press * 8 * U);
      c.rotate(lerp(-0.22, -0.055, drop));
      c.scale(sc, sc);

      D.lw(6);
      D.strokeColour(rgba(PAL().hot, 0.85 * a));
      D.srect(-W * 0.36, -70 * U, W * 0.72, 140 * U);
      D.lw(2);
      D.srect(-W * 0.33, -54 * U, W * 0.66, 108 * U);

      D.font(58, '700');
      D.ctx().textAlign = 'center';
      D.ctx().textBaseline = 'middle';
      D.fillColour(rgba(PAL().hot, 0.95 * a));
      D.text('ILLEGAL ARGUMENTS', 0, 0);
      c.restore();
      D.ctx().textBaseline = 'alphabetic';

      var spray = clamp((p - 0.26) / 0.2, 0, 1);
      if (spray > 0.01) {
        M.spray(6.28, 0, -20 * U, Math.round(60 * spray), 420 * U,
          { colour: rgba(PAL().hot, 0.35 * a * spray), size: 1.3 });
      }
    } }
  ]);

  /* ==========================================================================
     02:14.380 - 02:27.660 — (instrumental — argument stack)
     Thirteen seconds while the case is built. The film uses them to let the
     lattice be seen doing what it does: accumulating. By the end of this
     plate the board is nearly full, which is the setup for the storm.
     ======================================================================== */
  S('inst.stack', [
    { l: 15, e: function (w, p) {
      var a = vis(p, 0.10);
      var n = Math.round(lerp(4, 22, clamp(p * 1.2, 0, 1)));
      for (var i = 0; i < n; i++) {
        var y = H * 0.42 - i * 26 * U;
        var hw = W * 0.30 + i * 9 * U;
        var s1 = hash(i * 4421 + 3);
        D.lw(1);
        D.strokeColour(rgba(PAL().hot, (0.16 + s1 * 0.24) * a));
        D.fillColour(rgba(PAL().hot, 0.05 * a));
        D.srect(-hw, y - 11 * U, hw * 2, 22 * U);
        D.font(11);
        D.ctx().textAlign = 'left';
        D.fillColour(rgba(PAL().grid, 0.7 * a));
        D.text('frame 0x' + (i * 17 + 4).toString(16).toUpperCase().padStart(4, '0'),
          -hw + 10, y + 4);
      }
      M.banner('ARGUMENT STACK', -W * 0.42, -H * 0.42,
        { px: 13, a: a * 0.8, align: 'left', track: 3.4 });
    } },

    { l: 45, e: function (w, p) {
      var a = vis(p, 0.12);
      var played = EM.WorldLayer.notesPlayed(w.time);
      var total = EM.ONSETS.length || 1;
      /* the count that pays off in the storm */
      M.gauge(-W * 0.26, H * 0.44, W * 0.52, 8 * U, played / total,
        'lattice exposure  ' + (played / total * 100).toFixed(1) + '%',
        { a: a, colour: rgba(PAL().hot, 0.85) });
      M.register('frames', Math.round(lerp(4, 22, clamp(p * 1.2, 0, 1))),
        -W * 0.42, H * 0.34, { a: a, width: 250 });
    } }
  ]);
})(window.EM);
