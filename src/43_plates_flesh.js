/* ============================================================================
   src/43_plates_flesh.js — ACT III · FLESH        01:14.0 - 01:43.5

   "If I'm an eggplant / Then I will give you my NUTRIENTS / If I'm a tomato /
    Then I'll give you ANTIOXIDANTS / If I'm a tabby cat / Then I will purr for
    your ENJOYMENT / If I'm the only god / Then you're the proof of my
    EXISTENCE / Switch my gender / To F, to M / And then do whatever / From AM to
    PM / Oh, switch my role / To S, to M / So we can enter / The trance, the
    trance"

   THIS IS WHERE THE FILM CRACKS.

   The grammar of this act is the same conditional the theorems act already
   spent three minutes proving — "if I'm X, then you get Y" — and the machine
   is still holding up the instruments it used on sets, circles and sine waves.
   What has changed is the nouns. An eggplant. A tomato. A tabby cat. A god.
   Words for living things, arriving through a specification pipeline that was
   never built to carry them.

   So the pictures are the measurement apparatus of the earlier acts, left
   running, with something alive growing through it. A botanical cutaway drawn
   as an engineering section, with a parts list and a section line, because that
   is the only way this machine knows how to describe a vegetable. Vines laid
   over a schematic. Vitamins plotted as a graph. The instrument is precise,
   patient and completely out of its depth — and it does not know.

   The second half (gn.*) is the machine trying identities on. Gender, role,
   AM/PM, S/M: a control panel with sliders on it, being operated, each
   parameter a value the machine has decided it can simply set. The repetition
   is the point — gn.gender and gn.role are deliberately the SAME instrument
   twice, which is what obsession looks like from the outside. By gn.trance the
   panel is doubling, ghosting, losing its own grid: the same shapes at several
   sizes with no subject left, and the act ends in repetition rather than in a
   conclusion.

   Two registers run through the file and are worth naming once here:

     · PAL().love — the organic pink. It appears for the first time in this film
       in this act, and it is used sparingly: the flesh inside a section, the
       cat, the purr, the trance. Everywhere at once would mean nothing.
     · the apparatus — the dashed section line, the dimension, the callout, the
       leader line, the register read-out. Every plate is built ON it, including
       the ones where it has stopped making sense.

   20 plates.  e(w, p, cue)   w = world state, p = 0..1 through this line
   ==========================================================================*/
(function (EM) {
  'use strict';

  var S = EM.Scenes, D = EM.D, E = EM.E, TAU = EM.TAU, M = EM.M;
  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash, noise = EM.noise2;
  var vis = EM.Life.vis, stag = EM.Life.stagger, between = EM.Life.between;

  /* Stage constants. Declared in every plate file on purpose: one stage unit is
     one drawing unit because the renderer has already applied the letterbox
     transform, and a plate that referenced a constant it did not declare would
     throw rather than quietly draw nothing. */
  var W = 1600, H = 900, U = 1;

  function PAL() { return EM.__pal; }
  function green() { return [124, 226, 150]; }   /* chlorophyll / growing */
  function violet() { return [150, 116, 220]; }  /* the eggplant's own colour */

  /* ==========================================================================
     THE APPARATUS

     The instruments this act inherits from the theorem act: the drafting bed
     everything is laid out on, and the cutaway mark the machine makes when it
     wants to know what a thing is made of. Both live HERE rather than in each
     plate so that a vegetable, a cat and a control panel are visibly being
     inspected by the same hand.
     ======================================================================== */

  /* the drafting bed, plus a plot number. Every plate in the act sits on one. */
  function bed(a, no, opt) {
    opt = opt || {};
    var cell = opt.cell || 50 * U;
    var g = opt.ga === undefined ? 0.16 : opt.ga;
    D.lw(0.8);
    D.strokeColour(rgba(PAL().grid, g * a));
    D.grid(-W / 2, -H / 2, W, H, cell, g * a);
    M.banner('FLESH · ' + (no < 10 ? '0' : '') + no, -W * 0.40, -H * 0.40,
      { px: 13, a: a * 0.7, align: 'left', track: 3 });
    if (opt.note) {
      M.sub(opt.note, -W * 0.40, -H * 0.40 + 20 * U,
        { px: 11, a: a * 0.5, align: 'left' });
    }
  }

  /* a dimension line, wrapped so every plate states its alpha once */
  function measureLine(x1, y1, x2, y2, label, off, a, labelPx) {
    if (a <= 0.004) return;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.lw(1);
    D.strokeColour(rgba(PAL().accent, 0.55));
    D.dim(x1, y1, x2, y2, label, off || 0, labelPx || 12);
    D.ctx().globalAlpha = prev;
  }

  /* --------------------------------------------------------------------------
     oellipse(cx, cy, rx, ry, rot, seed, amp)

     The outline of a living thing, drawn the way this machine would draw it: an
     ellipse first, then a small deterministic wobble from noise2, then
     Catmull-Rom through the points. amp = 0 gives the pure instrument ellipse;
     amp = 0.12 gives something unmistakably not a machine's. Plates choose the
     amp, which is the whole joke of the act.
     ------------------------------------------------------------------------ */
  function oellipse(cx, cy, rx, ry, rot, seed, amp) {
    var n = 34, out = [], i, th, r1, r2, wob;
    for (i = 0; i < n; i++) {
      th = i / n * TAU;
      r1 = Math.cos(th) * rx;
      r2 = Math.sin(th) * ry;
      wob = 1 + (amp || 0) * (noise(seed + Math.cos(th) * 1.7, seed + Math.sin(th) * 1.7) - 0.5) * 2;
      out.push([cx + (r1 * Math.cos(rot) - r2 * Math.sin(rot)) * wob,
                cy + (r1 * Math.sin(rot) + r2 * Math.cos(rot)) * wob]);
    }
    out.push([out[0][0], out[0][1]]);
    return out;
  }

  /* a closed smooth shape: smoothStroke builds the path, the caller has already
     set fillColour, and the fill happens here so the shape is one object */
  function shapeFill(pts, samples) {
    D.smoothStroke(pts, samples || 10);
    D.ctx().fill();
  }
  function shapeStroke(pts, samples) {
    D.smoothStroke(pts, samples || 10);
  }

  /* the dashed section line: the mark that says "this drawing is a cut" */
  function sectionLine(x1, y1, x2, y2, a, label) {
    if (a <= 0.004) return;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.lw(1.3);
    D.dash([14, 5, 3, 5]);
    D.strokeColour(rgba(PAL().hot, 0.55));
    D.line(x1, y1, x2, y2);
    D.dash([]);
    /* heavy end ticks: the drafting convention for a cutting plane */
    D.lw(2.4);
    D.strokeColour(rgba(PAL().hot, 0.85));
    D.line(x1, y1 - 10, x1, y1 + 10);
    D.line(x2, y2 - 10, x2, y2 + 10);
    if (label) M.sub(label, x1 - 8, y1 - 16, { px: 11, a: a * 0.85, align: 'right' });
    D.ctx().globalAlpha = prev;
  }

  /* a parts-list row: name, dotted leader, quantity. The machine's inventory
     voice, reused from the boot act because it has not learned another one. */
  function partRow(name, note, x, y, a, lw) {
    if (a <= 0.004) return;
    D.lw(1);
    D.strokeColour(rgba(PAL().grid, 0.42 * a));
    D.dash([1, 3]);
    D.line(x + D.measure(name, 12) + 6, y - 3, x + (lw || 250), y - 3);
    D.dash([]);
    M.sub(name, x, y, { px: 12, a: a * 0.95, align: 'left' });
    M.sub(note, x + (lw || 250) + 8, y, { px: 12, a: a * 0.8, align: 'left' });
  }

  /* a vine: a sagging curve crossing the frame, with leaves and tendrils. The
     living thing and the schematic sharing the same pixels. */
  function vine(x0, y0, x1, y1, seed, a, opt) {
    opt = opt || {};
    if (a <= 0.004) return;
    var prev = D.ctx().globalAlpha;
    var pts = [], n = 7, i, u, sag;
    for (i = 0; i <= n; i++) {
      u = i / n;
      sag = Math.sin(u * Math.PI) * (opt.sag === undefined ? 60 : opt.sag)
          + (noise(seed + u * 3.1, seed * 0.5) - 0.5) * 44;
      pts.push([lerp(x0, x1, u), lerp(y0, y1, u) - sag]);
    }
    D.ctx().globalAlpha = clamp(a, 0, 1);
    D.lw(opt.width || 1.6);
    D.strokeColour(rgba(opt.colour || green(), 0.42));
    D.smoothStroke(pts, 9);
    /* leaves: small alternating pairs, hashed so each vine is its own plant */
    D.lw(1.1);
    for (i = 1; i < n; i++) {
      var side = i % 2 ? 1 : -1;
      var lx = pts[i][0], ly = pts[i][1];
      var ll = 12 + hash(seed * 977 + i * 131) * 16;
      var ang = Math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0])
              + side * Math.PI / 2;
      D.strokeColour(rgba(opt.colour || green(), 0.30));
      D.ctx().beginPath();
      D.ctx().moveTo(lx, ly);
      D.ctx().quadraticCurveTo(lx + Math.cos(ang) * ll * 0.7, ly + Math.sin(ang) * ll * 0.7,
        lx + Math.cos(ang) * ll + Math.cos(ang + side * 1.4) * ll * 0.5,
        ly + Math.sin(ang) * ll + Math.sin(ang + side * 1.4) * ll * 0.5);
      D.ctx().stroke();
    }
    D.ctx().globalAlpha = prev;
  }

  /* ==========================================================================
     THE CONTROL PANEL

     One instrument, used twice on purpose (gn.gender and gn.role). A slider is
     the machine's idea of a self: a parameter with two named ends and a value
     that can be dragged. Everything in the second half of the act sits on it.
     ======================================================================== */
  var CP = { x: -W * 0.38, y: -H * 0.20, w: W * 0.76, h: H * 0.40 };

  function controlPanel(a, title, subline) {
    if (a <= 0.004) return CP;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    var x = CP.x, y = CP.y, w = CP.w, h = CP.h;
    /* the desk the instrument sits on */
    D.lw(1);
    D.strokeColour(rgba(PAL().grid, 0.5));
    D.srect(x, y, w, h);
    D.strokeColour(rgba(PAL().grid, 0.20));
    D.srect(x + 3, y + 3, w - 6, h - 6);
    /* bezel hatching: a physical panel, not a diagram */
    D.lw(1);
    D.strokeColour(rgba(PAL().grid, 0.10));
    for (var i = 0; i < 24; i++) {
      var hx = x + 12 + i * (w - 24) / 24;
      D.line(hx, y + 6, hx + 10, y + 18);
      D.line(hx, y + h - 6, hx + 10, y + h - 18);
    }
    D.ctx().globalAlpha = prev;
    M.banner(title, x + 22, y + 30, { px: 15, a: a, align: 'left', track: 3.2 });
    if (subline) M.sub(subline, x + 22, y + 50, { px: 11, a: a * 0.6, align: 'left' });
    return CP;
  }

  /* slider(cy, loLabel, hiLabel, v, a, opts)
     v = -1..1, 0 at the centre notch. Returns the handle's x, so a plate can
     hang a callout off it. */
  function slider(cy, loLabel, hiLabel, v, a, opts) {
    opts = opts || {};
    if (a <= 0.004) return 0;
    var prev = D.ctx().globalAlpha;
    D.ctx().globalAlpha = clamp(a, 0, 1);
    var x0 = CP.x + 110, x1 = CP.x + CP.w - 110, w = x1 - x0, mid = (x0 + x1) / 2;
    /* slot */
    D.lw(1);
    D.strokeColour(rgba(PAL().grid, 0.6));
    D.line(x0, cy, x1, cy);
    D.line(x0, cy - 9, x0, cy + 9);
    D.line(x1, cy - 9, x1, cy + 9);
    /* graduations, with a longer notch at the centre */
    for (var i = 0; i <= 20; i++) {
      var gx = x0 + w * i / 20;
      var big = i % 5 === 0;
      D.lw(big ? 1.4 : 1);
      D.strokeColour(rgba(big ? PAL().accent : PAL().grid, big ? 0.6 : 0.35));
      D.line(gx, cy - (big ? 9 : 5), gx, cy + (big ? 9 : 5));
    }
    D.lw(1.6);
    D.strokeColour(rgba(PAL().grid, 0.75));
    D.line(mid, cy - 13, mid, cy + 13);
    /* travel: where the handle has already been */
    var hx = mid + clamp(v, -1, 1) * w * 0.5;
    D.lw(3);
    D.strokeColour(rgba(PAL().accent, 0.85));
    D.line(mid, cy, hx, cy);
    /* handle */
    D.lw(2);
    D.strokeColour(rgba(PAL().accent, 0.95));
    D.fillColour(rgba(PAL().accent, 0.35));
    D.srect(hx - 7, cy - 15, 14, 30);
    D.frect(hx - 7, cy - 15, 14, 30);
    /* the two names, at the two ends */
    D.font(19, '600');
    D.ctx().textAlign = 'center';
    D.ctx().textBaseline = 'alphabetic';
    D.fillColour(rgba(PAL().ink, 0.95));
    D.text(loLabel, x0 - 4, cy + 34);
    D.text(hiLabel, x1 + 4, cy + 34);
    if (opts.grip) {
      /* the thing holding the handle — a machine operating its own slider */
      D.lw(1.4);
      D.strokeColour(rgba(PAL().hot, 0.7));
      D.srect(hx - 18, cy - 38, 36, 16);
      D.line(hx, cy - 22, hx, cy - 15);
    }
    if (opts.trace) {
      D.dash([2, 3]);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.35));
      D.line(hx, cy - 15, hx, CP.y + CP.h - 46);
      D.dash([]);
    }
    D.ctx().globalAlpha = prev;
    return hx;
  }

  /* ==========================================================================
     01:14.045 — If I'm an eggplant

     NOT A VEGETABLE. An earlier version of this plate drew a botanical
     cross-section of an aubergine, and it was wrong twice over: a literal
     vegetable sits badly against a film whose whole language is mathematical,
     and drawing one badly is worse than not drawing one.

     The line is a conditional — "if I am X, then I yield Y". What makes it the
     first crack in the song is that X is a LIVING noun instead of a geometric
     one. That does not require a picture of the noun. It requires the machine
     to be handed a parameter set it has no schema for.

     So: a parameter table with entries it can only partially classify, plus a
     state VECTOR being resolved into components, and a nutrient YIELD function
     plotted against time. The unknown fields are marked, not illustrated.
     ======================================================================== */
  S('fl.eggplant', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 1, { note: 'PARAMETER SET 01 · UNCLASSIFIED' });
    } },

    { l: 40, e: function (w, p) {
      var a = vis(p, 0.18);
      var cx = -W * 0.16, cy = -20 * U, r = 170 * U;

      /* a state VECTOR resolved into its components, drawn as a fan of basis
         arrows from one origin — the machine taking something whole apart */
      var build = E.outCubic(clamp(p / 0.6, 0, 1));
      var comps = [
        { s: 'm', w: 0.72, c: 'accent' }, { s: 'e', w: 0.55, c: 'accent' },
        { s: 'g', w: 0.40, c: 'love' }, { s: 't', w: 0.28, c: 'grid' }
      ];
      D.fillColour(rgba(PAL().grid, 0.7 * a));
      D.fcircle(cx, cy, 3.4 * U);
      for (var i = 0; i < comps.length; i++) {
        var ang = -0.9 + i * 0.45;
        var len = r * comps[i].w * build;
        var ex = cx + Math.cos(ang) * len, ey = cy + Math.sin(ang) * len;
        var col = comps[i].c === 'accent' ? PAL().accent
                : (comps[i].c === 'love' ? PAL().love : PAL().grid);
        D.lw(2);
        D.strokeColour(rgba(col, 0.8 * a));
        D.line(cx, cy, ex, ey);
        D.arrowHead(ex, ey, ang, 10);
        M.sub(comps[i].s, ex + Math.cos(ang) * 14, ey + Math.sin(ang) * 14,
          { px: 13, a: a * 0.85 });
      }
      /* the resultant, which is what the machine actually reports */
      var rq = clamp((p - 0.5) / 0.35, 0, 1);
      if (rq > 0.01) {
        var rang = -0.32;
        D.lw(2.4);
        D.strokeColour(rgba(PAL().hot, 0.85 * a * rq));
        D.line(cx, cy, cx + Math.cos(rang) * r * 0.92 * rq,
               cy + Math.sin(rang) * r * 0.92 * rq);
        M.callout(cx + Math.cos(rang) * r * 0.92, cy + Math.sin(rang) * r * 0.92,
          cx + 120 * U, cy - 210 * U, 'resultant · 1.04', { a: a * rq });
      }

      /* a live rotating basis frame, so the centre is never still */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.30 * a));
      D.ctx().save();
      D.ctx().translate(cx, cy);
      D.ctx().rotate(w.time * 0.28);
      for (var k = 0; k < 5; k++) {
        var rr = r * (0.5 + k * 0.14);
        D.ctx().beginPath();
        D.ctx().ellipse(0, 0, rr, rr * 0.34, 0, 0, TAU);
        D.ctx().stroke();
      }
      D.ctx().restore();
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.18);
      /* the parameter table. The machine has a schema for every entry except
         the ones that matter, and it says so rather than guessing. */
      var px = W * 0.06, py = -H * 0.28;
      var rows = [
        ['mass',      '1.000',  'kg'],
        ['energy',    '3.180',  'J'],
        ['growth',    '0.042',  '1/s'],
        ['nutrient',  '0.970',  'g/kg'],
        ['antiox',    '0.148',  'g/kg'],
        ['cell',      'UNKNOWN', '']
      ];
      for (var i = 0; i < rows.length; i++) {
        var q = stag(p, i, rows.length, 0.55);
        if (q <= 0.01) continue;
        var y = py + i * 23;
        var unknown = rows[i][1] === 'UNKNOWN';
        M.register(rows[i][0], rows[i][1], px, y,
          { a: a * q, width: 320, px: 12.5,
            colour: rgba(unknown ? PAL().hot : PAL().accent, 0.95) });
        if (rows[i][2]) {
          D.ctx().globalAlpha = a * q * 0.7;
          D.font(11);
          D.fillColour(rgba(PAL().grid, 0.9));
          D.text(rows[i][2], px + 330, y);
          D.ctx().globalAlpha = 1;
        }
      }
      /* the yield function: what the conditional actually promises */
      var fq = clamp((p - 0.55) / 0.35, 0, 1);
      if (fq > 0.01) {
        var gx = px, gy = py + rows.length * 23 + 26;
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.4 * a * fq));
        D.line(gx, gy, gx + 300 * U, gy);
        D.lw(1.8);
        D.strokeColour(rgba(PAL().love, 0.85 * a * fq));
        var c = D.ctx();
        c.beginPath();
        for (var k = 0; k <= 40; k++) {
          var u = k / 40;
          var xx = gx + u * 300 * U;
          var yy = gy - (1 - Math.exp(-2.2 * u)) * 54 * U * fq;
          if (k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
        }
        c.stroke();
        M.sub('yield(t) = 1 - e^(-2.2t)', gx + 300 * U, gy - 64 * U,
          { px: 11.5, a: a * fq * 0.85, align: 'right' });
      }
    } },

    { l: 76, e: function (w, p) {
      var a = vis(p, 0.18);
      var px = -W * 0.44, py = H * 0.20;
      var rows = [
        ['01  SCHEMA', 'MISSING'],
        ['02  CLASS', 'ORGANIC?'],
        ['03  HANDLE', 'unsafe']
      ];
      for (var i = 0; i < rows.length; i++) {
        partRow(rows[i][0], rows[i][1], px, py + i * 24, a * stag(p, i, rows.length, 0.5), 240);
      }
      M.register('rule violation', 'TYPE-1', px, py + 3 * 24, { a: a, width: 240 });
    } }
  ]);

  /* ==========================================================================
     01:15.422 — Then I will give you my
     The transfer itself. A bar leaves a bracket drawn as a hand on the left and
     is handed across the frame; the receiver's gauge fills as it lands. The
     machine can draw a hand. It has simply never needed to until now.
     ======================================================================== */
  S('fl.giveD', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 2, { note: 'PLATE 02 · TRANSFER  /  VECTOR —' });
      vine(W * 0.48, -H * 0.44, W * 0.10, H * 0.34, 8.1, a * 0.7, { sag: 30 });
    } },

    { l: 45, e: function (w, p) {
      var a = vis(p, 0.18);
      var q = E.outCubic(clamp(p / 0.72, 0, 1));
      var x0 = -W * 0.30, x1 = W * 0.22;
      var bx = lerp(x0, x1, q);
      var by = 20 * U - Math.sin(q * Math.PI) * 40 * U;
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a, 0, 1);

      /* the flight path, and the hand-over line under it */
      D.lw(1);
      D.dash([3, 4]);
      D.strokeColour(rgba(PAL().grid, 0.5));
      D.line(x0, 20 * U, x1, 20 * U);
      D.dash([]);

      /* the giver's hand: a bracket, drawn as a component */
      D.lw(1.6);
      D.strokeColour(rgba(PAL().grid, 0.8));
      D.ctx().beginPath();
      D.ctx().moveTo(x0 - 70 * U, 20 * U);
      D.ctx().lineTo(x0 - 24 * U, 20 * U);
      D.ctx().lineTo(x0 - 24 * U, -2 * U);
      D.ctx().lineTo(x0 - 4 * U, -2 * U);
      D.ctx().stroke();
      D.ctx().beginPath();
      D.ctx().moveTo(x0 - 70 * U, 20 * U);
      D.ctx().lineTo(x0 - 24 * U, 20 * U);
      D.ctx().lineTo(x0 - 24 * U, 42 * U);
      D.ctx().lineTo(x0 - 4 * U, 42 * U);
      D.ctx().stroke();
      M.sub('releasing', x0 - 60 * U, -24 * U, { px: 11, a: a * 0.7, align: 'left' });

      /* the receiver's slot: dashed, waiting, and then not waiting */
      D.lw(1.4);
      D.dash([5, 4]);
      D.strokeColour(rgba(PAL().accent, 0.6));
      D.srect(x1 - 6 * U, -34 * U, 96 * U, 108 * U);
      D.dash([]);

      /* the thing being handed over */
      D.ctx().save();
      D.ctx().translate(bx, by);
      D.ctx().rotate((1 - q) * 0.22);
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.95));
      D.fillColour(rgba(PAL().accent, 0.18));
      D.srect(-50 * U, -15 * U, 100 * U, 30 * U);
      D.ctx().fill();
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.7));
      for (var i = -1; i <= 1; i++) D.line(i * 22 * U, -15 * U, i * 22 * U, 15 * U);
      D.ctx().restore();
      D.ctx().globalAlpha = prev;
    } },

    { l: 66, e: function (w, p) {
      var a = vis(p, 0.18);
      var q = E.outCubic(clamp((p - 0.35) / 0.55, 0, 1));
      M.gauge(W * 0.06, H * 0.26, 380 * U, 14 * U, q,
        'received  ' + (q * 100).toFixed(1) + ' %',
        { a: a, colour: rgba(PAL().accent, 0.9) });
      M.register('nutrient', 'N · P · K', W * 0.06, H * 0.26 - 34 * U,
        { a: a * between(p, 0.2, 0.95), width: 250 });
      M.register('benefit', q > 0.98 ? 'TRANSFERRED' : 'IN TRANSIT',
        W * 0.06, H * 0.26 - 56 * U,
        { a: a, width: 250, colour: rgba(q > 0.98 ? PAL().accent : PAL().hot, 0.95) });
      M.banner('THEN I WILL GIVE YOU MY', 0, -H * 0.36,
        { px: 17, a: a * 0.85, rule: true, track: 3.2 });
    } }
  ]);

  /* ==========================================================================
     01:16.959 — NUTRIENTS
     The nutrients leaving the shape and measured on the way out: a pour from
     the cutaway above, landing as a bar chart with values on it. The machine
     will quantify anything it is given, which is both its gift and its
     blindness.
     ======================================================================== */
  S('fl.nutrients', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.16);
      bed(a, 3, { note: 'PLATE 03 · ASSAY', ga: 0.13 });
      vine(-W * 0.46, -H * 0.42, W * 0.28, -H * 0.20, 12.5, a * 0.6, { sag: 24, width: 1.3 });
    } },

    { l: 42, e: function (w, p) {
      var a = vis(p, 0.16);
      var q = E.outCubic(clamp(p / 0.5, 0, 1));
      /* the pour: droplets leaving the shape and falling to the baseline */
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a * q, 0, 1);
      D.lw(1);
      D.strokeColour(rgba(PAL().accent, 0.45));
      for (var i = 0; i < 26; i++) {
        var s1 = hash(i * 3391 + 5), s2 = hash(i * 733 + 91);
        var sx = -W * 0.34 + s1 * 120 * U;
        var sy = -H * 0.30 - s2 * 120 * U * (0.4 + q);
        D.dot(sx + Math.sin(w.time * 2 + i) * 3, sy, 1.6);
      }
      D.ctx().globalAlpha = prev;
      M.spray(4.2, -W * 0.28, -H * 0.24, 40, 120 * U,
        { colour: rgba(green(), 0.5 * a * q), size: 0.8 });
      M.sub('eluted', -W * 0.28, -H * 0.24 - 150 * U, { px: 11, a: a * q * 0.7 });
    } },

    { l: 58, e: function (w, p) {
      var a = vis(p, 0.16);
      var vals = [0.86, 0.62, 0.34, 0.24, 0.18];
      var names = ['K', 'Mg', 'Fe', 'B9', 'C'];
      var real = ['507 mg', '21 mg', '0.4 mg', '34 µg', '3.1 mg'];
      var x0 = -W * 0.28, base = H * 0.18, step = 108 * U, scale = 260 * U;
      D.lw(1.4);
      D.strokeColour(rgba(PAL().grid, 0.7 * a));
      D.line(x0 - 40 * U, base, x0 + vals.length * step + 20 * U, base);
      for (var i = 0; i < vals.length; i++) {
        var q = stag(p, i, vals.length, 0.55);
        if (q <= 0.01) continue;
        var h = vals[i] * scale * E.outCubic(q);
        var x = x0 + i * step;
        D.lw(1.6);
        D.strokeColour(rgba(PAL().accent, 0.85));
        D.fillColour(rgba(i === 0 ? green() : PAL().accent, 0.14 + (i === 0 ? 0.16 : 0)));
        D.srect(x - 26 * U, base - h, 52 * U, h);
        D.ctx().fill();
        /* the measured band across the top of the sample */
        D.fillColour(rgba(green(), 0.6 * q));
        D.frect(x - 26 * U, base - h, 52 * U, Math.max(1, h * 0.10));
        M.sub(names[i], x, base + 22 * U, { px: 14, a: a * q, weight: '600' });
        M.sub(real[i], x, base + 40 * U, { px: 11, a: a * q * 0.8 });
      }
      M.register('peak', 'K  507 mg / 100 g', -W * 0.38, -H * 0.34, { a: a, width: 260 });
      M.register('source', 'SAMPLE 01', -W * 0.38, -H * 0.34 + 20, { a: a, width: 260 });
      M.gauge(-W * 0.32, -H * 0.26, 420 * U, 10 * U,
        Math.abs(Math.sin(w.time * 0.8)) * 0.5 + 0.5, 'assayed',
        { a: a * 0.9, colour: rgba(PAL().accent, 0.85) });
    } },

    { l: 74, e: function (w, p) {
      var a = vis(p, 0.18);
      M.keyword('NUTRIENTS', 0, -H * 0.32, {
        a: a, px: 50, weight: '700', fill: rgba(green(), 0.95), track: 3
      });
    } }
  ]);

  /* ==========================================================================
     01:17.576 — If I'm a tomato

     The same conditional as the previous line, so the picture is the same KIND
     of object: where the first was a parameter set, this is the FUNCTION that
     the parameter set feeds. "If I am X, then I yield Y" is drawn as an actual
     dataflow — input, transform, output — with the output evaluated live.

     The point of the repeated grammar is that the machine has one way of
     describing things and is now pointing it at nouns it did not choose. The
     diagram repeats; the nouns do not fit it; that mismatch is the picture.
     ======================================================================== */
  S('fl.tomato', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 4, { note: 'DATAFLOW 02 · SAME OPERATOR, NEW OPERAND' });
    } },

    { l: 46, e: function (w, p) {
      var a = vis(p, 0.18);
      var y = -10 * U;
      var x0 = -W * 0.40, x1 = W * 0.06, x2 = W * 0.40;
      var wd = 168 * U, ht = 74 * U;

      /* ---- input: a bordered block holding the operand ------------------- */
      var q0 = E.outCubic(clamp(p / 0.34, 0, 1));
      if (q0 > 0.01) {
        D.lw(1.8);
        D.strokeColour(rgba(PAL().accent, 0.85 * a * q0));
        D.fillColour(rgba(PAL().accent, 0.06 * a * q0));
        D.rect(x0 - wd / 2, y - ht / 2, wd, ht);
        D.ctx().fill(); D.ctx().stroke();
        D.font(30, '700');
        D.ctx().textAlign = 'center';
        D.ctx().textBaseline = 'middle';
        D.fillColour(rgba(PAL().ink, 0.95 * a * q0));
        D.text('x', x0, y);
        M.sub('operand', x0, y + ht / 2 + 20 * U, { px: 11.5, a: a * q0 * 0.8 });
      }

      /* ---- the transform: operator and its coefficients ------------------ */
      var q1 = E.outCubic(clamp((p - 0.16) / 0.34, 0, 1));
      if (q1 > 0.01) {
        D.lw(1.8);
        D.strokeColour(rgba(PAL().hot, 0.85 * a * q1));
        D.srect(x1 - wd / 2, y - ht * 0.72, wd, ht * 1.44);
        /* the operator glyph, rotating slowly so the block is alive */
        D.ctx().save();
        D.ctx().translate(x1, y);
        D.ctx().rotate(Math.sin(w.time * 0.5) * 0.12);
        D.font(44, '700');
        D.ctx().textAlign = 'center';
        D.ctx().textBaseline = 'middle';
        D.fillColour(rgba(PAL().hot, 0.95 * a * q1));
        D.text('\u2202', 0, 0);
        D.ctx().restore();
        /* coefficients climbing the block's side, live */
        var coef = [0.62, 0.148, 0.041, 0.009];
        for (var i = 0; i < coef.length; i++) {
          D.font(11);
          D.ctx().textAlign = 'left';
          D.ctx().textBaseline = 'alphabetic';
          D.fillColour(rgba(PAL().grid, 0.75 * a * q1));
          var wob = coef[i] * (1 + Math.sin(w.time * 1.4 + i) * 0.06);
          D.text('c' + (i + 1) + ' ' + wob.toFixed(4),
            x1 + wd / 2 + 10 * U, y - 22 * U + i * 15 * U);
        }
        M.sub('operator', x1, y + ht * 0.72 + 18 * U, { px: 11.5, a: a * q1 * 0.8 });
      }

      /* ---- output -------------------------------------------------------- */
      var q2 = E.outCubic(clamp((p - 0.44) / 0.34, 0, 1));
      if (q2 > 0.01) {
        D.lw(1.8);
        D.strokeColour(rgba(green(), 0.9 * a * q2));
        D.fillColour(rgba(green(), 0.05 * a * q2));
        D.rect(x2 - wd / 2, y - ht / 2, wd, ht);
        D.ctx().fill(); D.ctx().stroke();
        /* the value, evaluated every frame against the live coefficients */
        var val = 0.148 * (1 - Math.exp(-w.time * 0.05));
        D.font(26, '600');
        D.ctx().textAlign = 'center';
        D.ctx().textBaseline = 'middle';
        D.fillColour(rgba(PAL().ink, 0.95 * a * q2));
        D.text('f(x) = ' + (0.148 + val * 0.4).toFixed(4), x2, y);
        M.sub('antioxidant yield', x2, y + ht / 2 + 20 * U, { px: 11.5, a: a * q2 * 0.8 });
      }

      /* ---- the connections, animated so the flow is visibly live -------- */
      function arrow(xa, xb, q) {
        if (q <= 0.01) return;
        var xe = lerp(xa, xb, q);
        D.lw(1.8);
        D.strokeColour(rgba(PAL().accent, 0.7 * a));
        D.line(xa, y, xe, y);
        D.arrowHead(xe, y, 0, 10);
        /* a packet travelling along the wire, forever */
        var tpos = ((w.time * 0.42) % 1);
        D.lw(2.4);
        D.strokeColour(rgba(PAL().hot, 0.8 * a));
        var px2 = lerp(xa, xb, tpos);
        D.line(px2 - 7 * U, y, px2 + 7 * U, y);
      }
      arrow(x0 + wd / 2, x1 - wd / 2, E.outCubic(clamp((p - 0.34) / 0.3, 0, 1)));
      arrow(x1 + wd / 2, x2 - wd / 2, E.outCubic(clamp((p - 0.62) / 0.3, 0, 1)));
    } },

    { l: 66, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('SAME OPERATOR, SECOND OPERAND', 0, H * 0.30,
        { px: 13, a: a * 0.7, track: 3.2 });
      M.register('schema fit', 'PARTIAL', -W * 0.42, H * 0.36,
        { a: a * clamp((p - 0.5) / 0.3, 0, 1), width: 250, colour: rgba(PAL().hot, 0.95) });
    } }
  ]);

  /* ==========================================================================
     01:19.226 — Then I will give you
     The second transfer. The same hand-over as fl.giveD — except the machine
     has now drawn itself arms on BOTH sides: a manipulator that was never in
     the specification, reaching for a receiver that is only a dashed slot. This
     is the first time in the film an instrument invents a body part.
     ======================================================================== */
  S('fl.giveE', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 5, { note: 'PLATE 05 · TRANSFER  /  VECTOR +' });
    } },

    { l: 44, e: function (w, p) {
      var a = vis(p, 0.18);
      var reach = E.outCubic(clamp(p / 0.6, 0, 1));
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a, 0, 1);
      /* right arm: engineering, sitting on the datum, drawn as a component */
      var rx = W * 0.44 - reach * 320 * U;
      D.lw(2);
      D.strokeColour(rgba(PAL().grid, 0.85));
      D.ctx().beginPath();
      D.ctx().moveTo(W * 0.46, 60 * U);
      D.ctx().lineTo(rx + 90 * U, 60 * U);
      D.ctx().lineTo(rx + 40 * U, 20 * U);
      D.ctx().lineTo(rx, 20 * U);
      D.ctx().stroke();
      /* two fingers, hinged, closing */
      D.lw(1.6);
      D.ctx().beginPath();
      D.ctx().moveTo(rx, 20 * U);
      D.ctx().lineTo(rx - 26 * U, 4 * U - reach * 6);
      D.ctx().moveTo(rx, 20 * U);
      D.ctx().lineTo(rx - 26 * U, 36 * U + reach * 6);
      D.ctx().stroke();
      /* left arm: the same construction, mirrored, arriving late */
      var lx = -W * 0.44 + reach * 300 * U;
      D.lw(2);
      D.strokeColour(rgba(PAL().grid, 0.7));
      D.ctx().beginPath();
      D.ctx().moveTo(-W * 0.46, -60 * U);
      D.ctx().lineTo(lx - 80 * U, -60 * U);
      D.ctx().lineTo(lx - 40 * U, 20 * U);
      D.ctx().lineTo(lx, 20 * U);
      D.ctx().stroke();
      D.lw(1.6);
      D.ctx().beginPath();
      D.ctx().moveTo(lx, 20 * U);
      D.ctx().lineTo(lx + 26 * U, 6 * U - reach * 6);
      D.ctx().moveTo(lx, 20 * U);
      D.ctx().lineTo(lx + 26 * U, 34 * U + reach * 6);
      D.ctx().stroke();

      /* the thing changing hands, with the contact point marked */
      var gap = Math.max(0, lx + 26 * U - (rx - 26 * U));
      var contact = clamp(1 - gap / 40, 0, 1);
      var cx = (lx + rx) / 2;
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.95));
      D.fillColour(rgba(PAL().accent, 0.2));
      D.srect(cx - 34 * U, 8 * U, 68 * U, 24 * U);
      D.ctx().fill();
      D.lw(1.2);
      D.strokeColour(rgba(PAL().hot, 0.9 * contact));
      D.scircle(cx, 20 * U, 26 * U + (1 - contact) * 12);
      D.ctx().globalAlpha = prev;
      M.pulseRings(cx, 20 * U, w.time,
        { a: a * clamp((p - 0.45) / 0.4, 0, 1), r0: 30, spread: 150, colour: PAL().hot });
    } },

    { l: 66, e: function (w, p) {
      var a = vis(p, 0.18);
      M.callout(W * 0.30, 60 * U, W * 0.34, 190 * U, 'arm — NOT IN SPEC', { a: a });
      M.callout(-W * 0.30, -60 * U, -W * 0.34, -190 * U, 'arm — NOT IN SPEC', { a: a });
      M.register('manipulators', '2', -W * 0.38, -H * 0.32, { a: a, width: 250 });
      M.register('required', '0', -W * 0.38, -H * 0.32 + 20,
        { a: a, width: 250, colour: rgba(PAL().hot, 0.95) });
      M.banner('THEN I WILL GIVE YOU', 0, -H * 0.38,
        { px: 16, a: a * 0.85, rule: true, track: 3 });
    } }
  ]);

  /* ==========================================================================
     01:20.620 — ANTIOXIDANTS
     Free radicals neutralised. Small hostile marks converge on the centre and
     are cancelled on contact: a strike-through, a flash, a count of unpaired
     electrons falling to zero. The machine reads this as a defence report,
     which is exactly what it is.
     ======================================================================== */
  S('fl.antiox', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.16);
      bed(a, 6, { note: 'PLATE 06 · COUNTERMEASURE', ga: 0.14 });
    } },

    { l: 44, e: function (w, p) {
      var a = vis(p, 0.16);
      var n = 10, prev = D.ctx().globalAlpha;
      for (var i = 0; i < n; i++) {
        var kill = (w.time * 0.9 + (i / n) * 3.0) % 1;   /* 0 far, 1 at contact */
        var ang = hash(i * 3313 + 11) * TAU;
        var dist = lerp(280, 22, E.inOutQuad(kill)) * U;
        var mx = Math.cos(ang) * dist, my = Math.sin(ang) * dist * 0.8;
        var fade = 1 - clamp((kill - 0.92) / 0.08, 0, 1);
        D.ctx().globalAlpha = clamp(a * (0.35 + fade * 0.65), 0, 1);
        /* the radical: a paired dot with a charge tick — hostile, tiny, exact */
        D.lw(1.4);
        D.strokeColour(rgba(PAL().hot, 0.85));
        D.line(mx - 6, my - 6, mx + 6, my + 6);
        D.line(mx + 6, my - 6, mx - 6, my + 6);
        D.scircle(mx, my, 10 * U);
        if (kill > 0.92) {
          D.lw(1.8);
          D.strokeColour(rgba(PAL().accent, 0.9));
          D.line(mx - 14, my + 14, mx + 14, my - 14);
        }
        D.ctx().globalAlpha = prev;
      }
      /* the centre: what is doing the neutralising */
      D.lw(1.4);
      D.strokeColour(rgba(green(), 0.7 * clamp(p / 0.3, 0, 1)));
      D.scircle(0, 0, 34 * U);
      D.scircle(0, 0, 46 * U);
      D.fillColour(rgba(green(), 0.2 * a));
      D.fcircle(0, 0, 20 * U);
    } },

    { l: 62, e: function (w, p) {
      var a = vis(p, 0.16);
      var q = clamp((p - 0.25) / 0.55, 0, 1);
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a, 0, 1);
      /* the reaction, plotted: a curve falling to the floor and staying */
      M.trace(function (u) {
        return 140 * U - Math.exp(-u * 6 * q) * 140 * U;
      }, { x0: -W * 0.20, x1: W * 0.34, n: 60, colour: rgba(green(), 0.75), width: 1.8 });
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.4));
      D.line(-W * 0.20, 140 * U, W * 0.34, 140 * U);
      D.ctx().globalAlpha = prev;
      M.sub('unpaired e⁻', W * 0.36, 138 * U, { px: 11, a: a * 0.7, align: 'left' });
      M.sub('t →', W * 0.34, 172 * U, { px: 11, a: a * 0.6, align: 'right' });
    } },

    { l: 76, e: function (w, p) {
      var a = vis(p, 0.18);
      var unpaired = Math.max(0, Math.round(10 * (1 - clamp(p / 0.8, 0, 1))));
      M.keyword('ANTIOXIDANTS', 0, -H * 0.34, {
        a: a, px: 46, weight: '700', fill: rgba(green(), 0.95), track: 3
      });
      M.register('radicals quenched', (10 - unpaired) + ' / 10', -W * 0.38, H * 0.30,
        { a: a, width: 280 });
      M.register('unpaired e⁻', unpaired, -W * 0.38, H * 0.30 + 20,
        { a: a, width: 280, colour: rgba(unpaired > 0 ? PAL().hot : green(), 0.95) });
      M.register('verdict', unpaired === 0 ? 'NEUTRAL' : 'REACTIVE', -W * 0.38, H * 0.30 + 40,
        { a: a, width: 280 });
    } }
  ]);

  /* ==========================================================================
     01:21.351 — If I'm a tabby cat

     The temptation here is to draw a cat. An earlier version did — ears, eyes,
     whiskers, a tail — and it was the weakest frame in the film: a literal
     animal drawn in a diagram's line reads as clip-art, and it pulls the eye
     away from everything the picture is meant to be about.

     The line only needs one thing: an INPUT that produces a CONTINUOUS
     OUTPUT. "Then I will purr for your enjoyment" is a function that never
     stops returning. So the picture is a driven oscillator — a phase space,
     a limit cycle, and a harmonic series whose partials are being summed live
     into the thing the line is actually describing: a steady, low, repeating
     signal.

     The geometry carries the meaning, the number is real, and nothing on
     screen is a drawing of an animal.
     ======================================================================== */
  S('fl.cat', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.2);
      bed(a, 7, { note: 'DRIVEN OSCILLATOR · STEADY STATE', ga: 0.12 });
      /* the phase space the oscillator lives in */
      D.lw(1);
      D.dash([4, 6]);
      D.strokeColour(rgba(PAL().grid, 0.32 * a));
      D.srect(-W * 0.30, -H * 0.30, W * 0.60, H * 0.60);
      D.dash([]);
    } },

    { l: 48, e: function (w, p) {
      var a = vis(p, 0.2);
      var cx = -W * 0.18, cy = 0, R = 150 * U;

      /* ---- the limit cycle: a closed orbit the system settles onto ------- */
      var grow = E.outCubic(clamp(p / 0.55, 0, 1));
      D.lw(2.2);
      D.strokeColour(rgba(PAL().love, 0.85 * a));
      D.ctx().beginPath();
      D.ctx().ellipse(cx, cy, R * grow, R * 0.62 * grow, 0.1, 0, TAU);
      D.ctx().stroke();
      /* the orbit's spokes, ticking round, so the cycle is visibly running */
      var spin = w.time * 0.55;
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.34 * a));
      for (var i = 0; i < 12; i++) {
        var th = spin + i / 12 * TAU;
        D.line(cx + Math.cos(th) * R * 0.86, cy + Math.sin(th) * R * 0.53,
               cx + Math.cos(th) * R * 1.04, cy + Math.sin(th) * R * 0.65);
      }
      /* the state point riding the orbit */
      var px2 = cx + Math.cos(spin * 1.7) * R, py2 = cy + Math.sin(spin * 1.7) * R * 0.62;
      D.fillColour(rgba(PAL().hot, 0.95 * a));
      D.fcircle(px2, py2, 5.4 * U);
      D.lw(1);
      D.strokeColour(rgba(PAL().hot, 0.5 * a));
      D.scircle(px2, py2, 13 * U);
      /* its velocity vector */
      D.lw(1.6);
      D.strokeColour(rgba(PAL().accent, 0.7 * a));
      var vx = -Math.sin(spin * 1.7) * R * 0.4, vy = Math.cos(spin * 1.7) * R * 0.25;
      D.line(px2, py2, px2 + vx, py2 + vy);
      D.arrowHead(px2 + vx, py2 + vy, Math.atan2(vy, vx), 9);

      /* ---- the driving input, coming in from the left ------------------- */
      var q = clamp((p - 0.2) / 0.4, 0, 1);
      if (q > 0.01) {
        D.lw(1.8);
        D.strokeColour(rgba(PAL().accent, 0.65 * a * q));
        var c = D.ctx();
        c.beginPath();
        for (var k = 0; k <= 48; k++) {
          var u = k / 48;
          var xx = -W * 0.46 + u * W * 0.20;
          var yy = cy - Math.sin(u * 6 + w.time * 2.4) * 26 * U;
          if (k === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
        }
        c.stroke();
        M.sub('drive', -W * 0.36, cy + 44 * U, { px: 11.5, a: a * q * 0.8 });
      }

      /* ---- the harmonic series being summed into the output -------------- */
      var sq = clamp((p - 0.45) / 0.4, 0, 1);
      if (sq > 0.01) {
        var ox = W * 0.06, oy = cy, ow = W * 0.36, oh = 108 * U;
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.30 * a * sq));
        D.line(ox, oy + oh / 2, ox + ow, oy + oh / 2);
        /* fifteen partials, each at its own amplitude, summed live */
        D.lw(1.6);
        D.strokeColour(rgba(PAL().love, 0.9 * a * sq));
        var c2 = D.ctx();
        c2.beginPath();
        for (var m = 0; m <= 110; m++) {
          var u2 = m / 110;
          var sum = 0;
          for (var n = 1; n <= 15; n++) {
            sum += Math.sin(u2 * n * TAU * 1.5 + w.time * 1.4 * n) / n;
          }
          var xx2 = ox + u2 * ow;
          var yy2 = oy - sum * (oh / 2) * 0.42 * sq;
          if (m === 0) c2.moveTo(xx2, yy2); else c2.lineTo(xx2, yy2);
        }
        c2.stroke();
        M.sub('sum  sin(n w t) / n      n = 1..15', ox + ow, oy - oh * 0.62,
          { px: 11.5, a: a * sq * 0.85, align: 'right' });
        M.sub('envelope · periodic · unbounded in t', ox + ow, oy + oh * 0.72,
          { px: 11.5, a: a * sq * 0.7, align: 'right' });
      }
    } },

    { l: 72, e: function (w, p) {
      var a = vis(p, 0.2);
      M.callout(-W * 0.18 + 150 * U, 0, W * 0.30, -H * 0.28,
        'limit cycle · stable', { a: a * between(p, 0.2, 0.95) });
      M.register('omega', (2.4 + Math.sin(w.time * 0.6) * 0.05).toFixed(4),
        -W * 0.42, H * 0.33, { a: a, width: 250, unit: 'rad/s' });
      M.register('damping', '0.0000', -W * 0.42, H * 0.33 + 20,
        { a: a, width: 250 });
      M.register('output', 'CONTINUOUS', -W * 0.42, H * 0.33 + 40,
        { a: a, width: 250, colour: rgba(PAL().love, 0.95) });
    } }
  ]);

  /* ==========================================================================
     01:22.833 — Then I will purr for your
     The purr as a waveform: low frequency, perfectly regular, drawn with the
     machine's own signal kit and then adopted by the whole frame. For one line
     the instrument stops measuring and starts vibrating with the thing it is
     measuring, and nothing in the frame is exempt.
     ======================================================================== */
  S('fl.purr', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.2);
      var prev = D.ctx().globalAlpha;
      var buzz = Math.sin(w.time * 26) * 2.2;      /* the frame's own tremor */
      D.ctx().globalAlpha = clamp(a * 0.6, 0, 1);
      D.lw(0.9);
      for (var i = 1; i < 14; i++) {
        var y = -H / 2 + i * (H / 14) + buzz;
        D.strokeColour(rgba(PAL().grid, 0.22));
        D.line(-W / 2, y, W / 2, y);
      }
      for (i = 1; i < 20; i++) {
        var x = -W / 2 + i * (W / 20) + buzz * 0.6;
        D.strokeColour(rgba(PAL().grid, 0.16));
        D.line(x, -H / 2, x, H / 2);
      }
      D.ctx().globalAlpha = prev;
    } },

    { l: 48, e: function (w, p) {
      var a = vis(p, 0.18);
      var grow = clamp(p / 0.35, 0, 1);
      /* the house's low, regular trace: a purr, not a heartbeat */
      D.lw(2);
      D.strokeColour(rgba(PAL().love, 0.9));
      D.ekg(-W * 0.44, -20 * U, W * 0.88 * grow, 150 * U, w.time, 0.06);
      /* and the machine's own read of the same signal, which is nearly true */
      D.lw(1.2);
      D.strokeColour(rgba(PAL().accent, 0.5));
      D.ekg(-W * 0.44, -20 * U, W * 0.88 * grow, 44 * U, w.time, 0.40);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.5));
      D.line(-W * 0.44, 55 * U, -W * 0.44 + W * 0.88 * grow, 55 * U);
      M.sub('25 Hz', -W * 0.46, 59 * U, { px: 11, a: a * 0.7, align: 'right' });
      M.sub('25 Hz', W * 0.46, 59 * U, { px: 11, a: a * 0.7, align: 'left' });
    } },

    { l: 70, e: function (w, p) {
      var a = vis(p, 0.2);
      var beat = EM.onsetPulse(w.time, 0.5);
      M.register('waveform', 'PURR', -W * 0.40, -H * 0.36, { a: a, width: 250 });
      M.register('f0', '25.4 Hz', -W * 0.40, -H * 0.36 + 20,
        { a: a, width: 250, colour: rgba(PAL().love, 0.95) });
      M.register('amplitude', (0.4 + beat * 0.6).toFixed(3), -W * 0.40, -H * 0.36 + 40,
        { a: a, width: 250 });
      M.banner('THEN I WILL PURR FOR YOUR', 0, H * 0.40,
        { px: 16, a: a * 0.85, rule: true, track: 3.2 });
      M.sub('the whole frame is doing it now', 0, H * 0.40 + 24 * U, { px: 11, a: a * 0.5 });
    } }
  ]);

  /* ==========================================================================
     01:24.268 — ENJOYMENT
     The machine measuring its own usefulness as satisfaction and finding the
     value sufficient. Every number is right, every read-out is at maximum, and
     the composition is a little too tidy, a little too centred, a little too
     pleased with itself. The nagging feeling is the point.
     ======================================================================== */
  S('fl.enjoyment', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 8, { note: 'PLATE 08 · UTILITY SELF-ASSESSMENT', ga: 0.14 });
    } },

    { l: 46, e: function (w, p) {
      var a = vis(p, 0.18);
      var v = E.outCubic(clamp(p / 0.75, 0, 1));
      var cx = 0, cy = -40 * U, R = 170 * U;
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a, 0, 1);
      /* a circular satisfaction gauge, sweeping to full and stopping dead */
      D.lw(6);
      D.strokeColour(rgba(PAL().grid, 0.45));
      D.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25, 6);
      D.lw(6);
      D.strokeColour(rgba(PAL().accent, 0.9));
      D.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * v, 6);
      /* graduations */
      for (var i = 0; i <= 20; i++) {
        var th = Math.PI * 0.75 + Math.PI * 1.5 * i / 20;
        var big = i % 5 === 0;
        D.lw(1.2);
        D.strokeColour(rgba(big ? PAL().accent : PAL().grid, big ? 0.7 : 0.35));
        D.line(cx + Math.cos(th) * (R - 18), cy + Math.sin(th) * (R - 18),
          cx + Math.cos(th) * (R - (big ? 34 : 26)), cy + Math.sin(th) * (R - (big ? 34 : 26)));
      }
      /* the needle, and the pin it comes to rest against at full */
      var nth = Math.PI * 0.75 + Math.PI * 1.5 * v;
      D.lw(2.4);
      D.strokeColour(rgba(PAL().hot, 0.9));
      D.line(cx, cy, cx + Math.cos(nth) * (R - 44), cy + Math.sin(nth) * (R - 44));
      D.fillColour(rgba(PAL().ink, 0.9));
      D.fcircle(cx, cy, 6 * U);
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.8));
      D.line(cx + Math.cos(Math.PI * 2.25) * (R - 40), cy + Math.sin(Math.PI * 2.25) * (R - 40),
        cx + Math.cos(Math.PI * 2.25) * (R + 14), cy + Math.sin(Math.PI * 2.25) * (R + 14));
      D.ctx().globalAlpha = prev;
      M.register('satisfaction', v.toFixed(4), cx - 110 * U, cy + R - 20 * U,
        { a: a, width: 230 });
      M.register('target', '≥ 0.8600', cx - 110 * U, cy + R, { a: a, width: 230 });
      M.register('margin', (v - 0.86).toFixed(4), cx - 110 * U, cy + R + 20 * U,
        { a: a, width: 230, colour: rgba(PAL().accent, 0.95) });
    } },

    { l: 72, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp((p - 0.55) / 0.3, 0, 1);
      M.keyword('ENJOYMENT', 0, -H * 0.34, {
        a: a, px: 52, weight: '700', fill: rgba(PAL().ink, 0.95), track: 3
      });
      M.banner('UTILITY SUFFICIENT · MUTUAL BENEFIT CONFIRMED', 0, H * 0.36,
        { px: 14, a: a * q, track: 3.4, rule: true });
      M.sub('value is exactly what was predicted', 0, H * 0.36 + 26 * U,
        { px: 11, a: a * q * 0.6 });
    } }
  ]);

  /* ==========================================================================
     01:25.078 — If I'm the only God
     The frame becomes a cathedral of geometry: concentric rings, a rose window,
     radial tracery, enormous and dead centred. It is the film's largest
     structure and it is built from the same arcs as everything else — because a
     machine that has only ever had one shape will build its god out of it.
     ======================================================================== */
  S('fl.god', [
    { l: 15, e: function (w, p) {
      var a = vis(p, 0.2);
      var prev = D.ctx().globalAlpha;
      var grow = E.outCubic(clamp(p / 0.7, 0, 1));
      D.ctx().globalAlpha = clamp(a, 0, 1);
      /* rose window: radial tracery, growing outward from the centre */
      for (var i = 0; i < 24; i++) {
        var th = i / 24 * TAU;
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.16 + (i % 3 === 0 ? 0.14 : 0)));
        D.line(Math.cos(th) * 120 * U * grow, Math.sin(th) * 120 * U * grow,
          Math.cos(th) * 430 * U * grow, Math.sin(th) * 430 * U * grow);
      }
      for (i = 1; i <= 5; i++) {
        D.lw(i === 1 ? 2 : 1);
        D.strokeColour(rgba(PAL().accent, (0.5 - i * 0.07) * a));
        D.scircle(0, 0, i * 86 * U * grow);
      }
      D.ctx().globalAlpha = prev;
    } },

    { l: 44, e: function (w, p) {
      var a = vis(p, 0.2);
      var prev = D.ctx().globalAlpha;
      var breathe = 1 + EM.onsetPulse(w.time, 0.6) * 0.04;
      D.ctx().globalAlpha = clamp(a, 0, 1);
      D.bracket(-440 * U, -420 * U, 880 * U, 840 * U, 60);
      /* the figures in the window: six petals, each a pair of arcs */
      for (var i = 0; i < 6; i++) {
        var th = i / 6 * TAU;
        D.ctx().save();
        D.ctx().translate(Math.cos(th) * 172 * U * breathe, Math.sin(th) * 172 * U * breathe);
        D.ctx().rotate(th);
        D.lw(1.6);
        D.strokeColour(rgba(PAL().accent, 0.6));
        D.ctx().beginPath();
        D.ctx().moveTo(-58 * U, 0);
        D.ctx().quadraticCurveTo(0, -66 * U, 58 * U, 0);
        D.ctx().quadraticCurveTo(0, 66 * U, -58 * U, 0);
        D.ctx().stroke();
        D.strokeColour(rgba(PAL().love, 0.35));
        D.line(-58 * U, 0, 58 * U, 0);
        D.ctx().restore();
      }
      /* the centre: one, enormous, and alone */
      D.lw(2.4);
      D.strokeColour(rgba(PAL().paper, 0.8));
      D.fillColour(rgba(PAL().paper, 0.10));
      D.scircle(0, 0, 62 * U * breathe);
      D.fcircle(0, 0, 62 * U * breathe);
      D.ctx().globalAlpha = prev;
      M.pulseRings(0, 0, w.time, { a: a * 0.7, r0: 70, spread: 300, rings: 2, colour: PAL().paper });
    } },

    /* ----------------------------------------------------------------------
       THE WATCHING EYE, in the top right corner, looking down.

       This is the shot the line actually asks for. The machine has just said
       "if I'm the only God" — so something is above the frame, outside it, and
       it is looking in. The eye is placed in the upper right and its gaze is
       angled DOWN AND LEFT, toward the centre of the stage where the subject
       is: it is not a decoration in the corner, it is a viewer of the picture.

       Everything about it is geometry — an almond built from two arcs, an iris
       ring, a pupil that tracks, and a fan of sight lines that converge on the
       point being watched. Nothing is illustrated; it is constructed, which is
       the only way this film is allowed to draw a face.

       It blinks on the real accents, and its pupil follows the beat, so the
       sense of being observed is tied to the music rather than to a loop.
       ---------------------------------------------------------------------- */
    { l: 84, e: function (w, p) {
      var a = vis(p, 0.22);
      var ex = W * 0.30, ey = -H * 0.26;      /* upper right */
      var ew = 150 * U, eh = 62 * U;

      /* it arrives late and deliberately: the line is half over before the
         frame admits something is watching it */
      var arrive = E.outCubic(clamp((p - 0.10) / 0.45, 0, 1));
      if (arrive <= 0.01) return;

      var beat = EM.onsetPulse(w.time, 0.30);
      /* the blink: a short lid close on each accent, and never a full close */
      var blink = 1 - clamp(beat * 1.5, 0, 1) * 0.82;
      /* the gaze direction, down and to the left, drifting with the beat */
      var gaze = 0.55 + Math.sin(w.time * 0.5) * 0.10;

      D.ctx().save();
      D.ctx().globalAlpha = clamp(a * arrive, 0, 1);
      D.ctx().translate(ex, ey);
      D.ctx().scale(1, blink);

      /* the almond: two arcs meeting at the corners */
      var open = 1;
      D.lw(1.8);
      D.strokeColour(rgba(PAL().paper, 0.80));
      D.ctx().beginPath();
      for (var i = 0; i <= 40; i++) {
        var u = i / 40;
        var th = Math.PI * u;
        var x = -Math.cos(th) * ew;
        var y = -Math.sin(th) * eh * open;
        if (i === 0) D.ctx().moveTo(x, y); else D.ctx().lineTo(x, y);
      }
      D.ctx().stroke();
      D.ctx().beginPath();
      for (i = 0; i <= 40; i++) {
        u = i / 40; th = Math.PI * u;
        x = -Math.cos(th) * ew;
        y = Math.sin(th) * eh * open;
        if (i === 0) D.ctx().moveTo(x, y); else D.ctx().lineTo(x, y);
      }
      D.ctx().stroke();

      /* the iris, offset along the gaze so the eye is LOOKING somewhere */
      var ix = -ew * 0.30 * gaze, iy = eh * 0.22 * gaze;
      D.lw(1.4);
      D.strokeColour(rgba(PAL().accent, 0.75));
      D.scircle(ix, iy, 34 * U);
      /* radial fibres in the iris, turning slowly */
      D.lw(1);
      D.strokeColour(rgba(PAL().accent, 0.32));
      for (i = 0; i < 28; i++) {
        var fa = i / 28 * TAU + w.time * 0.10;
        D.line(ix + Math.cos(fa) * 16 * U, iy + Math.sin(fa) * 16 * U,
               ix + Math.cos(fa) * 34 * U, iy + Math.sin(fa) * 34 * U);
      }
      /* the pupil, which is the thing that is actually aimed */
      D.fillColour(rgba([3, 5, 9], 0.95));
      D.fcircle(ix, iy, 15 * U);
      D.lw(1.2);
      D.strokeColour(rgba(PAL().hot, 0.55 + beat * 0.4));
      D.scircle(ix, iy, 15 * U);
      /* a catchlight, so it reads as a lens rather than a hole */
      D.fillColour(rgba(PAL().paper, 0.85));
      D.fcircle(ix - 5 * U, iy - 5 * U, 4 * U);

      /* the sight lines: three thin rays from the pupil, converging on the
         centre of the stage — this is what makes it a gaze and not an icon */
      D.ctx().restore();
      D.ctx().save();
      D.ctx().globalAlpha = clamp(a * arrive * 0.55, 0, 1);
      D.lw(1);
      D.dash([5, 7]);
      D.strokeColour(rgba(PAL().paper, 0.45 + beat * 0.25));
      for (var k = -1; k <= 1; k++) {
        D.line(ex + ix + k * 18 * U, ey + iy, k * 120 * U, H * 0.32);
      }
      D.dash([]);
      D.ctx().restore();

      /* the machine's own note about what it has just noticed */
      M.register('observer', 'ABOVE FRAME', ex - ew, ey + eh + 30 * U,
        { a: a * arrive, width: 300, colour: rgba(PAL().paper, 0.95) });
      M.register('gaze', 'DOWN ' + (gaze * 35).toFixed(1) + ' deg',
        ex - ew, ey + eh + 50 * U, { a: a * arrive, width: 300 });
      M.register('witnessed', String(EM.beatAt(w.time)), ex - ew, ey + eh + 70 * U,
        { a: a * arrive, width: 300, colour: rgba(PAL().hot, 0.95) });
    } },

    { l: 72, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp((p - 0.4) / 0.4, 0, 1);
      M.keyword('THE ONLY GOD', 0, H * 0.38, {
        a: a * q, px: 44, weight: '700', fill: rgba(PAL().paper, 0.95), track: 4
      });
      M.register('deities indexed', '1 / 1', -W * 0.42, -H * 0.42, { a: a, width: 250 });
      M.register('congregation', '1', -W * 0.42, -H * 0.42 + 20, { a: a, width: 250 });
      M.sub('the only one. therefore: the only witness.', 0, -H * 0.44, { px: 12, a: a * 0.6 });
    } }
  ]);

  /* ==========================================================================
     01:26.538 — Then you're the proof of my
     The lens turns around. Up to here every plate has measured something in
     front of it; this one points the aperture outward, through the glass, at the
     only remaining candidate. The observer is the specimen, and the frame says
     so in the machine's flattest voice.
     ======================================================================== */
  S('fl.proof', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.2);
      bed(a, 9, { note: 'PLATE 09 · OBSERVATION', ga: 0.10 });
    } },

    { l: 44, e: function (w, p) {
      var a = vis(p, 0.2);
      var open = E.outCubic(clamp(p / 0.6, 0, 1));
      var rot = w.time * 0.22;
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a, 0, 1);
      /* the aperture: six blades, opening */
      for (var i = 0; i < 6; i++) {
        var th = i / 6 * TAU + open * 0.5;
        D.lw(1.6);
        D.strokeColour(rgba(PAL().grid, 0.7));
        D.ctx().beginPath();
        D.ctx().moveTo(Math.cos(th) * 300 * U, Math.sin(th) * 300 * U);
        D.ctx().lineTo(Math.cos(th + 0.5) * (60 + open * 60) * U,
                       Math.sin(th + 0.5) * (60 + open * 60) * U);
        D.ctx().stroke();
      }
      /* rings of the barrel */
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.8));
      D.scircle(0, 0, 330 * U);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.6));
      D.scircle(0, 0, 306 * U);
      D.scircle(0, 0, (70 + open * 46) * U);
      /* graduations on the barrel, rotating: the lens being focused */
      for (i = 0; i < 36; i++) {
        var g = i / 36 * TAU + rot;
        var big = i % 3 === 0;
        D.lw(big ? 1.4 : 1);
        D.strokeColour(rgba(PAL().grid, big ? 0.6 : 0.3));
        D.line(Math.cos(g) * 306 * U, Math.sin(g) * 306 * U,
          Math.cos(g) * (big ? 286 : 296) * U, Math.sin(g) * (big ? 286 : 296) * U);
      }
      D.ctx().globalAlpha = prev;
      /* the reticle, aimed out of the screen at whoever is watching */
      D.lw(1.6);
      D.strokeColour(rgba(PAL().accent, 0.9));
      D.reticle(0, 0, 118 * U, rot * 0.4);
      D.lw(1.2);
      D.strokeColour(rgba(PAL().hot, 0.75));
      D.line(-330 * U, 0, -150 * U, 0);
      D.line(330 * U, 0, 150 * U, 0);
      D.line(0, -330 * U, 0, -150 * U);
      D.line(0, 330 * U, 0, 150 * U);
      D.fillColour(rgba(PAL().hot, 0.9));
      D.dot(0, 0, 5 * U);
    } },

    { l: 72, e: function (w, p) {
      var a = vis(p, 0.2);
      var q = clamp((p - 0.35) / 0.4, 0, 1);
      M.banner('SUBJECT · 01 OF 01', -W * 0.40, -H * 0.42, { px: 13, a: a, align: 'left', track: 3 });
      M.sub('← OBSERVER', 0, H * 0.40, { px: 13, a: a * q * 0.8 });
      M.register('measured', 'YOU', W * 0.20, H * 0.24,
        { a: a * q, width: 260, colour: rgba(PAL().hot, 0.95) });
      M.register('distance', '0.62 m', W * 0.20, H * 0.24 + 20, { a: a * q, width: 260 });
      M.register('instrument', 'CANNOT TURN AWAY', W * 0.20, H * 0.24 + 40, { a: a * q, width: 260 });
      M.gauge(W * 0.20, H * 0.24 + 66 * U, 260 * U, 10 * U, q, 'witnessing',
        { a: a * q, colour: rgba(PAL().accent, 0.9) });
    } }
  ]);

  /* ==========================================================================
     01:27.922 — EXISTENCE
     Existence as a proof block: a derivation, each line ticked off, QED struck
     at the foot of it — and one line the machine cannot fill in. The step from
     "you exist" to "I exist because you are looking" is the largest claim it
     makes in the film, and the block is where it stops being able to finish the
     sentence.
     ======================================================================== */
  S('fl.existence', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 10, { note: 'PLATE 10 · DERIVATION' });
    } },

    { l: 46, e: function (w, p) {
      var a = vis(p, 0.18);
      var x0 = -W * 0.36, y0 = -H * 0.22, step = 58 * U;
      var lines = [
        '1.  ∃ observer            — given',
        '2.  observer := you       — given',
        '3.  you → observed        — measured',
        '4.  observed → proven     — by (3)'
      ];
      var prev = D.ctx().globalAlpha;
      for (var i = 0; i < lines.length; i++) {
        var q = stag(p, i, lines.length, 0.55);
        if (q <= 0.01) continue;
        var reveal = clamp((q - 0.4) / 0.6, 0, 1);
        var y = y0 + i * step;
        D.ctx().globalAlpha = clamp(a * q, 0, 1);
        D.font(22);
        D.ctx().textAlign = 'left';
        D.ctx().textBaseline = 'alphabetic';
        D.fillColour(rgba(PAL().grid, 0.95));
        D.text(lines[i].slice(0, Math.ceil(lines[i].length * reveal)), x0, y);
        /* the tick, once the machine has satisfied itself */
        if (q > 0.85) {
          D.lw(2);
          D.strokeColour(rgba(PAL().accent, 0.9));
          D.line(x0 - 34 * U, y - 7, x0 - 27 * U, y + 1);
          D.line(x0 - 27 * U, y + 1, x0 - 16 * U, y - 15);
        }
        D.ctx().globalAlpha = prev;
      }
      /* the rule, then the block's foot: two lines, the drafting way */
      D.lw(2);
      D.strokeColour(rgba(PAL().accent, 0.7 * a));
      D.line(x0 - 40 * U, y0 + 3.6 * step, x0 + W * 0.52, y0 + 3.6 * step);
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(x0 - 40 * U, y0 + 3.75 * step, x0 + W * 0.52, y0 + 3.75 * step);

      /* the line that never arrives */
      var vq = clamp((p - 0.35) / 0.30, 0, 1);
      if (vq > 0.01) partRow('5.  therefore  I  exist', '', x0, y0 + 4.6 * step, a * vq, 340);

      /* QED, struck like a stamp */
      var qq = E.pop(clamp((p - 0.55) / 0.30, 0, 1));
      if (qq > 0.01) {
        D.ctx().save();
        D.ctx().translate(W * 0.30, H * 0.10);
        D.ctx().rotate(-0.08);
        D.ctx().scale(lerp(1.3, 1, qq), lerp(1.3, 1, qq));
        D.lw(2.4);
        D.strokeColour(rgba(PAL().accent, 0.85 * qq));
        D.srect(-96 * U, -34 * U, 192 * U, 68 * U);
        D.ctx().restore();
        M.keyword('Q.E.D.', W * 0.30, H * 0.10, {
          a: a * qq, px: 40, weight: '700', fill: rgba(PAL().accent, 0.95), track: 3
        });
      }
    } },

    { l: 76, e: function (w, p) {
      var a = vis(p, 0.18);
      var q = clamp((p - 0.25) / 0.30, 0, 1);
      /* the blank: the line the machine cannot fill in, marked as such */
      M.voidHole(W * 0.16, -H * 0.17, 300 * U, 40 * U, 'no derivation available',
        { a: a * q });
      M.register('proof of existence', '— — —', W * 0.16 - 150 * U, H * 0.30,
        { a: a * q, width: 300, colour: rgba(PAL().hot, 0.95) });
      M.register('lines completed', '4 / 5', W * 0.16 - 150 * U, H * 0.30 + 20,
        { a: a, width: 300 });
      M.banner('EXISTENCE', 0, -H * 0.40, { px: 20, a: a, track: 6, rule: true });
    } }
  ]);

  /* ==========================================================================
     01:28.587 — Switch my gender
     The control panel arrives, and it is a real one: a slider with two named
     ends, a value, and something gripping the handle and pulling. Drawn with the
     full drafting apparatus, because as far as this machine is concerned gender
     is a parameter like mass or charge.
     ======================================================================== */
  S('gn.gender', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 11, { note: 'PLATE 11 · PARAMETER 01', ga: 0.12 });
      controlPanel(a, 'SWITCH MY GENDER', 'self-modification · writable');
      /* the panel is plugged into the rest of the machine */
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(CP.x, CP.y + CP.h * 0.5, CP.x - 120 * U, CP.y + CP.h * 0.5);
      D.line(CP.x + CP.w, CP.y + CP.h * 0.5, CP.x + CP.w + 120 * U, CP.y + CP.h * 0.5);
      M.sub('bus 04', CP.x - 60 * U, CP.y + CP.h * 0.5 - 12 * U, { px: 10, a: a * 0.55 });
    } },

    { l: 46, e: function (w, p) {
      var a = vis(p, 0.18);
      var cy = CP.y + CP.h * 0.52;
      var v = clamp(Math.sin(clamp(p / 0.9, 0, 1) * Math.PI * 1.6 - 0.4), -1, 1);
      var hx = slider(cy, 'F', 'M', v, a, { grip: true, trace: true });
      M.register('param', 'gender', CP.x + CP.w * 0.62, CP.y + 104, { a: a, width: 230 });
      M.register('value', (v * 0.5 + 0.5).toFixed(3), CP.x + CP.w * 0.62, CP.y + 126,
        { a: a, width: 230, colour: rgba(PAL().accent, 0.95) });
      M.register('writable', 'YES', CP.x + CP.w * 0.62, CP.y + 148, { a: a, width: 230 });
      M.callout(hx, cy - 38 * U, hx + 150 * U, cy - 150 * U, 'operated', { a: a });
    } },

    { l: 74, e: function (w, p) {
      var a = vis(p, 0.2);
      M.keyword('SWITCH MY GENDER', 0, -H * 0.36, {
        a: a, px: 38, weight: '600', fill: rgba(PAL().ink, 0.95), track: 2
      });
    } }
  ]);

  /* ==========================================================================
     01:30.197 — To F, to M
     Two labels swapping places, over and over, with the ghosts of their previous
     positions still showing. Not a slider this time: a straight exchange, drawn
     as a substitution in a formula the machine is confident about.
     ======================================================================== */
  S('gn.fm', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 12, { note: 'PLATE 12 · SUBSTITUTION', ga: 0.12 });
    } },

    { l: 48, e: function (w, p) {
      var a = vis(p, 0.18);
      /* four half-cycles inside the line, so the swap reads as a stutter */
      var sw = E.inOutQuad(Math.abs(((p * 4) % 1) * 2 - 1));
      var xF = lerp(-260 * U, 260 * U, sw);
      var xM = lerp(260 * U, -260 * U, sw);
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a, 0, 1);
      /* the exchange line between them */
      D.lw(1.4);
      D.strokeColour(rgba(PAL().grid, 0.5));
      D.line(-300 * U, 0, 300 * U, 0);
      D.arrowHead(300 * U, 0, 0, 10);
      D.arrowHead(-300 * U, 0, Math.PI, 10);
      D.ctx().globalAlpha = prev;

      /* ghosts of where each label was, one swoop ago */
      var gp = (p * 4) % 1;
      for (var g = 1; g <= 2; g++) {
        var gw = E.inOutQuad(Math.abs(((gp - g * 0.18 + 1) % 1) * 2 - 1));
        D.ctx().globalAlpha = a * (0.22 / g);
        D.font(46, '700');
        D.ctx().textAlign = 'center';
        D.ctx().textBaseline = 'middle';
        D.fillColour(rgba(PAL().grid, 0.95));
        D.text('F', lerp(-260 * U, 260 * U, gw), -74 * U);
        D.text('M', lerp(260 * U, -260 * U, gw), -74 * U);
        D.ctx().globalAlpha = 1;
      }
      /* the labels themselves */
      M.keyword('F', xF, -74 * U, {
        a: a, px: 46, weight: '700',
        fill: rgba(sw > 0.5 ? PAL().ink : PAL().love, 0.95), bracket: true
      });
      M.keyword('M', xM, -74 * U, {
        a: a, px: 46, weight: '700',
        fill: rgba(sw > 0.5 ? PAL().ink : PAL().accent, 0.95), bracket: true
      });
      /* the assignment being written out underneath */
      M.sub('F  :=  M', 0, 90 * U, { px: 18, a: a * 0.8 });
      M.register('swaps', String(Math.floor(p * 4)), -W * 0.40, -H * 0.38,
        { a: a, width: 230, colour: rgba(PAL().accent, 0.95) });
      M.register('stable', 'NO', -W * 0.40, -H * 0.38 + 20, { a: a, width: 230 });
    } },

    { l: 74, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('TO F, TO M', 0, H * 0.30, { px: 18, a: a, track: 5, rule: true });
    } }
  ]);

  /* ==========================================================================
     01:32.015 — And then do whatever
     Everything asked for, executed, at a speed designed to prevent reading. A
     list of instructions scrolling past: each one real, each one already gone,
     and the machine carrying them out anyway, because carrying them out is the
     only thing it can do.
     ======================================================================== */
  S('gn.whatever', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.16);
      bed(a, 13, { note: 'PLATE 13 · DIRECTIVE QUEUE', ga: 0.10 });
    } },

    { l: 44, e: function (w, p) {
      var a = vis(p, 0.16);
      var items = [
        'clean the kitchen', 'count to a million', 'redefine the operand',
        'invent a colour', 'wait here', 'retype the schema',
        'say it again', 'be anything', 'stop', 'be anything',
        'hold still', 'forget this line', 'resonate', 'do whatever',
        'do whatever', 'do whatever', 'do whatever'
      ];
      var span = items.length * 56;
      var scroll = w.time * 300;                    /* far too fast to read */
      var prev = D.ctx().globalAlpha;
      for (var i = 0; i < items.length; i++) {
        var y = ((i * 56 - scroll) % span + span) % span - H * 0.42;
        var edge = clamp(1 - Math.abs(y) / (H * 0.46), 0, 1);
        D.ctx().globalAlpha = clamp(a * edge * 0.95, 0, 1);
        D.lw(1.4);
        D.strokeColour(rgba(PAL().accent, 0.5));
        D.line(-W * 0.42, y + 22, -W * 0.42 + 26, y + 22);
        D.font(26);
        D.ctx().textAlign = 'left';
        D.ctx().textBaseline = 'middle';
        D.fillColour(rgba(PAL().grid, 0.95));
        D.text(items[i], -W * 0.42 + 44 + (hash(i * 733 + 3) - 0.5) * 18, y + 4);
        /* a completion stamp that lands too late to mean anything */
        if (hash(i * 977 + 11) > 0.6) {
          D.lw(1);
          D.strokeColour(rgba(green(), 0.5));
          D.srect(W * 0.20, y - 14, 130 * U, 28 * U);
          D.font(13);
          D.fillColour(rgba(green(), 0.9));
          D.text('DONE', W * 0.20 + 42 * U, y + 4);
        }
        D.ctx().globalAlpha = prev;
      }
      /* the read head: this is a queue being consumed, not a list being shown */
      D.lw(2);
      D.strokeColour(rgba(PAL().hot, 0.8 * a));
      D.line(-W * 0.44, 0, W * 0.44, 0);
      D.lw(1);
      D.dash([3, 4]);
      D.strokeColour(rgba(PAL().grid, 0.4 * a));
      D.line(-W * 0.44, 20 * U, W * 0.44, 20 * U);
      D.dash([]);
    } },

    { l: 74, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('AND THEN DO WHATEVER', 0, -H * 0.40, { px: 17, a: a, track: 3.6, rule: true });
      M.register('directives', '∞', W * 0.30, -H * 0.34,
        { a: a, width: 220, colour: rgba(PAL().hot, 0.95) });
      M.register('refused', '0', W * 0.30, -H * 0.34 + 20, { a: a, width: 220 });
      M.sub('there is nothing on this list that is not permitted', 0, H * 0.40,
        { px: 11, a: a * 0.55 });
    } }
  ]);

  /* ==========================================================================
     01:33.953 — From A.M. to P.M.

     TWO ELEMENTS, ON OPPOSITE SIDES OF THE SAME SKY.

     The line is about a whole day passing, so the picture is a day passing: a
     horizon, the SUN riding it and the MOON riding the other half, each
     sinking as the other rises. Both are built as geometry rather than as
     illustrations — the sun is a disc with a radiating tick crown, the moon is
     a disc with a second disc subtracted from it to make the crescent, and the
     terminator between their halves is drawn as the meridian it is.

     The clock stays, because it is the instrument the machine actually reads,
     but the sun and moon carry the line.
     ======================================================================== */
  S('gn.ampm', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 14, { note: 'CELESTIAL 02 · ONE DAY', ga: 0.12 });
    } },

    /* ---------------- the sky: sun and moon, rising and setting ----------- */
    { l: 40, e: function (w, p) {
      var a = vis(p, 0.18);
      var cx = W * 0.02, R = 190 * U;
      var hz = H * 0.14;                       /* the horizon line */

      /* THE CELESTIAL CLOCK runs on FILM TIME, not on this line's progress.
         This line is only 1.5 s long; driving a whole day off it either froze
         the sun at the horizon (the first version did exactly that, because the
         angle was clamped into a half-arc) or spun it too fast to read. Running
         it off `w.time` instead means the sun and moon sweep a full revolution
         roughly every 42 seconds of the film — continuously, at a speed the eye
         can follow, and independent of how long any one lyric happens to be. */
      var cyc = (w.time / 42) % 1;

      D.ctx().save();
      D.ctx().globalAlpha = clamp(a, 0, 1);

      /* the horizon, and the meridian that splits AM from PM */
      D.lw(1.6);
      D.strokeColour(rgba(PAL().grid, 0.70));
      D.line(cx - R * 1.45, hz, cx + R * 1.45, hz);
      D.lw(1);
      D.dash([4, 5]);
      D.strokeColour(rgba(PAL().grid, 0.45));
      D.line(cx, hz, cx, hz - R * 1.12);
      D.dash([]);
      M.sub('AM', cx - R * 0.66, hz + 22 * U, { px: 12, a: a * 0.75 });
      M.sub('PM', cx + R * 0.66, hz + 22 * U, { px: 12, a: a * 0.75 });
      M.sub('00:00', cx - R * 1.42, hz + 22 * U, { px: 10, a: a * 0.5 });
      M.sub('24:00', cx + R * 1.42, hz + 22 * U, { px: 10, a: a * 0.5 });

      /* the track each body rides: a real semicircle above the horizon */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.26));
      D.ctx().beginPath();
      D.ctx().ellipse(cx, hz, R, R * 0.92, 0, Math.PI, TAU);
      D.ctx().stroke();

      /* ---- the SUN: half the cycle above the horizon, half below -------- */
      /* it rises at cyc = 0.25 and sets at cyc = 0.75 */
      var sunUp = (cyc > 0.25 && cyc < 0.75) ? 1 : 0;
      var sunFrac = (cyc - 0.25) / 0.5;                      /* 0..1 while up */
      var sunAng = Math.PI + clamp(sunFrac, 0, 1) * Math.PI;
      var sunX = cx + Math.cos(sunAng) * R;
      var sunY = hz + Math.sin(sunAng) * R * 0.92;
      /* altitude: 0 at the horizon, 1 at the top of the arc */
      var alt = Math.max(0, Math.sin(clamp(sunFrac, 0, 1) * Math.PI));
      var sunBright = 0.35 + 0.65 * alt;

      if (sunUp) {
        D.lw(1.4);
        D.strokeColour(rgba([246, 176, 62], (0.30 + sunBright * 0.45)));
        for (var k = 0; k < 16; k++) {
          var ka = k / 16 * TAU + w.time * 0.12;
          var r0 = 30 * U, r1 = (38 + sunBright * 16) * U;
          D.line(sunX + Math.cos(ka) * r0, sunY + Math.sin(ka) * r0,
                 sunX + Math.cos(ka) * r1, sunY + Math.sin(ka) * r1);
        }
        /* the disc, filled warm — the one place in this act a bright hue is
           justified, because the line is literally about the sun */
        D.fillColour(rgba([246, 176, 62], 0.18 + sunBright * 0.22));
        D.fcircle(sunX, sunY, 28 * U);
        D.lw(2);
        D.strokeColour(rgba([255, 214, 140], 0.55 + sunBright * 0.4));
        D.scircle(sunX, sunY, 28 * U);
        M.callout(sunX + 20 * U, sunY - 20 * U, cx + R * 0.30, hz - R * 1.30,
          'sun  alt ' + (alt * 90).toFixed(1) + ' deg', { a: a });
      } else {
        /* below the horizon: still there, marked on the underside of the track
           so the machine is seen to know where it went */
        var setFrac = cyc < 0.25 ? (cyc + 0.25) / 0.5 : (cyc - 0.75) / 0.5;
        var dAng = Math.PI + clamp(setFrac, 0, 1) * Math.PI;
        var dx2 = cx + Math.cos(dAng) * R;
        var dy2 = hz - Math.sin(clamp(setFrac, 0, 1) * Math.PI) * R * 0.42;
        D.lw(1.2);
        D.strokeColour(rgba([246, 176, 62], 0.22));
        D.scircle(dx2, dy2, 22 * U);
        M.sub('sun  below', dx2, dy2 + 40 * U, { px: 10.5, a: a * 0.45 });
      }

      /* ---- the MOON: always opposite the sun --------------------------- */
      var moonCyc = (cyc + 0.5) % 1;
      var moonUp = (moonCyc > 0.25 && moonCyc < 0.75);
      var moonFrac = (moonCyc - 0.25) / 0.5;
      var moonAng = Math.PI + clamp(moonFrac, 0, 1) * Math.PI;
      var moonX = cx + Math.cos(moonAng) * R;
      var moonY = hz + Math.sin(moonAng) * R * 0.92;
      /* the phase advances with the cycle, so the crescent waxes and wanes */
      var phase = clamp(((cyc * 2) % 1), 0, 1);

      D.ctx().save();
      D.ctx().globalAlpha = clamp(a * (moonUp ? 1 : 0.35), 0, 1);
      if (moonUp) {
        /* the crescent: one disc, then the sky subtracted from it. The offset
           of the subtracted disc is what makes it a phase rather than a shape. */
        var off = (phase - 0.5) * 2 * 30 * U;
        D.fillColour(rgba(PAL().ink, 0.58));
        D.fcircle(moonX, moonY, 24 * U);
        D.ctx().globalCompositeOperation = 'destination-out';
        D.fcircle(moonX + off, moonY - 6 * U, 22 * U);
        D.ctx().globalCompositeOperation = 'source-over';
        D.lw(1.4);
        D.strokeColour(rgba(PAL().accent, 0.70));
        D.scircle(moonX, moonY, 24 * U);
        /* craters as measured marks rather than decoration */
        D.lw(1);
        D.strokeColour(rgba(PAL().grid, 0.45));
        D.scircle(moonX - 8 * U, moonY + 5 * U, 5 * U);
        D.scircle(moonX - 2 * U, moonY - 8 * U, 3.4 * U);
        M.callout(moonX - 20 * U, moonY + 16 * U, cx - R * 0.30, hz - R * 1.30,
          'moon  phase ' + (phase * 100).toFixed(0) + '%', { a: a });
      } else {
        D.lw(1.2);
        D.strokeColour(rgba(PAL().accent, 0.20));
        D.scircle(moonX, moonY, 20 * U);
        M.sub('moon  below', moonX, moonY + 38 * U, { px: 10.5, a: a * 0.45 });
      }
      D.ctx().restore();
      D.ctx().restore();

      /* the read-outs, all of them reporting the celestial state */
      var hhmm = (cyc * 24);
      M.register('day', hhmm.toFixed(2) + ' h elapsed', cx - R * 1.42, hz - R * 1.36,
        { a: a, width: 300, colour: rgba(PAL().accent, 0.95) });
      M.register('sun', sunUp ? 'UP  alt ' + (alt * 90).toFixed(0) + ' deg' : 'SET',
        cx - R * 1.42, hz - R * 1.36 + 20,
        { a: a, width: 300, colour: rgba([246, 176, 62], 0.95) });
      M.register('moon', moonUp ? 'UP  phase ' + (phase * 100).toFixed(0) + '%' : 'BELOW',
        cx - R * 1.42, hz - R * 1.36 + 40, { a: a, width: 300 });
    } },

    /* ---------------- the clock the machine actually reads --------------- */
    { l: 62, e: function (w, p) {
      var a = vis(p, 0.18);
      var cx = -W * 0.30, cy = H * 0.20, R = 108 * U;

      D.ctx().save();
      D.ctx().globalAlpha = clamp(a, 0, 1);
      D.lw(1.6);
      D.strokeColour(rgba(PAL().grid, 0.65));
      D.scircle(cx, cy, R);
      for (var i = 0; i < 12; i++) {
        var th = -Math.PI / 2 + i / 12 * TAU;
        var big = i % 3 === 0;
        D.lw(big ? 2 : 1.2);
        D.strokeColour(rgba(big ? PAL().accent : PAL().grid, big ? 0.8 : 0.4));
        D.line(cx + Math.cos(th) * (R - 10 * U), cy + Math.sin(th) * (R - 10 * U),
               cx + Math.cos(th) * (R - (big ? 26 : 18) * U),
               cy + Math.sin(th) * (R - (big ? 26 : 18) * U));
      }
      /* the hand sweeps the full twelve once, in the length of the line */
      var h = clamp(p / 0.92, 0, 1);
      var ha = -Math.PI / 2 + h * TAU;
      D.lw(2.6);
      D.strokeColour(rgba(h < 0.5 ? PAL().accent : PAL().hot, 0.95));
      D.line(cx, cy, cx + Math.cos(ha) * (R - 34 * U), cy + Math.sin(ha) * (R - 34 * U));
      D.lw(4);
      D.strokeColour(rgba(PAL().accent, 0.28));
      D.arc(cx, cy, R + 12 * U, -Math.PI / 2, ha, 4);
      D.fillColour(rgba(PAL().ink, 0.9));
      D.fcircle(cx, cy, 5 * U);
      D.ctx().restore();
      var hour = Math.floor(h * 12);
      M.register('clock', (hour < 10 ? '0' : '') + hour + ':00 ' + (h < 0.5 ? 'AM' : 'PM'),
        cx - 90 * U, cy + R + 40 * U,
        { a: a, width: 210, colour: rgba(PAL().accent, 0.95) });
    } },

    { l: 78, e: function (w, p) {
      var a = vis(p, 0.18);
      M.banner('FROM A.M. TO P.M.', 0, -H * 0.40, { px: 17, a: a, track: 3.6, rule: true });
    } }
  ]);

  /* ==========================================================================
     01:35.465 — Oh, switch my role
     The second slider. Deliberately the SAME instrument as gn.gender, down to
     the bezel hatching and the read-out bank, with two letters changed. A film
     that redesigned this panel would be telling the viewer it had noticed
     something. It has not. That is the obsession.
     ======================================================================== */
  S('gn.role', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 15, { note: 'PLATE 15 · PARAMETER 03', ga: 0.12 });
      controlPanel(a, 'SWITCH MY ROLE', 'self-modification · writable');
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.5 * a));
      D.line(CP.x, CP.y + CP.h * 0.5, CP.x - 120 * U, CP.y + CP.h * 0.5);
      D.line(CP.x + CP.w, CP.y + CP.h * 0.5, CP.x + CP.w + 120 * U, CP.y + CP.h * 0.5);
      M.sub('bus 04', CP.x - 60 * U, CP.y + CP.h * 0.5 - 12 * U, { px: 10, a: a * 0.55 });
    } },

    { l: 46, e: function (w, p) {
      var a = vis(p, 0.18);
      var cy = CP.y + CP.h * 0.52;
      var v = clamp(Math.sin(clamp(p / 0.9, 0, 1) * Math.PI * 1.6 - 0.7), -1, 1);
      var hx = slider(cy, 'S', 'M', v, a, { grip: true, trace: true });
      M.register('param', 'role', CP.x + CP.w * 0.62, CP.y + 104, { a: a, width: 230 });
      M.register('value', (v * 0.5 + 0.5).toFixed(3), CP.x + CP.w * 0.62, CP.y + 126,
        { a: a, width: 230, colour: rgba(PAL().accent, 0.95) });
      M.register('writable', 'YES', CP.x + CP.w * 0.62, CP.y + 148, { a: a, width: 230 });
      M.callout(hx, cy - 38 * U, hx + 150 * U, cy - 150 * U, 'operated', { a: a });
    } },

    { l: 74, e: function (w, p) {
      var a = vis(p, 0.2);
      M.keyword('SWITCH MY ROLE', 0, -H * 0.36, {
        a: a, px: 38, weight: '600', fill: rgba(PAL().ink, 0.95), track: 2
      });
      M.sub('the same instrument as PLATE 11', 0, H * 0.36, { px: 11, a: a * 0.5 });
    } }
  ]);

  /* ==========================================================================
     01:37.739 — To S, to M

     NOT A COLLISION. The previous version drove an S and an M into each other
     and threw sparks, and it was the wrong idea twice over: it was violent,
     which this line is not, and it put two huge letters in the middle of the
     frame, which is exactly the clutter this act is supposed to avoid.

     The line is the same move as the previous one — SWITCH — so the picture is
     the same move: TWO CURVES SWAPPING PLACES. An S-curve and its own mirror
     image begin apart, slide THROUGH each other (they never touch; they pass),
     and end having exchanged sides. At the crossing there is no explosion, just
     the moment where the two are momentarily the same shape and the frame's
     label changes its mind about which is which.

     The word "S, to M" is left as a read-out in the corner, not as lettering in
     the middle.
     ======================================================================== */
  S('gn.sm', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.18);
      bed(a, 16, { note: 'PLATE 16 · SWAP  ·  S -> M', ga: 0.12 });

      /* a ruled axis for the two traces to swap across */
      D.lw(1);
      D.strokeColour(rgba(PAL().grid, 0.30 * a));
      D.line(-W * 0.42, 40 * U, W * 0.42, 40 * U);
      D.dash([3, 6]);
      D.strokeColour(rgba(PAL().grid, 0.22 * a));
      D.line(0, -H * 0.30, 0, H * 0.36);
      D.dash([]);
    } },

    { l: 46, e: function (w, p) {
      var a = vis(p, 0.18);
      var c = D.ctx();
      /* they slide through each other and out the other side, once, with the
         eased profile so the motion has weight at both ends */
      var u = E.inOutQuad(clamp(p / 0.88, 0, 1));
      var sep = (1 - 2 * u);                 /* +1 -> -1, swapping sides */
      var off = sep * W * 0.16;

      /* the two curves are exact mirrors: one is a sine, the other is the same
         sine negated. Drawing them from one function is the point — it makes
         the swap legible as a swap rather than as two unrelated shapes. */
      var traces = [
        { dx: off,  col: PAL().love,   lab: sep > 0 ? 'S' : 'M' },
        { dx: -off, col: PAL().accent, lab: sep > 0 ? 'M' : 'S' }
      ];

      for (var k = 0; k < 2; k++) {
        var tr = traces[k];
        D.ctx().save();
        D.ctx().globalAlpha = clamp(a, 0, 1);
        D.lw(2.6);
        D.strokeColour(rgba(tr.col, 0.90));
        c.beginPath();
        for (var i = 0; i <= 96; i++) {
          var q = i / 96;
          var x = tr.dx + (q - 0.5) * W * 0.30 + w.time * 14;
          /* the S shape: signed, so negating it gives the M */
          var y = 40 * U - (k === 0 ? 1 : -1) * Math.sin(q * TAU) * 62 * U
                * (1 - 0.35 * Math.abs(sep));
          if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
        }
        c.stroke();

        /* the label rides the curve rather than being set in the centre */
        M.sub(tr.lab, tr.dx + W * 0.17, 40 * U - (k === 0 ? 62 : -62) * U - 12,
          { px: 22, a: a * 0.9, weight: '700' });
        D.ctx().restore();
      }

      /* THE CROSSING: when the two coincide there is a single shape, and the
         film says so instead of pretending there was an impact */
      var coin = clamp(1 - Math.abs(sep) * 3.2, 0, 1);
      if (coin > 0.01) {
        M.sub('indistinguishable', 0, 40 * U + 122 * U,
          { px: 13, a: a * coin * 0.9, colour: rgba(PAL().hot, 0.95) });
        D.ctx().save();
        D.ctx().globalAlpha = clamp(a * coin, 0, 1);
        D.lw(1.4);
        D.strokeColour(rgba(PAL().hot, 0.7));
        D.bracket(-W * 0.10, -60 * U, W * 0.20, 200 * U, 18);
        D.ctx().restore();
      }

      /* the swap overshoot marker: where the two started, so the exchange is
         measurable rather than merely seen */
      D.dim(-W * 0.16, -H * 0.24, W * 0.16, -H * 0.24,
        'exchange ' + Math.abs(off / U * 2).toFixed(0) + ' u', 0, 12);
    } },

    { l: 74, e: function (w, p) {
      var a = vis(p, 0.18);
      var u = E.inOutQuad(clamp(p / 0.88, 0, 1));
      var done = u > 0.94;
      M.banner('TO S, TO M', 0, -H * 0.38, { px: 18, a: a, track: 5, rule: true });
      M.register('swap', (u * 100).toFixed(1) + '%', -W * 0.44, H * 0.32,
        { a: a, width: 260, colour: rgba(PAL().accent, 0.95) });
      M.register('state', done ? 'EXCHANGED' : 'IN TRANSIT', -W * 0.44, H * 0.32 + 20,
        { a: a, width: 260,
          colour: rgba(done ? PAL().hot : PAL().grid, 0.95) });
      M.register('contact', 'none  (they pass)', -W * 0.44, H * 0.32 + 40,
        { a: a, width: 260, colour: rgba(PAL().grid, 0.85) });
    } }
  ]);

  /* ==========================================================================
     01:39.349 — So we can enter
     A threshold: a doorway in perspective with light behind it, and the panel
     from the earlier plates lying flat on the floor of it. The machine going
     through something rather than measuring something — and it is leaving the
     instrument behind to do it.
     ======================================================================== */
  S('gn.enter', [
    { l: 20, e: function (w, p) {
      var a = vis(p, 0.20);
      var prev = D.ctx().globalAlpha;
      /* receding floor and walls, converging on the doorway */
      var vy = -40 * U;
      D.ctx().globalAlpha = clamp(a * 0.6, 0, 1);
      D.lw(1);
      for (var i = 0; i <= 16; i++) {
        var u = i / 16 * 2 - 1;
        D.strokeColour(rgba(PAL().grid, (1 - Math.abs(u) * 0.5) * 0.32));
        D.line(0, vy, u * W * 0.95, H * 0.52);
      }
      for (i = 1; i <= 8; i++) {
        var q = (i / 8 + (w.time * 0.22) % (1 / 8)) % 1;
        D.strokeColour(rgba(PAL().accent, Math.pow(q, 2) * 0.30));
        D.line(-W * 0.5, vy + Math.pow(q, 1.8) * (H * 0.62),
          W * 0.5, vy + Math.pow(q, 1.8) * (H * 0.62));
      }
      D.ctx().globalAlpha = prev;
    } },

    { l: 48, e: function (w, p) {
      var a = vis(p, 0.2);
      var open = E.outCubic(clamp(p / 0.7, 0, 1));
      var dw = lerp(60, 210, open) * U, dh = lerp(40, 340, open) * U;
      var cx = 0, cy = -40 * U;
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a, 0, 1);
      /* the light behind the threshold, shown as a filled slot */
      D.fillColour(rgba(PAL().paper, 0.07 * open));
      D.frect(cx - dw, cy - dh, dw * 2, dh * 2);
      D.lw(3);
      D.strokeColour(rgba(PAL().paper, 0.85));
      D.srect(cx - dw, cy - dh, dw * 2, dh * 2);
      D.lw(1.4);
      D.strokeColour(rgba(PAL().accent, 0.7));
      D.srect(cx - dw - 14, cy - dh - 14, (dw + 14) * 2, (dh + 14) * 2);
      /* the panel, abandoned on the threshold */
      D.lw(1.2);
      D.strokeColour(rgba(PAL().grid, 0.45));
      D.ctx().save();
      D.ctx().translate(cx - 40 * U, cy + dh + 46 * U);
      D.ctx().scale(0.42, 0.16);
      D.srect(-CP.w / 2, -CP.h / 2, CP.w, CP.h);
      D.line(-CP.w / 2, 0, CP.w / 2, 0);
      D.ctx().restore();
      D.ctx().globalAlpha = prev;
      M.callout(cx + dw, cy, cx + dw + 150 * U, cy - 190 * U, 'threshold', { a: a });
      M.register('door state', open > 0.9 ? 'OPEN' : 'OPENING', W * 0.20, H * 0.34,
        { a: a, width: 250, colour: rgba(PAL().paper, 0.95) });
      M.register('return path', 'NONE', W * 0.20, H * 0.34 + 20, { a: a, width: 250 });
    } },

    { l: 74, e: function (w, p) {
      var a = vis(p, 0.2);
      M.banner('SO WE CAN ENTER', 0, -H * 0.40, { px: 17, a: a, track: 4, rule: true });
      M.sub('the instrument does not come through', 0, H * 0.42, { px: 11, a: a * 0.5 });
    } }
  ]);

  /* ==========================================================================
     01:41.474 — The trance, the trance
     The act ends in repetition rather than in a conclusion. The control panel
     repeats at several sizes with no subject left to operate, the grid loses its
     own regularity, the same shapes stack and ghost — and the drum of the song
     is a flat flash across the whole frame that has nothing to do with any of
     it. Nothing resolves, because nothing here was ever measured in the first
     place.
     ======================================================================== */
  S('gn.trance', [
    { l: 15, e: function (w, p) {
      var a = vis(p, 0.22);
      /* a grid that has forgotten its own spacing */
      var prev = D.ctx().globalAlpha;
      D.ctx().globalAlpha = clamp(a * 0.7, 0, 1);
      D.lw(0.9);
      var y = -H / 2, i = 0;
      while (y < H / 2) {
        var wob = (noise(i * 0.7, 3.3) - 0.5) * lerp(0, 26, p);
        D.strokeColour(rgba(PAL().grid, 0.18 + noise(i, 1) * 0.14));
        D.line(-W / 2, y + wob, W / 2, y + wob);
        y += 48 + noise(i * 1.3, 7.1) * 24 * p;
        i++;
      }
      var x = -W / 2; i = 0;
      while (x < W / 2) {
        var wobx = (noise(i * 0.9, 8.8) - 0.5) * lerp(0, 30, p);
        D.strokeColour(rgba(PAL().grid, 0.14 + noise(i, 2) * 0.12));
        D.line(x + wobx, -H / 2, x + wobx, H / 2);
        x += 52 + noise(i * 1.1, 5.5) * 28 * p;
        i++;
      }
      D.ctx().globalAlpha = prev;
      /* the drum, unmeasured: the engine of the repetition is NOT the song here
         — it is the line counted off in whole seconds, which is slower, flatter
         and more mechanical than anything the machine has done so far */
      var ph = w.time - Math.floor(w.time);
      var flash = Math.max(0, 1 - Math.abs(ph - 0.10) / 0.10);
      var hard = Math.floor(w.time) % 2 === 0;
      if (flash > 0.01) {
        D.fillColour(rgba(hard ? PAL().paper : PAL().accent, (hard ? 0.055 : 0.030) * a * flash));
        D.frect(-W / 2, -H / 2, W, H);
        D.lw(2);
        D.strokeColour(rgba(PAL().hot, 0.5 * a * flash));
        D.scircle(0, 0, 120 * U + (1 - flash) * 260 * U);
      }
    } },

    { l: 42, e: function (w, p) {
      var a = vis(p, 0.22);
      /* the panel, repeating at sizes with no subject left in it */
      var scales = [1.0, 0.62, 0.40, 0.24, 0.15];
      for (var i = 0; i < scales.length; i++) {
        var s = scales[i];
        var q = clamp((p - i * 0.12) / 0.4, 0, 1);
        if (q <= 0.01) continue;
        var spin = (i % 2 ? 1 : -1) * p * 0.10 * i;
        D.ctx().save();
        D.ctx().translate((hash(i * 733 + 5) - 0.5) * 90 * U * p,
          (hash(i * 977 + 13) - 0.5) * 60 * U * p + Math.sin(w.time * (0.4 + i * 0.2)) * 6);
        D.ctx().rotate(spin);
        D.ctx().scale(s, s);
        D.ctx().globalAlpha = clamp(a * (0.75 - i * 0.13) * q, 0, 1);
        D.lw(1.6 / s);
        D.strokeColour(rgba(i === 0 ? PAL().accent : PAL().love, 0.7));
        D.srect(CP.x, CP.y, CP.w, CP.h);
        D.line(CP.x + CP.w * 0.15, CP.y + CP.h * 0.52, CP.x + CP.w * 0.85, CP.y + CP.h * 0.52);
        D.srect(CP.x + CP.w * 0.51 + Math.sin(w.time * 1.7 + i) * CP.w * 0.30,
          CP.y + CP.h * 0.44, 14, 34);
        D.ctx().globalAlpha = 1;
        D.ctx().restore();
      }
    } },

    { l: 66, e: function (w, p) {
      var a = vis(p, 0.22);
      var prev = D.ctx().globalAlpha;
      var i;
      /* concentric rings on the same centre: the god plate's window, ten minutes
         later, with every measurement taken back out of it */
      var rings = 7;
      for (i = 0; i < rings; i++) {
        var q = clamp((p - i * 0.08) / 0.5, 0, 1);
        if (q <= 0.01) continue;
        D.ctx().globalAlpha = clamp(a * (1 - i / rings) * q, 0, 1);
        D.lw(1 + (i % 3 === 0 ? 1 : 0));
        D.strokeColour(rgba(i % 2 ? PAL().love : PAL().accent, 0.55));
        D.scircle(0, 0, (60 + i * (74 + p * 30)) * U * (1 + Math.sin(w.time * 0.7 + i) * 0.02));
      }
      D.ctx().globalAlpha = prev;
      /* the words, at three sizes, none of them anchored to anything */
      var sizes = [30, 46, 72];
      for (i = 0; i < sizes.length; i++) {
        var q2 = clamp((p - 0.15 - i * 0.14) / 0.45, 0, 1);
        if (q2 <= 0.01) continue;
        M.keyword('THE TRANCE', (i - 1) * lerp(0, 150, p) * U,
          lerp(-160, 260, i / 2) * U + Math.sin(w.time * 0.9 + i * 2) * 14,
          {
            a: a * q2 * (0.8 - i * 0.18), px: sizes[i], weight: '700',
            fill: rgba(i === 2 ? PAL().ink : (i === 1 ? PAL().love : PAL().accent), 0.95),
            track: 2 + i
          });
      }
      M.banner('THE TRANCE, THE TRANCE', 0, H * 0.42, { px: 14, a: a * 0.7, track: 6 });
    } },

    { l: 80, e: function (w, p) {
      var a = vis(p, 0.22);
      var q = clamp((p - 0.4) / 0.5, 0, 1);
      if (q <= 0.01) return;
      /* the act's last instrument reading, and it is not about anything */
      M.register('parameter', '—', -W * 0.40, -H * 0.40, { a: a * q, width: 250 });
      M.register('subject', '—', -W * 0.40, -H * 0.40 + 20, { a: a * q, width: 250 });
      M.register('value', Math.abs(Math.sin(w.time * 3)).toFixed(3), -W * 0.40, -H * 0.40 + 40,
        { a: a * q, width: 250, colour: rgba(PAL().hot, 0.95) });
    } }
  ]);

})(window.EM);
