/* ============================================================================
   src/10_draw.js — the drawing kit every plate is written with.

   Owns: canvas primitives, type, technical annotation marks, and a legibility
   floor for text.

   WHY A KIT INSTEAD OF DRAWING DIRECTLY
   -------------------------------------
   131 plates written against the raw canvas API would drift apart into 131
   different hands. Everything here works in the film's 1600x900 stage units
   and shares one stroke weight language, one dash convention and one set of
   annotation marks, so a plate from minute zero and a plate from minute three
   look like the same instrument drew them.

   THE STAGE CONSTANTS: plates do `var W = 1600, H = 900, U = 1;` at the top of
   their own file. U is the scale factor and is always 1 because the renderer
   applies the letterbox transform to the canvas before any plate runs. That
   means one stage unit is one drawing unit. If a plate references a constant it
   did not declare it will throw, and the scene registry reports the throw
   instead of swallowing it — see 15_sceneapi.js for why that matters.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var TAU = EM.TAU, clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba;

  var ctx = null;
  var W = 1600, H = 900;

  var curStroke = '#ffffff';
  var curFill = 'rgba(0,0,0,0)';
  var curWidth = 1.4;

  var MONO = '"Cascadia Mono","Consolas","SFMono-Regular","DejaVu Sans Mono","Liberation Mono",Menlo,monospace';
  var SANS = '"Segoe UI","Helvetica Neue",Arial,"Noto Sans",sans-serif';
  var SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Songti SC",serif';

  function bind(c, w, h) { ctx = c; W = w; H = h; }
  function C() { return ctx; }
  function size() { return { w: W, h: H }; }

  /* ==========================================================================
     STATE PRIMITIVES
     ======================================================================== */
  function lw(w) { if (w != null) { curWidth = w; ctx.lineWidth = w; } return curWidth; }
  function dash(pat) { ctx.setLineDash(pat || []); return pat; }
  function opacity(v) { ctx.globalAlpha = v == null ? 1 : clamp(v, 0, 1); return ctx.globalAlpha; }
  function comp(mode) { ctx.globalCompositeOperation = mode || 'source-over'; }
  function shadow(blur, colour) {
    ctx.shadowBlur = blur || 0;
    ctx.shadowColor = colour || 'rgba(0,0,0,0)';
  }
  function clipRect(x, y, w, h) {
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  }

  /* ==========================================================================
     GEOMETRY
     ======================================================================== */
  function begin() { ctx.beginPath(); }
  function moveTo(x, y) { ctx.moveTo(x, y); }
  function lineTo(x, y) { ctx.lineTo(x, y); }
  function close() { ctx.closePath(); }
  function stroke() { ctx.stroke(); }
  function fill() { ctx.fill(); }
  function strokeBoth() { ctx.stroke(); }

  function strokeColour(s) { if (s != null) curStroke = s; ctx.strokeStyle = curStroke; return curStroke; }
  function fillColour(s) { if (s != null) curFill = s; ctx.fillStyle = curFill; return curFill; }

  function line(x1, y1, x2, y2) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function rect(x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); }
  function srect(x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.stroke(); }
  function frect(x, y, w, h) { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.fill(); }
  function circle(x, y, r, a0, a1) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.01, r), a0 === undefined ? 0 : a0, a1 === undefined ? TAU : a1);
  }
  function scircle(x, y, r, a0, a1) { circle(x, y, r, a0, a1); ctx.stroke(); }
  function fcircle(x, y, r, a0, a1) { circle(x, y, r, a0, a1); ctx.fill(); }
  function dot(x, y, r, colour) {
    if (colour) fillColour(colour);
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.05, r), 0, TAU); ctx.fill();
  }
  function ring(x, y, r, width) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.05, r), 0, TAU);
    ctx.lineWidth = width || 1; ctx.stroke();
  }
  function arc(x, y, r, a0, a1, width) {
    ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, r), a0, a1);
    if (width) ctx.lineWidth = width;
    ctx.stroke();
  }

  function ngon(x, y, r, n, rot, R) {
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var a = (rot || 0) + i / n * TAU;
      var rr = R ? R(i) : r;
      var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function sngon(x, y, r, n, rot, R) { ngon(x, y, r, n, rot, R); ctx.stroke(); }
  function fngon(x, y, r, n, rot, R) { ngon(x, y, r, n, rot, R); ctx.fill(); }

  function star(x, y, rOut, rIn, spikes, rot) {
    ctx.beginPath();
    for (var i = 0; i < spikes * 2; i++) {
      var rr = i % 2 ? rIn : rOut;
      var a = (rot || 0) + i / (spikes * 2) * TAU;
      var px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /* pts: [[x,y], [cx,cy,x,y] quad, [c1x,c1y,c2x,c2y,x,y] cubic] */
  function path(pts, closeIt) {
    if (!pts || !pts.length) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i];
      if (p.length === 2) ctx.lineTo(p[0], p[1]);
      else if (p.length === 4) ctx.quadraticCurveTo(p[0], p[1], p[2], p[3]);
      else ctx.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
    }
    if (closeIt) ctx.closePath();
    ctx.stroke();
  }

  /* Catmull-Rom sampled into a polyline: hand-drawn curves that still pass
     exactly through their control points. */
  function smooth(pts, samples) {
    var out = [], n = pts.length;
    if (n < 2) return pts.slice();
    samples = samples || 8;
    for (var i = 0; i < n - 1; i++) {
      var p0 = pts[i > 0 ? i - 1 : 0], p1 = pts[i];
      var p2 = pts[i + 1], p3 = pts[i + 2 < n ? i + 2 : n - 1];
      for (var s = 0; s < samples; s++) {
        var t = s / samples, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[n - 1]);
    return out;
  }
  function smoothStroke(pts, samples) {
    var s = smooth(pts, samples);
    ctx.beginPath();
    for (var i = 0; i < s.length; i++) {
      if (i === 0) ctx.moveTo(s[i][0], s[i][1]); else ctx.lineTo(s[i][0], s[i][1]);
    }
    ctx.stroke();
    return s;
  }

  /* a wobbly polyline: the same curve, drawn by a hand that is not a machine.
     Displacement is hashed from the point index, so it is stable per frame. */
  function handLine(x1, y1, x2, y2, amp, seed, segments) {
    segments = segments || 5;
    var pts = [], r = Math.hypot(x2 - x1, y2 - y1) || 1;
    var nx = -(y2 - y1) / r, ny = (x2 - x1) / r;
    for (var i = 0; i <= segments; i++) {
      var u = i / segments;
      var d = (EM.hash(Math.floor((seed || 0) * 1000) + i * 37) - 0.5) * 2 * (amp || 3) * Math.sin(u * Math.PI);
      pts.push([lerp(x1, x2, u) + nx * d, lerp(y1, y2, u) + ny * d]);
    }
    smoothStroke(pts, 6);
    return pts;
  }

  /* ==========================================================================
     TYPE
     ======================================================================== */
  function font(px, weight, family) {
    var fam = family === 'sans' ? SANS : (family === 'serif' ? SERIF : MONO);
    ctx.font = (weight ? weight + ' ' : '') + px + 'px ' + fam;
  }
  function measure(s, px, weight, family) {
    font(px, weight, family);
    return ctx.measureText(String(s)).width;
  }

  /* --------------------------------------------------------------------------
     LEGIBILITY FLOOR.

     The film is built on near-black. A cyan hairline at alpha 0.5 is a
     beautiful thing and completely unreadable as a word — and the palette
     swings to a hot red in the last minute, where the accent colour alone
     measures under 2:1 against the ground. The answer is not to brighten the
     film (that destroys the mood) but to guarantee a floor for *type only*:

       stage 1  raise the alpha, keeping the hue exactly;
       stage 2  only if no alpha can reach the floor, mix the minimum amount
                toward the film's own text colour.

     Decorative linework is deliberately NOT subject to this. Hairlines, glows
     and particles keep their weakness, because that weakness is the look.
     ------------------------------------------------------------------------ */
  var BG_LUM = 0.0055;                 /* roughly rgb(5,7,12) */
  var TEXT_INK = [228, 242, 250];
  var FLOOR = 4.5;

  function needLum(min) { return (min || FLOOR) * (BG_LUM + 0.05) - 0.05; }

  function minAlphaFor(col, min, from) {
    var need = needLum(min);
    if (need <= 0) return from === undefined ? 1 : from;
    from = (from === undefined || !(from > 0)) ? 0.05 : from;
    if (EM.lum(col) <= need) return 1;
    var lo = Math.max(0.001, Math.min(from, 0.999)), hi = 1;
    if (EM.lum([col[0] * lo, col[1] * lo, col[2] * lo]) >= need) return lo;
    for (var i = 0; i < 24; i++) {
      var mid = (lo + hi) / 2;
      if (EM.lum([col[0] * mid, col[1] * mid, col[2] * mid]) < need) lo = mid; else hi = mid;
    }
    return Math.min(1, hi);
  }

  /* given whatever CSS colour a plate asked for, return one it can be read in */
  function readable(css, min) {
    min = min || FLOOR;
    var c = EM.parseCSS(css);
    if (!c) return css;
    var need = needLum(min);
    var col = [c.r, c.g, c.b];
    var eff = c.a >= 0.99 ? col : [c.r * c.a, c.g * c.a, c.b * c.a];
    if (EM.lum(eff) >= need) return css;
    if (EM.lum(col) > need) return rgba(col, Math.max(c.a, minAlphaFor(col, min, c.a)));
    /* too dark for any alpha: walk toward the text colour the least we can */
    var hi = 1, t = 0;
    for (var i = 0; i < 20; i++) {
      t = (t + hi) / 2;
      var m = EM.mix(col, TEXT_INK, t);
      if (EM.lum(m) < need) t = t; else hi = t;
    }
    return rgba(EM.mix(col, TEXT_INK, hi), Math.max(c.a, 0.9));
  }

  /* set fill and draw, lifting it just for the glyphs */
  function text(s, x, y, align, baseline) {
    var draw = readable(curFill, FLOOR);
    var prev = ctx.fillStyle;
    ctx.fillStyle = draw;
    ctx.textAlign = align || 'left';
    ctx.textBaseline = baseline || 'alphabetic';
    ctx.fillText(String(s), x, y);
    ctx.fillStyle = prev;
  }
  function textStroke(s, x, y, align, baseline) {
    ctx.textAlign = align || 'left';
    ctx.textBaseline = baseline || 'alphabetic';
    ctx.strokeText(String(s), x, y);
  }

  /* letter-spaced monospace, the film's "labelled by the machine" voice */
  function spaced(s, x, y, px, tracking, align) {
    s = String(s);
    font(px);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    var t = tracking === undefined ? px * 0.34 : tracking;
    var draw = readable(curFill, FLOOR);
    var prev = ctx.fillStyle;
    ctx.fillStyle = draw;
    var total = 0, i, ws = [];
    for (i = 0; i < s.length; i++) { ws.push(ctx.measureText(s.charAt(i)).width); total += ws[i] + t; }
    total -= t;
    var cx = align === 'center' ? x - total / 2 : (align === 'right' ? x - total : x);
    for (i = 0; i < s.length; i++) { ctx.fillText(s.charAt(i), cx, y); cx += ws[i] + t; }
    ctx.fillStyle = prev;
    return total;
  }

  /* --------------------------------------------------------------------------
     TYPE-ON. Reveals a string by character, each glyph riding its own eased
     ramp, plus an optional block cursor.

     `opt.stagger` controls how much the characters trail each other. At 0 the
     whole line arrives at once; at 0.6 it streams in like a terminal printing
     it, which is the film's default voice for anything the machine says about
     itself.

     Works on abs() return values because plate drawing runs inside
     ctx.save()/restore() with no shadow leaking out.
     ------------------------------------------------------------------------ */
  function typeOn(s, x, y, px, cfg) {
    cfg = cfg || {};
    s = String(s);
    var p = clamp(cfg.p === undefined ? 1 : cfg.p, 0, 1);
    var track = cfg.track === undefined ? px * 0.08 : cfg.track;
    var stagger = cfg.stagger === undefined ? 0.45 : cfg.stagger;
    var family = cfg.family;
    var weight = cfg.weight;
    font(px, weight, family);
    ctx.textAlign = 'left';
    ctx.textBaseline = cfg.baseline || 'alphabetic';

    var draw = readable(cfg.colour || curFill, FLOOR);
    var prev = ctx.fillStyle;
    ctx.fillStyle = draw;

    var n = s.length, span = 1 - stagger;
    var cx = x, i, ch, cw, k, a;
    for (i = 0; i < n; i++) {
      k = n > 1 ? i / (n - 1) : 0;
      a = stagger > 0 && span > 0 ? clamp((p - k * stagger) / span, 0, 1) : (p > 0 ? 1 : 0);
      if (a <= 0) {
        cw = ctx.measureText(s.charAt(i)).width;
        cx += cw + track;
        continue;
      }
      ch = s.charAt(i);
      cw = ctx.measureText(ch).width;
      if (cfg.glow) {
        ctx.shadowBlur = px * cfg.glow;
        ctx.shadowColor = draw;
      }
      ctx.globalAlpha = a;
      ctx.fillText(ch, cx - (1 - E_outCubic(a)) * px * 0.35, y);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      cx += cw + track;
    }
    ctx.fillStyle = prev;

    if (cfg.cursor) {
      var blink = cfg.blink === undefined ? 1 : cfg.blink;
      if (blink > 0.3) {
        fillColour(draw);
        ctx.globalAlpha = 0.55 + 0.45 * blink;
        frect(cx + track, y - px * 0.76, px * 0.48, px * 0.84);
        ctx.globalAlpha = 1;
        fillColour(curFill);
      }
    }
    return cx - x;
  }
  function E_outCubic(u) { return 1 - Math.pow(1 - u, 3); }

  /* ==========================================================================
     TECHNICAL ANNOTATION — the marks that make the frame read as a
     measurement rather than a picture
     ======================================================================== */
  function arrowHead(x, y, ang, s) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(ang - 0.34) * s, y - Math.sin(ang - 0.34) * s);
    ctx.moveTo(x, y);
    ctx.lineTo(x - Math.cos(ang + 0.34) * s, y - Math.sin(ang + 0.34) * s);
    ctx.stroke();
  }

  /* dimension line with arrowheads, optional offset and centred label */
  function dim(x1, y1, x2, y2, label, off, labelPx) {
    var dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    off = off || 0;
    var ax1 = x1 + nx * off, ay1 = y1 + ny * off;
    var ax2 = x2 + nx * off, ay2 = y2 + ny * off;
    line(ax1, ay1, ax2, ay2);
    arrowHead(ax2, ay2, Math.atan2(dy, dx), 9);
    arrowHead(ax1, ay1, Math.atan2(-dy, -dx), 9);
    /* witness lines back to the measured points */
    var wl = Math.min(12, Math.abs(off) * 0.9);
    if (wl > 1) {
      line(x1, y1, ax1 + nx * Math.sign(off) * wl, ay1 + ny * Math.sign(off) * wl);
      line(x2, y2, ax2 + nx * Math.sign(off) * wl, ay2 + ny * Math.sign(off) * wl);
    }
    if (label) {
      var px = labelPx || 15;
      font(px);
      var w = ctx.measureText(label).width;
      var a = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate((ax1 + ax2) / 2, (ay1 + ay2) / 2);
      if (Math.abs(a) > Math.PI / 2) ctx.rotate(a + Math.PI); else ctx.rotate(a);
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      fillColour(readable(curFill, FLOOR));
      /* knock a hole in the line so the label sits in it */
      ctx.save();
      comp('destination-out');
      frect(-w / 2 - 5, -px - 4, w + 10, px + 8);
      ctx.restore();
      comp('source-over');
      fillColour(curFill);
      ctx.fillStyle = readable(curFill, FLOOR);
      ctx.fillText(label, 0, -3);
      ctx.fillStyle = curFill;
      ctx.restore();
    }
  }

  /* corner brackets: the "this object is selected" frame */
  function bracket(x, y, w, h, s) {
    s = s || 22;
    ctx.beginPath();
    ctx.moveTo(x, y + s); ctx.lineTo(x, y); ctx.lineTo(x + s, y);
    ctx.moveTo(x + w - s, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + s);
    ctx.moveTo(x + w, y + h - s); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - s, y + h);
    ctx.moveTo(x + s, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - s);
    ctx.stroke();
  }

  /* crosshair + ring: marks a quantity the machine is measuring */
  function reticle(x, y, r, rot) {
    scircle(x, y, r);
    scircle(x, y, r * 0.62);
    for (var i = 0; i < 4; i++) {
      var a = (rot || 0) + i * Math.PI / 2;
      line(x + Math.cos(a) * r, y + Math.sin(a) * r,
           x + Math.cos(a) * r * 1.24, y + Math.sin(a) * r * 1.24);
    }
  }

  function grid(x, y, w, h, cell, a) {
    var prev = ctx.globalAlpha;
    ctx.globalAlpha = a === undefined ? 0.5 : a;
    ctx.beginPath();
    for (var i = Math.ceil(x / cell) * cell; i <= x + w; i += cell) { ctx.moveTo(i, y); ctx.lineTo(i, y + h); }
    for (var j = Math.ceil(y / cell) * cell; j <= y + h; j += cell) { ctx.moveTo(x, j); ctx.lineTo(x + w, j); }
    ctx.stroke();
    ctx.globalAlpha = prev;
  }

  function axes(cx, cy, len, labelX, labelY, px) {
    line(cx - len, cy, cx + len, cy);
    line(cx, cy - len, cx, cy + len);
    arrowHead(cx + len, cy, 0, 9);
    arrowHead(cx, cy - len, -Math.PI / 2, 9);
    font(px || 14);
    ctx.textAlign = 'left';
    if (labelX) { ctx.textBaseline = 'top'; text(labelX, cx + len + 8, cy + 5); }
    if (labelY) { ctx.textBaseline = 'bottom'; text(labelY, cx + 7, cy - len - 5); }
  }

  /* dashed tick ruler, used to make the frame feel measured */
  function ruler(x, y, w, ticks, bigEvery, px) {
    line(x, y, x + w, y);
    for (var i = 0; i <= ticks; i++) {
      var u = i / ticks, big = bigEvery && i % bigEvery === 0;
      var h = big ? 11 : 5;
      ctx.globalAlpha = big ? 0.85 : 0.45;
      line(x + u * w, y, x + u * w, y - h);
      if (big && px) {
        ctx.globalAlpha = 0.7;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        text(String(i), x + u * w, y + 4);
      }
      ctx.globalAlpha = 1;
    }
  }

  /* segmented meter, e.g. a level or a progress read-out */
  function meter(x, y, w, h, v, segs) {
    segs = segs || 24;
    var on = Math.round(clamp(v, 0, 1) * segs);
    for (var i = 0; i < segs; i++) {
      ctx.globalAlpha = i < on ? 1 : 0.14;
      frect(x + i * (w / segs), y, (w / segs) * 0.6, h);
      ctx.globalAlpha = 1;
    }
  }

  /* ==========================================================================
     SIGNALS — waveforms and bars derived from the measured song, not faked
     ======================================================================== */
  function waveform(x, y, w, h, t, freq, amp, phase) {
    ctx.beginPath();
    var n = Math.max(24, Math.floor(w / 3));
    for (var i = 0; i <= n; i++) {
      var u = i / n;
      var env = Math.sin(u * Math.PI);
      var v = Math.sin(u * (freq || 8) * TAU + (t || 0) * 4 + (phase || 0)) * 0.6
            + Math.sin(u * (freq || 8) * 2.3 * TAU - (t || 0) * 2.7) * 0.28
            + (EM.noise1(u * 22 + (t || 0) * 1.5) - 0.5) * 0.5;
      var px = x + u * w, py = y + h / 2 - v * env * (h / 2) * (amp === undefined ? 1 : amp);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  /* the real energy envelope of the song, as baked by _build/parse-mp3.js */
  function waveBars(x, y, w, h, from, to, colour, barW) {
    var WAVE = EM.WAVE;
    if (!WAVE || !WAVE.length) return;
    var dur = EM.AUDIO_END;
    var bw = barW || 2;
    var step = Math.max(1, Math.floor(WAVE.length * (to - from) / dur / (w / (bw + 1))));
    ctx.beginPath();
    for (var i = 0; i < WAVE.length; i += step) {
      var tt = i / WAVE.length * dur;
      if (tt < from || tt > to) continue;
      var u = (tt - from) / (to - from);
      var v = WAVE[i] / 255;
      var px = x + u * w;
      var hh = Math.max(1, v * h);
      ctx.rect(px, y + (h - hh) / 2, bw, hh);
    }
    ctx.fillStyle = colour;
    ctx.fill();
  }

  /* ==========================================================================
     EFFECTS
     ======================================================================== */
  /* horizontal slice displacement of whatever is already on the canvas */
  function sliceGlitch(canvas, amt, t) {
    if (amt <= 0.001) return;
    var n = Math.round(6 + amt * 16);
    for (var i = 0; i < n; i++) {
      var r = EM.hash((i * 977 + Math.floor(t * 13) * 131) | 0);
      var sy = Math.floor(r * canvas.height);
      var sh = Math.max(2, Math.floor((0.004 + r * 0.05) * amt * canvas.height));
      var dx = (EM.hash((i * 313 + Math.floor(t * 13) * 71) | 0) - 0.5) * amt * 190;
      try { ctx.drawImage(canvas, 0, sy, canvas.width, sh, dx, sy, canvas.width, sh); }
      catch (e) { /* a slice that cannot be copied is not worth failing a frame */ }
    }
  }

  /* triangular debris, deterministic from its seed */
  function shard(seed, x, y, r, rot, a) {
    var a0 = seed * TAU;
    ctx.globalAlpha = a;
    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
      var ang = a0 + rot + i / 3 * TAU;
      var rr = r * (0.6 + EM.hash((seed * 1000 + i * 37) | 0) * 0.7);
      var px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* a hand-drawn heart, as a parametric plot (this is the shape the machine
     eventually admits it cannot solve) */
  function heartAt(k, steps) {
    var a = k / steps * TAU;
    return [
      16 * Math.pow(Math.sin(a), 3),
      -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))
    ];
  }
  function heart(cx, cy, scale) {
    ctx.beginPath();
    for (var k = 0; k <= 28; k++) {
      var p = heartAt(k, 28);
      var px = cx + p[0] / 16 * scale, py = cy + p[1] / 16 * scale;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  /* a signal that is mostly regular and occasionally not — a heartbeat with
     noise, or a system losing its timing */
  function ekg(x, y, w, h, t, irregular) {
    var n = Math.max(48, Math.floor(w / 2.2));
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var u = i / n;
      var phase = ((u * 3 + t * 0.55) % 1 + 1) % 1;
      var beat = 0;
      if (phase < 0.06) beat = Math.sin(phase / 0.06 * Math.PI) * 0.25;
      else if (phase < 0.12) beat = -0.35;
      else if (phase < 0.20) beat = Math.sin((phase - 0.12) / 0.08 * Math.PI) * 1.0;
      else if (phase < 0.30) beat = Math.sin((phase - 0.20) / 0.10 * Math.PI) * -0.30;
      else if (phase < 0.42) beat = Math.sin((phase - 0.30) / 0.12 * Math.PI) * 0.22;
      var jit = (EM.noise1(u * 40 + t * 6) - 0.5) * (irregular || 0) * 0.7;
      var px = x + u * w, py = y + h / 2 - (beat + jit) * h * 0.46;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  /* --------------------------------------------------------------------------
     seeded structure helpers, so scenery can be laid out from a number
     ------------------------------------------------------------------------ */
  function rnd(seed) { return EM.hash(Math.floor(seed * 100003) | 0); }
  function rr(seed, a, b) { return a + rnd(seed) * (b - a); }

  function seededBlob(cx, cy, r, seed, points, wobble) {
    var pts = [];
    points = points || 14;
    for (var i = 0; i < points; i++) {
      var a = i / points * TAU;
      var rr2 = r * (1 - (wobble || 0.2) + EM.noise1(seed + i * 0.7) * (wobble || 0.2) * 2);
      pts.push([cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2]);
    }
    smoothStroke(pts.concat([pts[0]]), 6);
  }

  EM.D = {
    bind: bind, ctx: C, size: size,
    lw: lw, dash: dash, alpha: opacity, opacity: opacity, comp: comp, shadow: shadow, clipRect: clipRect,
    begin: begin, moveTo: moveTo, lineTo: lineTo, close: close,
    stroke: stroke, fill: fill,
    strokeColour: strokeColour, fillColour: fillColour,
    line: line, rect: rect, srect: srect, frect: frect,
    circle: circle, scircle: scircle, fcircle: fcircle, dot: dot, ring: ring, arc: arc,
    ngon: ngon, sngon: sngon, fngon: fngon, star: star,
    path: path, smooth: smooth, smoothStroke: smoothStroke, handLine: handLine,
    font: font, measure: measure, text: text, textStroke: textStroke,
    spaced: spaced, typeOn: typeOn, readable: readable, minAlphaFor: minAlphaFor,
    arrowHead: arrowHead, dim: dim, bracket: bracket, reticle: reticle,
    grid: grid, axes: axes, ruler: ruler, meter: meter,
    waveform: waveform, waveBars: waveBars,
    sliceGlitch: sliceGlitch, shard: shard, heart: heart, ekg: ekg,
    rnd: rnd, rr: rr, seededBlob: seededBlob,
    MONO: MONO, SANS: SANS, SERIF: SERIF, FLOOR: FLOOR
  };
})(window.EM);
