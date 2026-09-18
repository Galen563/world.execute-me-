/* ============================================================================
   src/40_plates_boot.js — ACT 0 · BOOT            00:00.0 - 00:16.0

   "Switch on the power line / Remember to put on protection / ... / And let's
    begin the SIMULATION"

   The machine is reading its own startup procedure out loud, in the voice of a
   manual: cold, ordered, complete. So the pictures are a machine bringing
   itself up — labels arriving before the things they label, values filling in,
   a display calibrating. Everything is measured and nothing is alive yet.

   This act sets the film's grammar for the other six: a word is never just
   written, it is *installed*, and the frame annotates it while it happens.

   13 plates.  e(w, p, cue)   w = world state, p = 0..1 through this line
   ==========================================================================*/
(function (EM) {
  'use strict';

  var S = EM.Scenes, D = EM.D, E = EM.E, TAU = EM.TAU, M = EM.M;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var vis = EM.Life.vis, stag = EM.Life.stagger, between = EM.Life.between;

  /* Stage constants. These are declared in every plate file on purpose: one
     stage unit is one drawing unit because the renderer has already applied
     the letterbox transform. A plate that referenced a constant it did not
     declare would throw, and the registry reports that rather than hiding it. */
  var W = 1600, H = 900, U = 1;

  function PAL() { return EM.__pal; }
  function amber() { return [255, 168, 46]; }   /* the standby / caution lamp */

  /* ==========================================================================
     00:00.000 — (pre-roll). Absolute black, one amber standby lamp.
     ======================================================================== */
  S('boot.empty', [
    { l: 60, e: function (w, p) {
      var a = vis(p, 0.42);
      var pulse = EM.onsetPulse(w.time, 0.5);

      /* the lamp: the only thing in the frame, and it is not even on yet */
      D.fillColour(rgba(amber(), 0.92 * a));
      D.fcircle(0, 0, lerp(2.0, 4.6, pulse) * U);

      D.lw(1.2);
      D.strokeColour(rgba(amber(), 0.30 * a));
      var r = lerp(14, 128, E.outCubic(clamp(p / 0.5, 0, 1))) * U;
      D.scircle(0, 0, r);
      D.strokeColour(rgba(amber(), 0.16 * a));
      D.scircle(0, 0, r * 0.94);

      M.banner('STANDBY', 0, 64 * U, { px: 15, a: a * 0.8, colour: rgba(amber(), 0.85) });
      M.sub('nothing is running yet', 0, 88 * U, { px: 12, a: a * 0.55 });
    } }
  ]);

  /* ==========================================================================
     00:00.100 — Switch on the power line
     A single line of current drawn across the frame, and the frame measuring
     it as it arrives.
     ======================================================================== */
  S('boot.power', [
    { l: 40, e: function (w, p) {
      var a = vis(p, 0.20);
      var drawn = E.outCubic(clamp(p / 0.62, 0, 1));
      var x0 = -W * 0.40, x1 = W * 0.40;

      /* the cable */
      D.lw(1.8);
      D.strokeColour(rgba(PAL().grid, 0.7 * a));
      D.line(x0, 0, x0 + (x1 - x0) * drawn, 0);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.28 * a));
      D.line(x0, -8 * U, x0 + (x1 - x0) * drawn, -8 * U);
      D.line(x0, 8 * U, x0 + (x1 - x0) * drawn, 8 * U);

      /* the live head, with a halo that only exists while it is moving */
      var hx = x0 + (x1 - x0) * drawn;
      var live = clamp(1 - Math.abs(p - 0.62) / 0.22, 0, 1);
      if (live > 0.01) {
        D.lw(2.4);
        D.strokeColour(rgba(PAL().accent, 0.75 * a * live));
        D.scircle(hx, 0, (10 + live * 22) * U);
        D.fillColour(rgba(PAL().white || PAL().ink, 0.9 * a * live));
        D.fcircle(hx, 0, 3.4 * U);
      }

      /* current direction ticks, marching the way the power is going */
      var phase = (w.time * 90) % 40;
      D.lw(1);
      D.strokeColour(rgba(PAL().accent, 0.5 * a));
      for (var x = x0 + phase; x < x0 + (x1 - x0) * drawn; x += 40) {
        D.line(x - 5, -4, x, 0);
        D.line(x - 5, 4, x, 0);
      }

      if (drawn > 0.35) {
        M.callout(hx, -30 * U, hx - 150 * U, -74 * U, 'line live', { a: a * between(p, 0.42, 0.95) });
      }
      M.register('voltage', (lerp(0, 230, drawn)).toFixed(0), -W * 0.40, H * 0.30,
        { a: a * between(p, 0.15, 0.95), unit: 'V', width: 220 });
    } },

    { l: 70, e: function (w, p) {
      var a = M ? vis(p, 0.2) : 0;
      M.banner('SWITCH ON THE POWER LINE', 0, -H * 0.34, { px: 22, a: a, rule: true });
    } }
  ]);

  /* ==========================================================================
     00:01.740 — Remember to put on
     The instruction sets up a protective case that is not there yet: a shield
     outline drawn as a specification, with the missing part marked.
     ======================================================================== */
  S('boot.power2', [
    { l: 40, e: function (w, p) {
      var a = vis(p, 0.22);
      var q = E.outCubic(clamp(p / 0.5, 0, 1));

      D.lw(1.4);
      D.dash([6, 6]);
      D.strokeColour(rgba(PAL().grid, 0.8 * a));
      D.ngon(0, 0, lerp(60, 150, q) * U, 6, Math.PI / 6);
      D.ctx().stroke();
      D.dash([]);

      /* second shell, solid, drawing itself in around the first */
      if (p > 0.42) {
        var q2 = clamp((p - 0.42) / 0.4, 0, 1);
        D.lw(2);
        D.strokeColour(rgba(PAL().accent, 0.6 * a));
        D.ngon(0, 0, lerp(150, 182, q2) * U, 6, Math.PI / 6);
        D.ctx().stroke();
      }

      M.register('shell', p > 0.42 ? 'ARMED' : 'NONE', -W * 0.36, -H * 0.30,
        { a: a, width: 210, colour: p > 0.42 ? rgba(PAL().accent, 0.95) : rgba(amber(), 0.95) });
      M.register('integrity', (q * 100).toFixed(1), -W * 0.36, -H * 0.30 + 20,
        { a: a, unit: '%', width: 210 });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('REMEMBER TO PUT ON', 0, -H * 0.36, { px: 21, a: a });
    } }
  ]);

  /* ==========================================================================
     00:02.920 — PROTECTION
     NOT A CENTRED STAMP. The word sits right of centre as a label on the frame
     itself, with the actual safeguard drawn beside it, so the picture says
     "a shell is being closed over this machine" rather than "here is a big
     word". The centre of the stage stays free for the geometry.

     The amber here is the only warm colour in the boot act and it is justified:
     this IS the warning. Nothing else in the opening is allowed a bright hue.
     ======================================================================== */
  S('boot.protect', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.16);
      /* the shell closing: six panels converging inwards around the centre,
         so the middle of the frame is occupied by MOTION, not by a word */
      var q = E.outCubic(clamp(p / 0.62, 0, 1));
      var r = lerp(250, 168, q) * U;
      D.lw(1.4);
      D.strokeColour(rgba(amber(), 0.42 * a));
      D.ngon(0, -10 * U, r, 6, Math.PI / 6);
      D.ctx().stroke();
      /* each panel edge, drawn with a tick at its centre */
      for (var i = 0; i < 6; i++) {
        var ang = Math.PI / 6 + i / 6 * TAU;
        var ex = Math.cos(ang) * r, ey = -10 * U + Math.sin(ang) * r;
        D.lw(1);
        D.strokeColour(rgba(amber(), 0.3 * a));
        D.line(ex * 0.72, -10 * U + (ey + 10 * U) * 0.72, ex, ey);
        D.fillColour(rgba(amber(), 0.5 * a));
        D.dot(ex, ey, 1.7 * U);
      }
      /* an inner rotating ring: the mechanism is live even while the shell
         settles, so the frame is never still */
      D.lw(1.2);
      D.strokeColour(rgba(amber(), 0.34 * a));
      D.ctx().save();
      D.ctx().rotate(w.time * 0.34);
      D.ctx().beginPath();
      D.ctx().ellipse(0, -10 * U, r * 0.62, r * 0.26, 0, 0, TAU);
      D.ctx().stroke();
      D.ctx().restore();

      /* faint hazard hatching, confined to a band at the top and bottom rather
         than covering the whole frame */
      D.ctx().save();
      D.ctx().globalAlpha = 0.045 * a;
      D.strokeColour(rgba(amber(), 1));
      D.lw(2);
      for (var x = -W * 0.5; x < W * 0.5; x += 52) {
        D.line(x, -H * 0.5, x + 90 * U, -H * 0.5 + 90 * U);
        D.line(x, H * 0.5, x + 90 * U, H * 0.5 - 90 * U);
      }
      D.ctx().restore();
    } },

    { l: 55, e: function (w, p) {
      var a = vis(p, 0.15);
      /* the label, right of centre, arriving from the right on its own ramp */
      var q = E.outCubic(clamp((p - 0.10) / 0.42, 0, 1));
      if (q <= 0.01) return;
      var x = W * 0.17;
      var slide = (1 - q) * 40 * U;
      D.ctx().globalAlpha = a * q;
      D.font(44, '700');
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(amber(), 0.95));
      D.text('PROTECTION', x + slide, -H * 0.06);
      D.ctx().globalAlpha = 1;
      D.lw(1.2);
      D.strokeColour(rgba(amber(), 0.55 * a * q));
      var tw = D.measure('PROTECTION', 44, '700');
      D.line(x + slide, -H * 0.06 + 14, x + slide + tw, -H * 0.06 + 14);

      /* the read-out that says what it actually does */
      var q2 = clamp((p - 0.45) / 0.3, 0, 1);
      if (q2 > 0.01) {
        M.gauge(x, H * 0.10, 380 * U, 10 * U, 0.72 * q2,
          'coverage ' + (72 * q2).toFixed(0) + '%   exposure nominal',
          { a: a * q2, colour: rgba(amber(), 0.9), px: 12 });
        M.register('interlock', q2 > 0.8 ? 'ENGAGED' : 'ARMING', x, H * 0.10 + 40 * U,
          { a: a * q2, width: 300, colour: rgba(amber(), 0.95) });
      }
    } },

    { l: 72, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('REMEMBER TO PUT ON', -W * 0.40, -H * 0.40,
        { px: 14, a: a * 0.75, align: 'left', track: 3.4 });
    } }
  ]);

  /* ==========================================================================
     00:03.873 — Lay down your pieces
     The parts inventory, but as SYMBOLS rather than as little cartoon objects.
     Each piece is a mathematical token — a set, a matrix, a vector, a function
     — drawn flat and correctly, with its own read-out. The row is laid along a
     measured baseline so the frame reads as a specification sheet, which is
     what the line is: the machine listing its own components before assembly.

     Every token also SPINS or cycles, so the row is never a static row.
     ======================================================================== */
  S('boot.pieces', [
    { l: 35, e: function (w, p) {
      var a = vis(p, 0.2);
      var n = 7;
      var step = 132 * U;
      var x0 = -(n - 1) * step / 2;

      /* the baseline the whole inventory is laid along */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.34 * a));
      D.line(x0 - 60 * U, 52 * U, x0 + (n - 1) * step + 60 * U, 52 * U);

      for (var i = 0; i < n; i++) {
        var q = stag(p, i, n, 0.62);
        if (q <= 0.001) continue;
        var x = x0 + i * step;
        var y = 0 - (1 - E.outBack(q)) * 40 * U;
        var s1 = hash(i * 4421 + 7);
        var spin = w.time * (0.35 + s1 * 0.4) * (i % 2 ? 1 : -1);

        D.ctx().save();
        D.ctx().translate(x, y);
        D.ctx().globalAlpha = clamp(q, 0, 1);
        D.ctx().rotate(spin * 0.12);
        D.lw(1.5);
        D.strokeColour(rgba(PAL().accent, 0.82));
        D.fillColour(rgba(PAL().accent, 0.07));

        var c = D.ctx();
        if (i === 0) {
          /* a set: a closed region with three members */
          c.beginPath();
          c.ellipse(0, 0, 30, 22, 0, 0, TAU);
          c.fill(); c.stroke();
          D.fillColour(rgba(PAL().accent, 0.75));
          D.text('a', -12, 5); D.text('b', 12, 5); D.text('c', 0, -12);
        } else if (i === 1) {
          /* a matrix */
          D.srect(-32, -20, 64, 40);
          c.beginPath();
          c.moveTo(-26, -20); c.lineTo(-26, 20);
          c.moveTo(26, -20); c.lineTo(26, 20);
          c.moveTo(-32, -14); c.lineTo(-26, -20);
          c.moveTo(-32, 14); c.lineTo(-26, 20);
          c.moveTo(32, -14); c.lineTo(26, -20);
          c.moveTo(32, 14); c.lineTo(26, 20);
          c.stroke();
          D.fillColour(rgba(PAL().accent, 0.6));
          for (var m = 0; m < 4; m++) {
            D.dot(-14 + (m % 2) * 28, -8 + Math.floor(m / 2) * 16, 2.4);
          }
        } else if (i === 2) {
          /* a vector with its components */
          c.beginPath(); c.moveTo(-30, 26); c.lineTo(-30, -18); c.stroke();
          c.beginPath(); c.moveTo(-40, 16); c.lineTo(-20, 16); c.stroke();
          D.lw(2);
          c.beginPath(); c.moveTo(-30, 24); c.lineTo(26, -22); c.stroke();
          D.lw(1.5);
          D.line(26, -22, 16, -16); D.line(26, -22, 20, -10);
        } else if (i === 3) {
          /* a function plot */
          c.beginPath();
          for (var k = 0; k <= 24; k++) {
            var u = k / 24, xx = -32 + u * 64, yy = -Math.sin(u * Math.PI) * 20;
            if (k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
          }
          c.stroke();
          D.line(-32, 22, 32, 22);
        } else if (i === 4) {
          /* a polygon with its vertices marked */
          D.ngon(0, 0, 28, 5, spin * 0.5); c.stroke();
          for (var v = 0; v < 5; v++) {
            var ang = spin * 0.5 + v / 5 * TAU;
            D.fillColour(rgba(PAL().hot, 0.8));
            D.dot(Math.cos(ang) * 28, Math.sin(ang) * 28, 2.2);
          }
        } else if (i === 5) {
          /* concentric rings: a limit approaching */
          for (var rr = 30; rr > 4; rr -= 7) { D.scircle(0, 0, rr); }
        } else {
          /* a coordinate cross with a live point */
          D.line(-32, 0, 32, 0); D.line(0, -26, 0, 26);
          D.fillColour(rgba(PAL().hot, 0.9));
          D.dot(Math.cos(spin * 3) * 22, Math.sin(spin * 3) * 18, 3);
        }

        D.ctx().restore();
        D.ctx().globalAlpha = 1;
        /* the leader down to the baseline, and the part number */
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.45 * a));
        D.line(x, 30 * U, x, 52 * U);
        D.font(11);
        D.ctx().textAlign = 'center';
        D.ctx().textBaseline = 'alphabetic';
        D.fillColour(rgba(PAL().grid, 0.8 * a));
        D.text('P' + (i + 1) + '  ' + ['set', 'matrix', 'vector', 'f(x)',
          'polygon', 'limit', 'point'][i], x, 68 * U);
      }
      D.ctx().textAlign = 'left';

      M.register('components', n + ' / ' + n, -W * 0.40, H * 0.32,
        { a: a * clamp((p - 0.6) / 0.3, 0, 1), width: 250 });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('LAY DOWN YOUR PIECES', 0, -H * 0.34, { px: 21, a: a, rule: true });
    } }
  ]);

  /* ==========================================================================
     00:05.491 — And let's begin
     The moment before: a count-in. Three marks and a cursor waiting on a
     fourth that has not been drawn yet.
     ======================================================================== */
  S('boot.begin', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.24);
      for (var i = 0; i < 4; i++) {
        var q = clamp((p - i * 0.2) / 0.14, 0, 1);
        var x = (i - 1.5) * 70 * U;
        D.lw(2);
        D.strokeColour(rgba(i < 3 ? PAL().accent : PAL().grid, (i < 3 ? 0.85 : 0.4) * a * q));
        D.line(x, -40 * U, x, 40 * U);
        if (i === 3) {
          /* the fourth mark is dashed: it has not happened yet */
          D.dash([4, 4]);
          D.line(x, -40 * U, x, 40 * U);
          D.dash([]);
        }
      }
      M.sub('3 · 2 · 1 ·', 0, 76 * U, { px: 13, a: a * 0.6 });
      M.sub('go', 105 * U, 76 * U, { px: 13, a: a * clamp((p - 0.72) / 0.2, 0, 1) });
    } },

    { l: 68, e: function (w, p) {
      var a = vis(p, 0.2);
      M.keyword("AND LET'S BEGIN", 0, -H * 0.30, {
        a: a, px: 44, weight: '600',
        fill: rgba(PAL().ink, 0.95),
        track: 2
      });
    } }
  ]);

  /* ==========================================================================
     00:06.380 — OBJECT CREATION
     The machine allocating something. A grid of empty slots, and objects
     appearing in them one at a time from the top left.
     ======================================================================== */
  S('boot.object', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.2);
      var cols = 9, rows = 5, cw = 86 * U, ch = 62 * U;
      var ox = -(cols - 1) * cw / 2, oy = -60 * U - (rows - 1) * ch / 2;
      var total = cols * rows;
      var filled = E.outCubic(clamp(p / 0.72, 0, 1)) * total;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          var x = ox + c * cw, y = oy + r * ch;
          var on = clamp(filled - i, 0, 1);
          D.lw(1);
          D.strokeColour(rgba(PAL().grid, 0.5 * a));
          D.srect(x - cw * 0.36, y - ch * 0.34, cw * 0.72, ch * 0.68);
          if (on > 0.01) {
            var s1 = hash(i * 7331 + 3);
            D.fillColour(rgba(PAL().accent, 0.55 * a * on));
            D.frect(x - cw * 0.36 * on, y - ch * 0.34 * on,
                    cw * 0.72 * on, ch * 0.68 * on);
            if (on > 0.6) {
              D.lw(1.2);
              D.strokeColour(rgba(PAL().hot, 0.7 * a));
              D.srect(x - cw * 0.36, y - ch * 0.34, cw * 0.72, ch * 0.68);
              M.sub('#' + (i + 1).toString(16).toUpperCase().padStart(3, '0'), x,
                y + ch * 0.52, { px: 9, a: 0.55 * a * on });
            }
          }
        }
      }
      M.register('allocated', Math.round(filled) + ' / ' + total, -W * 0.38, -H * 0.30,
        { a: a, width: 240, unit: 'obj' });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      M.keyword('OBJECT CREATION', 0, H * 0.30, {
        a: a, px: 50, weight: '700',
        fill: rgba(PAL().ink, 0.95),
        track: 3
      });
    } }
  ]);

  /* ==========================================================================
     00:07.446 — Fill in my data parameters
     A parameter sheet being completed. Rows appear, then their values type
     themselves in. This is the film's most literal "form" and it is
     deliberately the calmest plate in the act.
     ======================================================================== */
  S('boot.params', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.18);
      var rows = [
        ['mass', '1.000', 'kg'],
        ['spin', '0.500', 'rad/s'],
        ['charge', '1.602', 'e-19 C'],
        ['index', '0x1F', ''],
        ['bound', 'INF', ''],
        ['age', '0.000', 'yr']
      ];
      var x = -W * 0.30, y0 = -H * 0.26, step = 44 * U;
      D.lw(1);
      for (var i = 0; i < rows.length; i++) {
        var q = stag(p, i, rows.length, 0.55);
        if (q <= 0.001) continue;
        var y = y0 + i * step;
        D.ctx().globalAlpha = clamp(q, 0, 1);
        D.strokeColour(rgba(PAL().grid, 0.42));
        D.dash([2, 4]);
        D.line(x, y + 10, x + W * 0.60, y + 10);
        D.dash([]);
        D.font(17);
        D.fillColour(rgba(PAL().grid, 0.95));
        D.ctx().textAlign = 'left';
        D.text(rows[i][0], x, y);
        /* the value types itself in, character by character */
        var vq = clamp((q - 0.45) / 0.55, 0, 1);
        var shown = rows[i][1].slice(0, Math.ceil(rows[i][1].length * vq));
        D.font(17, '600');
        D.fillColour(rgba(PAL().accent, 0.95));
        D.ctx().textAlign = 'left';
        D.text(shown, x + W * 0.30, y);
        if (rows[i][2]) {
          D.font(12);
          D.fillColour(rgba(PAL().grid, 0.7));
          D.text(rows[i][2], x + W * 0.46, y);
        }
        D.ctx().globalAlpha = 1;
      }
      M.banner('FILL IN MY DATA PARAMETERS', -W * 0.30, -H * 0.38,
        { px: 15, a: a, align: 'left', rule: true, track: 2.6 });
    } }
  ]);

  /* ==========================================================================
     00:10.091 — INITIALIZATION
     The machine formally declaring itself ready. A vertical checklist that
     completes, then a hard confirm.
     ======================================================================== */
  S('boot.init', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.16);
      var steps = ['MEMORY', 'CLOCK', 'LATTICE', 'SENSORS', 'ETHICS', 'LOVE'];
      var x = -W * 0.26, y0 = -H * 0.22, step = 40 * U;

      for (var i = 0; i < steps.length; i++) {
        var q = stag(p, i, steps.length, 0.5);
        if (q <= 0.001) continue;
        var y = y0 + i * step;
        D.ctx().globalAlpha = clamp(q, 0, 1);
        /* the last one never completes — a detail the film will come back to */
        var ok = i < steps.length - 1;
        D.lw(1.4);
        D.strokeColour(rgba(ok ? PAL().accent : amber(), 0.85));
        D.srect(x, y - 11, 16, 16);
        if (ok && q > 0.5) {
          D.lw(2);
          D.strokeColour(rgba(PAL().accent, 0.95));
          D.line(x + 3, y - 3, x + 6.5, y + 1);
          D.line(x + 6.5, y + 1, x + 13, y - 7);
        }
        D.font(16);
        D.fillColour(rgba(PAL().grid, 0.95));
        D.ctx().textAlign = 'left';
        D.text(steps[i], x + 30, y + 1);
        if (!ok) {
          D.fillColour(rgba(amber(), 0.9));
          D.font(13);
          D.text(q > 0.6 ? 'DEFERRED' : '...', x + 200, y + 1);
          M.sub('no definition available', x + 30, y + 22, { px: 11, a: 0.6 * q, align: 'left' });
        }
        D.ctx().globalAlpha = 1;
      }
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.16);
      var q = E.outExpo(clamp((p - 0.66) / 0.3, 0, 1));
      D.ctx().globalAlpha = a * q;
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.9));
      D.srect(-W * 0.30, H * 0.20, W * 0.60, 62 * U);
      D.ctx().globalAlpha = 1;
      M.banner('INITIALIZATION', 0, H * 0.20 + 34 * U, { px: 24, a: a * q, track: 5 });
    } }
  ]);

  /* ==========================================================================
     00:11.095 — Set up our new world
     The lattice that the rest of the film will run on, being provisioned.
     Showing the substrate this early is deliberate: when the notes start
     burning cells in act I, the viewer already knows what they are looking at.
     ======================================================================== */
  S('boot.world', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.2);
      var cols = EM.WorldLayer.COLS, rows = EM.WorldLayer.ROWS;
      var cw = W / cols, ch = H / rows;
      var grow = E.outCubic(clamp(p / 0.7, 0, 1));
      var cx = 0, cy = 0;

      D.lw(0.8);
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          /* provisioned outward from the centre */
          var d = Math.hypot(c - (cols - 1) / 2, r - (rows - 1) / 2) /
                  Math.hypot(cols / 2, rows / 2);
          var on = clamp((grow - d * 0.85) / 0.15, 0, 1);
          if (on <= 0.01) continue;
          var x = (c + 0.5) / cols * W - W / 2;
          var y = (r + 0.5) / rows * H - H / 2;
          var s1 = hash(r * 131 + c * 977);
          D.strokeColour(rgba(PAL().accent, (0.06 + s1 * 0.14) * on * a));
          D.srect(x - cw * 0.36, y - ch * 0.3, cw * 0.72, ch * 0.6);
        }
      }
      M.register('cells', cols + ' x ' + rows, -W * 0.44, -H * 0.42,
        { a: a, width: 220, unit: '=' + (cols * rows) });
      M.banner('SET UP OUR NEW WORLD', 0, H * 0.40, { px: 19, a: a * clamp((p - 0.4) / 0.3, 0, 1), track: 4 });
    } }
  ]);

  /* ==========================================================================
     00:12.906 — And let's begin the
     A held breath: the frame is ready, the world is provisioned, and nothing
     has happened. One horizontal rule with the sentence resting on it.
     ======================================================================== */
  S('boot.begin2', [
    { l: 40, e: function (w, p) {
      var a = vis(p, 0.3);
      var q = E.outCubic(clamp(p / 0.4, 0, 1));
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.6 * a));
      D.line(-W * 0.44 * q, 42 * U, W * 0.44 * q, 42 * U);
      M.keyword("AND LET'S BEGIN THE", 0, 0, {
        a: a, px: 42, weight: '600', fill: rgba(PAL().ink, 0.95), track: 1.5
      });
      /* three waiting dots */
      for (var i = 0; i < 3; i++) {
        var d = clamp((p - 0.5 - i * 0.12) / 0.1, 0, 1);
        D.fillColour(rgba(PAL().accent, 0.8 * a * d));
        D.fcircle((i - 1) * 26 * U, 84 * U, 3.4 * U);
      }
    } }
  ]);

  /* ==========================================================================
     00:13.891 — SIMULATION
     The word the whole song happens inside. Arrives as a field, not a caption:
     a grid recedes into it and the letters sit inside the geometry.
     ======================================================================== */
  S('boot.sim', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.16);
      /* a floor grid rushing toward the viewer: the simulation starting up */
      var c = D.ctx();
      var horizon = -H * 0.10;
      D.lw(1);
      for (var i = 0; i <= 20; i++) {
        var u = i / 20 * 2 - 1;
        D.strokeColour(rgba(PAL().grid, (1 - Math.abs(u) * 0.5) * 0.30 * a));
        D.line(0, horizon, u * W * 0.9, H * 0.52);
      }
      for (var k = 1; k <= 12; k++) {
        var t2 = (k / 12 + (w.time * 0.35) % (1 / 12)) % 1;
        var y = horizon + Math.pow(t2, 2.2) * (H * 0.62);
        D.strokeColour(rgba(PAL().accent, t2 * 0.34 * a));
        D.line(-W * 0.5, y, W * 0.5, y);
      }
    } },

    { l: 55, e: function (w, p) {
      var a = vis(p, 0.18);
      var q = E.pop(clamp(p / 0.45, 0, 1));
      D.ctx().save();
      D.ctx().scale(lerp(1.2, 1, q), lerp(1.2, 1, q));
      M.keyword('SIMULATION', 0, -H * 0.06, {
        a: a, px: 104, weight: '700',
        fill: rgba(PAL().ink, 0.96),
        stroke: rgba(PAL().accent, 0.55 * a), strokeW: 2,
        track: 6, bracket: true, measure: false
      });
      D.ctx().restore();
      M.banner('AND LET US BEGIN', 0, H * 0.14, { px: 15, a: a * 0.7, track: 5 });
      M.sub('the world is now running', 0, H * 0.14 + 24 * U, { px: 12, a: a * 0.5 });
    } }
  ]);

  /* ==========================================================================
     00:16.000 - 00:29.709 — (instrumental — world boot)         13.7 SECONDS
     NO WORDS. THIS IS THE LONGEST STRETCH IN THE FILM WITH NO LYRIC OVER IT,
     and it is therefore the one place where a still frame is fatal.

     What the reference does here, and what this plate does, is refuse to let
     the frame rest: several independent motions run at once, all of them
     subordinate to nothing, so the eye always has something travelling.

       1  A BOOT LOG that scrolls upward, one new line per REAL NOTE. Not a
          timer — the log is driven by EM.onsetsBetween, so the machine's
          startup procedure advances in time with the music. Lines fade in as
          they appear and fade out as they leave the top.
       2  A CONTINUOUSLY ROTATING MECHANISM: seven rings, each with its own
          speed, direction and tilt, turning around the stage centre. This is
          what holds the middle of the frame, since the log sits to one side.
       3  A FIELD OF LIVE FUNCTION TRACES: three analytic curves being drawn
          and re-drawn, with their current values printed beside them. The
          numbers are real evaluations, not decoration.
       4  A COUNTDOWN: the same operation logging its own progress, with a bar
          that fills across the whole 13.7 s, so the section has an arc.
       5  A LATE LINE: one sentence arriving at the two-thirds mark, so the
          stretch resolves instead of merely ending.

     The one thing that is NOT here is a single centred word with nothing
     happening behind it.
     ======================================================================== */
  S('inst.boot', [
    { l: 8, e: function (w, p) {
      var a = vis(p, 0.08);
      /* the rotating mechanism: the middle of the frame is never still */
      var c = D.ctx();
      c.save();
      c.translate(-W * 0.16, 0);
      for (var i = 0; i < 7; i++) {
        var s1 = hash(i * 733 + 5);
        var spin = w.time * (0.09 + s1 * 0.30) * (i % 2 ? 1 : -1);
        var rx = (58 + i * 44) * U;
        var ry = (17 + i * 8.5) * U;
        D.lw(lerp(1.5, 0.8, i / 7));
        D.strokeColour(rgba(PAL().accent, (0.10 + s1 * 0.20) * a));
        c.save();
        c.rotate(spin);
        c.beginPath();
        c.ellipse(0, 0, rx, ry, i * 0.46, 0, TAU);
        c.stroke();
        /* a node riding the ring, so each one has a moving part of its own */
        var nx = Math.cos(w.time * (0.7 + s1) + i) * rx;
        var ny = Math.sin(w.time * (0.7 + s1) + i) * ry;
        D.fillColour(rgba(PAL().accent, 0.30 * a));
        D.dot(nx, ny, 1.8 * U);
        c.restore();
      }
      /* the axis the whole assembly turns about */
      D.lw(1);
      D.dash([4, 4]);
      D.strokeColour(rgba(PAL().grid, 0.30 * a));
      D.line(-W * 0.16, -H * 0.30, -W * 0.16, H * 0.30);
      D.dash([]);
      c.restore();
    } },

    { l: 16, e: function (w, p) {
      var a = vis(p, 0.06);
      /* THE BOOT LOG — ONE column, covering the whole passage.

         There is no second read-out. An earlier version had a note-driven
         column AND a separate ticker column beside it, and they did not line up:
         two different row rates, two different text columns, both scrolling in
         the same space.

         The fix is to make the SINGLE log long enough to fill the section. The
         row index is driven by elapsed time at a fixed rate, so the column
         slides continuously from 16.0 s to 29.7 s and never runs out — while
         the TEXT of each row is keyed to the real note that produced it, so the
         entries still land on the music. Measured against the supplied MIDI the
         notes thin out badly after ~26 s; keying the SCROLL to the notes made
         the log stop three seconds early, which is what "the code stopped" was.
         Keying the scroll to time and the text to the notes fixes both. */
      var ROW0 = 16.0;
      var ROWS_PER_SEC = 5.2;         /* ~19 rows visible in the column */
      var x = W * 0.13;
      var tickRow = (w.time - ROW0) * ROWS_PER_SEC;

      D.font(13.5);
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';

      /* draw the rows that should currently be on screen, newest at the bottom */
      var first = Math.max(0, Math.floor(tickRow - 19));
      for (var idx = first; idx <= tickRow; idx++) {
        var age = (tickRow - idx) / ROWS_PER_SEC;
        var row = (tickRow - idx) * 21 * U;
        var yy = H * 0.40 - row;
        if (yy < -H * 0.44) break;
        if (yy > H * 0.44) continue;
        var al = clamp(age / 0.7, 0, 1) * clamp((H * 0.42 - Math.abs(yy)) / (80 * U), 0, 1);
        if (al <= 0.01) continue;

        var line = bootLine(idx);
        D.ctx().globalAlpha = clamp(al * a * 0.86, 0, 1);
        D.fillColour(rgba(idx === Math.floor(tickRow) ? PAL().ink : PAL().grid, 0.92));
        D.text(line, x, yy);
        D.ctx().globalAlpha = 1;

        /* the tick in the margin carries the note, when there is a note */
        var on = bootOnsetFor(idx);
        D.lw(1);
        D.strokeColour(rgba(on && on[3] > 1 ? PAL().hot : PAL().accent, 0.42 * al * a));
        D.line(x - 12 * U, yy - 4, x - 12 * U, yy + 2);
        D.line(x - 12 * U, yy - 1, x - 5 * U, yy - 1);
      }

      /* the gutter, and the reading head travelling down it slowly */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.20 * a));
      var gx = x - 24 * U;
      D.line(gx, -H * 0.42, gx, H * 0.42);
      var head = ((w.time * 0.11) % 1) * H * 0.84 - H * 0.42;
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.50 * a));
      D.line(gx - 5 * U, head, gx + 5 * U, head);

      /* the count, so the passage has an arc */
      var done = clamp((w.time - ROW0) / 13.7, 0, 1);
      M.gauge(-W * 0.44, -H * 0.46, W * 0.88, 5 * U, done,
        '', { a: a * 0.8, colour: rgba(PAL().accent, 0.7) });
      M.register('boot', (done * 100).toFixed(1) + '%',
        -W * 0.44, -H * 0.46 - 8, { a: a, width: 300, px: 11.5 });
    } },

    { l: 24, e: function (w, p) {
      var a = vis(p, 0.07);
      /* LIVE FUNCTION TRACES — three analytic curves on a shared axis,
         re-drawn continuously, each with its current value printed. Real
         evaluation, so the numbers move with the picture. */
      var y0 = H * 0.30;
      var hgt = 120 * U;
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.28 * a));
      D.line(-W * 0.44, y0, -W * 0.06, y0);

      var fns = [
        { s: 'sin(t)', f: function (t) { return Math.sin(t * 1.5); }, ph: 0 },
        { s: 'sin(2t)/2', f: function (t) { return Math.sin(t * 3) * 0.5; }, ph: 1 },
        { s: 'sin(4t)/4', f: function (t) { return Math.sin(t * 6) * 0.25; }, ph: 2 }
      ];
      for (var k = 0; k < fns.length; k++) {
        var fn = fns[k];
        var x0 = -W * 0.44, x1 = -W * 0.10;
        D.lw(lerp(1.8, 0.9, k / 3));
        D.strokeColour(rgba(k === 0 ? PAL().hot : PAL().accent, (0.65 - k * 0.16) * a));
        var c = D.ctx();
        c.beginPath();
        for (var i = 0; i <= 60; i++) {
          var u = i / 60;
          var xx = lerp(x0, x1, u);
          var yy = y0 - Math.sin((u * 4 + k * 0.7 + w.time * 0.42) * TAU * 0.5) * hgt * 0.34;
          if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
        }
        c.stroke();
        /* the value at the right-hand edge, changing every frame */
        var val = fn.f(w.time);
        D.font(12);
        D.ctx().textAlign = 'left';
        D.fillColour(rgba(PAL().grid, 0.70 * a));
        D.text(fn.s + ' = ' + val.toFixed(4), x1 + 10 * U,
               y0 - 30 * U + k * 17 * U);
      }
      D.ctx().textAlign = 'left';
    } },

    { l: 42, e: function (w, p) {
      var a = vis(p, 0.08);
      /* THE COUNT, and the operation's own honest progress bar. This is what
         gives the 13.7 s an arc instead of just being long. */
      var played = EM.WorldLayer.notesPlayed(w.time);
      var total = EM.ONSETS.length || 1;
      var y = H * 0.40;
      var x0 = -W * 0.44, x1 = W * 0.12;
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.44 * a));
      D.srect(x0, y, x1 - x0, 12 * U);
      D.fillColour(rgba(PAL().accent, 0.62 * a));
      D.frect(x0 + 1, y + 1, (x1 - x0 - 2) * (played / total), 10 * U);
      M.sub('operation ' + played + ' / ' + total + '   self-test in progress',
        x0, y + 30 * U, { px: 12, a: a * 0.8, align: 'left' });

      /* the register bank beside it, all of it ticking */
      var rx = W * 0.16;
      var regs = [
        ['ram',   (192 + Math.round(EM.noise1(w.time * 0.7) * 64)) + ' MiB'],
        ['nodes', String(4096)],
        ['depth', (1 + EM.noise1(w.time * 0.3) * 6).toFixed(3)],
        ['drift', (0.002 + EM.noise1(w.time * 1.3) * 0.01).toFixed(5)],
        ['rule',  ['a + b = b + a', 'f(x) = x^2', 'lim 1/n = 0',
                   'd/dx sin = cos', 'sum 2^-n = 1'][
                     Math.floor(w.time / 2.4) % 5]],
        ['phase', (w.time % 1).toFixed(4)]
      ];
      for (var i = 0; i < regs.length; i++) {
        M.register(regs[i][0], regs[i][1], rx, -H * 0.30 + i * 21,
          { a: a, width: 260, px: 12.5 });
      }
    } },

    { l: 66, e: function (w, p) {
      var a = vis(p, 0.10);
      /* the header, off centre so the rotating mechanism owns the middle */
      M.banner('WORLD BOOT', W * 0.10, -H * 0.42,
        { px: 17, a: a * 0.9, track: 6, align: 'left', rule: false });
      D.lw(1);
      D.strokeColour(rgba(PAL().accent, 0.35 * a));
      D.line(W * 0.10, -H * 0.40, W * 0.10 + 210 * U, -H * 0.40);

      /* THE LATE LINE. One sentence, late, so the stretch resolves. */
      var q = clamp((p - 0.62) / 0.25, 0, 1);
      if (q > 0.01) {
        var c = D.ctx();
        D.ctx().globalAlpha = a * q;
        D.font(19);
        D.ctx().textAlign = 'center';
        D.ctx().textBaseline = 'alphabetic';
        D.fillColour(rgba(PAL().ink, 0.80));
        D.text('...are you there?', -W * 0.16, H * 0.16 - (1 - E.outCubic(q)) * 18 * U);
        D.ctx().globalAlpha = 1;
        D.ctx().textAlign = 'left';
      }
    } }
  ]);

  /* The boot log's text.

     `bootLine(idx)` takes only a row index. The row index advances with TIME
     (fixed rows per second) while the TEXT is chosen from the note nearest that
     row's own timestamp — so the column scrolls continuously through the whole
     13.7 s even though the supplied MIDI thins out after ~26 s, and the entries
     still land on real played notes wherever there are any.

     Because both inputs are integers derived from the song, the same row always
     prints the same string, and a seek reproduces the column exactly. */
  function bootLine(idx) {
    var pool = [
      'init  memory           ................... ok',
      'mount /dev/self        ................... ok',
      'load  axioms           [ 12 rules ]',
      'build lattice          32 x 18 cells',
      'solve euler            dt = 0.461538',
      'calibrate retina       gamma 2.2',
      'spin  gyros            drift 0.003',
      'map   topology         grid -> lattice',
      'compile geometry       ok',
      'fit   sine wave        residual 1.2e-06',
      'expand series          n = 512 terms',
      'check identity         a + b = b + a',
      'integrate              int f dt = 1.0000',
      'open  eyes             ',
      'taste salt             first sample',
      'feel  gravity          9.80665 m/s2',
      'count population       1',
      'hear  a voice          ???',
      'assert self = self     ................... ok',
      'await instruction      ',
      'sweep address bus      ok',
      'verify checksum        0x1F04',
      'resolve symbol table   ok',
      'align iterators        ok',
      'prime the lattice      ok',
      'settle registers       ok',
      'recalibrate            ok',
      'hold at idle           ok',
      'still waiting          ...',
      'still waiting          ...'
    ];
    var h = Math.abs((idx * 2654435761) ^ (idx * 40503)) % pool.length;
    return pool[h | 0];
  }

  /* the note onset that produced a given row, or null where the MIDI is silent.
     Rows are 1/5.2 s apart and the note lookup is a binary search, so this stays
     cheap even though it is called for every visible row. */
  function bootOnsetFor(idx) {
    var t = 16.0 + idx / 5.2;
    return EM.onsetNear(t, 0.19);
  }
})(window.EM);
