/* ============================================================================
   _tools/render-png.js — render frames of the film to PNG, headless.

   WHY THIS IS WORTH 400 LINES
   ---------------------------
   The verifiers prove the film is complete, in sync, seek-safe and that every
   plate puts ink on the canvas. None of them can tell you whether a frame
   LOOKS right — whether the composition is balanced, whether a word sits on
   top of a diagram, whether something is off the edge of the stage.

   So this is a small software rasteriser: it drives the real plate code,
   intercepts the canvas calls, and draws them into a pixel buffer. It is not
   a browser renderer and it does not pretend to be. Text is drawn as solid
   boxes rather than glyphs, gradients are approximated, and there is no
   anti-aliasing. What it IS faithful about is GEOMETRY: where things are, how
   big they are, what overlaps what. That is exactly what composition review
   needs, and it is a class of bug the numeric checks cannot see.

   A caution learned the hard way: when you use a tool to judge whether the
   work is correct, check the tool first. A rasteriser with a missing clip or a
   double-applied transform will show you a broken frame that is not broken.

   Usage:
     node _tools/render-png.js 82              one frame at 82 s
     node _tools/render-png.js 82 95 130       several frames
     node _tools/render-png.js --sheet 12      a contact sheet of 12 frames
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { createEnv } = require('./stub-env');

const OUTDIR = path.join(__dirname, '..', 'frames-out');
const SW = 800, SH = 450;              /* output size: the stage at 1/2 */

/* ==========================================================================
   A minimal PNG encoder (RGBA, 8-bit, one IDAT)
   ======================================================================== */
function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;                       /* filter: none */
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

/* ==========================================================================
   PARSE a CSS colour into [r,g,b,a]

   The channel pattern must accept DECIMALS. `EM.mix` returns unrounded floats,
   so a mixed colour arrives as `rgba(186.4,242.35,231.55,0.55)`. The first
   version of this parser only matched integers, failed on every mixed colour,
   and fell through to its white default — which is why several frames rendered
   as a faint white haze over black. The film was drawing fine lines; the tool
   was painting them white.

   Every colour bug in this file has had the same shape: the worst kind of bug,
   where the symptom looks like the subject rather than the instrument.
   ======================================================================== */
const NAMED = { white: [255, 255, 255, 1], black: [0, 0, 0, 1], red: [255, 0, 0, 1] };
const NUMRE = '(-?[\\d.]+(?:e-?\\d+)?)';
const RGBARE = new RegExp('^rgba?\\(\\s*' + NUMRE + '\\s*,\\s*' + NUMRE + '\\s*,\\s*' +
  NUMRE + '\\s*(?:,\\s*' + NUMRE + '\\s*)?\\)$', 'i');

function parseColour(c) {
  if (c == null) return [255, 255, 255, 1];
  if (typeof c !== 'string') return [255, 255, 255, 1];
  const s = c.trim();
  let m = s.match(RGBARE);
  if (m) {
    return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
  }
  m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const v = parseInt(m[1], 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255, 1];
  }
  if (NAMED[s.toLowerCase()]) return NAMED[s.toLowerCase()].slice();
  return [255, 255, 255, 1];
}

/* ==========================================================================
   THE RASTERISER
   --------------------------------------------------------------------------
   Canvas paths are accumulated as polygons. Every curve is flattened by the
   *caller-side* recording, so by the time it reaches here it is a polygon.
   Fill uses the even-odd rule via a scanline crossing list, which is correct
   for the self-intersecting shapes this film draws (the ngons, stars and the
   connected lattice edges) and is cheap.
   ======================================================================== */
function Raster(w, h) {
  this.w = w; this.h = h;
  this.buf = Buffer.alloc(w * h * 4);
  /* opaque black ground, like the real canvas */
  for (let i = 0; i < w * h; i++) {
    this.buf[i * 4 + 0] = 0;
    this.buf[i * 4 + 1] = 0;
    this.buf[i * 4 + 2] = 0;
    this.buf[i * 4 + 3] = 255;
  }
}

Raster.prototype.blend = function (x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
  const i = (y * this.w + x) * 4;
  const ia = 1 - a;
  this.buf[i] = r * a + this.buf[i] * ia;
  this.buf[i + 1] = g * a + this.buf[i + 1] * ia;
  this.buf[i + 2] = b * a + this.buf[i + 2] * ia;
};

/* even-odd polygon fill. `paint` is either an [r,g,b,a] colour or a gradient
   evaluator (x,y) -> [r,g,b,a]. */
Raster.prototype.fillPoly = function (pts, paint, alpha) {
  if (pts.length < 3 || alpha <= 0) return;
  const isFn = typeof paint === 'function';
  if (!isFn && paint[3] * alpha <= 0) return;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(this.h - 1, Math.ceil(maxY));
  const xs = [];
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5;
    xs.length = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const pi = pts[i], pj = pts[j];
      if ((pi[1] <= cy && pj[1] > cy) || (pj[1] <= cy && pi[1] > cy)) {
        xs.push(pi[0] + (cy - pi[1]) / (pj[1] - pi[1]) * (pj[0] - pi[0]));
      }
    }
    if (xs.length < 2) continue;
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.round(xs[k]));
      const xb = Math.min(this.w - 1, Math.round(xs[k + 1]));
      for (let x = xa; x <= xb; x++) {
        if (isFn) {
          const c = paint(x + 0.5, cy);
          this.blend(x, y, c[0], c[1], c[2], c[3] * alpha);
        } else {
          this.blend(x, y, paint[0], paint[1], paint[2], paint[3] * alpha);
        }
      }
    }
  }
};

Raster.prototype.strokePath = function (path, lw, col, alpha, dash) {
  if (path.length < 2 || alpha <= 0) return;
  const half = Math.max(0.5, lw / 2);
  const paint = typeof col === 'function' ? col : col;
  let acc = 0, on = true;
  for (let i = 1; i < path.length; i++) {
    const p = path[i - 1], q = path[i];
    const dx = q[0] - p[0], dy = q[1] - p[1];
    const len = Math.hypot(dx, dy);
    if (len < 1e-6) continue;
    if (dash && dash.length) {
      let pos = 0;
      while (pos < len) {
        const seg = Math.max(0.5, dash[Math.floor(acc) % dash.length] || 1);
        const left = seg - (acc % seg);
        if (on) {
          const t0 = pos / len, t1 = Math.min(1, (pos + left) / len);
          this.line(p[0] + dx * t0, p[1] + dy * t0,
                    p[0] + dx * t1, p[1] + dy * t1, half, paint, alpha);
        }
        pos += left; acc += left; on = !on;
        if (acc > 100000) break;
      }
    } else {
      this.line(p[0], p[1], q[0], q[1], half, paint, alpha);
    }
  }
};

/* a thick line as a rotated rectangle */
Raster.prototype.line = function (x0, y0, x1, y1, half, paint, alpha) {
  let nx = -(y1 - y0), ny = (x1 - x0);
  const L = Math.hypot(nx, ny);
  if (L < 1e-9) return;
  nx = nx / L * half; ny = ny / L * half;
  this.fillPoly([
    [x0 + nx, y0 + ny], [x1 + nx, y1 + ny],
    [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]
  ], paint, alpha);
};

Raster.prototype.rect = function (x, y, w, h, paint, alpha) {
  this.fillPoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], paint, alpha);
};

/* ==========================================================================
   REAL GRADIENTS
   --------------------------------------------------------------------------
   An earlier version of this tool approximated a gradient by averaging its
   stops. That made every frame in the film show a flat grey field with a hard
   vertical seam down the middle, because the backdrop is a radial gradient
   whose stops happen to average to grey. It looked exactly like a rendering
   bug in the film. It was not; it was a bug in the tool.

   So they are evaluated properly: radial gradients sample their centre point
   per pixel from the two defining circles, which is what the canvas does.
   ======================================================================== */
function makeGradient(kind, args) {
  const stops = [];
  const g = function (x, y) {
    let u;
    if (kind === 'radial') {
      const x0 = args[0], y0 = args[1], r0 = args[2];
      const x1 = args[3], y1 = args[4], r1 = args[5];
      const d = Math.hypot(x1 - x0, y1 - y0);
      const dpt = Math.hypot(x - x0, y - y0);
      if (d < 1e-6) u = r0 >= r1 ? 0 : 1;
      else u = (dpt - r0) / (r1 - r0);
    } else {
      const x0 = args[0], y0 = args[1], x1 = args[2], y1 = args[3];
      const dx = x1 - x0, dy = y1 - y0;
      const len2 = dx * dx + dy * dy;
      u = len2 < 1e-9 ? 0 : ((x - x0) * dx + (y - y0) * dy) / len2;
    }
    u = u < 0 ? 0 : (u > 1 ? 1 : u);
    if (!stops.length) return [0, 0, 0, 0];
    if (u <= stops[0][0]) return stops[0][1].slice();
    const lastS = stops[stops.length - 1];
    if (u >= lastS[0]) return lastS[1].slice();
    for (let i = 0; i + 1 < stops.length; i++) {
      const a = stops[i], b = stops[i + 1];
      if (u >= a[0] && u <= b[0]) {
        const k = b[0] === a[0] ? 0 : (u - a[0]) / (b[0] - a[0]);
        const ca = a[1], cb = b[1];
        return [
          ca[0] + (cb[0] - ca[0]) * k,
          ca[1] + (cb[1] - ca[1]) * k,
          ca[2] + (cb[2] - ca[2]) * k,
          ca[3] + (cb[3] - ca[3]) * k
        ];
      }
    }
    return lastS[1].slice();
  };
  g.__gradient = true;
  g.addColorStop = function (o, c) {
    stops.push([o, parseColour(c)]);
    stops.sort((a, b) => a[0] - b[0]);
  };
  /* a flat representative colour, for the places that need one (clearRect
     background sizing, and any path the rasteriser cannot sample per pixel) */
  g.flat = function () {
    if (!stops.length) return [0, 0, 0, 0];
    let r = 0, gg = 0, b = 0, a = 0;
    for (const s of stops) { r += s[1][0]; gg += s[1][1]; b += s[1][2]; a += s[1][3]; }
    const n = stops.length;
    return [r / n, gg / n, b / n, a / n];
  };
  return g;
}

/* ==========================================================================
   THE RECORDING CONTEXT
   --------------------------------------------------------------------------
   Same interface the film expects, built on the rasteriser. It tracks the
   transform stack itself so coordinates arrive in pixel space.
   ======================================================================== */
function makeRecordingCtx(ras, scale, offsetX, offsetY, stats) {
  const stack = [];
  let M = [1, 0, 0, 1, 0, 0];            /* a,b,c,d,e,f */
  const path = [];
  let cur = null, startPt = null;
  const st = {
    fillStyle: '#ffffff', strokeStyle: '#ffffff', lineWidth: 1, globalAlpha: 1,
    font: '', textAlign: 'left', textBaseline: 'alphabetic',
    globalCompositeOperation: 'source-over', lineDash: [], shadowBlur: 0
  };

  function apply(x, y) {
    return [
      offsetX + (M[0] * x + M[2] * y + M[4]) * scale,
      offsetY + (M[1] * x + M[3] * y + M[5]) * scale
    ];
  }
  function mul(m) {
    M = [
      M[0] * m[0] + M[2] * m[1], M[1] * m[0] + M[3] * m[1],
      M[0] * m[2] + M[2] * m[3], M[1] * m[2] + M[3] * m[3],
      M[0] * m[4] + M[2] * m[5] + M[4], M[1] * m[4] + M[3] * m[5] + M[5]
    ];
  }
  function effAlpha(base) { return Math.max(0, Math.min(1, (base === undefined ? 1 : base) * st.globalAlpha)); }

  const ctx = {
    canvas: { width: 1600, height: 900 },
    save() { stack.push([M.slice(), { ...st }]); },
    restore() {
      const s = stack.pop();
      if (s) { M = s[0]; Object.assign(st, s[1]); }
    },
    setTransform(a, b, c, d, e, f) { M = [a, b, c, d, e, f]; },
    resetTransform() { M = [1, 0, 0, 1, 0, 0]; },
    translate(x, y) { mul([1, 0, 0, 1, x, y]); },
    rotate(a) { mul([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]); },
    scale(x, y) { mul([x, 0, 0, y, 0, 0]); },

    beginPath() { path.length = 0; cur = null; startPt = null; },
    closePath() { if (startPt) { path.push(startPt.slice()); cur = startPt.slice(); } },
    moveTo(x, y) { cur = apply(x, y); startPt = cur.slice(); path.push(cur.slice()); },
    lineTo(x, y) { cur = apply(x, y); path.push(cur.slice()); },
    quadraticCurveTo(cx, cy, x, y) {
      /* flatten into 10 segments */
      const p0 = cur || apply(0, 0);
      const c = apply(cx, cy), p1 = apply(x, y);
      for (let i = 1; i <= 10; i++) {
        const t = i / 10, it = 1 - t;
        path.push([
          it * it * p0[0] + 2 * it * t * c[0] + t * t * p1[0],
          it * it * p0[1] + 2 * it * t * c[1] + t * t * p1[1]
        ]);
      }
      cur = p1.slice();
    },
    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
      const p0 = cur || apply(0, 0);
      const a = apply(c1x, c1y), b = apply(c2x, c2y), p1 = apply(x, y);
      for (let i = 1; i <= 12; i++) {
        const t = i / 12, it = 1 - t;
        path.push([
          it * it * it * p0[0] + 3 * it * it * t * a[0] + 3 * it * t * t * b[0] + t * t * t * p1[0],
          it * it * it * p0[1] + 3 * it * it * t * a[1] + 3 * it * t * t * b[1] + t * t * t * p1[1]
        ]);
      }
      cur = p1.slice();
    },
    arc(x, y, r, a0, a1, ccw) {
      const c = apply(x, y);
      const rs = r * Math.abs(M[0]) * scale;
      let span = (a1 === undefined ? Math.PI * 2 : a1) - (a0 === undefined ? 0 : a0);
      if (span <= 0) span += Math.PI * 2;
      const n = Math.max(8, Math.min(160, Math.round(Math.abs(span) * rs / 2) + 8));
      /* A real canvas arc on an empty path implicitly starts a subpath at the
         arc's own first point. Without this, `beginPath(); arc(); fill()` —
         which is how every circle in the film is drawn — produced an empty
         path here and crashed. Found by running the rasteriser on frame 0.5,
         which is exactly the class of bug this tool exists to surface. */
      if (!path.length) {
        path.push([c[0] + Math.cos(a0 === undefined ? 0 : a0) * rs,
                   c[1] + Math.sin(a0 === undefined ? 0 : a0) * rs]);
      }
      for (let i = 0; i <= n; i++) {
        const a = (a0 === undefined ? 0 : a0) + span * (i / n);
        path.push([c[0] + Math.cos(a) * rs, c[1] + Math.sin(a) * rs]);
      }
      cur = path[path.length - 1].slice();
    },
    ellipse(x, y, rx, ry, rot, a0, a1) {
      const c = apply(x, y);
      const rxs = rx * Math.abs(M[0]) * scale, rys = ry * Math.abs(M[3]) * scale;
      let span = (a1 === undefined ? Math.PI * 2 : a1) - (a0 === undefined ? 0 : a0);
      if (span <= 0) span += Math.PI * 2;
      const n = 48;
      const cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
      for (let i = 0; i <= n; i++) {
        const a = (a0 === undefined ? 0 : a0) + span * (i / n);
        const px = Math.cos(a) * rxs, py = Math.sin(a) * rys;
        path.push([c[0] + px * cr - py * sr, c[1] + px * sr + py * cr]);
      }
      cur = path[path.length - 1].slice();
    },
    arcTo() {},
    rect(x, y, w, h) {
      path.length = 0;
      path.push(apply(x, y), apply(x + w, y), apply(x + w, y + h), apply(x, y + h));
      cur = path[0].slice(); startPt = cur.slice();
    },

    fill() {
      if (path.length < 3) return;
      const style = st.fillStyle;
      if (typeof style === 'function' && style.__gradient) {
        ras.fillPoly(path, style, st.globalAlpha);
      } else {
        const col = parseColour(style);
        ras.fillPoly(path, col, effAlpha(col[3]));
      }
      stats.fills++;
    },
    stroke() {
      if (path.length < 2) return;
      const style = st.strokeStyle;
      const lw = st.lineWidth * Math.abs(M[0]) * scale;
      const dash = st.lineDash.length
        ? st.lineDash.map(d => Math.max(1, d * Math.abs(M[0]) * scale)) : null;
      if (typeof style === 'function' && style.__gradient) {
        ras.strokePath(path, lw, style, st.globalAlpha, dash);
      } else {
        const col = parseColour(style);
        ras.strokePath(path, lw, col, effAlpha(col[3]), dash);
      }
      stats.strokes++;
    },
    clip() {
      /* NOT implemented, and it matters. The film uses clips for the grid
         field's horizon mask and a few plates; without them you will see
         geometry that the real canvas hides. Treated as a no-op rather than
         guessed at, and counted so a reviewer knows a frame used one. */
      stats.clips++;
    },
    fillRect(x, y, w, h) {
      const style = st.fillStyle;
      const p0 = apply(x, y), p1 = apply(x + w, y + h);
      const rx = Math.min(p0[0], p1[0]), ry = Math.min(p0[1], p1[1]);
      const rw = Math.abs(p1[0] - p0[0]), rh = Math.abs(p1[1] - p0[1]);
      if (typeof style === 'function' && style.__gradient) {
        ras.rect(rx, ry, rw, rh, style, st.globalAlpha);
      } else {
        const col = parseColour(style);
        ras.rect(rx, ry, rw, rh, col, effAlpha(col[3]));
      }
      stats.fills++;
    },
    strokeRect(x, y, w, h) {
      const col = parseColour(st.strokeStyle);
      const lw = st.lineWidth * Math.abs(M[0]) * scale;
      const p0 = apply(x, y), p1 = apply(x + w, y + h);
      const a = effAlpha(col[3]);
      ras.line(p0[0], p0[1], p1[0], p0[1], lw / 2, col, a);
      ras.line(p1[0], p0[1], p1[0], p1[1], lw / 2, col, a);
      ras.line(p1[0], p1[1], p0[0], p1[1], lw / 2, col, a);
      ras.line(p0[0], p1[1], p0[0], p0[1], lw / 2, col, a);
      stats.strokes++;
    },
    clearRect() {},
    /* Text as solid boxes. NOT glyphs — but the box has the right position and
       the right measured extent, which is all composition review needs. */
    fillText(t, x, y) {
      const s = String(t);
      const px = parseFloat((st.font.match(/(\d+(?:\.\d+)?)px/) || [0, 14])[1]) || 14;
      const mono = !/sans|serif/i.test(st.font);
      const w = s.length * px * (mono ? 0.60 : 0.52);
      let x0 = x;
      if (st.textAlign === 'center') x0 = x - w / 2;
      else if (st.textAlign === 'right') x0 = x - w;
      let y0 = y - px * 0.75;
      if (st.textBaseline === 'middle') y0 = y - px * 0.5;
      else if (st.textBaseline === 'top') y0 = y;
      const p0 = apply(x0, y0), p1 = apply(x0 + w, y0 + px * 1.02);
      const col = parseColour(st.fillStyle);
      /* The colour is passed as an ARRAY. It used to be spread into four
         arguments, which the signature — (x, y, w, h, paint, alpha) — read as
         paint = red-channel and alpha = green-channel, so every piece of text
         in the film rasterised as a dark or white block. This call had been
         wrong since the gradient refactor changed `rect`'s signature, and
         nothing noticed because text boxes still appeared at the right places;
         only their colour was nonsense. */
      ras.rect(Math.min(p0[0], p1[0]), Math.min(p0[1], p1[1]),
               Math.abs(p1[0] - p0[0]), Math.abs(p1[1] - p0[1]),
               col, effAlpha(col[3]) * 0.9);
      stats.text++;
    },
    strokeText() { stats.text++; },
    measureText(t) {
      const s = String(t);
      const m = st.font.match(/(\d+(?:\.\d+)?)px/);
      const px = (m ? parseFloat(m[1]) : 14) || 14;
      const mono = !/sans|serif/i.test(st.font);
      return { width: s.length * px * (mono ? 0.60 : 0.52) };
    },
    setLineDash(a) { st.lineDash = a || []; },
    getLineDash() { return st.lineDash; },
    /* Gradients are evaluated per pixel in PIXEL space. The film creates them
       after the stage transform is set, which would make an untransformed
       interpretation read in stage units and land in the wrong place — so the
       defining points are mapped through the current transform here. */
    createLinearGradient(x0, y0, x1, y1) {
      const a = apply(x0, y0), b = apply(x1, y1);
      return makeGradient('linear', [a[0], a[1], b[0], b[1]]);
    },
    createRadialGradient(x0, y0, r0, x1, y1, r1) {
      const a = apply(x0, y0), b = apply(x1, y1);
      const s = Math.abs(M[0]) * scale;
      return makeGradient('radial', [a[0], a[1], r0 * s, b[0], b[1], r1 * s]);
    },
    createPattern() { return null; },
    drawImage() {},
    getImageData(x, y, w, h) {
      return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h };
    },
    putImageData() {},
    createImageData(w, h) {
      return { data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h };
    },
    isPointInPath() { return false; },
    getContextAttributes() { return { alpha: false }; }
  };
  /* --------------------------------------------------------------------------
     The colour and state properties.

     These were MISSING in the first version of this file, and the omission was
     silent: `ctx.strokeStyle = 'rgba(...)'` simply added an own property that
     nothing read, so every stroke and fill fell back to white. The film came
     out as white-on-white — which looked like a broken film and was a broken
     tool. Accessors onto `st` are what make the assignment reach the
     rasteriser, and the probe that found it was four lines long.
     ------------------------------------------------------------------------ */
  function accessor(name) {
    Object.defineProperty(ctx, name, {
      get() { return st[name]; },
      set(v) { st[name] = v; },
      enumerable: true, configurable: true
    });
  }
  ['fillStyle', 'strokeStyle', 'lineWidth', 'globalAlpha', 'font', 'textAlign',
   'textBaseline', 'globalCompositeOperation', 'shadowBlur', 'shadowColor',
   'filter', 'lineDashOffset', 'lineCap', 'lineJoin',
   'imageSmoothingEnabled'].forEach(accessor);

  /* gradient objects are created by makeGradient above; they carry their own
     stop list and are sampled per pixel by the rasteriser */
  return ctx;
}

/* ==========================================================================
   RENDER one instant
   ======================================================================== */
function renderFrame(EM, t) {
  const stats = { fills: 0, strokes: 0, text: 0, clips: 0 };
  const ras = new Raster(SW, SH);
  const scale = Math.min(SW / 1600, SH / 900);
  const offsetX = (SW - 1600 * scale) / 2;
  const offsetY = (SH - 900 * scale) / 2;
  const ctx = makeRecordingCtx(ras, scale, offsetX, offsetY, stats);

  /* the renderer puts the origin at the centre of the 1600x900 stage */
  ctx.setTransform(1, 0, 0, 1, 800, 450);

  const D = EM.D;
  const prevBind = D.ctx();
  D.bind(ctx, 1600, 900);
  EM.M.bindStage();

  const w = EM.World.at(t);
  w.time = t;
  w.pal = EM.World.palette(w);
  w.U = 1;
  EM.__pal = w.pal;

  EM.WorldLayer.draw(w, w.pal, t);
  const cue = EM.Lyrics.at(t);
  if (cue) EM.drawScene(cue.scene, w, t, cue);

  D.bind(prevBind, 1600, 900);
  return { ras, stats, cue, w };
}

/* ==========================================================================
   MAIN
   ======================================================================== */
const args = process.argv.slice(2);
const sheet = args.indexOf('--sheet');
let times = [];

if (sheet >= 0) {
  const n = parseInt(args[sheet + 1] || '12', 10);
  for (let i = 0; i < n; i++) times.push(+(i / n * 211.5 + 2).toFixed(2));
} else {
  times = args.filter(a => !isNaN(parseFloat(a))).map(Number);
}
if (!times.length) {
  console.log('usage: node _tools/render-png.js <seconds...>');
  console.log('       node _tools/render-png.js --sheet 12');
  process.exit(0);
}

const env = createEnv({ quiet: true });
const EM = env.EM;
fs.mkdirSync(OUTDIR, { recursive: true });

console.log('rendering ' + times.length + ' frame(s) at ' + SW + 'x' + SH +
  ' (the stage at ' + (SW / 1600).toFixed(3) + 'x, text as boxes)');
for (const t of times) {
  const { ras, stats, cue } = renderFrame(env.EM, t);
  const name = 't' + String(t).replace('.', '_').padStart(7, '0') + '.png';
  const file = path.join(OUTDIR, name);
  fs.writeFileSync(file, encodePNG(SW, SH, ras.buf));
  console.log('  ' + EM.fmtTime(t) + '  ' + (cue ? cue.scene.padEnd(18) : '(no cue)') +
    '  "' + (cue ? cue.text : '') + '"' +
    '   fills=' + stats.fills + ' strokes=' + stats.strokes + ' text=' + stats.text +
    (stats.clips ? '  clips=' + stats.clips + ' (not rasterised)' : ''));
}
console.log('\nwrote ' + times.length + ' PNG(s) to ' + path.relative(path.join(__dirname, '..'), OUTDIR));
