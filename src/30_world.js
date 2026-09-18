/* ============================================================================
   src/30_world.js — the machine the whole film is happening inside.

   THIS IS THE IDENTITY OF THE PIECE
   ---------------------------------
   The song is a program running. So the world is not a backdrop, it is a
   *substrate*: a 32 x 18 lattice of cells, which is what the machine is
   computing on. And here is the idea the rest of the film hangs off:

       every single note that sounds lights one cell of that lattice,
       and leaves a mark that never fully heals.

   Accents and the love/hate axis are different dimensions of the same grid, so
   the board carries the history of the performance. By 02:38 — the execution
   storm, where the machine fires sixteen times in a row — the lattice has
   accumulated the whole song as a scarred burn pattern, and the picture is
   literally the shape of what has been played so far. The ending is not a
   special effect: it is the board, fully written.

   Because the marks are a pure function of (note index, t), scrubbing to any
   point reproduces the exact same scar. The film has a memory and yet holds no
   state — see the note at the top of 00_core.js for why that matters.

   ---------------------------------------------------------------------------
   A NOTE ON SUBORDINATION, WHICH IS A COMPOSITION RULE IN THIS FILE
   ---------------------------------------------------------------------------
   Measured at one point, this layer was producing 60-75% of every frame's
   drawing calls while the plate — the actual subject of the line being sung —
   produced 2-17%. The result was a film that looked busy and never gave the eye
   anything to land on: the background was not background.

   So the alphas in this file are deliberately LOW, and every one of them is a
   fraction of what it would take to be the subject. The lattice, the grid, the
   depth shells and the particles are here to be SEEN THROUGH, not looked at.
   The scene plates compensate: they are the loud layer, and they are the only
   thing allowed to be loud. If you raise a number in this file, check
   _tools/gap-check.js and then look at a rendered frame before keeping it.

   LAYER ORDER (bottom to top)
     bg -> depth -> gridField -> tileField -> topology -> threads -> particles
        -> shards -> loveGlyphs -> annotation -> vignette
   ==========================================================================*/
(function (EM) {
  'use strict';

  var D = EM.D, E = EM.E, TAU = EM.TAU;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba;
  var hash = EM.hash, noise = EM.noise2;

  var W = 1600, H = 900, U = 1, CX = 0, CY = 0;

  /* --------------------------------------------------------------------------
     THE SUBORDINATION GAIN. One number that scales every alpha this layer
     draws, so the background can be pushed back without editing a hundred
     literals — and so it can be re-tuned in one place if a future change makes
     the plates louder or quieter.

     It multiplies the context alpha for the duration of draw(), which is
     exactly the semantics wanted: everything the world layer paints is dimmed
     by the same factor, and the scene plate, which is drawn afterwards with the
     context restored, is not touched at all.
     ------------------------------------------------------------------------ */
  var GAIN = 0.50;

  /* a knob the verifier can turn to simplify the tile field when measuring
     cost, so a performance test does not have to lie about what it measured */
  EM.WORLD_SIMPLE = EM.WORLD_SIMPLE || 0;

  function frame(w, h, u, cx, cy) { W = w; H = h; U = u; CX = cx; CY = cy; }

  /* the lattice the machine computes on */
  var COLS = 32, ROWS = 18;
  var CELL_W = W / COLS, CELL_H = H / ROWS;
  function cellX(c) { return -W / 2 + (c + 0.5) * CELL_W; }
  function cellY(r) { return -H / 2 + (r + 0.5) * CELL_H; }

  /* ==========================================================================
     1. BACKDROP — rebuilt every frame on purpose.

     A cached gradient would be a lie: the palette depends on t, so a cached
     one would make a seek render a frame from somewhere else. A radial
     gradient costs microseconds; correctness is not the place to save them.
     ======================================================================== */
  function bg(w, pal, t) {
    var c = D.ctx();
    var g = c.createRadialGradient(CX, CY - H * 0.06, H * 0.05,
                                   CX, CY, Math.max(W, H) * 0.78);
    g.addColorStop(0, pal.bgInner);
    g.addColorStop(0.52, pal.bgOuter);
    g.addColorStop(1, '#010204');
    /* The gradient has to be installed with the context at full alpha and then
       painted before anything else touches globalAlpha. Setting alpha first
       and painting after made the whole backdrop — and everything drawn after
       it, because the context alpha was still low — come out at a thirtieth of
       its strength: a flat, empty frame. Caught by rendering the film to PNG
       and looking at it; no numeric check would have found this. */
    c.save();
    c.globalAlpha = 1;
    c.fillStyle = g;
    c.fillRect(-W / 2 - 10, -H / 2 - 10, W + 20, H + 20);
    c.restore();

    /* scanning raster: the image is being drawn by something */
    c.save();
    c.globalAlpha = 0.05 + 0.028 * Math.sin(t * 1.7);
    c.strokeStyle = 'rgba(255,255,255,1)';
    c.lineWidth = 1;
    c.beginPath();
    for (var y = -H / 2; y < H / 2; y += 4 * U) { c.moveTo(-W / 2, y); c.lineTo(W / 2, y); }
    c.stroke();
    c.restore();

    /* refresh sweep */
    var sy = ((t * 0.11) % 1.9 - 0.45) * H;
    c.save();
    var g2 = c.createLinearGradient(0, sy - 90 * U, 0, sy + 90 * U);
    g2.addColorStop(0, 'rgba(255,255,255,0)');
    g2.addColorStop(0.5, rgba(pal.accent, 0.05 + w.heat * 0.05));
    g2.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g2;
    c.fillRect(-W / 2, sy - 90 * U, W, 180 * U);
    c.restore();
  }

  /* ==========================================================================
     2. GRID FIELD — the coordinate system the lyrics keep referring to.

     A receding plane with a vanishing point, so the lattice reads as something
     with depth rather than a flat texture. It sinks and tilts as the world
     loses its rules.
     ======================================================================== */
  function gridField(w, pal, t) {
    var c = D.ctx();
    var horizon = CY - H * 0.12 + w.vert * H * 0.30;
    var ok = 1 - clamp(w.shatter * 1.1, 0, 1);
    /* fewer rules: a coordinate system needs to be legible, not dense */
    var rows = 13, cols = 17;
    D.lw(1);

    c.save();
    c.beginPath();
    c.rect(-W / 2, horizon, W, H - horizon);
    c.clip();

    var vpx = Math.sin(t * 0.12) * 80 * U;
    for (var i = 0; i <= cols; i++) {
      var u = i / cols * 2 - 1;
      D.strokeColour(rgba(pal.grid, (1 - Math.abs(u) * 0.55) * 0.26 * ok *
        (0.45 + w.density * 0.7)));
      D.line(vpx, horizon, u * W * 0.95, H / 2 + 40 * U);
    }
    for (var r = 1; r <= rows; r++) {
      var p = r / rows;
      var yy = horizon + Math.pow(p, 2.4) * (H * 0.64 + H * 0.1);
      D.strokeColour(rgba(pal.grid, p * 0.30 * ok * (0.45 + w.density * 0.8)));
      D.line(-W / 2, yy, W / 2, yy);
    }
    c.restore();
  }

  /* ==========================================================================
     2b. DEPTH — the room the machine is in.

     The earlier version of this world read as a flat sheet of patterns. What
     was missing was not detail, it was DISTANCE: a fixed structure far behind
     everything else, drawn in faint rules, so the grid and the tiles have
     somewhere to be relative to. Two nested wireframe solids turning very
     slowly around a common centre give the frame a back wall, and because they
     are the furthest thing on screen they are also the quietest — which is why
     they add space without adding clutter.
     ======================================================================== */
  function depth(w, pal, t) {
    var c = D.ctx();
    var breathe = 1 + Math.sin(t * 0.07) * 0.035;
    /* sinks as the world loses its rules; drops with the pit at ISOLATION */
    var drop = w.vert * H * 0.10;
    var fade = 0.55 + w.struct * 0.45;

    for (var shell = 0; shell < 2; shell++) {
      var rotY = t * (0.035 + shell * 0.022) * (shell ? -1 : 1);
      var rotX = 0.42 + Math.sin(t * 0.05 + shell) * 0.10;
      var rx = (430 - shell * 150) * breathe * U;
      var al = (0.085 - shell * 0.03) * fade;
      if (al <= 0.004) continue;

      /* a cuboctahedron-ish cage: three orthogonal rings plus connecting edges
         read as a solid without needing a depth buffer */
      D.lw(shell ? 0.8 : 1.0);
      /* NOTE: in this file the palette arrives as the ARGUMENT `pal` (an
         object), not as a helper function — the plate files have a PAL()
         helper, the world layer does not. Writing pal() here is a TypeError. */
      D.strokeColour(rgba(pal.grid, al));
      for (var ring = 0; ring < 3; ring++) {
        var axis = ring;
        var r2 = rx * (ring === 1 ? 0.92 : 1);
        c.beginPath();
        for (var i = 0; i <= 36; i++) {
          var ang = i / 36 * TAU;
          var u1 = Math.cos(ang) * r2, u2 = Math.sin(ang) * r2;
          /* project a 3D circle down to the two visible axes */
          var px, py;
          if (axis === 0) { px = u1; py = u2 * Math.cos(rotX); }
          else if (axis === 1) { px = u1 * Math.cos(rotY); py = u2; }
          else { px = u1 * Math.cos(rotY) * 0.7 + u2 * Math.sin(rotY) * 0.7;
                 py = u2 * Math.cos(rotY) * 0.7 - u1 * Math.sin(rotY) * 0.7; }
          if (i === 0) c.moveTo(px, py + drop); else c.lineTo(px, py + drop);
        }
        c.stroke();
      }
    }

    /* a single receding wall of verticals, far behind, drifting laterally:
       this is what actually sells the depth, because the eye reads parallel
       lines converging as a room rather than a texture */
    D.lw(0.7);
    D.strokeColour(rgba(pal.grid, 0.045 * fade));
    c.beginPath();
    var skew = Math.sin(t * 0.045) * 120 * U;
    for (var k = -9; k <= 9; k++) {
      var bx = k * 150 * U + skew;
      c.moveTo(bx * 0.42, -H * 0.50);
      c.lineTo(bx, H * 0.50);
    }
    c.stroke();
  }

  /* ==========================================================================
     3. THE TILE FIELD — the heart of it.

     For each note in the song we precompute which cell it burns. Cells are
     assigned by walking the board two-dimensionally, so consecutive notes
     travel a path across it instead of crawling left to right like a progress
     bar. A chord (several notes on the same millisecond) burns harder.

     Every cell also accumulates an "exposure" the first time it is used, so
     later sections of the song look like a board that has been worked over.
     ======================================================================== */
  var BEAT_TILE = null;
  function ensureBeatTiles() {
    if (BEAT_TILE) return BEAT_TILE;
    var arr = EM.ONSETS || [];
    BEAT_TILE = new Float32Array(arr.length * 4);
    for (var k = 0; k < arr.length; k++) {
      /* the walk: 7 columns per step and 13 rows per step, which because 32
         and 18 share no small factors visits the whole board in a long,
         readable diagonal drift rather than in stripes */
      var c = ((k * 7 + Math.floor(k / 8) * 3) % COLS + COLS) % COLS;
      var r = ((k * 13 + Math.floor(k / 4) * 2) % ROWS + ROWS) % ROWS;
      var o = k * 4;
      BEAT_TILE[o] = c;
      BEAT_TILE[o + 1] = r;
      BEAT_TILE[o + 2] = arr[k][1] / 127;          /* pitch, for the hue */
      BEAT_TILE[o + 3] = arr[k][3];                /* voices, for the weight */
    }
    return BEAT_TILE;
  }

  /* how far the song has been played at time t, in notes */
  function notesPlayed(t) {
    var i = EM.onsetIndex(t);
    return i < 0 ? 0 : i + 1;
  }

  function tileField(w, pal, t, layer) {
    var c = D.ctx();
    var arr = EM.ONSETS || [];
    if (!arr.length) return;
    var tiles = ensureBeatTiles();
    var played = notesPlayed(t);
    var live = clamp((1 - EM.WORLD_SIMPLE) * (0.35 + w.density), 0, 1);

    /* The permanent burn is sampled rather than exhaustive. Every cell the song
       has touched is still represented — the pattern is what carries the
       meaning — but stepping every third note keeps this from being the single
       heaviest thing on screen, which at full density it was. The marks are
       long-lived, so a third of them at the same alpha reads almost identically
       while costing a third as much. */
    var BACK = layer === 0 ? 150 : 90;
    var STEP = layer === 0 ? 3 : 1;
    var from = Math.max(0, played - BACK);
    var to = played;

    D.lw(1);
    for (var k = from; k < to; k += STEP) {
      var o = k * 4;
      var cc = tiles[o], rr = tiles[o + 1];
      var pitch = tiles[o + 2], voices = tiles[o + 3];
      var bb = arr[k];
      var age = t - bb[0] / 1000;
      if (age < 0) continue;

      var x = cellX(cc), y = cellY(rr);
      var wcell = CELL_W * 0.80, hcell = CELL_H * 0.72;

      if (layer === 0) {
        /* --- the permanent mark: this cell has been computed on ---------- */
        var burn = Math.pow(1 - clamp(age / 46, 0, 1), 0.55);
        var heavy = clamp(voices / 4, 0, 1);
        var a = (0.05 + burn * 0.16 + heavy * 0.06) * live;
        if (a > 0.004) {
          D.fillColour(rgba(pal.grid, a));
          D.frect(x - wcell / 2, y - hcell / 2, wcell, hcell);
          /* the cell keeps a ruled edge while the world still has rules */
          if (w.struct > 0.22) {
            D.strokeColour(rgba(pal.grid, a * 2.2 * w.struct));
            D.srect(x - wcell / 2, y - hcell / 2, wcell, hcell);
          }
        }
      } else {
        /* --- the live hit: a short bright event on the cell just used ---- */
        var life = 0.42 + (bb[4] / 127) * 0.5;
        if (age > life) continue;
        var q = age / life;
        var hit = Math.pow(1 - q, 2.0);
        var hue = lerp(0.35, 1.0, pitch);          /* low notes cooler */
        var col = EM.mix(pal.accent, pal.hot, hue * 0.55);
        D.fillColour(rgba(col, 0.55 * hit));
        D.frect(x - wcell / 2 * (1 + q * 0.35), y - hcell / 2 * (1 + q * 0.35),
                wcell * (1 + q * 0.35), hcell * (1 + q * 0.35));
        if (w.struct > 0.4 && voices > 1) {
          D.strokeColour(rgba(col, 0.7 * hit * w.struct));
          D.lw(1.4);
          D.srect(x - wcell * 0.62, y - hcell * 0.62, wcell * 1.24, hcell * 1.24);
          D.lw(1);
        }
      }
    }
  }

  /* the wiring between cells that have recently been used: it makes the board
     read as a circuit rather than a spreadsheet */
  function tileWeb(w, pal, t) {
    var arr = EM.ONSETS || [];
    if (!arr.length || w.struct < 0.3) return;
    var tiles = ensureBeatTiles();
    var played = notesPlayed(t);
    var link = clamp((w.struct - 0.3) / 0.5, 0, 1) * clamp(w.density * 1.4, 0, 1);
    if (link < 0.02) return;
    var N = Math.min(26, Math.floor(lerp(4, 26, link)));
    D.lw(0.8);
    D.strokeColour(rgba(pal.accent, 0.10 * link));
    var c = D.ctx();
    c.beginPath();
    for (var k = Math.max(1, played - N); k < played; k++) {
      var a = (k - 1) * 4, b = k * 4;
      c.moveTo(cellX(tiles[a]), cellY(tiles[a + 1]));
      c.lineTo(cellX(tiles[b]), cellY(tiles[b + 1]));
    }
    c.stroke();
  }

  /* a thin crosshair that tracks the cell in use right now */
  function cursor(w, pal, t) {
    var i = EM.onsetIndex(t);
    if (i < 0) return;
    var tiles = ensureBeatTiles();
    var o = i * 4;
    var age = t - (EM.ONSETS[i][0] / 1000);
    var a = clamp(1 - age / 0.45, 0, 1);
    if (a <= 0.01) return;
    var x = cellX(tiles[o]), y = cellY(tiles[o + 1]);
    D.lw(1);
    D.strokeColour(rgba(pal.accent, 0.34 * a));
    D.line(x - CELL_W * 1.6, y, x + CELL_W * 1.6, y);
    D.line(x, y - CELL_H * 1.6, x, y + CELL_H * 1.6);
    D.scircle(x, y, CELL_W * 0.75 * (1 + age * 3));
  }

  /* ==========================================================================
     4. TOPOLOGIES — what the machine currently thinks it is.

     Named shapes rather than a single animated object, so the world can be
     shown *changing its mind* about its own nature: a screen of tiles, a point
     lattice, a wave, something growing, a knot, and finally an open curve.
     ======================================================================== */
  var SHAPES = {

    /* 00:00 - the board is a display, mostly blank, calibrating */
    screen: function (w, pal, t) {
      var c = D.ctx();
      var pulse = EM.onsetPulse(t, 0.34);
      var n = Math.round(lerp(70, 210, w.density));
      for (var i = 0; i < n; i++) {
        var s1 = hash(i * 4421 + 11), s2 = hash(i * 9967 + 23);
        var on = s2 < 0.16 + w.density * 0.5;
        var tw = on ? (0.35 + 0.65 * noise(i * 0.9, t * 0.7)) : 0.06;
        var x = (s1 - 0.5) * W * 0.86;
        var y = (s2 - 0.5) * H * 0.72;
        D.fillColour(rgba(pal.accent, tw * (0.30 + pulse * 0.5)));
        D.frect(x, y, CELL_W * 0.42 * (1 + pulse * 0.8), CELL_H * 0.30);
      }
      /* calibration crosshair + a bar that is still filling */
      D.lw(1);
      D.strokeColour(rgba(pal.accent, 0.22));
      D.scircle(0, 0, lerp(40, 190, E.outCubic(clamp(t / 15, 0, 1))) * U);
      D.reticle(0, 0, 62 * U, t * 0.4);
    },

    /* 00:29 - "if I'm a set of points": a lattice, ordered and proud of it */
    lattice: function (w, pal, t) {
      var c = D.ctx();
      var n = Math.round(lerp(7, 15, w.density));
      var s = 92 * U;
      var pulse = EM.onsetPulse(t, 0.3);
      var pts = [];
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n * 0.62; j++) {
          var x = (i - (n - 1) / 2) * s;
          var y = (j - (n * 0.62 - 1) / 2) * s;
          var d = Math.hypot(x, y) / (n * s * 0.6);
          if (d > 1.04) continue;
          var tw = 0.22 + 0.78 * noise(i * 0.7 + 11, j * 0.7 + t * 0.5);
          var r = (1.1 + tw * 1.6 + pulse * 1.7) * U;
          c.fillStyle = rgba(pal.accent, 0.14 + tw * 0.5);
          c.beginPath();
          c.arc(x, y, Math.max(0.2, r * (1 + w.chaos * tw * 1.6)), 0, TAU);
          c.fill();
          if (d < 0.75) pts.push([x, y]);
        }
      }
      /* the lattice pulls its own points together as order rises */
      var linkA = clamp((w.struct - 0.3) / 0.55, 0, 1);
      if (linkA > 0.02) {
        D.lw(0.8);
        D.strokeColour(rgba(pal.accent, 0.14 * linkA));
        c.beginPath();
        for (var k = 0; k < pts.length; k++) {
          for (var m = k + 1; m < pts.length; m += 5) {
            var dd = Math.hypot(pts[k][0] - pts[m][0], pts[k][1] - pts[m][1]);
            if (dd < s * 1.2) {
              c.moveTo(pts[k][0], pts[k][1]);
              c.lineTo(pts[m][0], pts[m][1]);
            }
          }
        }
        c.stroke();
      }
    },

    /* 00:37 - "if I'm a sine wave": the machine as a signal */
    wave: function (w, pal, t) {
      var c = D.ctx();
      var lines = 9;
      var amp = 62 * U * (1 + w.chaos * 2.2);
      for (var l = 0; l < lines; l++) {
        var u = lines > 1 ? l / (lines - 1) : 0.5;
        var off = (u - 0.5) * H * 0.66;
        var freq = lerp(2.2, 5.4, u) * (1 + w.heat * 0.7);
        var ph = t * (0.7 + u * 0.9) + l;
        D.lw(lerp(1.8, 0.7, u));
        D.strokeColour(rgba(l === 4 ? pal.hot : pal.accent, lerp(0.34, 0.08, Math.abs(u - 0.5) * 2)));
        c.beginPath();
        for (var i = 0; i <= 96; i++) {
          var q = i / 96;
          var x = (q - 0.5) * W * 0.94;
          var y = off + Math.sin(q * freq * TAU + ph) * amp
                + (noise(q * 6 + l, t * 0.6) - 0.5) * 30 * U * w.chaos;
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();
      }
      /* the wave is being measured: tangents and limits marked on it */
      if (w.struct > 0.5) {
        var mx = (noise(t * 0.2, 3) - 0.5) * W * 0.7;
        var my = Math.sin((mx / (W * 0.94) + 0.5) * 5.4 * TAU + t) * amp;
        D.lw(1);
        D.strokeColour(rgba(pal.grid, 0.3));
        D.dim(mx, -H * 0.42, mx, my, (Math.abs(my) / 10).toFixed(1), 26, 13);
      }
    },

    /* 01:14 - "if I'm an eggplant": things start growing */
    organic: function (w, pal, t) {
      var c = D.ctx();
      var n = Math.round(lerp(5, 17, w.rot));
      for (var i = 0; i < n; i++) {
        var s1 = hash(i * 7331 + 5), s2 = hash(i * 3391 + 9), s3 = hash(i * 977 + 3);
        var bx = (s1 - 0.5) * W * 0.8;
        var by = H * 0.42;
        var hgt = (60 + s2 * 300) * U * (0.5 + w.rot);
        var sway = Math.sin(t * (0.5 + s3) + i) * 26 * U * (1 + w.chaos);
        D.lw(lerp(0.9, 2.4, s3));
        D.strokeColour(rgba(EM.mix(pal.accent, pal.love, 0.4), 0.16 + s3 * 0.34));
        var pts = [];
        for (var k = 0; k <= 7; k++) {
          var q = k / 7;
          pts.push([bx + sway * q * q + Math.sin(q * 4 + i) * 12 * U * w.chaos,
                    by - hgt * q]);
        }
        D.smoothStroke(pts, 7);
        /* leaves */
        for (var m = 2; m < 6; m++) {
          var lq = m / 7;
          var lx = bx + sway * lq * lq, ly = by - hgt * lq;
          var side = (m % 2) ? 1 : -1;
          D.lw(1);
          D.strokeColour(rgba(pal.accent, 0.2 + s1 * 0.2));
          c.beginPath();
          c.ellipse(lx + side * 16 * U, ly, 17 * U, 6.5 * U, side * 0.5, 0, TAU);
          c.stroke();
        }
      }
    },

    /* 01:41 - "the trance": everything is knotted together */
    tangle: function (w, pal, t) {
      var c = D.ctx();
      var n = Math.round(lerp(9, 26, w.chaos));
      var nodes = [];
      for (var i = 0; i < n; i++) {
        var a = i / n * TAU + t * (0.08 + w.chaos * 0.25);
        var rr = (110 + hash(i * 4421) * 250) * U * (1 + w.shatter * 0.5);
        nodes.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.78]);
      }
      D.lw(1.1);
      for (var k = 0; k < n; k++) {
        var p = nodes[k], q = nodes[(k * 5 + 3) % n];
        var d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        D.strokeColour(rgba(pal.accent, clamp(0.30 - d / 2600, 0.03, 0.30) * (0.5 + w.chaos * 0.7)));
        /* the links are drawn as curves, not straight rules — the geometry is
           no longer a straight line and that is the point */
        c.beginPath();
        c.moveTo(p[0], p[1]);
        c.quadraticCurveTo((p[0] + q[0]) / 2 + Math.sin(t + k) * 40 * U,
                           (p[1] + q[1]) / 2 + Math.cos(t + k) * 40 * U,
                           q[0], q[1]);
        c.stroke();
      }
      for (var m = 0; m < n; m++) {
        D.fillColour(rgba(pal.hot, 0.3 + hash(m * 131) * 0.4));
        D.dot(nodes[m][0], nodes[m][1], (1.6 + hash(m * 71) * 2.4) * U);
      }
    },

    /* 02:57 - "I am trapped in love": order gone, but no longer cold.
       A single open curve, drawn by hand, with nothing measuring it. */
    open: function (w, pal, t) {
      var c = D.ctx();
      var layers = 7;
      for (var l = 0; l < layers; l++) {
        var s = hash(l * 5501 + 17);
        D.lw(lerp(0.8, 2.6, hash(l * 313 + 7)));
        D.strokeColour(rgba(EM.mix(pal.accent, pal.love, 0.35 + s * 0.5),
                            0.10 + s * 0.26));
        var pts = [];
        for (var i = 0; i <= 8; i++) {
          var q = i / 8;
          var x = (q - 0.5) * W * 0.86;
          var drift = Math.sin(t * (0.18 + s * 0.3) + l) * 40 * U;
          var y = Math.sin(q * TAU * (0.7 + s * 0.7) + t * 0.35 + l * 1.3) * (70 + s * 130) * U
                + drift + (noise(q * 4 + l, t * 0.4) - 0.5) * 50 * U;
          pts.push([x, y]);
        }
        D.smoothStroke(pts, 10);
      }
      /* a slow bloom of soft points, like dust in a projector beam */
      var dots = Math.round(lerp(20, 90, w.love));
      for (var k = 0; k < dots; k++) {
        var s1 = hash(k * 4421 + 41), s2 = hash(k * 9967 + 13);
        var yy = ((s2 * H * 1.4 - t * (10 + s1 * 26)) % (H * 1.4));
        if (yy < -H * 0.7) yy += H * 1.4;
        var xx = (s1 - 0.5) * W * 1.05 + Math.sin(t * 0.4 + s2 * 12) * 40 * U;
        D.fillColour(rgba(pal.love, (0.05 + s1 * 0.22) * clamp((w.love - 0.2) / 0.6, 0, 1)));
        D.dot(xx, yy, (0.9 + s2 * 2.2) * U);
      }
    }
  };

  /* ==========================================================================
     5. PARTICLES / THREADS / DEBRIS
     Each one is a pure function of (index, t): no pool, no lifetime array, no
     state that survives a frame, so a backwards seek renders identically.
     ======================================================================== */
  function particles(w, pal, t) {
    var c = D.ctx();
    /* sparse by design: at 150 these were a snowstorm over the subject */
    var n = Math.round(lerp(0, 90, w.density * (0.4 + w.chaos * 0.7)));
    var drift = 20 + w.chaos * 130;
    for (var i = 0; i < n; i++) {
      var s1 = hash(i * 4421 + 3), s2 = hash(i * 9967 + 41), s3 = hash(i * 131 + 7);
      var span = H * 1.5;
      var yy = ((s2 * span - t * (drift * (0.4 + s3))) % span);
      if (yy < -span / 2) yy += span;
      var xx = (s1 - 0.5) * W * 1.1 + Math.sin(t * (0.3 + s3 * 0.6) + i) * 30 * U * (1 + w.chaos);
      var sz = (0.7 + s3 * 2.3) * U;
      D.fillColour(rgba(s3 > 0.82 ? pal.hot : pal.accent,
                        (0.06 + s1 * 0.28) * (0.5 + w.density)));
      D.dot(xx, yy, sz);
    }
  }

  /* filaments that stitch the frame together while the world still holds */
  function threads(w, pal, t) {
    if (w.struct < 0.28) return;
    var c = D.ctx();
    var n = Math.round(lerp(3, 14, w.struct * w.density));
    D.lw(0.9);
    for (var i = 0; i < n; i++) {
      var s1 = hash(i * 7331 + 5), s2 = hash(i * 3391 + 9);
      D.strokeColour(rgba(pal.grid, (0.05 + s1 * 0.12) * w.struct));
      var pts = [];
      for (var k = 0; k <= 5; k++) {
        var q = k / 5;
        pts.push([(s1 - 0.5) * W + q * (s2 - 0.5) * W * 0.5,
                  (s2 - 0.5) * H + Math.sin(q * 5 + i + t * 0.3) * 40 * U]);
      }
      D.smoothStroke(pts, 6);
    }
  }

  /* fragments thrown clear of the lattice as it breaks up */
  function shards(w, pal, t) {
    if (w.shatter < 0.02) return;
    var n = Math.round(lerp(0, 46, w.shatter));
    D.lw(1);
    for (var i = 0; i < n; i++) {
      var s1 = hash(i * 4421 + 3), s2 = hash(i * 9967 + 41), s3 = hash(i * 131 + 7);
      var a0 = s1 * TAU + t * (0.05 + s3 * 0.25);
      var rr = (180 + s2 * 520) * U * (0.6 + w.shatter * 0.8);
      var x = Math.cos(a0) * rr, y = Math.sin(a0) * rr * 0.7;
      D.fillColour(rgba(pal.grid, 0.20 + s1 * 0.3));
      D.strokeColour(rgba(pal.accent, 0.15 + s2 * 0.3));
      D.shard(s3, x, y, (5 + s1 * 16) * U, a0, w.shatter);
    }
  }

  function vignette(w, pal) {
    var c = D.ctx();
    if (w.heat > 0.05) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = w.heat * 0.15 * (0.7 + 0.3 * Math.sin(w.time * 6));
      c.fillStyle = rgba(pal.hot, 1);
      c.fillRect(-W / 2, -H / 2, W, H);
      c.restore();
    }
    var g = c.createRadialGradient(0, 0, H * 0.30, 0, 0, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.74, 'rgba(0,0,0,0.30)');
    g.addColorStop(1, 'rgba(0,0,0,0.74)');
    c.fillStyle = g;
    c.fillRect(-W / 2, -H / 2, W, H);
  }

  /* --------------------------------------------------------------------------
     HEARTS, AND WHY THEY HAVE TO STOP.

     The parametric heart is the film's sign for the variable it is not supposed
     to have, and it belongs in the LOVE act. But `w.love` reaches 1.0 at 03:11
     and then STAYS there to the end — the world's keyframe curve holds it — so
     a purely state-driven gate meant thirty pink hearts were still drifting
     through the closing minutes, over the outro, over the final inventory, all
     the way to black. In a film whose whole palette is built on a cold monitor
     blue with one warm turn at the end, a drifting field of pink hearts at
     03:27 reads as a different film.

     So the gate is on TIME as well as on state: the hearts peak in the LOVE act
     and are gone well before the closing. The ending cools to paper, not to
     rose. This is a direct consequence of holding one curve to the end —
     anything that switches on partway through and never switches off has to be
     given an explicit exit.
     ------------------------------------------------------------------------ */
  function loveGlyphs(w, pal, t) {
    if (w.love < 0.22) return;
    /* a hard close: full through the LOVE act, gone by 03:12 */
    var late = 1 - clamp((t - 190.0) / 5.0, 0, 1);
    if (late <= 0.01) return;
    var n = Math.round(lerp(0, 30, (w.love - 0.22) / 0.78) * late);
    for (var i = 0; i < n; i++) {
      var s1 = hash(i * 4421 + 3), s2 = hash(i * 9967 + 41);
      var span = H * 1.4;
      var yy = ((s2 * span - t * (14 + s1 * 26)) % span);
      if (yy < -span / 2) yy += span;
      var xx = (s1 - 0.5) * W * 1.05 + Math.sin(t * 0.45 + s2 * 12) * 36 * U;
      var sc = (7 + s2 * 17) * U;
      D.lw(1.3);
      D.strokeColour(rgba(pal.love, (0.05 + s1 * 0.26)
        * clamp((w.love - 0.22) / 0.5, 0, 1) * late));
      D.heart(xx, yy, sc);
    }
  }

  /* ==========================================================================
     5b. THE BREATHING ENVELOPE.

     This exists because of a real note on the finished film: "there is not a
     single gap in the middle, the longer I watch the more it suffocates."

     That was my doing. Fixing the empty frames had been done by ADDING — a
     permanent annotation floor, a denser lattice, more read-outs — and the
     result was a film with no negative space left in it. Density with no rest is
     exhausting, and exhaustion is not intensity.

     So the whole middle of the piece now breathes on a slow envelope: the
     annotation layer and the world layer both duck to roughly 45% for a few
     seconds and open back up, on a period long enough (about 15 s) that it reads
     as phrasing rather than as a pulse.

       · it ducks HARDEST through the execution storm, which is the densest part
         of the film and the part most in need of air around it;
       · it never closes completely, because the film still must not have an
         empty frame;
       · it is a pure function of t, so seeking reproduces it exactly.

     Anything that is loud for three and a half minutes stops being loud. The
     rest is what makes the loud parts loud.
     ======================================================================== */
  function breath(t) {
    /* two slow, incommensurable periods so the phrasing never lines up with the
       bars and never becomes a metronome the ear can predict */
    var b = 0.72 + 0.28 * Math.sin(t * 0.4189 + 1.15) * 0.6
                 + 0.28 * Math.sin(t * 0.2713) * 0.4;
    /* extra air exactly where the film is busiest */
    if (t > 145 && t < 178) b -= 0.16;
    if (t > 128 && t < 136) b -= 0.08;
    return clamp(b, 0.46, 1);
  }

  /* ==========================================================================
     4b. THE SEESAW.

     The world does not simply sit at the keyframed tilt. It ROCKS about the
     centre of the frame — the origin of the stage is the fulcrum, and the whole
     scene swings either side of it like a plank on a pivot.

     Three properties matter, and each was a note from watching it:

       · it is a SINE, not a linear ramp, so it decelerates into each extreme
         and accelerates through the middle. Nothing arrives abruptly.
       · the FREQUENCY and PHASE drift slowly, so the rocking never settles into
         a metronome. A perfectly periodic tilt reads as a machine fault; a
         slowly wandering one reads as something breathing.
       · the amplitude is a function of the world state, so the swing grows as
         the film loses its order and settles in the warm act.

     Pure function of t, so a seek lands at exactly the same angle.
     ======================================================================== */
  function seesaw(w, t) {
    /* two incommensurable periods: the sway never repeats exactly */
    var slow = Math.sin(t * 0.0432) * 0.55 + Math.sin(t * 0.0171 + 1.3) * 0.45;
    /* the eased swing: squared keeps the dwell at the extremes longer */
    var s = Math.sign(slow) * Math.pow(Math.abs(slow), 1.45);
    var amp = 1.55 + w.chaos * 2.6 + w.love * 1.5;      /* degrees */
    return s * amp;
  }

  /* how far the whole scene is shifted sideways as it swings, so the motion
     reads as a pivot rather than a rotation about the screen centre */
  function seesawShift(w, t) {
    return Math.sin(t * 0.0432) * 42 * U * (0.5 + w.chaos);
  }

  /* ==========================================================================
     SUBORDINATION — one gain, applied inside each background element.

     The background was swallowing the subject: measured, this layer was making
     60-75% of every frame's drawing calls while the plate made 2-17%. Rather
     than retune a hundred alpha literals, every background element runs its
     body with the context alpha multiplied by GAIN. Nested alpha assignments
     inside those bodies then compound correctly, so a line that wanted 0.2 is
     drawn at 0.2 * GAIN.

     NOT applied to bg() (the backdrop must paint the frame to full black) or to
     vignette() (the falloff must stay full strength or the frame goes flat).
     Everything in between is background by construction.
     ======================================================================== */
  function faint(fn, scale) {
    var c = D.ctx();
    c.save();
    c.globalAlpha = c.globalAlpha * GAIN * (scale === undefined ? 1 : scale);
    fn();
    c.restore();
  }

  /* --------------------------------------------------------------------------
     `near` — for the SUBJECT, not the surroundings.

     GAIN is right for everything that is background: the depth shells, the grid
     plane, the burn marks, the threads, the particles, the annotation. It is
     WRONG for the topology shape, which is the film's own central figure at any
     given moment. Rolling that into GAIN as well left the lattice, the wave and
     the open curve sitting at 40% strength, which is over-subordination: the
     point of pushing the backdrop back is so the subject can be SEEN.

     So the shape is drawn at full strength, modulated only by the breathing
     envelope so it still has room around it.
     ------------------------------------------------------------------------ */
  function near(fn, scale) {
    var c = D.ctx();
    c.save();
    c.globalAlpha = c.globalAlpha * (scale === undefined ? 1 : scale);
    fn();
    c.restore();
  }

  /* ==========================================================================
     MAIN DRAW
     ======================================================================== */
  function draw(w, pal, t) {
    var c = D.ctx();
    /* one value governs how much of the machine is visible this second */
    var br = breath(t);

    bg(w, pal, t);
    faint(function () { depth(w, pal, t); }, br);
    faint(function () { gridField(w, pal, t); }, br);

    /* the lattice sits under the topology: it is the substrate everything is
       computed on, so it stays visible at every point of the song */
    faint(function () { tileField(w, pal, t, 0); }, br);

    var shape = SHAPES[w.topo] || SHAPES.screen;
    var tilt = w.tilt + seesaw(w, t);
    c.save();
    c.translate(seesawShift(w, t), w.vert * -H * 0.02);
    c.rotate(tilt * Math.PI / 180);
    var zoom = lerp(1, w.scale, 0.5);
    c.scale(zoom, zoom);
    if (w.shatter > 0.01) {
      c.translate((hash(Math.floor(t * 9) * 31) - 0.5) * w.shatter * 16 * U,
                  (hash(Math.floor(t * 9) * 61) - 0.5) * w.shatter * 16 * U);
    }
    faint(function () { tileWeb(w, pal, t); }, br);
    faint(function () { threads(w, pal, t); }, br);
    near(function () { shape(w, pal, t); }, br);
    c.restore();

    /* debris and particles follow the board as it swings, so the swing is a
       property of the world rather than a transform on one layer */
    c.save();
    c.translate(seesawShift(w, t) * 0.5, 0);
    c.rotate(seesaw(w, t) * 0.5 * Math.PI / 180);
    faint(function () { shards(w, pal, t); }, br);
    faint(function () { particles(w, pal, t); }, br);
    c.restore();

    /* the live hits go on top of everything so an accent always reads, at full
       strength: a note landing is an event and events are not background */
    tileField(w, pal, t, 1);
    cursor(w, pal, t);

    if (w.love > 0.22) faint(function () { loveGlyphs(w, pal, t); });

    /* ANNOTATION LAYER — the always-moving floor that keeps the frame alive in
       quiet passages, carrying the machine's real read-outs. Dimmed during the
       loudest stretches so it never competes with the storm, and modulated by
       the breathing envelope so the film has room to be looked at rather than
       only room to be filled. */
    var dim = (1 - clamp((w.heat - 0.55) / 0.45, 0, 1) * 0.72) * br;
    if (EM.Annotate) {
      faint(function () { EM.Annotate.draw(w, t, dim, EM.Lyrics.at(t)); });
    }

    vignette(w, pal);
  }

  EM.WorldLayer = {
    draw: draw,
    frame: frame,
    SHAPES: SHAPES,
    seesaw: seesaw,
    breath: breath,
    COLS: COLS,
    ROWS: ROWS,
    cellX: cellX,
    cellY: cellY,
    cellSize: function () { return { w: CELL_W, h: CELL_H }; },
    notesPlayed: notesPlayed,
    tileOf: function (k) {
      ensureBeatTiles();
      return { c: BEAT_TILE[k * 4], r: BEAT_TILE[k * 4 + 1] };
    }
  };
})(window.EM);
