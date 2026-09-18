/* ============================================================================
   src/32_annotate.js — LAYER 2 — the machine's own annotations.

   THE PROBLEM THIS SOLVES
   -----------------------
   A film made of 131 separate line-plates has a failure mode: if a plate is
   quiet, or a line is short, the frame goes still and empty. Measured, the
   worst offenders were only 12-19 primitives for nearly their whole duration —
   the eye reads that as a hole in the film.

   The fix is not to make every plate louder (that produces clutter, which is
   the opposite fault). It is to give the frame a FLOOR: a layer that is always
   moving, always subordinate, and never competes with the subject.

   ---------------------------------------------------------------------------
   EVERY NUMBER ON THIS LAYER IS REAL
   ---------------------------------------------------------------------------
   An earlier version drew four corner registers whose values were arbitrary
   clocks and a gutter full of falling numerals that meant nothing. They moved,
   but they were decoration pretending to be instrumentation, and that is worse
   than nothing — it teaches the viewer to stop reading the numbers.

   So every figure here is computed from something true, and labelled with the
   unit it is in:

     T          the film clock, in seconds                     (from t)
     BEAT       which note of the 615 has sounded              (EM.beatAt)
     TEMPO      the measured local period, in BPM              (EM.beatPeriod)
     PITCH      the pitch of the note sounding right now       (EM.onsetNear)
     VEL        its velocity, 0-127, as recorded in the MIDI
     ORDER      the world's `struct` parameter, 1 -> 0
     D(dt)      a real finite difference of that parameter: the world's rate of
                decay per second, which is genuinely informative and changes
                every frame because the keyframe curve is non-linear
     ENTROPY    the world's `chaos` parameter
     LOVE       the variable, which the machine is not supposed to have
     LINE       progress through the current lyric, 0-100%, which is the one
                number that ties the annotation to the plate

   The top rail cycles a real function, evaluated, with its value printed. The
   side rules are a beat ruler in seconds. The bottom rail plots the actual
   pitch of the last five seconds of notes.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var D = EM.D, E = EM.E, TAU = EM.TAU;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba;
  var hash = EM.hash, noise = EM.noise2;

  var W = 1600, H = 900, U = 1;
  function PAL() { return EM.__pal; }

  var M = null;                      /* EM.M, resolved on first use */

  /* --------------------------------------------------------------------------
     A drifting function read-out. The functions are actually evaluated at t,
     so the numbers are live rather than decorative.
     ------------------------------------------------------------------------ */
  var FN = [
    { s: 'sin(t)',      u: '',   f: function (t) { return Math.sin(t); } },
    { s: 'cos(t/2)',    u: '',   f: function (t) { return Math.cos(t / 2); } },
    { s: 'tanh(t/60)',  u: '',   f: function (t) { return Math.tanh(t / 60); } },
    { s: 'exp(-t/40)',  u: '',   f: function (t) { return Math.exp(-t / 40); } },
    { s: 'log1p(t)',    u: '',   f: function (t) { return Math.log1p(t); } },
    { s: 'sqrt(t)',     u: '',   f: function (t) { return Math.sqrt(t); } },
    { s: '1-e^-t/20',   u: '',   f: function (t) { return 1 - Math.exp(-t / 20); } },
    { s: 'atan(t/30)',  u: '',   f: function (t) { return Math.atan(t / 30); } },
    { s: 'sin(t)cos(t)',u: '',   f: function (t) { return Math.sin(t) * Math.cos(t); } }
  ];

  function topRail(w, t) {
    var a = 0.34;
    var y = -H / 2 + 28;
    var x0 = -W * 0.44;
    var slot = t / 3.0, local = slot % 1;
    var n = FN.length;
    var i = ((Math.floor(slot) % n) + n) % n, j = (i + 1) % n;

    /* the hairline */
    D.lw(1);
    D.strokeColour(rgba(PAL().grid, 0.20 * a));
    D.line(x0, y + 15, W * 0.44, y + 15);

    /* a caret running the rail, brightening on every real accent */
    var beat = EM.onsetPulse(t, 0.30);
    var cx = x0 + ((t * 58) % (W * 0.88));
    D.lw(1.2);
    D.strokeColour(rgba(PAL().accent, (0.10 + beat * 0.24) * a));
    D.line(cx, y + 11, cx, y + 20);

    D.font(12.5);
    D.ctx().textAlign = 'left';
    D.ctx().textBaseline = 'alphabetic';

    var out = (1 - local) * (1 - local);
    if (out > 0.02) {
      D.ctx().globalAlpha = a * out;
      D.fillColour(rgba(PAL().grid, 0.95));
      D.text('f(t) = ' + FN[i].s + ' = ' + FN[i].f(t).toFixed(5), x0 + 2, y);
      D.ctx().globalAlpha = 1;
    }
    var inn = clamp(local * 1.6 - 0.4, 0, 1);
    if (inn > 0.02) {
      D.ctx().globalAlpha = a * inn;
      D.fillColour(rgba(PAL().grid, 0.95));
      D.text('f(t) = ' + FN[j].s + ' = ' + FN[j].f(t).toFixed(5), x0 + 2, y);
      D.ctx().globalAlpha = 1;
    }

    /* domain, and the one thing that never changes */
    D.ctx().textAlign = 'right';
    D.fillColour(rgba(PAL().grid, 0.50 * a));
    D.text('t in [0, ' + EM.AUDIO_END.toFixed(5) + '] s   f_s = ' +
      EM.AUDIO_RATE + ' Hz', W * 0.44, y);
    D.ctx().textAlign = 'left';
  }

  /* --------------------------------------------------------------------------
     Side rules: a beat ruler in real time. One tick per measured note onset,
     labelled every fourth tick with the actual second it falls on. The ruler
     therefore stays in time with the music rather than with a fixed grid.
     ------------------------------------------------------------------------ */
  function sideScales(w, t) {
    var a = 0.30;
    var span = H * 0.60;
    var y0 = -span / 2;
    var window = 9.0;                      /* seconds visible on the rule */

    for (var side = -1; side <= 1; side += 2) {
      var x = side * W * 0.466;
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.26 * a));
      D.line(x, y0, x, y0 + span);

      var arr = EM.onsetsBetween(t - window / 2, t + window / 2);
      for (var k = 0; k < arr.length; k++) {
        var nt = arr[k][0] / 1000;
        var u = (nt - (t - window / 2)) / window;
        if (u < 0 || u > 1) continue;
        var yy = y0 + u * span;
        var isBar = (k % 4 === 0);
        var dist = Math.abs(nt - t);
        var al = (1 - dist / (window / 2)) * (isBar ? 0.85 : 0.45) * a;
        D.lw(isBar ? 1.4 : 1);
        D.strokeColour(rgba(PAL().accent, al));
        D.line(x, yy, x - side * (isBar ? 15 : 7) * U, yy);
        if (isBar) {
          D.font(10);
          D.ctx().textAlign = side < 0 ? 'left' : 'right';
          D.fillColour(rgba(PAL().grid, al * 1.4));
          D.text(nt.toFixed(2) + 's', x + side * 8 * U, yy + 3.5);
        }
      }
      /* the playhead on the ruler, which is where the film is right now */
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.55 * a));
      var my = y0 + span / 2;
      D.line(x, my, x - side * 20 * U, my);
    }
    D.ctx().textAlign = 'left';
  }

  /* --------------------------------------------------------------------------
     THE REGISTER BLOCK. Four labelled read-outs, every value real and unit-ed.
     This replaces the meaningless ticking numbers the film used to show.
     ------------------------------------------------------------------------ */
  function registers(w, t, cue) {
    var a = 0.40;
    var px = 11.5;
    var x = -W * 0.44;
    var y0 = -H * 0.42;

    var near = EM.onsetNear(t, 0.5);
    var per = EM.beatPeriod(t, 0.4615);
    var bpm = 60 / per;

    /* the world's rate of decay, as a real finite difference of the keyframe
       curve — genuinely different every frame because the curve is not linear */
    var h = 0.05;
    var wAhead = EM.World.at(Math.min(EM.AUDIO_END, t + h));
    var dStruct = (wAhead.struct - w.struct) / h;

    /* SEVEN ROWS, NOT TEN.

       At ten rows plus a mirrored block of ten, the annotation layer was putting
       two dense columns of small type down both edges of EVERY frame. Measured
       on a rendered frame it read as noise: the margins were a wall of digits
       while the middle of the picture sat empty, and the eye had nowhere to
       land. The values below are the ones that actually get read; the rest were
       filling space. */
    var rows = [
      ['T',        t.toFixed(3),                    's'],
      ['BEAT',     String(EM.beatAt(t)).padStart(4, '0'), '/ ' + EM.ONSETS.length],
      ['TEMPO',    bpm.toFixed(2),                  'BPM'],
      ['PITCH',    near ? String(near.lo) + (near.hi > near.lo ? '-' + near.hi : '') : '--', 'midi'],
      ['ORDER',    w.struct.toFixed(4),             '1->0'],
      ['D(dt)',    (dStruct >= 0 ? '+' : '') + dStruct.toFixed(5), '/s'],
      ['LOVE',     w.love.toFixed(4),               '']
    ];

    D.font(px);
    D.ctx().textAlign = 'left';
    D.ctx().textBaseline = 'alphabetic';
    for (var i = 0; i < rows.length; i++) {
      var y = y0 + i * 15.5;
      D.fillColour(rgba(PAL().grid, 0.55 * a));
      D.text(rows[i][0], x, y);
      var lw0 = D.measure(rows[i][0], px);
      var isLove = rows[i][0] === 'LOVE';
      D.fillColour(rgba(isLove ? PAL().love : PAL().accent, 0.88 * a));
      D.text(rows[i][1], x + 62, y);
      if (rows[i][2]) {
        D.fillColour(rgba(PAL().grid, 0.42 * a));
        D.text(rows[i][2], x + 128, y);
      }
    }

    /* the mirrored block carries the ACCENT side of the same story — the notes
       themselves rather than the world's reaction to them. Five rows, not ten. */
    var xr = W * 0.44;
    var rowsR = [
      ['ONSETS',  String(EM.ONSETS.length)],
      ['PLAYED',  String(EM.WorldLayer.notesPlayed(t))],
      ['VEL',     near ? String(near.vel) : '--'],
      ['VOICES',  near ? String(near.voices) : '--'],
      ['SHELL',   '2']
    ];
    for (i = 0; i < rowsR.length; i++) {
      var yr = y0 + i * 15.5;
      var val = rowsR[i][1];
      D.font(px);
      D.ctx().textAlign = 'right';
      D.fillColour(rgba(PAL().accent, 0.80 * a));
      D.text(val, xr, yr);
      var vw = D.measure(val, px);
      D.fillColour(rgba(PAL().grid, 0.50 * a));
      D.text(rowsR[i][0], xr - vw - 9, yr);
    }
    D.ctx().textAlign = 'left';
  }

  /* --------------------------------------------------------------------------
     The bottom rail: the actual pitch of the last few seconds, as stems. Real
     note data, so it moves with the music rather than with a timer.
     ------------------------------------------------------------------------ */
  function signalTrail(w, t) {
    var a = 0.36;
    var y0 = H * 0.452;
    var span = 5.0;
    var x0 = -W * 0.44, x1 = W * 0.44;

    D.lw(1);
    D.strokeColour(rgba(PAL().grid, 0.24 * a));
    D.line(x0, y0, x1, y0);

    var arr = EM.onsetsBetween(t - span, t + 0.01);
    for (var i = 0; i < arr.length; i++) {
      var u = (arr[i][0] / 1000 - (t - span)) / span;
      var x = lerp(x0, x1, u);
      var hgt = ((arr[i][2] - 52) / 22) * 18 * U + 5 * U;
      var age = (t - arr[i][0] / 1000) / span;
      var al = (1 - age) * 0.8;
      D.lw(1.3);
      D.strokeColour(rgba(PAL().accent, al * a));
      D.line(x, y0, x, y0 - hgt);
      if (arr[i][3] > 1) {
        D.fillColour(rgba(PAL().hot, al * a));
        D.dot(x, y0 - hgt, 2.0);
      }
    }
    D.lw(1.4);
    var live = EM.onsetPulse(t, 0.3);
    D.strokeColour(rgba(PAL().hot, (0.3 + live * 0.6) * a));
    D.line(x1, y0 - 22 * U, x1, y0 + 4);

    /* label the axis honestly */
    D.font(10);
    D.ctx().textAlign = 'left';
    D.fillColour(rgba(PAL().grid, 0.42 * a));
    D.text('pitch  midi 52-74   window ' + span.toFixed(1) + 's', x0, y0 + 22 * U);
    D.ctx().textAlign = 'right';
    D.fillColour(rgba(PAL().grid, 0.42 * a));
    D.text('now = ' + t.toFixed(3) + 's', x1, y0 + 22 * U);
    D.ctx().textAlign = 'left';
  }

  /* --------------------------------------------------------------------------
     A row of beat pips under the top rail: one lights on each real accent.
     ------------------------------------------------------------------------ */
  function pips(w, t) {
    var a = 0.44;
    var n = 16;
    var y = -H / 2 + 44;
    var wd = 7 * U, gap = 5 * U;
    var total = n * wd + (n - 1) * gap;
    var x0 = -total / 2;
    var beat = EM.beatAt(t);

    for (var i = 0; i < n; i++) {
      var idx = beat - 1 - (n - 1 - i);
      var on = 0;
      if (idx >= 0 && idx < EM.ONSETS.length) {
        var age = t - EM.ONSETS[idx][0] / 1000;
        on = clamp(1 - age / 0.55, 0, 1);
      }
      var x = x0 + i * (wd + gap);
      D.fillColour(rgba(on > 0.02 ? PAL().hot : PAL().grid,
        (on > 0.02 ? (0.25 + on * 0.7) : 0.14) * a));
      D.frect(x, y - on * 3 * U, wd, 3.4 * U + on * 3 * U);
    }
  }

  /* --------------------------------------------------------------------------
     A small harmonic analyser in the right gutter: fifteen partials of a
     standing wave, each drawn as its own bar at its own amplitude, all of them
     animated. This is geometry rather than numerals, which is what the film
     wants in its margins — and it is a real series being summed, not noise.
     ------------------------------------------------------------------------ */
  function harmonics(w, t) {
    var a = 0.30;
    var n = 15;
    var x = W * 0.408;
    var y0 = H * 0.05;
    var bw = 5 * U, gap = 4 * U;
    D.font(10);
    for (var k = 1; k <= n; k++) {
      var amp = 1 / k;
      var phase = Math.sin(t * 1.5 * k + k * 0.7);
      var hgt = (amp * 0.5 + 0.5 * amp * phase) * 74 * U;
      var y = y0 + (k - 1) * (bw + gap);
      D.fillColour(rgba(PAL().accent, (0.10 + amp * 0.30) * a));
      D.frect(x, y, Math.max(1, hgt), bw);
      D.fillColour(rgba(PAL().grid, 0.40 * a));
      D.ctx().textAlign = 'right';
      D.text('n=' + k, x - 8 * U, y + bw - 1);
    }
    D.ctx().textAlign = 'right';
    D.fillColour(rgba(PAL().grid, 0.52 * a));
    D.text('harmonic series', x, y0 - 8 * U);
    D.ctx().textAlign = 'left';
  }

  /* ==========================================================================
     MAIN — called every frame from 30_world.js before the plate is drawn.
     `dim` scales the whole layer down during the loudest passages so the
     annotation never competes with the storm.
     ======================================================================== */
  function draw(w, t, dim, cue) {
    var d = dim === undefined ? 1 : dim;
    if (d <= 0.02) return;
    if (!M) M = EM.M;
    var ctx = D.ctx();
    ctx.save();
    D.comp('source-over');
    /* every element is scaled by the same subordination factor */
    ctx.globalAlpha = d;
    pips(w, t);
    topRail(w, t);
    sideScales(w, t);
    registers(w, t, cue);
    signalTrail(w, t);
    if (d > 0.35) harmonics(w, t);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  EM.Annotate = { draw: draw, FN: FN };
})(window.EM);
