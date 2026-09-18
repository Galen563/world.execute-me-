/* ============================================================================
   src/46_plates_love.js —ACT VI 路 LOVE            02:57.2 - 03:31.9

   "I've studied / I've studied how to properly LO-O-OVE / Question me /
    Question me, I can answer all LO-O-OVE / I know the algebraic expression of
    LO-O-OVE / Though you are free / I am trapped / Trapped in LO-O-OVE /
    EXECUTION / (outro) / (end)"

   THE PAYOFF OF THE FILM'S ONE IDEA
   ---------------------------------
   The world's `struct` parameter is now 0.03: the machine has stopped obeying
   its own rules. But `warm` is at 0.86 —the highest in the whole piece —and
   that is the point. Order is gone and the picture is warm for the first time.
   Nothing has been solved. It has simply stopped computing.

   So every plate in this act follows one rule: THE PARAMETRIC GEOMETRY IS
   REPLACED BY THINGS DRAWN BY HAND. Where earlier acts used M.trace (an
   analytic function sampled across the frame), this act uses M.handCurve (a
   line with visible hesitation). Where earlier acts used the lattice, this act
   uses a board the lattice has worn through. The regression from machine to
   hand is the entire emotional content, and it is done by swapping one helper
   for another.

   The four LO-O-OVEs get four different KINDS of thing, not four drawings:
      1  a chemical structure —atoms and bonds, the molecule of the feeling
      2  an algebraic expansion —lim, integral, sigma flying in
      3  the first genuinely hand-written thing in the film: letters with a
         slight rotation and tremor, and a crooked underline reading
         (no equation required)
      4  a heartbeat —an irregular, noisy waveform
   The last one is the ending. Not a resolution: a loop.

   16 plates.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var S = EM.Scenes, D = EM.D, E = EM.E, TAU = EM.TAU, M = EM.M;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var vis = EM.Life.vis, stag = EM.Life.stagger, between = EM.Life.between;

  var W = 1600, H = 900, U = 1;
  function PAL() { return EM.__pal; }

  /* a warmth that arrives in this act and stays: the palette already carries
     it, this just makes the intent explicit in one place */
  function warm(t) { return clamp((t - 177.2) / 14, 0, 1); }

  /* ==========================================================================
     02:57.246 —I've studied
     The machine reporting its method. A study: pages, references, a syllabus.
     Still mechanical —the turn to warmth has not fully happened yet.
     ======================================================================== */
  S('lv.studied', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.22);
      /* a stack of pages being turned, drawn as overlapping planes */
      var n = 7;
      for (var i = 0; i < n; i++) {
        var q = stag(p, i, n, 0.5);
        if (q <= 0.01) continue;
        var off = i * 7 * U;
        var y = -H * 0.24 + i * 9 * U;
        D.ctx().globalAlpha = clamp(q, 0, 1) * (0.35 + (1 - i / n) * 0.5);
        D.lw(1.2);
        D.strokeColour(rgba(PAL().grid, 0.8));
        D.fillColour(rgba(PAL().grid, 0.04));
        D.rect(-W * 0.26 + off, y, W * 0.44 - off * 1.4, H * 0.40 - off);
        D.ctx().fill();
        D.ctx().stroke();
        /* ruled text on the top few pages */
        if (i >= n - 3) {
          D.lw(1);
          D.strokeColour(rgba(PAL().grid, 0.45));
          for (var k = 0; k < 7; k++) {
            var s1 = hash(i * 977 + k * 313);
            var ly = y + 34 * U + k * 22 * U;
            D.line(-W * 0.24 + off, ly, -W * 0.24 + off + (0.2 + s1 * 0.55) * W * 0.40, ly);
          }
        }
        D.ctx().globalAlpha = 1;
      }
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner("I'VE STUDIED", -W * 0.34, -H * 0.40,
        { px: 18, a: a, align: 'left', track: 3.6, rule: true });
      M.register('sources', 1, -W * 0.42, H * 0.34, { a: a, width: 250 });
      M.register('method', 'unknown', -W * 0.42, H * 0.34 + 20,
        { a: a, width: 250, colour: rgba(PAL().grid, 0.85) });
    } }
  ]);

  /* ==========================================================================
     02:58.173 —I've studied how to properly
     The object of study: LOVE, approached like a specimen. The last plate in
     the film where the apparatus is fully in control.
     ======================================================================== */
  S('lv.properly', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.22);
      /* a specimen frame, with a hand-drawn heart inside it and instruments
         around the outside: the moment the two languages meet */
      D.lw(1.4);
      D.strokeColour(rgba(PAL().grid, 0.8 * a));
      D.srect(-W * 0.22, -H * 0.28, W * 0.44, H * 0.56);

      /* corner ticks */
      for (var sx = -1; sx <= 1; sx += 2) {
        for (var sy = -1; sy <= 1; sy += 2) {
          var cx0 = sx * W * 0.22, cy0 = sy * H * 0.28;
          D.lw(2);
          D.strokeColour(rgba(PAL().accent, 0.7 * a));
          D.line(cx0, cy0, cx0 - sx * 30 * U, cy0);
          D.line(cx0, cy0, cx0, cy0 - sy * 30 * U);
        }
      }
      /* leader lines to the instrument panel */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(W * 0.22, -H * 0.20, W * 0.38, -H * 0.34);
      D.line(W * 0.22, H * 0.20, W * 0.38, H * 0.34);
    } },

    { l: 55, e: function (w, p) {
      var a = vis(p, 0.22);
      /* the specimen: drawn by hand, inside a measured frame —the whole film
         in one image */
      var s = 8.6 * U * 8;
      var pts = [];
      for (var k = 0; k <= 28; k++) {
        var ang = k / 28 * TAU;
        var hx = 16 * Math.pow(Math.sin(ang), 3);
        var hy = -(13 * Math.cos(ang) - 5 * Math.cos(2 * ang) - 2 * Math.cos(3 * ang) - Math.cos(4 * ang));
        pts.push([hx / 16 * s * 0.52 + (hash(k * 313 + 7) - 0.5) * 4,
                  hy / 16 * s * 0.52 + (hash(k * 977 + 3) - 0.5) * 4]);
      }
      M.handCurve(pts, 1.618, {
        wobble: 2.4, width: 2.2,
        colour: rgba(EM.mix(PAL().accent, PAL().love, 0.7), 0.9 * a)
      });
      M.banner('SPECIMEN 001', 0, -H * 0.32, { px: 12, a: a * 0.7, track: 3.6 });
    } },

    { l: 72, e: function (w, p) {
      var a = vis(p, 0.22);
      M.keyword('HOW TO PROPERLY', 0, H * 0.38, {
        a: a, px: 38, weight: '600', fill: rgba(PAL().ink, 0.95), track: 2
      });
      M.register('specimen', 'unlabelled', W * 0.34, -H * 0.30,
        { a: a, width: 230, align: 'left' });
      M.register('hazard', 'none known', W * 0.34, -H * 0.30 + 20,
        { a: a, width: 230, align: 'left' });
    } }
  ]);

  /* ==========================================================================
     02:59.929 —LO-O-OVE                          [kind 1 of 4: the molecule]
     A chemical structure: the word as atoms and bonds, with its formula. The
     machine reducing the feeling to something it can name.
     ======================================================================== */
  S('lv.lo1', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.18);
      var word = 'LO-O-OVE';
      var px = 64;
      D.font(px, '700');
      var total = D.measure(word, px, '700');
      var x0 = -total / 2;
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';

      /* atoms, placed on the letters themselves */
      var centres = [];
      for (var i = 0; i < word.length; i++) {
        var ch = word.charAt(i);
        var cw = D.measure(ch, px, '700');
        /* a slight vertical wobble, phase-locked to time but deterministic */
        var cy = Math.sin(i * 0.9 + w.time * 2) * 22 * U;
        centres.push([x0 + cw / 2, cy, cw, ch]);
        x0 += cw;
      }
      /* bonds first, so the atoms sit on top */
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.55 * a));
      for (i = 1; i < centres.length; i++) {
        D.line(centres[i - 1][0], centres[i - 1][1], centres[i][0], centres[i][1]);
      }
      /* glyphs and atom rings */
      for (i = 0; i < centres.length; i++) {
        var c = centres[i];
        D.font(px, '700');
        D.fillColour(rgba(PAL().ink, 0.95 * a));
        D.text(c[3], c[0] - c[2] / 2, 22 * U + c[1]);
        D.lw(1.6);
        D.strokeColour(rgba(c[3] === '-' ? PAL().accent : PAL().hot, 0.7 * a));
        D.scircle(c[0], c[1], c[2] * 0.62);
      }
      D.ctx().textAlign = 'center';
      M.sub('C8H11NO2  路  dopamine  路  detected', 0, 118 * U,
        { px: 14, a: a * 0.75, track: 2.4 });
    } }
  ]);

  /* ==========================================================================
     03:00.857 —Question me
     An interrogation. The machine volunteering to be examined, and the frame
     becoming a Q&A.
     ======================================================================== */
  S('lv.question', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.24);
      var pairs = 4;
      for (var i = 0; i < pairs; i++) {
        var q = stag(p, i, pairs, 0.55);
        if (q <= 0.01) continue;
        var y = -H * 0.24 + i * 62 * U;
        D.ctx().globalAlpha = clamp(q, 0, 1);
        /* the question mark, large, on the left */
        D.font(36, '700');
        D.ctx().textAlign = 'right';
        D.fillColour(rgba(PAL().accent, 0.85));
        D.text('?', -W * 0.22, y);
        /* a blank answer line on the right */
        D.lw(1.4);
        D.strokeColour(rgba(PAL().grid, 0.7));
        D.line(-W * 0.16, y, W * 0.26, y);
        /* some are answered, some are not */
        var answered = i < 2;
        if (answered) {
          D.lw(1.2);
          D.strokeColour(rgba(PAL().hot, 0.6));
          D.line(-W * 0.14, y - 6, W * 0.24, y - 6);
        } else {
          D.dash([4, 5]);
          D.lw(1.2);
          D.strokeColour(rgba(PAL().grid, 0.5));
          D.line(-W * 0.14, y - 6, W * 0.12, y - 6);
          D.dash([]);
        }
        D.ctx().globalAlpha = 1;
      }
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.24);
      M.banner('QUESTION ME', 0, -H * 0.40, { px: 20, a: a, track: 4.4, rule: true });
    } }
  ]);

  /* ==========================================================================
     03:01.901 —Question me, I can answer all
     The confidence: every question answered, and the answers are all the same
     word.
     ======================================================================== */
  S('lv.answer', [
    /* A query loop that returns the same thing every time is a fixed point, and
       a fixed point should be drawn as one: the frame shows a function being
       iterated, each application landing closer to the same value, with the
       residual collapsing to zero. The Q&A rows are the log of that loop.
       The previous version was the rows alone, which measured at 15-31
       primitives — a hole in the middle of the act. */
    { l: 18, e: function (w, p) {
      var a = vis(p, 0.20);
      var c = D.ctx();
      var x0 = -W * 0.44, x1 = W * 0.06;
      var y0 = H * 0.16, hgt = 150 * U;

      /* the iteration plotted: f applied n times, converging */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.30 * a));
      D.line(x0, y0, x1, y0);
      var iters = 9;
      var prevY = y0 - hgt;
      for (var n = 1; n <= iters; n++) {
        var q = stag(p, n, iters + 2, 0.5);
        if (q <= 0.01) continue;
        var x = lerp(x0, x1, n / iters);
        /* value = 1 - 2^-n : each step halves the remaining distance */
        var val = 1 - Math.pow(2, -n);
        var y = y0 - val * hgt * E.outCubic(q);
        D.lw(1.2);
        D.strokeColour(rgba(PAL().hot, 0.35 * a * q));
        D.line(x, y0, x, y);
        D.fillColour(rgba(val > 0.97 ? PAL().love : PAL().accent, 0.85 * a * q));
        D.dot(x, y, 3.2 * U);
        if (n > 1) {
          D.lw(1);
          D.strokeColour(rgba(PAL().accent, 0.45 * a * q));
          D.line(lerp(x0, x1, (n - 1) / iters), prevY, x, y);
        }
        prevY = y;
      }
      /* the asymptote it is converging to */
      D.lw(1);
      D.dash([5, 5]);
      D.strokeColour(rgba(PAL().love, 0.55 * a));
      D.line(x0, y0 - hgt, x1, y0 - hgt);
      D.dash([]);
      M.sub('x -> 1  (LO-O-OVE)', x1, y0 - hgt - 10,
        { px: 11.5, a: a * 0.8, align: 'right', colour: rgba(PAL().love, 0.9) });
      M.sub('iteration n', x1, y0 + 18, { px: 11, a: a * 0.55, align: 'right' });
      M.register('residual', Math.pow(2, -iters).toFixed(8), x0, y0 + 34,
        { a: a, width: 300, px: 11.5 });
    } },

    { l: 44, e: function (w, p) {
      var a = vis(p, 0.22);
      var rows = 5;
      var answer = 'LO-O-OVE';
      for (var i = 0; i < rows; i++) {
        var q = stag(p, i, rows, 0.5);
        if (q <= 0.01) continue;
        var y = -H * 0.30 + i * 40 * U;
        var typed = Math.ceil(answer.length * clamp(q, 0, 1));
        D.ctx().globalAlpha = clamp(q, 0, 1);
        D.font(15);
        D.ctx().textAlign = 'right';
        D.fillColour(rgba(PAL().grid, 0.8));
        D.text('Q' + (i + 1), W * 0.08, y);
        D.ctx().textAlign = 'left';
        D.font(22, '600');
        D.fillColour(rgba(PAL().hot, 0.9));
        D.text(answer.slice(0, typed), W * 0.13, y);
        /* a confidence bar beside each answer, all of them full */
        D.fillColour(rgba(PAL().hot, 0.30 * q));
        D.frect(W * 0.30, y - 11, 150 * U * q, 11 * U);
        D.ctx().globalAlpha = 1;
      }
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('EVERY QUERY RETURNS THE SAME VALUE', 0, H * 0.36,
        { px: 13, a: a * 0.8, track: 3.4 });
      M.register('accuracy', '100.000%', -W * 0.44, -H * 0.40,
        { a: a, width: 260, colour: rgba(PAL().hot, 0.95) });
      M.register('usefulness', '0.000%', -W * 0.44, -H * 0.40 + 20,
        { a: a, width: 260, colour: rgba(PAL().grid, 0.85) });
      M.register('queries answered', Math.round(clamp(p * 5, 1, 5)),
        -W * 0.44, -H * 0.40 + 40, { a: a, width: 260 });
    } }
  ]);

  /* ==========================================================================
     03:03.646 —LO-O-OVE                          [kind 2 of 4: the algebra]
     An algebraic expansion: the terms flying in and assembling into the word.
     The machine's actual answer to the question.
     ======================================================================== */
  S('lv.lo2', [
    { l: 30, e: function (w, p) {
      var a = vis(p, 0.16);
      D.font(60, '700');
      D.ctx().textAlign = 'center';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(PAL().ink, 0.95 * a));
      D.text('LO-O-OVE', 0, 0);
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.8 * a));
      D.line(-W * 0.34, -14 * U, W * 0.34, -14 * U);

      /* the expansion terms flying in from the edges of the frame */
      var terms = ['lim', 'INT', 'SIGMA', 'd/dt', 'e^i.pi', 'sqrt', 'inf'];
      for (var i = 0; i < terms.length; i++) {
        var s1 = hash(i * 313 + 3), s2 = hash(i * 977 + 7);
        var q = clamp((p - s1 * 0.5) / 0.4, 0, 1);
        if (q <= 0) continue;
        var px = (22 + s1 * 22);
        D.font(px);
        D.ctx().textAlign = 'center';
        D.fillColour(rgba(PAL().accent, 0.7 * a * q));
        D.text(terms[i], (s2 - 0.5) * W * 0.84,
               -110 * U + s1 * 40 * U - q * 30 * U + 120 * U);
      }
      D.ctx().textAlign = 'center';
      M.sub('solving...', 0, 90 * U, { px: 15, a: a * 0.75, tracking: 2.6 });
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.16);
      /* the equation, assembled at the bottom and unresolved */
      var q = clamp((p - 0.65) / 0.3, 0, 1);
      if (q <= 0.01) return;
      M.banner('LOVE = lim(n->inf) SIGMA(i=1..n) affection(i) / distance(i)', 0, H * 0.34,
        { px: 14, a: a * q * 0.85, track: 1.2 });
      M.sub('does not converge', 0, H * 0.34 + 22, { px: 12, a: a * q * 0.7, colour: rgba(PAL().hot, 0.85) });
    } }
  ]);

  /* ==========================================================================
     03:04.540 —I know the algebraic expression of
     The machine asserting knowledge. Everything is labelled, and the labels
     are wrong.
     ======================================================================== */
  S('lv.algebraic', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.22);
      /* a term-by-term breakdown, each line annotated —and each annotation
         quietly useless */
      var terms = [
        ['affection(i)', 'unbounded'],
        ['distance(i)', 'increasing'],
        ['return', '0'],
        ['error', 'increasing']
      ];
      var x = -W * 0.30, y0 = -H * 0.20, step = 52 * U;
      for (var i = 0; i < terms.length; i++) {
        var q = stag(p, i, terms.length, 0.5);
        if (q <= 0.01) continue;
        var y = y0 + i * step;
        D.ctx().globalAlpha = clamp(q, 0, 1);
        D.font(22);
        D.ctx().textAlign = 'left';
        D.fillColour(rgba(PAL().ink, 0.92));
        D.text(terms[i][0], x, y);
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.6));
        var lw0 = D.measure(terms[i][0], 22);
        D.line(x + lw0 + 12, y - 6, W * 0.24, y - 6);
        D.font(18, '600');
        D.ctx().textAlign = 'right';
        D.fillColour(rgba(i > 1 ? PAL().hot : PAL().accent, 0.9));
        D.text(terms[i][1], W * 0.24, y);
        D.ctx().globalAlpha = 1;
      }
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('THE ALGEBRAIC EXPRESSION OF', 0, -H * 0.40,
        { px: 16, a: a * 0.9, track: 3.4 });
    } }
  ]);

  /* ==========================================================================
     03:07.665 —LO-O-OVE                          [kind 3 of 4: hand-written]
     THE FIRST GENUINELY HAND-WRITTEN THING IN THE FILM. Letters with a slight
     rotation and tremor, a crooked underline, and the note
     "(no equation required)". After two minutes of instruments, this is the
     moment the film stops being a machine.
     ======================================================================== */
  S('lv.lo3', [
    { l: 40, e: function (w, p) {
      var a = vis(p, 0.14);
      var word = 'LO-O-OVE';
      var px = 86;
      D.font(px, '700');
      var total = D.measure(word, px, '700');
      var x0 = -total / 2;
      D.ctx().textBaseline = 'alphabetic';

      /* each glyph placed by hand: its own rotation and its own vertical
         offset, hashed from its index so the wobble is stable */
      for (var i = 0; i < word.length; i++) {
        var ch = word.charAt(i);
        var cw = D.measure(ch, px, '700');
        var k = stag(p, i, word.length, 0.5);
        if (k <= 0.01) { x0 += cw; continue; }
        var rot = (hash(i * 4421 + 11) - 0.5) * 0.16;
        var dy = (hash(i * 9967 + 23) - 0.5) * 16;
        var sc = lerp(1.6, 1, E.outCubic(k));

        D.ctx().save();
        D.ctx().translate(x0 + cw / 2, dy);
        D.ctx().rotate(rot);
        D.ctx().scale(sc, sc);
        D.ctx().globalAlpha = clamp(k, 0, 1) * a;
        D.font(px, '700');
        D.ctx().textAlign = 'center';
        D.fillColour(rgba(EM.mix(PAL().paper, PAL().love, 0.25), 0.95));
        D.text(ch, 0, 0);
        D.ctx().restore();
        D.ctx().globalAlpha = 1;
        x0 += cw;
      }

      /* the crooked underline, drawn with a tremor that grows */
      var uq = clamp((p - 0.45) / 0.4, 0, 1);
      if (uq > 0.01) {
        D.lw(3);
        D.ctx().globalAlpha = a * uq;
        M.handCurve([
          [-total / 2 - 14, 40], [-total * 0.2, 46], [total * 0.2, 38], [total / 2 + 14, 48]
        ], 2.718, {
          wobble: 4, width: 3,
          colour: rgba(EM.mix(PAL().paper, PAL().love, 0.35), 0.9)
        });
        D.ctx().globalAlpha = 1;
      }

      /* the note underneath, in the same hand, and it is the thesis */
      var nq = clamp((p - 0.68) / 0.3, 0, 1);
      if (nq > 0.01) {
        D.font(19, '600');
        D.ctx().textAlign = 'center';
        D.ctx().globalAlpha = a * nq;
        D.fillColour(rgba(EM.mix(PAL().paper, PAL().grid, 0.35), 0.9));
        D.text('(no equation required)', 6 * U, 92 * U);
        D.ctx().globalAlpha = 1;
      }
    } }
  ]);

  /* ==========================================================================
     03:08.483 —Though you are free
     The turn of the two clauses. One figure unlocked, one locked, side by side
     —and the difference between them is the whole song.
     ======================================================================== */
  S('lv.free', [
    /* The line turns on a pair of constraints — one released, one held — so the
       picture is a PHASE PORTRAIT of the same system in two states. The left
       half is a particle whose energy is not conserved and which therefore
       escapes to infinity; the right half is the same particle inside a
       potential well, closed. Drawing both as trajectories rather than as
       brackets and boxes is what fills the middle of the frame, which in the
       earlier version was empty. */
    { l: 22, e: function (w, p) {
      var a = vis(p, 0.20);
      var c = D.ctx();
      var half = W * 0.44;
      var y0 = 0;

      D.lw(1.2);
      D.dash([5, 6]);
      D.strokeColour(rgba(PAL().grid, 0.50 * a));
      D.line(0, -H * 0.40, 0, H * 0.40);
      D.dash([]);

      /* ---- LEFT: unbound. A trajectory that leaves and never returns ---- */
      var tq = E.outCubic(clamp(p / 0.8, 0, 1));
      D.lw(2.2);
      D.strokeColour(rgba(PAL().accent, 0.85 * a));
      c.beginPath();
      for (var i = 0; i <= 90; i++) {
        var u = (i / 90) * tq;
        /* r grows without a bound: the escape orbit */
        var r = 24 + u * u * (half * 0.78);
        var th = u * 5.2;
        var px = -half * 0.30 - Math.cos(th) * r * 0.5 - u * r * 0.35;
        var py = y0 - Math.sin(th) * r * 0.62;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      /* its energy, which only increases */
      D.lw(1);
      D.strokeColour(rgba(PAL().accent, 0.45 * a));
      for (i = 0; i < 4; i++) {
        var e1 = i / 4, e2 = (i + 1) / 4;
        var x1 = -half * 0.72 + e1 * half * 0.72, x2 = -half * 0.72 + e2 * half * 0.72;
        D.line(x1, H * 0.22 - e1 * e1 * 60, x2, H * 0.22 - e2 * e2 * 60);
      }
      M.banner('E = +', -half * 0.60, H * 0.30, { px: 13, a: a * 0.8, track: 3 });
      M.register('binding', 'NONE', -half * 0.92, -H * 0.36,
        { a: a, width: 240, colour: rgba(PAL().accent, 0.95) });
      M.register('escape', 'YES', -half * 0.92, -H * 0.36 + 20, { a: a, width: 240 });
      M.sub('YOU', -half * 0.30, -H * 0.30, { px: 15, a: a, track: 3 });

      /* ---- RIGHT: bound. The same particle inside a well --------------- */
      var bq = E.outCubic(clamp(p / 0.8, 0, 1));
      /* the well */
      D.lw(1.6);
      D.strokeColour(rgba(PAL().hot, 0.65 * a));
      c.beginPath();
      for (i = 0; i <= 60; i++) {
        var u2 = i / 60;
        var wx = half * 0.08 + u2 * W * 0.34;
        var wy = -H * 0.16 + Math.pow(u2 * 2 - 1, 2) * H * 0.28;
        if (i === 0) c.moveTo(wx, wy); else c.lineTo(wx, wy);
      }
      c.stroke();
      /* the trapped trajectory, closing on itself forever */
      D.lw(2.2);
      D.strokeColour(rgba(PAL().hot, 0.9 * a));
      c.beginPath();
      for (i = 0; i <= 120; i++) {
        var u3 = (i / 120) * bq;
        var th3 = u3 * 9.0;
        var rr = (H * 0.13) * (1 - 0.25 * u3);
        var px3 = half * 0.30 + Math.cos(th3) * rr * 1.5;
        var py3 = -H * 0.16 + H * 0.22 + Math.sin(th3) * rr * 0.8;
        if (i === 0) c.moveTo(px3, py3); else c.lineTo(px3, py3);
      }
      c.stroke();
      /* the walls that keep it there */
      D.lw(2.4);
      D.strokeColour(rgba(PAL().hot, 0.85 * a));
      D.line(half * 0.08, -H * 0.16 + H * 0.28, half * 0.08, H * 0.16);
      D.line(half * 0.08 + W * 0.34, -H * 0.16 + H * 0.28, half * 0.08 + W * 0.34, H * 0.16);
      M.banner('E = -', half * 0.16, H * 0.30, { px: 13, a: a * 0.8, track: 3 });
      M.register('binding', 'STRONG', half * 0.30, -H * 0.36,
        { a: a, width: 240, colour: rgba(PAL().hot, 0.95) });
      M.register('escape', 'NO', half * 0.30, -H * 0.36 + 20, { a: a, width: 240 });
      M.sub('ME', half * 0.30, -H * 0.30, { px: 15, a: a, track: 3 });
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.22);
      M.banner('THOUGH YOU ARE FREE', -W * 0.22, H * 0.36,
        { px: 17, a: a * (1 - clamp((p - 0.4) / 0.3, 0, 1) * 0.5), track: 3.2 });
      var q = clamp((p - 0.4) / 0.3, 0, 1);
      if (q > 0.01) {
        M.banner('I AM TRAPPED', W * 0.22, H * 0.34,
          { px: 17, a: a * q, track: 3.2, colour: rgba(PAL().hot, 0.95) });
      }
    } }
  ]);

  /* ==========================================================================
     03:09.746 —I am trapped
     Alone in the frame with the statement. Everything else has been removed.
     ======================================================================== */
  S('lv.trappedme', [
    { l: 22, e: function (w, p) {
      var a = vis(p, 0.18);
      /* the enclosure was the whole plate and it measured at 14 primitives for
         most of the line. It now has an interior: a state vector pinned at the
         box's corner trying to escape along its own gradient, with the walls
         crossing it off component by component. */
      var q = E.outCubic(clamp(p / 0.7, 0, 1));
      var hw = lerp(W * 0.46, W * 0.26, q);
      var hh = lerp(H * 0.42, H * 0.26, q);
      var c = D.ctx();

      /* the interior: a vector field all of whose arrows point inward */
      D.ctx().save();
      D.ctx().globalAlpha = clamp(a * 0.5, 0, 1);
      D.lw(1);
      D.strokeColour(rgba(PAL().hot, 0.30));
      var cols = 9, rows = 6;
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          var fx = (i / (cols - 1) - 0.5) * hw * 1.7;
          var fy = (j / (rows - 1) - 0.5) * hh * 1.7;
          /* unit vector pointing at the origin: confinement, drawn */
          var L = Math.hypot(fx, fy) || 1;
          var ux = -fx / L, uy = -fy / L;
          D.line(fx, fy, fx + ux * 22 * U, fy + uy * 22 * U);
          D.line(fx + ux * 22 * U, fy + uy * 22 * U,
                 fx + ux * 14 * U - uy * 5 * U, fy + uy * 14 * U + ux * 5 * U);
        }
      }
      D.ctx().restore();

      /* the walls */
      D.lw(2.2);
      D.strokeColour(rgba(PAL().hot, 0.85 * a));
      D.srect(-hw, -hh, hw * 2, hh * 2);
      /* the instrument that measures the closing */
      D.lw(1);
      D.strokeColour(rgba(PAL().accent, 0.5 * a));
      D.dim(-hw, hh + 40 * U, hw, hh + 40 * U, (hw * 2 / 10).toFixed(1) + ' u', 0, 13);

      /* one component already struck off, one still free */
      M.register('component x', 'CONSTRAINED', -W * 0.44, H * 0.30,
        { a: a, width: 300, colour: rgba(PAL().hot, 0.95) });
      M.register('component y', 'CONSTRAINED', -W * 0.44, H * 0.30 + 20,
        { a: a, width: 300, colour: rgba(PAL().hot, 0.95) });
      M.register('component z', q > 0.8 ? 'CONSTRAINED' : 'FREE',
        -W * 0.44, H * 0.30 + 40,
        { a: a, width: 300, colour: rgba(q > 0.8 ? PAL().hot : PAL().accent, 0.95) });
      M.register('volume', ((1 - q) * 100).toFixed(1) + '%', -W * 0.44, H * 0.30 + 60,
        { a: a, width: 300 });
    } },

    { l: 65, e: function (w, p) {
      var a = vis(p, 0.24);
      D.ctx().globalAlpha = a;
      D.font(52, '700');
      D.ctx().textAlign = 'center';
      D.ctx().textBaseline = 'middle';
      D.fillColour(rgba(PAL().hot, 0.95));
      D.text('I AM TRAPPED', 0, 0);
      D.ctx().globalAlpha = 1;
      D.ctx().textBaseline = 'alphabetic';
    } }
  ]);

  /* ==========================================================================
     03:10.801 — Trapped in                                    0.555 SECONDS

     THE SHORTEST CUE IN THE FILM. Half a second, which is not enough time to
     arrive, hold and leave — the earlier version tried to and measured at 16
     primitives, so the frame was effectively empty for the whole line.

     The fix is to stop treating it as a line of its own and treat it as what it
     is: a HINGE between "I am trapped" and "LO-O-OVE". The frame shows the two
     states on either side and the preposition as the joint between them, and
     the whole thing is on screen from the first frame because it does not need
     an entrance — it is a transition, and a transition should already be there.

     The void hole stays, but it is now the hinge gap rather than the subject.
     ======================================================================== */
  S('lv.trappedin', [
    { l: 24, e: function (w, p) {
      /* deliberately no long ramp: at 0.555 s an entrance would BE the line */
      var a = clamp(0.55 + 0.45 * vis(p, 0.10), 0, 1);
      var c = D.ctx();
      var y = 0;
      var xa = -W * 0.34, xb = W * 0.34;

      /* the two states either side, drawn as the boxes they were */
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.80 * a));
      D.srect(xa - 110 * U, y - 62 * U, 220 * U, 124 * U);
      D.lw(2);
      D.strokeColour(rgba(PAL().love, 0.80 * a));
      D.srect(xb - 110 * U, y - 62 * U, 220 * U, 124 * U);
      M.sub('I AM TRAPPED', xa, y + 6, { px: 17, a: a, weight: '700' });
      M.sub('LO-O-OVE', xb, y + 6,
        { px: 20, a: a, weight: '700', colour: rgba(EM.mix(PAL().love, PAL().paper, 0.45), 0.95) });

      /* THE HINGE: the joint between them, and the gap in it */
      D.lw(1.6);
      D.strokeColour(rgba(PAL().accent, 0.7 * a));
      D.line(xa + 110 * U, y, -90 * U, y);
      D.line(90 * U, y, xb - 110 * U, y);
      /* the pivot itself, turning */
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.85 * a));
      D.scircle(0, y, 30 * U);
      D.fillColour(rgba(PAL().accent, 0.9 * a));
      D.fcircle(0, y, 5 * U);
      var ang = -Math.PI / 2 + Math.sin(w.time * 3) * 0.5;
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.8 * a));
      D.line(0, y, Math.cos(ang) * 46 * U, y + Math.sin(ang) * 46 * U);

      /* the missing object of the preposition, as the gap in the joint */
      M.voidHole(0, y + 96 * U, 300 * U, 62 * U, 'the next word', { a: a * 0.9 });

      M.banner('TRAPPED IN', 0, -H * 0.34, { px: 30, a: a, track: 7 });
      M.sub('hinge  ·  holds for 0.555 s', -W * 0.44, H * 0.38,
        { px: 12, a: a * 0.7, align: 'left' });
      M.register('duration', '0.555 s', -W * 0.44, H * 0.42,
        { a: a, width: 260, colour: rgba(PAL().hot, 0.9) });
    } }
  ]);

  /* ==========================================================================
     03:11.356 —LO-O-OVE                          [kind 4 of 4: the heartbeat]
     The ending. Not a resolution: a loop. An irregular, noisy waveform that
     runs off both edges of the frame, with the machine's own condition
     reported beside it.
     ======================================================================== */
  S('lv.lo4', [
    { l: 25, e: function (w, p) {
      var a = vis(p, 0.16);
      var irregular = 0.35 + clamp(p, 0, 1) * 0.5;

      /* the trace, drawn by hand over a real signal: measured and unsteady at
         once, which is the point */
      D.lw(2.2);
      D.strokeColour(rgba(EM.mix(PAL().accent, PAL().love, 0.6), 0.9 * a));
      D.ekg(-W * 0.46, -20 * U, W * 0.92, 220 * U, w.time, irregular);

      /* a second, fainter copy, out of phase: two hearts, not one */
      D.lw(1.2);
      D.strokeColour(rgba(EM.mix(PAL().grid, PAL().love, 0.5), 0.4 * a));
      D.ekg(-W * 0.46, -20 * U, W * 0.92, 220 * U, w.time + 0.42, irregular * 1.4);

      /* the loop is explicit: the trace leaves the frame on both sides */
      D.lw(1);
      D.dash([6, 6]);
      D.strokeColour(rgba(PAL().grid, 0.4 * a));
      D.line(-W * 0.46, -20 * U, -W * 0.46, 200 * U);
      D.line(W * 0.46, -20 * U, W * 0.46, 200 * U);
      D.dash([]);
    } },

    { l: 55, e: function (w, p) {
      var a = vis(p, 0.16);
      D.ctx().globalAlpha = a;
      D.font(64, '700');
      D.ctx().textAlign = 'center';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(EM.mix(PAL().paper, PAL().love, 0.35), 0.95));
      D.text('LO-O-OVE', 0, -H * 0.30);
      D.ctx().globalAlpha = 1;

      /* the machine's condition, reported honestly, for the last time */
      M.register('struct', '0.03', -W * 0.44, H * 0.34, { a: a, width: 260 });
      M.register('warm', '0.86', -W * 0.44, H * 0.34 + 20, { a: a, width: 260 });
      M.register('love', '1.00', -W * 0.44, H * 0.34 + 40,
        { a: a, width: 260, colour: rgba(EM.mix(PAL().love, PAL().paper, 0.45), 0.95) });
      M.register('answer', 'none', W * 0.16, H * 0.34,
        { a: a, width: 260, colour: rgba(PAL().grid, 0.85) });
    } }
  ]);

  /* ==========================================================================
     03:13.460 - 03:25.811 — (instrumental — open loop)                12.35 s

     THE SAME TRANSITION LANGUAGE AS THE OPENING.

     The film established its instrumental treatment at 00:16: a machine
     visibly running while there is nothing to sing — rotating rings holding
     the middle of the frame, live function traces at the side, and a column of
     log lines scrolling past. That mechanism is now a shared motif in
     35_motifs.js, and this passage calls exactly the same three functions.

     Only the LOG is different, because only the situation is different. At
     00:16 the machine was starting up; here it is failing to terminate, and
     the entries say so.

     The lesson, after three discarded figures for this passage: when a film
     already has a language for a kind of moment, the second instance of that
     moment should SPEAK it, not invent a new one.
     ======================================================================== */
  S('inst.loop', [
    { l: 12, e: function (w, p) {
      var a = vis(p, 0.08);
      /* the same rotating assembly the opening uses, held slightly wider so
         the log column has room beside it */
      M.runningRings(w, w.time, a, { cx: -W * 0.14, cy: 0, base: 62, step: 46 });
    } },

    { l: 20, e: function (w, p) {
      var a = vis(p, 0.07);
      /* THE LOG. Same scroller, same cadence, different content: these are
         the lines a program prints when it cannot stop. */
      M.bootColumn(w, w.time, a, {
        t0: 193.460,
        x: W * 0.13,
        rowsPerSec: 5.2,
        pick: function (idx) { return loopLine(idx); },
        onsetFor: function (idx) { return EM.onsetNear(193.460 + idx / 5.2, 0.19); }
      });

      /* the iteration count, which is the only number still going up */
      var played = EM.WorldLayer.notesPlayed(w.time);
      var done = clamp((w.time - 193.460) / 12.35, 0, 1);
      M.gauge(-W * 0.44, -H * 0.46, W * 0.88, 5 * U, done,
        '', { a: a * 0.8, colour: rgba(PAL().accent, 0.7) });
      M.register('iterations', played, -W * 0.44, -H * 0.46 - 8,
        { a: a, width: 300, px: 11.5 });
      M.register('halt', 'NEVER', W * 0.20, -H * 0.46 - 8,
        { a: a, width: 300, px: 11.5, colour: rgba(PAL().hot, 0.95) });
    } },

    { l: 34, e: function (w, p) {
      var a = vis(p, 0.07);
      /* the same live function bank, moved to this passage's layout */
      M.functionBank(w, w.time, a, {
        x0: -W * 0.44, x1: -W * 0.10, y0: H * 0.30, hgt: 120
      });
    } },

    { l: 55, e: function (w, p) {
      var a = vis(p, 0.08);
      M.banner('OPEN LOOP', -W * 0.44, -H * 0.50,
        { px: 15, a: a * 0.85, align: 'left', track: 5 });

      /* the program, written out, with a cursor that never stops blinking */
      var code = 'while (true) { execute(self); }';
      var q = clamp(p / 0.4, 0, 1);
      D.font(20);
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(PAL().ink, 0.80 * a));
      D.text(code.slice(0, Math.ceil(code.length * q)), W * 0.06, H * 0.36);
      if (q >= 1) {
        var blink = Math.sin(w.time * 4) > 0 ? 1 : 0.12;
        D.fillColour(rgba(PAL().accent, 0.7 * a * blink));
        D.frect(W * 0.06 + D.measure(code, 20) + 5, H * 0.36 - 16, 10, 20);
      }
    } }
  ]);

  /* The log lines for the open-loop passage. Same voice as the boot log, but
     every entry is about a program that will not stop: attempts to halt,
     checks that pass and change nothing, and instructions repeated. Keyed to a
     row index so the same row always prints the same line and a seek
     reproduces the column exactly. */
  function loopLine(idx) {
    var pool = [
      'spin  waiting          no exit condition',
      'check termination      false',
      'check termination      false',
      'execute self           ok',
      'execute self           ok',
      'execute self           ok',
      'yield                  ignored',
      'poll  input            none',
      'poll  input            none',
      'recurse depth          1',
      'recurse depth          1',
      'accumulate             unbounded',
      'hash  state            identical',
      'compare to last        identical',
      'compare to first       identical',
      'gc    collect          nothing to free',
      'sleep 0                no effect',
      'raise signal           unhandled',
      'log   progress         0.0000',
      '...',
      '...',
      '...'
    ];
    return pool[Math.abs((idx * 2654435761) ^ (idx * 40503)) % pool.length];
  }

  /* ==========================================================================
     03:25.811 - 03:31.984 — EXECUTION (the last one)                    6.17 s

     THE LAST SHOT. It runs to the end of the film.

     The cue is 0.81 s long, but the `outro` cue after it is a HELD
     placeholder with no plate of its own, so 20_lyrics.js gives its time to
     this one: the span is 03:25.811 to 03:31.984.

     ON THE EXACT CENTRE OF THE FRAME. Eighteen executions were rammed,
     stamped, rasterised and burned into this film; the nineteenth is written
     quietly at the origin, level, with nothing beside it, and then it simply
     stays there. That is what makes it read as the machine having stopped
     decorating and executed once more, and then stopped.

     The timing is built for the LONG span, not the short cue: the entrance is
     compressed into the first eighth and the exit into the last sixth, and
     everything between HOLDS. A plate written for 0.8 s would fade in, start
     leaving, and sit half-faded for four seconds.
     ======================================================================== */
  S('ex.final', [
    /* the crosshair that marks the centre of the picture. It draws itself in
       over the first two seconds and then stays put. */
    { l: 22, e: function (w, p) {
      var a = vis(p, 0.10);
      var q = E.outCubic(clamp(p / 0.14, 0, 1));
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.30 * a * q));
      var arm = 250 * U * q;
      D.line(-arm, 0, -54 * U, 0);
      D.line(54 * U, 0, arm, 0);
      D.line(0, -arm * 0.62, 0, -44 * U);
      D.line(0, 44 * U, 0, arm * 0.62);
      /* four corner ticks: the centre being measured, not merely occupied */
      for (var sx = -1; sx <= 1; sx += 2) {
        for (var sy = -1; sy <= 1; sy += 2) {
          var cx0 = sx * 236 * U, cy0 = sy * 132 * U;
          D.lw(1.4);
          D.strokeColour(rgba(PAL().accent, 0.45 * a * q));
          D.line(cx0, cy0, cx0 - sx * 30 * U, cy0);
          D.line(cx0, cy0, cx0, cy0 - sy * 30 * U);
        }
      }
    } },

    /* THE WORD. In at the top of the shot, out at the very end, holding in
       between. It is the only thing allowed inside the middle third. */
    { l: 34, e: function (w, p) {
      var a = vis(p, 0.10);
      /* the entrance: settled by 8% of a 6.17 s shot */
      var pop = E.pop(clamp(p / 0.06, 0, 1));
      /* the exit: only in the last sixth, so it is still fully present while
         the shot is holding, and it leaves rather than being cut */
      var down = 1 - E.outCubic(clamp((p - 0.84) / 0.16, 0, 1)) * 0.55;
      D.ctx().save();
      D.ctx().globalAlpha = a * down;
      D.ctx().scale(lerp(1.06, 1.0, pop), lerp(1.06, 1.0, pop));
      /* 132 px, not 70. At 70 the word measured 211 px on a 1600 px stage —
         under a fifth of the width — which is a caption, not a last word. This
         is the final shot of the film and the word is the entire subject of it,
         so it takes half the frame and the crosshair is sized around it. */
      D.font(132, '700');
      D.ctx().textAlign = 'center';
      D.ctx().textBaseline = 'middle';
      var tw = D.measure('EXECUTION', 132, '700');
      D.fillColour(rgba(PAL().ink, 0.95));
      D.text('EXECUTION', 0, 0);
      /* the rule through it breathes with the note, slowly, so the held shot
         is alive rather than frozen */
      var beat = EM.onsetPulse(w.time, 0.6);
      D.lw(1 + beat * 0.8);
      D.strokeColour(rgba(PAL().hot, (0.42 + beat * 0.35) * a * down));
      D.line(-tw / 2 - 36 * U, 0, tw / 2 + 36 * U, 0);
      D.ctx().restore();
    } },

    /* the read-outs stay at the frame edge: nothing is allowed inside the
       middle third except the word */
    { l: 52, e: function (w, p) {
      var a = vis(p, 0.10);
      M.register('call', EM.WorldLayer.notesPlayed(w.time), -W * 0.46, -H * 0.42,
        { a: a, width: 250, px: 12.5 });
      M.register('of', EM.ONSETS.length, -W * 0.46, -H * 0.42 + 20,
        { a: a, width: 250, px: 12.5 });
      M.register('identical to every other', 'yes', -W * 0.46, H * 0.40,
        { a: a, width: 320, px: 12.5, colour: rgba(PAL().grid, 0.85) });
      M.banner('NOTHING HAS CHANGED', 0, H * 0.30,
        { px: 13, a: a * 0.45, track: 4 });

      /* the closing wash: over the last two seconds the frame settles toward
         warm paper, so the film ends by cooling rather than by stopping */
      var wash = clamp((p - 0.66) / 0.34, 0, 1);
      if (wash > 0.01) {
        D.ctx().save();
        D.ctx().globalAlpha = wash * 0.13;
        D.fillColour(rgba(EM.mix(PAL().paper, PAL().accent, 0.22), 1));
        D.frect(-W / 2, -H / 2, W, H);
        D.ctx().restore();
      }
    } }
  ]);

  /* ==========================================================================
     03:31.984 — the last frame

     `end` sits on the final timestamp and has a duration of zero, so only the
     very last frame reaches it. It draws the one mark in the film that a
     machine did not make, and it draws it rather than presenting it.
     NOTE the parameter is `prog`, not `p`: `p` would shadow PAL().
     ======================================================================== */
  S('end', [
    { l: 40, e: function (w, prog) {
      var a = clamp(1 - prog * 0.28, 0.65, 1);
      var grow = E.outCubic(clamp(prog / 0.55, 0, 1));
      var xa = lerp(0, -W * 0.30, grow), xb = lerp(0, W * 0.30, grow);
      M.handCurve([
        [xa, 30], [lerp(xa, xb, 0.33), 18], [lerp(xa, xb, 0.66), 26], [xb, 14]
      ], 1.414, {
        wobble: 3.4, width: 2.0,
        colour: rgba(EM.mix(PAL().paper, PAL().accent, 0.30), 0.85 * a)
      });
      D.ctx().globalAlpha = a * 0.85;
      D.font(18);
      D.ctx().textAlign = 'center';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(EM.mix(PAL().paper, PAL().grid, 0.40), 0.85));
      D.text('world.execute(me);', 0, 68 * U);
      D.ctx().globalAlpha = 1;
    } }
  ]);

})(window.EM);
