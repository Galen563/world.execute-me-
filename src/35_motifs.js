/* ============================================================================
   src/35_motifs.js — the shared subject matter.

   Every plate is its own picture, but the film has to feel like one hand drew
   it. This file is the vocabulary that makes that true: the marks this machine
   uses when it draws, and the four or five ideas the song keeps returning to.

   THE MACHINE'S MARKS
     banner    a line of text where the frame puts its own labels
     sub       a subordinate annotation
     keyword   a lyric word set as a printed object, not a caption
     register  a register read-out, the machine talking about itself
     gauge     a bar with a value under it
     callout   a leader line to a feature with a label
     wire      the machine's trace as analytic line-work

   THE IDEAS
     fracture  a shape with a crack through it, the film's signature of
               breaking without falling apart
     handCurve a line drawn by hand with visible hesitation, replacing the
               parametric geometry at the moment the machine stops calculating
     voidHole  an absence: somewhere a value should be, and is not

   Plates are written in terms of these, so a new plate is a composition of
   understood parts rather than a fresh 60 lines of canvas calls.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var D = EM.D, E = EM.E, TAU = EM.TAU;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var W = 1600, H = 900, U = 1;

  function bindStage() { var s = D.size(); W = s.w; H = s.h; U = 1; }

  /* ==========================================================================
     TEXT
     ======================================================================== */

  /* The frame's own voice: tracked monospace, small, upper case. This is the
     machine annotating its own output. */
  function banner(s, x, y, opt) {
    opt = opt || {};
    var px = opt.px || 15;
    var a = opt.a === undefined ? 1 : opt.a;
    if (a <= 0.004) return 0;
    D.lw(1);
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.fillColour(opt.colour || (EM.__pal ? EM.__pal.accentCSS : '#56d6e8'));
    var w = D.spaced(s, x, y, px, opt.track === undefined ? px * 0.32 : opt.track,
      opt.align || 'center');
    if (opt.rule) {
      var hw = w / 2;
      D.strokeColour(rgba(EM.__pal ? EM.__pal.grid : [60, 90, 110], 0.5 * a));
      D.line(x - hw, y + 7, x + hw, y + 7);
    }
    D.ctx().globalAlpha = prev;
    return w;
  }

  /* subordinate annotation: asides, units, values, hints */
  function sub(s, x, y, opt) {
    opt = opt || {};
    var px = opt.px || 13;
    var a = opt.a === undefined ? 1 : opt.a;
    if (a <= 0.004) return;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.font(px, opt.weight, opt.family);
    D.fillColour(opt.colour || rgba(EM.__pal ? EM.__pal.grid : [70, 100, 124], 0.95));
    D.text(s, x, y, opt.align || 'center', opt.baseline);
    D.ctx().globalAlpha = prev;
  }

  /* A lyric word as a printed OBJECT: the thing the line is about, given a
     body, a title and a measured dimension. Using this everywhere is what
     keeps the film from looking like subtitles on top of wallpaper. */
  function keyword(word, cx, cy, opt) {
    opt = opt || {};
    var a = opt.a === undefined ? 1 : opt.a;
    if (a <= 0.004) return { w: 0, h: 0 };
    var px = opt.px || 76;
    var track = opt.track === undefined ? px * 0.06 : opt.track;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);

    var w = D.measure(word, px, opt.weight);
    var h = px;
    var x0 = opt.align === 'left' ? cx : (opt.align === 'right' ? cx - w : cx - w / 2);
    var y = cy + px * 0.34;

    if (opt.fill) {
      D.fillColour(opt.fill);
      D.font(px, opt.weight);
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';
      D.text(word, x0, y);
    }
    if (opt.stroke) {
      D.strokeColour(opt.stroke);
      D.lw(opt.strokeW || 1.6);
      D.font(px, opt.weight);
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';
      D.textStroke(word, x0, y);
    }
    if (opt.measure) {
      D.lw(1);
      D.strokeColour(rgba(EM.__pal ? EM.__pal.accent : [86, 214, 232], 0.5 * a));
      D.line(x0, y + 12, x0 + w, y + 12);
      sub((opt.measureLabel || (w / 10).toFixed(1) + ' u'), x0 + w / 2, y + 30,
        { px: 12, a: a * 0.8 });
    }
    if (opt.bracket) {
      D.lw(1);
      D.strokeColour(rgba(EM.__pal ? EM.__pal.accent : [86, 214, 232], 0.42 * a));
      D.bracket(x0 - 14, cy - h * 0.62, w + 28, h * 1.16, 16);
    }
    D.ctx().globalAlpha = prev;
    return { w: w, h: h, x0: x0, y: y };
  }

  /* the machine's self-report: NAME  value  unit */
  function register(name, value, x, y, opt) {
    opt = opt || {};
    var a = opt.a === undefined ? 1 : opt.a;
    if (a <= 0.004) return;
    var px = opt.px || 13;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    var pal = EM.__pal;
    D.font(px);
    D.ctx().textAlign = 'left';
    D.ctx().textBaseline = 'alphabetic';
    D.fillColour(rgba(pal ? pal.grid : [70, 100, 124], 0.85));
    D.text(name.toUpperCase(), x, y);
    var nw = D.measure(name.toUpperCase(), px);
    D.fillColour(opt.colour || rgba(pal ? pal.accent : [86, 214, 232], 0.95));
    var ss = String(value);
    D.text(ss, x + nw + 8, y);
    if (opt.unit) {
      var vw = D.measure(ss, px);
      D.fillColour(rgba(pal ? pal.grid : [70, 100, 124], 0.7));
      D.text(opt.unit, x + nw + 14 + vw, y);
    }
    /* dotted leader to the value: makes it read as a table row */
    if (opt.dots !== false) {
      D.dash([1, 3]);
      D.lw(1);
      D.strokeColour(rgba(pal ? pal.grid : [70, 100, 124], 0.4 * a));
      var total = opt.width || 150;
      D.line(x + nw + 6, y - 3, x + total, y - 3);
      D.dash([]);
    }
    D.ctx().globalAlpha = prev;
  }

  /* a labelled bar with its value printed under it */
  function gauge(x, y, w, h, v, label, opt) {
    opt = opt || {};
    var a = opt.a === undefined ? 1 : opt.a;
    if (a <= 0.004) return;
    var pal = EM.__pal;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.lw(1);
    D.strokeColour(rgba(pal ? pal.grid : [70, 100, 124], 0.6));
    D.srect(x, y, w, h);
    v = clamp(v, 0, 1);
    D.fillColour(opt.colour || rgba(pal ? pal.accent : [86, 214, 232], 0.85));
    D.frect(x + 1, y + 1, (w - 2) * v, h - 2);
    /* segment ticks */
    D.strokeColour(rgba([3, 5, 10], 0.55));
    for (var i = 1; i < 8; i++) D.line(x + w * i / 8, y + 1, x + w * i / 8, y + h - 1);
    if (label) sub(label, x, y + h + 14, { px: opt.px || 12, a: a * 0.85, align: 'left' });
    D.ctx().globalAlpha = prev;
  }

  /* leader line from a feature out to a label — the signature "this is being
     inspected" mark */
  function callout(x, y, tx, ty, label, opt) {
    opt = opt || {};
    var a = opt.a === undefined ? 1 : opt.a;
    if (a <= 0.004) return;
    var pal = EM.__pal;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.lw(1);
    D.strokeColour(rgba(pal ? pal.accent : [86, 214, 232], 0.55 * a));
    var kx = tx + (tx >= x ? 26 : -26);
    D.line(x, y, kx, ty);
    D.line(kx, ty, kx + (tx >= x ? 46 : -46), ty);
    D.dot(x, y, 2.2, rgba(pal ? pal.hot : [232, 62, 54], 0.9 * a));
    D.font(opt.px || 12);
    D.ctx().textAlign = tx >= x ? 'left' : 'right';
    D.ctx().textBaseline = 'middle';
    D.fillColour(rgba(pal ? pal.ink : [228, 242, 250], 0.9 * a));
    D.text(label, kx + (tx >= x ? 7 : -7), ty - 9);
    D.ctx().globalAlpha = prev;
  }

  /* ==========================================================================
     THE IDEAS
     ======================================================================== */

  /* A crack through a shape: one line that starts at the edge, kinks its way
     across, and leaves the thing still recognisable. The film's signature of
     breaking without falling apart — so it can be used at 00:49 on a sine wave
     and at 02:04 on a condition diamond and read as the same event. */
  function fracture(cx, cy, r, seed, opt) {
    opt = opt || {};
    var segs = opt.segs || 6;
    var pal = EM.__pal;
    var pts = [[cx + Math.cos(opt.angle || 0) * r, cy + Math.sin(opt.angle || 0) * r]];
    var ang = (opt.angle || 0) + Math.PI;
    var px = pts[0][0], py = pts[0][1];
    for (var i = 0; i < segs; i++) {
      ang += (hash(Math.floor(seed * 9973) + i * 131) - 0.5) * 0.9;
      var len = r * 2 / segs * (0.7 + hash(Math.floor(seed * 313) + i * 71) * 0.7);
      px += Math.cos(ang) * len;
      py += Math.sin(ang) * len;
      pts.push([px, py]);
    }
    D.lw(opt.width || 1.6);
    D.strokeColour(opt.colour || rgba(pal ? pal.hot : [232, 62, 54], 0.85));
    D.ctx().beginPath();
    for (var k = 0; k < pts.length; k++) {
      if (k === 0) D.ctx().moveTo(pts[k][0], pts[k][1]);
      else D.ctx().lineTo(pts[k][0], pts[k][1]);
    }
    D.ctx().stroke();
    /* the two walls of the crack, so it has thickness */
    if (opt.wide !== false) {
      D.lw((opt.width || 1.6) * 0.6);
      D.strokeColour(rgba(pal ? pal.hot : [232, 62, 54], 0.4));
      D.ctx().beginPath();
      for (k = 0; k < pts.length; k++) {
        var off = 3.5;
        if (k === 0) D.ctx().moveTo(pts[k][0] + off, pts[k][1] - off);
        else D.ctx().lineTo(pts[k][0] + off, pts[k][1] - off);
      }
      D.ctx().stroke();
    }
    return pts;
  }

  /* A line drawn by a hand that is not a machine. This is reserved for the
     last act: everything before it is measured, and this is the first thing in
     the film that is not. Amp and hesitation are arguments, not constants. */
  function handCurve(pts, seed, opt) {
    opt = opt || {};
    var pal = EM.__pal;
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var wob = (hash(Math.floor(seed * 7717) + i * 313) - 0.5) * 2 * (opt.wobble || 4);
      var wob2 = (hash(Math.floor(seed * 4421) + i * 977) - 0.5) * 2 * (opt.wobble || 4) * 0.6;
      out.push([pts[i][0] + wob, pts[i][1] + wob2]);
    }
    D.lw(opt.width || 1.8);
    D.strokeColour(opt.colour || rgba(pal ? pal.accent : [86, 214, 232], 0.85));
    D.smoothStroke(out, 8);
    return out;
  }

  /* An absence. Somewhere a value should be and is not: a dashed outline with
     nothing inside it, and a label saying what is missing. Used for every
     "you have left" and for the variable that evaluates to undefined. */
  function voidHole(cx, cy, w, h, label, opt) {
    opt = opt || {};
    var a = opt.a === undefined ? 1 : opt.a;
    if (a <= 0.004) return;
    var pal = EM.__pal;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.lw(1.3);
    D.dash([5, 5]);
    D.strokeColour(rgba(pal ? pal.grid : [70, 100, 124], 0.85));
    D.srect(cx - w / 2, cy - h / 2, w, h);
    D.dash([]);
    /* the corners are marked, so it reads as a slot rather than a box */
    D.lw(1.6);
    D.strokeColour(rgba(pal ? pal.accent : [86, 214, 232], 0.5 * a));
    var s = Math.min(w, h) * 0.18;
    D.bracket(cx - w / 2, cy - h / 2, w, h, s);
    if (label) {
      sub(label, cx, cy + h / 2 + 22, { px: opt.px || 13, a: a * 0.9 });
    }
    D.ctx().globalAlpha = prev;
  }

  /* ==========================================================================
     TRACES — the machine's analytic line-work, three flavours
     ======================================================================== */

  /* a smooth analytic function sampled across the stage */
  function trace(fn, opt) {
    opt = opt || {};
    var pal = EM.__pal;
    var x0 = opt.x0 === undefined ? -W * 0.46 : opt.x0;
    var x1 = opt.x1 === undefined ? W * 0.46 : opt.x1;
    var n = opt.n || 128;
    var c = D.ctx();
    D.lw(opt.width || 1.4);
    D.strokeColour(opt.colour || rgba(pal ? pal.accent : [86, 214, 232], 0.75));
    c.beginPath();
    for (var i = 0; i <= n; i++) {
      var u = i / n;
      var x = lerp(x0, x1, u);
      var y = fn(u, x);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    return c;
  }

  /* a sampled series drawn as data points with stems — the machine plotting */
  function stemPlot(vals, x0, y0, step, scale, opt) {
    opt = opt || {};
    var pal = EM.__pal;
    D.lw(1.4);
    D.strokeColour(opt.colour || rgba(pal ? pal.accent : [86, 214, 232], 0.8));
    var c = D.ctx();
    c.beginPath();
    for (var i = 0; i < vals.length; i++) {
      var x = x0 + i * step;
      var y = y0 - vals[i] * scale;
      c.moveTo(x, y0);
      c.lineTo(x, y);
    }
    c.stroke();
    D.fillColour(rgba(pal ? pal.hot : [232, 62, 54], 0.9));
    for (i = 0; i < vals.length; i++) {
      D.dot(x0 + i * step, y0 - vals[i] * scale, 1.9);
    }
  }

  /* the film's faint background register, drawn behind the content so the
     frame always reads as a running machine even in a quiet moment */
  function registerBed(w, t, opt) {
    opt = opt || {};
    var pal = EM.__pal;
    var a = (opt.a === undefined ? 1 : opt.a) * 0.35;
    var rows = opt.rows || 6;
    register('t', t.toFixed(3), -W / 2 + 30, H / 2 - 30 - (rows - 1) * 18,
      { a: a, width: 190, px: 12 });
    register('struct', (w ? w.struct : 0).toFixed(3), -W / 2 + 30,
      H / 2 - 30 - (rows - 2) * 18, { a: a, width: 190, px: 12 });
    register('love', (w ? w.love : 0).toFixed(3), -W / 2 + 30,
      H / 2 - 30 - (rows - 3) * 18, { a: a, width: 190, px: 12 });
  }

  /* a particle-ish spray, deterministic, for the loud plates */
  function spray(seed, cx, cy, n, radius, opt) {
    opt = opt || {};
    var pal = EM.__pal;
    var col = opt.colour || rgba(pal ? pal.hot : [232, 62, 54], 0.7);
    for (var i = 0; i < n; i++) {
      var a0 = hash(Math.floor(seed * 9973) + i * 37) * TAU;
      var r = radius * (0.15 + hash(Math.floor(seed * 313) + i * 71) * 0.85);
      var x = cx + Math.cos(a0) * r, y = cy + Math.sin(a0) * r * 0.78;
      var sz = (0.8 + hash(Math.floor(seed * 77) + i * 13) * 2.4) * (opt.size || 1);
      if (opt.line) {
        D.lw(1);
        D.strokeColour(col);
        D.line(cx + Math.cos(a0) * r * 0.3, cy + Math.sin(a0) * r * 0.3 * 0.78, x, y);
      } else {
        D.dot(x, y, sz, col);
      }
    }
  }

  /* concentric pulse rings, sized off the real accents */
  function pulseRings(cx, cy, t, opt) {
    opt = opt || {};
    var pal = EM.__pal;
    var p = EM.onsetPulse(t, opt.win || 0.42);
    if (p <= 0.01) return;
    var rings = opt.rings || 3;
    for (var i = 0; i < rings; i++) {
      var q = clamp(p - i * 0.14, 0, 1);
      if (q <= 0) continue;
      D.lw(lerp(2.4, 0.6, q));
      D.strokeColour(rgba(opt.colour || (pal ? pal.accent : [86, 214, 232]),
        q * 0.55 * (opt.a === undefined ? 1 : opt.a)));
      D.scircle(cx, cy, (opt.r0 || 40) + (1 - q) * (opt.spread || 320));
    }
  }

  /* ==========================================================================
     THE BOOT MECHANISM — shared by the two instrumental passages.

     The opening transition (16.0 s) and the open-loop passage (193.5 s) are the
     film's two long stretches with no singing over them, and they want the same
     treatment: a machine visibly running while there is nothing to sing. Rather
     than maintain two similar-looking implementations, the three parts of that
     treatment live here and both plates call them.

       0  runningRings   seven rings, each its own speed, direction and tilt,
                         with a node riding each one. This is what holds the
                         middle of the frame.
       1  functionBank   three analytic curves re-evaluated every frame with
                         their current values printed. The numbers are real.
       2  bootColumn     a column of log lines scrolling upward, one new line per
                         fixed interval, TEXT chosen from the note nearest that
                         row's own timestamp so the entries land on the music.

     Every one of these takes `(w, t, a, opts)` and returns nothing. They draw
     in stage units. NOTE: the helper is `PAL()`, uppercase, because `p` is a
     progress parameter in this codebase and lowercase `pal` has been shadowed by
     it three times already in this project's history.
     ======================================================================== */
  function PALs() { return EM.__pal; }

  function runningRings(w, t, a, opts) {
    opts = opts || {};
    var pal = PALs();
    var cx = opts.cx === undefined ? -W * 0.16 : opts.cx;
    var cy = opts.cy === undefined ? 0 : opts.cy;
    var base = opts.base === undefined ? 58 : opts.base;
    var step = opts.step === undefined ? 44 : opts.step;
    var scale = opts.scale === undefined ? 1 : opts.scale;
    var c = D.ctx();

    c.save();
    c.translate(cx, cy);
    for (var i = 0; i < 7; i++) {
      var s1 = EM.hash(i * 733 + 5);
      var spin = t * (0.09 + s1 * 0.30) * (i % 2 ? 1 : -1);
      var rx = (base + i * step) * U * scale;
      var ry = (base * 0.29 + i * step * 0.19) * U * scale;
      D.lw(lerp(1.5, 0.8, i / 7));
      D.strokeColour(rgba(pal.accent, (0.10 + s1 * 0.20) * a));
      c.save();
      c.rotate(spin);
      c.beginPath();
      c.ellipse(0, 0, rx, ry, i * 0.46, 0, TAU);
      c.stroke();
      var nx = Math.cos(t * (0.7 + s1) + i) * rx;
      var ny = Math.sin(t * (0.7 + s1) + i) * ry;
      D.fillColour(rgba(pal.accent, 0.30 * a));
      D.dot(nx, ny, 1.8 * U);
      c.restore();
    }
    /* the axis the assembly turns about */
    D.lw(1);
    D.dash([4, 4]);
    D.strokeColour(rgba(pal.grid, 0.30 * a));
    D.line(0, -H * 0.30, 0, H * 0.30);
    D.dash([]);
    c.restore();
  }

  function functionBank(w, t, a, opts) {
    opts = opts || {};
    var pal = PALs();
    var x0 = opts.x0 === undefined ? -W * 0.44 : opts.x0;
    var x1 = opts.x1 === undefined ? -W * 0.10 : opts.x1;
    var y0 = opts.y0 === undefined ? H * 0.30 : opts.y0;
    var hgt = (opts.hgt === undefined ? 120 : opts.hgt) * U;
    var c = D.ctx();

    D.lw(1);
    D.strokeColour(rgba(pal.grid, 0.28 * a));
    D.line(x0, y0, x1, y0);

    var fns = [
      { s: 'sin(t)', f: function (q) { return Math.sin(q * 1.5); } },
      { s: 'sin(2t)/2', f: function (q) { return Math.sin(q * 3) * 0.5; } },
      { s: 'sin(4t)/4', f: function (q) { return Math.sin(q * 6) * 0.25; } }
    ];
    for (var k = 0; k < fns.length; k++) {
      D.lw(lerp(1.8, 0.9, k / 3));
      D.strokeColour(rgba(k === 0 ? pal.hot : pal.accent, (0.65 - k * 0.16) * a));
      c.beginPath();
      for (var i = 0; i <= 60; i++) {
        var u = i / 60;
        var xx = lerp(x0, x1, u);
        var yy = y0 - Math.sin((u * 4 + k * 0.7 + t * 0.42) * TAU * 0.5) * hgt * 0.34;
        if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
      }
      c.stroke();
      D.font(12);
      D.ctx().textAlign = 'left';
      D.ctx().textBaseline = 'alphabetic';
      D.fillColour(rgba(pal.grid, 0.70 * a));
      D.text(fns[k].s + ' = ' + fns[k].f(t).toFixed(4), x1 + 10 * U,
             y0 - 30 * U + k * 17 * U);
    }
  }

  /* bootColumn: the scrolling log. `opts.pool` is the list of lines and
     `opts.pick(rowIndex, t)` chooses which one a row shows, so the two passages
     can share the mechanism and differ in what it is logging. */
  function bootColumn(w, t, a, opts) {
    opts = opts || {};
    var pal = PALs();
    var x = opts.x === undefined ? W * 0.13 : opts.x;
    var t0 = opts.t0 === undefined ? 16.0 : opts.t0;
    var rps = opts.rowsPerSec === undefined ? 5.2 : opts.rowsPerSec;
    var rowH = (opts.rowH === undefined ? 21 : opts.rowH) * U;
    var px = opts.px === undefined ? 13.5 : opts.px;
    var tickRow = (t - t0) * rps;

    D.font(px);
    D.ctx().textAlign = 'left';
    D.ctx().textBaseline = 'alphabetic';

    var first = Math.max(0, Math.floor(tickRow - 19));
    for (var idx = first; idx <= tickRow; idx++) {
      var age = (tickRow - idx) / rps;
      var yy = H * 0.40 - (tickRow - idx) * rowH;
      if (yy < -H * 0.44) break;
      if (yy > H * 0.44) continue;
      var al = clamp(age / 0.7, 0, 1) *
               clamp((H * 0.42 - Math.abs(yy)) / (80 * U), 0, 1);
      if (al <= 0.01) continue;

      var line = opts.pick ? opts.pick(idx, t) : ('row ' + idx);
      D.ctx().globalAlpha = clamp(al * a * 0.86, 0, 1);
      D.fillColour(rgba(idx === Math.floor(tickRow) ? pal.ink : pal.grid, 0.92));
      D.text(line, x, yy);
      D.ctx().globalAlpha = 1;

      /* the tick in the margin carries the note, where there is a note */
      var near = opts.onsetFor ? opts.onsetFor(idx) : null;
      D.lw(1);
      D.strokeColour(rgba(near && near.voices > 1 ? pal.hot : pal.accent, 0.42 * al * a));
      D.line(x - 12 * U, yy - 4, x - 12 * U, yy + 2);
      D.line(x - 12 * U, yy - 1, x - 5 * U, yy - 1);
    }

    /* the gutter and its reading head */
    D.lw(1);
    D.strokeColour(rgba(pal.grid, 0.20 * a));
    var gx = x - 24 * U;
    D.line(gx, -H * 0.42, gx, H * 0.42);
    var head = ((t * 0.11) % 1) * H * 0.84 - H * 0.42;
    D.lw(2);
    D.strokeColour(rgba(pal.accent, 0.50 * a));
    D.line(gx - 5 * U, head, gx + 5 * U, head);
    D.ctx().textAlign = 'left';
  }

  EM.M = {
    bindStage: bindStage,
    banner: banner,
    sub: sub,
    keyword: keyword,
    register: register,
    gauge: gauge,
    callout: callout,
    fracture: fracture,
    handCurve: handCurve,
    voidHole: voidHole,
    trace: trace,
    stemPlot: stemPlot,
    registerBed: registerBed,
    spray: spray,
    pulseRings: pulseRings,
    runningRings: runningRings,
    functionBank: functionBank,
    bootColumn: bootColumn
  };
})(window.EM);
