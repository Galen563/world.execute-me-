/* ============================================================================
   src/42_plates_condition.js — ACT II · CONDITION      00:59.2 - 01:14.0

   "If I can / If I can give you all the STIMULATIONS / Then I can / Then I can
    be your only SATISFACTION / ... / I will run the EXECUTION / Though we are
    trapped / In this strange strange SIMULATION"

   The act where the bargain is stated. "If I can ... then I can ..." is a
   conditional, and the film draws it as one: a decision diamond with the
   condition on the left, the consequence on the right, and the machine
   checking whether it qualifies.

   The diamond is the recurring object of this act, and it is also the thing
   that breaks. It starts complete and correct at 00:59, and by the end of the
   act there is a crack through it and the label has changed to something the
   machine cannot verify. Same shape, six appearances, six different states of
   damage — which is how "repeated grammar must vary" is handled without
   repeating a single drawing.

   11 plates.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var S = EM.Scenes, D = EM.D, E = EM.E, TAU = EM.TAU, M = EM.M;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var vis = EM.Life.vis, stag = EM.Life.stagger, between = EM.Life.between;

  var W = 1600, H = 900, U = 1;
  function PAL() { return EM.__pal; }

  /* --------------------------------------------------------------------------
     THE CONDITIONAL, as one reusable drawing with a damage argument.

     d = 0  intact: clean diamond, both branches open, condition verified
     d = 1  ruined: crack through the shape, branches shut, label unverifiable

     Every plate in this act that shows the conditional calls this, so the
     viewer reads six states of the SAME object rather than six new diagrams.
     ------------------------------------------------------------------------ */
  function conditional(cx, cy, r, dmg, opt) {
    opt = opt || {};
    var a = opt.a === undefined ? 1 : opt.a;
    var p = opt.p === undefined ? 1 : opt.p;
    if (a <= 0.004) return;

    var gap = dmg * 0.42;                 /* how far the diamond has opened up */
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);

    /* ---- the diamond, drawn as four edges so a crack can separate them --- */
    var pts = [[cx, cy - r], [cx + r * 1.5, cy], [cx, cy + r], [cx - r * 1.5, cy]];
    D.lw(2);
    D.strokeColour(rgba(dmg > 0.45 ? PAL().hot : PAL().accent, 0.9));
    for (var i = 0; i < 4; i++) {
      var a1 = pts[i], a2 = pts[(i + 1) % 4];
      /* each edge draws itself in during the line's entrance */
      var q = clamp(p / 0.35 - i * 0.06, 0, 1);
      if (q <= 0) continue;
      /* and the lower-right edge is the one that tears away */
      var tear = (i === 1) ? gap * r * 0.5 : 0;
      D.ctx().beginPath();
      D.ctx().moveTo(a1[0], a1[1]);
      D.ctx().lineTo(lerp(a1[0], a2[0], q) + tear * 0.4, lerp(a1[1], a2[1], q) + tear);
      D.ctx().stroke();
    }

    /* ---- the two branches leaving the diamond ---------------------------- */
    var openL = (1 - dmg * 0.8);
    D.lw(1.4);
    D.strokeColour(rgba(PAL().grid, 0.8));
    /* TRUE branch leaves to the right */
    D.ctx().beginPath();
    D.ctx().moveTo(cx + r * 1.5, cy);
    D.ctx().lineTo(cx + r * 1.5 + 120 * openL, cy);
    D.ctx().lineTo(cx + r * 1.5 + 170 * openL, cy - 130 * openL);
    D.ctx().stroke();
    /* FALSE branch leaves downward */
    D.ctx().beginPath();
    D.ctx().moveTo(cx, cy + r);
    D.ctx().lineTo(cx, cy + r + 120 * openL);
    D.ctx().stroke();

    M.sub('TRUE', cx + r * 1.5 + 178 * openL, cy - 136 * openL,
      { px: 12, a: a * openL, align: 'left' });
    M.sub('FALSE', cx + 12, cy + r + 118 * openL, { px: 12, a: a * openL, align: 'left' });

    /* ---- the crack ------------------------------------------------------- */
    if (dmg > 0.18) {
      M.fracture(cx, cy, r * 0.92, 3.17, {
        angle: -0.6, segs: 5, width: 1.4 + dmg * 1.4,
        colour: rgba(PAL().hot, clamp((dmg - 0.18) / 0.5, 0, 1) * a)
      });
    }

    /* ---- the condition label, above the shape ---------------------------- */
    var label = opt.label || 'IF I CAN';
    M.banner(label, cx, cy - r - 34, {
      px: opt.labelPx || 17, a: a, track: 3.4,
      colour: rgba(dmg > 0.6 ? PAL().hot : PAL().accent, 0.95)
    });

    /* ---- the verdict, below it ------------------------------------------ */
    if (opt.verdict) {
      var vq = clamp((p - 0.5) / 0.3, 0, 1);
      if (vq > 0.01) {
        D.lw(1.6);
        D.strokeColour(rgba(dmg > 0.6 ? PAL().hot : PAL().accent, 0.85 * vq));
        D.srect(cx - 130, cy + r + 158, 260, 34);
        M.banner(opt.verdict, cx, cy + r + 181, {
          px: 14, a: a * vq, track: 3,
          colour: rgba(dmg > 0.6 ? PAL().hot : PAL().accent, 0.95)
        });
      }
    }

    D.ctx().globalAlpha = prev;
  }

  /* ==========================================================================
     00:59.223 — If I can
     The conditional appears for the first time, intact, being drawn.
     ======================================================================== */
  S('cd.ifIcan', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.2);
      /* a drafting bed: the machine laying out its own logic diagram */
      D.lw(0.8);
      D.strokeColour(rgba(PAL().grid, 0.18 * a));
      D.grid(-W / 2, -H / 2, W, H, 50 * U, 0.18 * a);
      M.banner('CONDITIONAL · 01', -W * 0.40, -H * 0.38,
        { px: 13, a: a * 0.7, align: 'left', track: 3 });
    } },

    { l: 45, e: function (w, p, cue) {
      var a = vis(p, 0.18);
      conditional(0, -20 * U, 86 * U, 0, {
        a: a, p: p, label: 'IF I CAN', verdict: 'CONDITION MET'
      });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      M.register('attempt', 1, -W * 0.40, H * 0.30, { a: a, width: 250 });
      M.register('granted', 'PENDING', -W * 0.40, H * 0.30 + 20,
        { a: a, width: 250, colour: rgba(PAL().accent, 0.95) });
    } }
  ]);

  /* ==========================================================================
     00:59.687 — If I can give you all the
     Everything the machine has, offered: a handed-over pile, measured.
     ======================================================================== */
  S('cd.giveall', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.18);
      var n = 24;
      for (var i = 0; i < n; i++) {
        var q = stag(p, i, n, 0.55);
        if (q <= 0.001) continue;
        var col = i % 6, row = Math.floor(i / 6);
        var x = (col - 2.5) * 40 * U;
        var y = -40 * U + row * 26 * U - (1 - E.outBack(q)) * 90 * U;
        var s1 = hash(i * 4421 + 9);
        D.ctx().globalAlpha = clamp(q, 0, 1);
        D.lw(1.2);
        D.strokeColour(rgba(PAL().accent, 0.7));
        D.fillColour(rgba(PAL().accent, 0.12 + s1 * 0.15));
        D.srect(x - 16, y - 9, 32, 18);
        D.ctx().globalAlpha = 1;
      }
      /* the pile is being weighed */
      D.lw(1.4);
      D.strokeColour(rgba(PAL().grid, 0.7 * a));
      D.line(-160 * U, 90 * U, 160 * U, 90 * U);
      M.sub('total offered', 0, 112 * U, { px: 12, a: a * 0.8 });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      M.keyword('ALL OF IT', 0, -H * 0.32, {
        a: a, px: 40, weight: '600', fill: rgba(PAL().ink, 0.95), track: 2
      });
      M.gauge(-220 * U, -H * 0.22, 440 * U, 12 * U,
        E.outCubic(clamp(p / 0.7, 0, 1)), 'offered to you',
        { a: a, colour: rgba(PAL().accent, 0.9) });
    } }
  ]);

  /* ==========================================================================
     01:01.958 — STIMULATIONS
     The word as a jolt: a spike train hitting the frame, each hit measured.
     ======================================================================== */
  S('cd.stim', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.16);
      var c = D.ctx();
      var hits = 7;
      D.lw(2);
      for (var i = 0; i < hits; i++) {
        var q = clamp((p - i * 0.1) / 0.12, 0, 1);
        if (q <= 0) continue;
        var x = (i - (hits - 1) / 2) * 180 * U;
        var amp = (60 + hash(i * 3391 + 5) * 130) * U * E.outExpo(q);
        D.strokeColour(rgba(PAL().hot, 0.75 * a * (1 - q * 0.3)));
        c.beginPath();
        c.moveTo(x - 60 * U, 0);
        c.lineTo(x - 10 * U, 0);
        c.lineTo(x, -amp);
        c.lineTo(x + 10 * U, amp * 0.4);
        c.lineTo(x + 20 * U, 0);
        c.lineTo(x + 70 * U, 0);
        c.stroke();
        M.sub('-' + (20 + i * 7) + 'dB', x, 34 * U, { px: 10, a: a * 0.6 });
      }
      /* the baseline being driven */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(-W * 0.44, 0, W * 0.44, 0);
    } },

    { l: 60, e: function (w, p) {
      var a = vis(p, 0.16);
      var q = E.pop(clamp(p / 0.4, 0, 1));
      D.ctx().save();
      D.ctx().scale(lerp(1.15, 1, q), lerp(1.15, 1, q));
      M.keyword('STIMULATIONS', 0, -H * 0.26, {
        a: a, px: 68, weight: '700',
        fill: rgba(PAL().hot, 0.95 * a),
        stroke: rgba(PAL().ink, 0.4 * a), strokeW: 1
      });
      D.ctx().restore();
      M.pulseRings(0, -H * 0.26, w.time, { a: a, r0: 120, spread: 200, colour: PAL().hot });
    } }
  ]);

  /* ==========================================================================
     01:02.589 — Then I can
     The consequence side of the conditional, drawn as the mirror of the first.
     ======================================================================== */
  S('cd.thenIcan', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.2);
      D.lw(0.8);
      D.strokeColour(rgba(PAL().grid, 0.18 * a));
      D.grid(-W / 2, -H / 2, W, H, 50 * U, 0.18 * a);
      M.banner('CONDITIONAL · THEN', -W * 0.40, -H * 0.38,
        { px: 13, a: a * 0.7, align: 'left', track: 3 });
    } },

    { l: 45, e: function (w, p) {
      var a = vis(p, 0.18);
      /* the consequence is drawn on the OTHER side of the frame, so the pair
         of plates reads as one diagram read left to right */
      conditional(0, -20 * U, 86 * U, 0.08, {
        a: a, p: p, label: 'THEN I CAN', verdict: 'CONSEQUENCE STAGED'
      });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      M.register('premise', 'ok', -W * 0.40, H * 0.30, { a: a, width: 250 });
      M.register('consequence', 'ready', -W * 0.40, H * 0.30 + 20,
        { a: a, width: 250, colour: rgba(PAL().accent, 0.95) });
    } }
  ]);

  /* ==========================================================================
     01:03.535 — Then I can be your only
     "Only": a set reduced to a single member. Everything else greyed out.
     ======================================================================== */
  S('cd.only', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.18);
      var cols = 6, rows = 4, cw = 120 * U, ch = 76 * U;
      var keep = 14;                    /* the one that survives */
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          var x = (c - (cols - 1) / 2) * cw;
          var y = (r - (rows - 1) / 2) * ch - 20 * U;
          var isKept = i === keep;
          /* the others fade out as the line progresses */
          var fade = isKept ? 1 : clamp(1 - (p - 0.35) / 0.3, 0.06, 1);
          var q = stag(p, i, cols * rows, 0.4);
          if (q <= 0.001) continue;
          D.ctx().globalAlpha = clamp(q * fade, 0, 1);
          D.lw(isKept ? 2 : 1);
          D.strokeColour(rgba(isKept ? PAL().hot : PAL().grid, isKept ? 0.95 : 0.5));
          D.srect(x - 40 * U, y - 24 * U, 80 * U, 48 * U);
          if (!isKept) {
            /* a strike-through: this one is excluded */
            D.lw(1);
            D.strokeColour(rgba(PAL().grid, 0.5));
            D.line(x - 40 * U, y - 24 * U, x + 40 * U, y + 24 * U);
          }
          D.ctx().globalAlpha = 1;
        }
      }
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp((p - 0.5) / 0.3, 0, 1);
      if (q <= 0.01) return;
      var x = (2 - (6 - 1) / 2) * 120 * U;
      var y = (Math.floor(14 / 6) - (4 - 1) / 2) * 76 * U - 20 * U;
      D.bracket(x - 54 * U, y - 34 * U, 108 * U, 68 * U, 18);
      M.callout(x + 40 * U, y, x + 150 * U, y - 80 * U, 'the only one', { a: a * q });
      M.banner('SET REDUCED TO 1 MEMBER', 0, H * 0.34, { px: 15, a: a * q, track: 3.4 });
    } }
  ]);

  /* ==========================================================================
     01:05.397 — SATISFACTION
     The gauge reaching full — and the film showing that full is not the same
     as enough.
     ======================================================================== */
  S('cd.satis', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.18);
      var fill = E.outCubic(clamp(p / 0.7, 0, 1));

      /* a large central gauge, filling */
      var w0 = 620 * U, h0 = 54 * U;
      D.lw(2);
      D.strokeColour(rgba(PAL().grid, 0.8 * a));
      D.srect(-w0 / 2, -h0 / 2, w0, h0);
      D.fillColour(rgba(PAL().accent, 0.7 * a));
      D.frect(-w0 / 2 + 3, -h0 / 2 + 3, (w0 - 6) * fill, h0 - 6);
      /* segment rules */
      D.lw(1);
      D.strokeColour(rgba([3, 5, 10], 0.6));
      for (var i = 1; i < 20; i++) {
        D.line(-w0 / 2 + w0 * i / 20, -h0 / 2 + 3, -w0 / 2 + w0 * i / 20, h0 / 2 - 3);
      }
      /* the "full" tick, and the note that it is not the target */
      var markX = -w0 / 2 + w0 * 0.86;
      D.lw(1.6);
      D.strokeColour(rgba(PAL().hot, 0.9 * a));
      D.line(markX, -h0 / 2 - 14, markX, h0 / 2 + 14);
      M.sub('required 0.86', markX, -h0 / 2 - 22, { px: 11, a: a * 0.8 });
      M.sub(lerp(0, 1, fill).toFixed(3), 0, h0 / 2 + 26, { px: 22, a: a, weight: '600' });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      M.keyword('SATISFACTION', 0, -H * 0.30, {
        a: a, px: 62, weight: '700', fill: rgba(PAL().ink, 0.95), track: 3
      });
      var q = clamp((p - 0.75) / 0.2, 0, 1);
      if (q > 0.01) {
        M.sub('gauge full. sufficiency not indicated.', 0, H * 0.34,
          { px: 13, a: a * q, colour: rgba(PAL().hot, 0.9) });
      }
    } }
  ]);

  /* ==========================================================================
     01:06.601 — If I can make you happy
     The condition turns outward: for the first time the target is the other
     person's state, not a measurable property of the machine.
     ======================================================================== */
  S('cd.happy', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.2);
      /* a face-like read-out, drawn as an instrument: two sensors and a curve
         that is trying to be an upward mouth but keeps being plotted as data */
      D.lw(1.4);
      D.strokeColour(rgba(PAL().grid, 0.7 * a));
      D.scircle(-70 * U, -30 * U, 34 * U);
      D.scircle(70 * U, -30 * U, 34 * U);
      D.fillColour(rgba(PAL().accent, 0.5 * a));
      D.fcircle(-70 * U, -30 * U, 5 * U);
      D.fcircle(70 * U, -30 * U, 5 * U);

      /* the mouth as a sampled curve, and it is being fitted */
      var curve = clamp(p / 0.65, 0, 1);
      M.trace(function (u) {
        var target = Math.sin(u * Math.PI) * 52 * U;      /* a smile */
        var flat = 0;
        return 70 * U - lerp(flat, target, curve);
      }, { x0: -110 * U, x1: 110 * U, n: 48, colour: rgba(PAL().accent, 0.9 * a), width: 2.4 });

      M.sub('fitting expression...', 0, 190 * U, { px: 13, a: a * 0.8 });
      M.register('residual', (1 - curve).toFixed(4), -W * 0.38, -H * 0.34,
        { a: a, width: 240 });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      M.banner('IF I CAN MAKE YOU HAPPY', 0, -H * 0.38, { px: 17, a: a, rule: true, track: 3 });
    } }
  ]);

  /* ==========================================================================
     01:08.252 — I will run the
     A command being issued. The keystroke, the confirmation, the commit.
     ======================================================================== */
  S('cd.runthe', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp(p / 0.5, 0, 1);
      var line = '> run --target=self --then=EXECUTION';
      var shown = line.slice(0, Math.ceil(line.length * q));
      D.font(26);
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(PAL().ink, 0.95 * a));
      D.text(shown, -W * 0.30, -20 * U);
      /* block cursor */
      var cw = D.measure(shown, 26);
      if (q < 1 && Math.sin(w.time * 8) > 0) {
        D.fillColour(rgba(PAL().accent, 0.9 * a));
        D.frect(-W * 0.30 + cw + 3, -44 * U, 14, 30 * U);
      }
      /* command frame, prompts and a live status line — the machine at its
         own terminal issuing the instruction that will define the rest of
         the song */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.6 * a));
      D.srect(-W * 0.32, -56 * U, W * 0.64, 74 * U);
      M.banner('STDIN', -W * 0.30, -70 * U, { px: 11, a: a * 0.6, align: 'left', track: 3 });

      /* a prompt glyph, blinking */
      D.fillColour(rgba(PAL().accent, 0.8 * a));
      D.frect(-W * 0.30 - 22, -32 * U, 12, 22 * U);

      /* the option table the command is drawing from */
      var opts = [['--target', 'self'], ['--then', 'EXECUTION'], ['--undo', 'none']];
      for (var i = 0; i < opts.length; i++) {
        var q2 = stag(p, i, opts.length, 0.5);
        if (q2 <= 0.01) continue;
        M.register(opts[i][0], opts[i][1], -W * 0.28, 78 * U + i * 19,
          { a: a * q2, width: 300, colour: rgba(i === 1 ? PAL().hot : PAL().accent, 0.95) });
      }
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp((p - 0.6) / 0.3, 0, 1);
      if (q <= 0.01) return;
      M.sub('commit accepted', 0, 90 * U, { px: 15, a: a * q, colour: rgba(PAL().accent, 0.95) });
      M.pulseRings(0, 60 * U, w.time, { a: a * q, r0: 30, spread: 260, rings: 2 });
    } }
  ]);

  /* ==========================================================================
     01:09.259 — EXECUTION (first)
     The word appears for the first of eighteen times. Here it is almost
     gentle: a gear beginning to turn, and the sound of something starting.
     The eighteen are drawn by one parameterised factory in
     45_plates_execution.js; this first one belongs to this act because it is
     still part of the bargain, not yet part of the storm.
     ======================================================================== */
  S('ex.first', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.18);
      var spin = E.outCubic(clamp(p / 0.8, 0, 1)) * 1.4;
      var c = D.ctx();
      /* a gear, drawn as a real involute-ish form: teeth, hub, and a keyway */
      for (var ring = 0; ring < 2; ring++) {
        var r1 = ring === 0 ? 96 * U : 62 * U;
        var teeth = ring === 0 ? 16 : 12;
        var rot = spin * (ring === 0 ? 1 : -1.35);
        D.lw(ring === 0 ? 2 : 1.4);
        D.strokeColour(rgba(PAL().accent, (ring === 0 ? 0.8 : 0.55) * a));
        D.ngon(0, -20 * U, r1, teeth, rot, function (i) {
          return r1 * (i % 2 ? 0.84 : 1);
        });
        c.stroke();
        D.scircle(0, -20 * U, r1 * 0.62, 0, TAU);
        /* spokes */
        for (var s = 0; s < 5; s++) {
          var ang = rot + s / 5 * TAU;
          D.line(Math.cos(ang) * r1 * 0.24, -20 * U + Math.sin(ang) * r1 * 0.24,
                 Math.cos(ang) * r1 * 0.6, -20 * U + Math.sin(ang) * r1 * 0.6);
        }
      }
      D.lw(1.6);
      D.strokeColour(rgba(PAL().hot, 0.7 * a));
      D.scircle(0, -20 * U, 14 * U);
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.16);
      M.keyword('EXECUTION', 0, H * 0.26, {
        a: a, px: 54, weight: '700', fill: rgba(PAL().ink, 0.95)
      });
      M.sub('call 1 / 18', 0, H * 0.26 + 44 * U, { px: 13, a: a * 0.7, track: 2.6 });
    } },

    { l: 12, e: function (w, p) {
      var a = vis(p, 0.2);
      /* a metronome / cycle counter, because this is the machine's only verb */
      var beats = 12;
      for (var i = 0; i < beats; i++) {
        var x = (i - (beats - 1) / 2) * 26 * U;
        var on = i <= Math.floor(clamp(p, 0, 1) * beats);
        D.fillColour(rgba(on ? PAL().hot : PAL().grid, on ? 0.85 * a : 0.3 * a));
        D.frect(x - 7 * U, -H * 0.40, 13 * U, 5 * U);
      }
    } }
  ]);

  /* ==========================================================================
     01:10.084 — Though we are trapped
     The box closing. The conditional's diamond has become a container.
     ======================================================================== */
  S('cd.trapped', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = E.outCubic(clamp(p / 0.7, 0, 1));
      var hw = lerp(W * 0.46, W * 0.20, q);
      var hh = lerp(H * 0.42, H * 0.20, q);
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.85 * a));
      D.srect(-hw, -hh, hw * 2, hh * 2);
      /* walls of the box, thickening toward the centre */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      for (var i = 1; i <= 5; i++) {
        var inset = i * 14 * U;
        if (hw - inset <= 0) break;
        D.srect(-hw + inset, -hh + inset, (hw - inset) * 2, (hh - inset) * 2);
      }
      /* interior hatching: this space is not available */
      D.ctx().save();
      D.ctx().beginPath();
      D.ctx().rect(-hw, -hh, hw * 2, hh * 2);
      D.ctx().clip();
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.2 * a));
      for (var x = -hw; x < hw; x += 22 * U) {
        D.line(x, -hh, x + hh * 2, hh);
      }
      D.ctx().restore();
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      M.banner('THOUGH WE ARE TRAPPED', 0, -H * 0.04, { px: 20, a: a, track: 3.4 });
      var q = clamp((p - 0.55) / 0.3, 0, 1);
      M.register('free volume', ((1 - q) * 100).toFixed(1), -W * 0.36, H * 0.32,
        { a: a * q, width: 250, unit: '%' });
    } }
  ]);

  /* ==========================================================================
     01:11.764 — In this strange, strange
     Repetition of a word as a visual stutter: the same shape printed twice,
     slightly offset, and the offset growing.
     ======================================================================== */
  S('cd.strange', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.2);
      var off = lerp(6, 46, clamp(p / 0.8, 0, 1));
      for (var k = 0; k < 4; k++) {
        var s = k / 3;
        D.ctx().globalAlpha = a * (0.16 + s * 0.30);
        D.lw(2);
        D.strokeColour(rgba(k === 3 ? PAL().hot : PAL().accent, 0.9));
        D.ngon((k - 1.5) * off * 0.6, (k - 1.5) * off * 0.4, 130 * U, 3, k * 0.3);
        D.ctx().stroke();
        D.ctx().globalAlpha = 1;
      }
      /* a double-exposure guide, like a mis-registered print */
      D.lw(1);
      D.dash([3, 5]);
      D.strokeColour(rgba(PAL().grid, 0.4 * a));
      D.line(-W * 0.44, 0, W * 0.44, 0);
      D.dash([]);
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      /* the word said twice, the second time not quite aligned */
      M.keyword('STRANGE', -6 * U, -H * 0.24, {
        a: a * 0.45, px: 46, weight: '700', fill: rgba(PAL().grid, 0.95)
      });
      M.keyword('STRANGE', 6 * U, -H * 0.24 + 16 * U, {
        a: a, px: 46, weight: '700', fill: rgba(PAL().ink, 0.95)
      });
      M.sub('the same word, printed twice, out of register', 0, H * 0.32,
        { px: 12, a: a * 0.6 });
    } }
  ]);

  /* ==========================================================================
     01:13.169 — SIMULATION (second)
     The word from the boot act, returning — but now the cage is part of it.
     The first SIMULATION was a promise; this one is a description.
     ======================================================================== */
  S('cd.sim2', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.2);
      /* the same receding floor as the first SIMULATION, now with a ceiling:
         the simulation is closed at both ends */
      var horizon = -H * 0.34;
      D.lw(1);
      for (var i = 0; i <= 18; i++) {
        var u = i / 18 * 2 - 1;
        D.strokeColour(rgba(PAL().grid, (1 - Math.abs(u) * 0.5) * 0.34 * a));
        D.line(0, horizon, u * W * 0.88, H * 0.30);
      }
      for (var k = 1; k <= 10; k++) {
        var q = (k / 10 + (w.time * 0.3) % (1 / 10)) % 1;
        var y = horizon + Math.pow(q, 2.2) * (H * 0.64);
        D.strokeColour(rgba(PAL().accent, q * 0.34 * a));
        D.line(-W * 0.46, y, W * 0.46, y);
      }
      /* the lid */
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.7 * a));
      D.line(-W * 0.46, horizon, W * 0.46, horizon);
      for (var x = -W * 0.46; x <= W * 0.46; x += 40 * U) {
        D.line(x, horizon, x + 18 * U, horizon - 16 * U);
      }
    } },

    { l: 60, e: function (w, p) {
      var a = vis(p, 0.18);
      var q = E.pop(clamp(p / 0.45, 0, 1));
      D.ctx().save();
      D.ctx().scale(lerp(1.15, 1, q), lerp(1.15, 1, q));
      M.keyword('SIMULATION', 0, H * 0.10, {
        a: a, px: 92, weight: '700',
        fill: rgba(PAL().ink, 0.95),
        stroke: rgba(PAL().hot, 0.6 * a), strokeW: 2,
        track: 6
      });
      D.ctx().restore();
      M.banner('STRANGE, AND NOW ENCLOSED', 0, -H * 0.44, { px: 13, a: a * 0.7, track: 4 });
      /* the crack finally reaches the conditional: it is closed from here on */
      var cq = clamp((p - 0.6) / 0.3, 0, 1);
      if (cq > 0.01) {
        M.fracture(0, H * 0.10, 200 * U, 5.72, {
          angle: 0.4, segs: 7, width: 2,
          colour: rgba(PAL().hot, 0.7 * a * cq)
        });
      }
    } }
  ]);
})(window.EM);
