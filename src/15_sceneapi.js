/* ============================================================================
   src/15_sceneapi.js — the plate registry and the per-line draw protocol.

   Every lyric line owns exactly one plate. A plate is a list of layers, each
   with a `l` (draw order) and an `e(w, p, cue)` effect function:

       w    the world state at this instant (see 01_world.js)
       p    0..1 progress through this line
       cue  { i, t, text, scene, repeat, dur, end }

   TWO THINGS THIS FILE IS RESPONSIBLE FOR
   ---------------------------------------
   1. HAND-OFF, NOT CUTS. Plates are faded by `vis(p)` rather than swapped, so
      two adjacent lines dissolve through each other. The film is a continuous
      piece with lyrics over it, not a slideshow with captions.

   2. A FAILURE MUST NOT BE SILENT. A plate that throws is caught so one bad
      effect cannot kill the film — but it is counted, reported once per plate,
      and surfaced in the HUD and in the self-test. A version of this project
      that swallowed plate exceptions reported "131 / 131 plates registered,
      100% coverage" while every single plate was throwing and drawing nothing.
      Coverage that only proves registration is worthless; the audit in
      _tools/scene-audit.js proves ink reached the canvas.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var clamp = EM.clamp, lerp = EM.lerp, E = EM.E;

  var REG = Object.create(null);
  var ORDER = [];

  /* --------------------------------------------------------------------------
     S(id, effects) — register a plate.
     `effects` is an array of { l, e } or bare functions (auto-layered).
     ------------------------------------------------------------------------ */
  function S(id, effects) {
    if (REG[id]) throw new Error('duplicate plate id: ' + id);
    var list;
    if (typeof effects === 'function') list = [{ l: 0, e: effects }];
    else list = [].slice.call(effects);
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] === 'function') list[i] = { l: i * 10, e: list[i] };
      if (list[i].l === undefined) list[i].l = i * 10;
    }
    list.sort(function (a, b) { return a.l - b.l; });
    REG[id] = list;
    ORDER.push(id);
    return list;
  }

  /* --------------------------------------------------------------------------
     PROTOCOL HELPERS — shared by every plate so 131 drawings behave alike
     ------------------------------------------------------------------------ */

  /* --------------------------------------------------------------------------
     THE HAND-OFF.

     Two rules, both learned from watching the film rather than from theory:

     1. A LONG ENTRANCE, RELATIVE TO THE LINE. `a` is a FRACTION of this cue's
        own duration, not a fixed number of seconds, and it is generous. A line
        that lasts 3 s does not finish arriving until half a second in. This is
        what stops the film reading as a slideshow: the incoming picture is
        still resolving while the words are already being sung over it, so
        every line has its own internal movement instead of appearing, holding
        still, and leaving.

     2. THE OUTGOING PLATE IS STILL THERE. drawScene paints the previous cue's
        plate first at a decaying fraction of its own alpha, so the old picture
        leaves THROUGH the new one. Without that, the frame at a line boundary
        is nearly empty and the eye reads a hole — which is exactly the
        "1-3 second gap" the film is not allowed to have.
     ------------------------------------------------------------------------ */
  function vis(p, a) {
    a = a === undefined ? 0.16 : a;
    if (p < 0) return 0;
    if (p < a) return E.outCubic(p / a);
    if (p > 1 - a * 0.8) return E.outCubic(clamp((1 - p) / (a * 0.8), 0, 1));
    return 1;
  }

  /* how long the entrance lasts, as a fraction of this cue, and how fast the
     tail decays.

     These were tuned twice. The first version used a flatter ramp (0.16) and
     `In this strange, strange` — a 1.4 s line — measured at 17 primitives for
     most of its length: mathematically the picture was there, but it spent so
     much of a very short cue fading in and out that the viewer saw a hole.

     So the ramp is a GENEROUS fraction on short lines (a 0.5 s line takes a
     third of its life to arrive) and the tail is long enough that the outgoing
     plate is still substantially present when the incoming one starts. The
     result is that no line, however brief, is ever an empty frame.
     ------------------------------------------------------------------------ */
  function ramp(cue) {
    if (!cue.dur || cue.dur <= 0) return 0.2;
    if (cue.dur < 0.8) return 0.40;
    if (cue.dur < 1.2) return 0.34;
    if (cue.dur < 3) return 0.26;
    if (cue.dur < 8) return 0.22;
    return 0.18;
  }

  /* the previous cue's exit weight at time t: 1 at the boundary, 0 once it has
     finished leaving. Long enough to carry a short outgoing line through the
     incoming one, short enough that it never muddies the new line. */
  var TAIL = 0.50;                 /* seconds */
  function tailAt(cue, t) {
    if (!cue || cue.i <= 0) return 0;
    var dt = t - cue.t;
    if (dt < 0) return 0;
    var q = clamp(dt / TAIL, 0, 1);
    if (q >= 1) return 0;
    return Math.pow(1 - q, 1.5) * 0.80;
  }

  /* per-character / per-element stagger: element k of n reaches 1 at
     k*span of the way through the line */
  function stagger(p, k, n, span) {
    span = span === undefined ? 0.5 : span;
    var st = n > 1 ? (k / (n - 1)) * span : 0;
    return clamp((p - st) / (1 - span), 0, 1);
  }

  /* a window on the line: 0 before `from`, 1 between `from`+`fade` and
     `to`-`fade`, 0 after `to`. Lets a plate stage several beats inside one
     lyric without inventing its own arithmetic. */
  function between(p, from, to, fade) {
    fade = fade === undefined ? 0.06 : fade;
    if (p <= from || p >= to) return 0;
    return Math.min(clamp((p - from) / fade, 0, 1), clamp((to - p) / fade, 0, 1));
  }

  /* flicker that only ever subtracts: 1 most of the time, dipping briefly.
     Used for anything failing. Deterministic from p. */
  function glitchOut(p, amount, seed) {
    var v = 1;
    for (var i = 0; i < 3; i++) {
      var c = EM.hash(((seed || 0) * 977 + i * 131) | 0);
      var wdt = 0.02 + c * 0.05;
      var d = Math.abs(p - c);
      if (d < wdt) v = Math.min(v, 1 - (amount || 0.6) * (1 - d / wdt));
    }
    return v;
  }

  /* count-in used by plates that need to know "which beat of this line" */
  function beatPhase(w, per) { return EM.wave(w.time, per || 1.0); }

  EM.Life = {
    vis: vis,
    ramp: ramp,
    stagger: stagger,
    between: between,
    glitch: glitchOut,
    beat: beatPhase,
    tail: tailAt,
    TAIL: TAIL
  };

  /* --------------------------------------------------------------------------
     DRAW
     ------------------------------------------------------------------------ */
  var faults = Object.create(null);
  var faultCount = 0;
  var faultSeq = [];

  function report(id, err) {
    var msg = (err && err.message) ? err.message : String(err);
    if (faults[id] === msg) return;
    faults[id] = msg;
    faultCount++;
    faultSeq.push({ id: id, message: msg });
    var label = 'plate "' + id + '" failed: ' + msg;
    if (faultCount <= 12) console.error('[world.execute(me);] ' + label);
    else if (faultCount === 13) console.error('[world.execute(me);] … further plate failures suppressed');
    if (EM.onFault) { try { EM.onFault(id, msg); } catch (e) { /* ignore */ } }
  }

  function draw(id, w, t, cue) {
    var list = REG[id];
    if (!list) return false;
    var p = cue.dur > 0 ? clamp((t - cue.t) / cue.dur, 0, 1) : 0;
    exec(list, w, p, t, cue, 1);
    return true;
  }

  /* run one plate's layers at an explicit alpha multiplier */
  function exec(list, w, p, t, cue, gain) {
    var ctx = EM.D.ctx();
    for (var i = 0; i < list.length; i++) {
      ctx.save();
      try {
        if (gain < 0.999) ctx.globalAlpha = gain;
        list[i].e(w, p, cue);
      } catch (err) {
        report(cue.scene, err);
      }
      ctx.restore();
      /* a plate that leaked context state must not poison the next one */
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* --------------------------------------------------------------------------
     THE MORPH.

     A cross-dissolve is not a transition, it is two pictures overlapping. What
     it lacks is DEFORMATION: one shape becoming another. So across every line
     boundary the whole plate transform is driven by a single morph phase that
     runs 0 -> 1 -> 0 through the hand-off, and it carries both pictures:

       at the instant of the changeover both plates are pulled toward each
       other — same scale, same slight rotation — so they read as one shape
       mid-transformation rather than as two independent images. Then the
       incoming plate expands into place and the outgoing one contracts away.

     Total visual weight stays roughly constant through the whole thing because
     the outgoing gain is 1 at the boundary and falls as the incoming rises.

     Note this is applied around the STAGE ORIGIN, which is the centre of the
     frame — so the deformation pivots where the audience's eye is, and the two
     pictures appear to be the same object changing.
     ------------------------------------------------------------------------ */
  function morphAt(cue, t) {
    if (!cue || cue.i <= 0) return 0;
    if (cue.bleed === false) return 0;      /* cut cues do not morph */
    var dt = t - cue.t;
    if (dt < 0 || dt >= TAIL) return 0;
    return E.inOutQuad(1 - dt / TAIL);      /* 1 at the boundary -> 0 */
  }

  /* --------------------------------------------------------------------------
     drawSequence — the outgoing line dissolves THROUGH the incoming one.

     The previous plate is painted first at a decaying share of its alpha and
     the current plate on top at full strength, so at a boundary the frame
     always contains two moving pictures rather than a hole. This is the
     difference between a film and a slideshow, and it is also what removes the
     empty stretches between short lines.

     THE EXCEPTION IS `cue.bleed === false`. A plate whose picture IS the sung
     word must not survive its own line: during the EXECUTION storm the cues are
     0.6-1.0 s apart, so a half-second tail meant the frame kept showing the word
     EXECUTION while the song was singing something else. The lyrics and the
     picture contradicted each other. Those plates are CUT at the boundary
     instead, and the incoming plate's own generous entrance keeps the frame
     full.
     ------------------------------------------------------------------------ */
  function drawSequence(cue, w, t) {
    var ctx = EM.D.ctx();
    var prevCue = (cue.i > 0) ? EM.Lyrics.cues[cue.i - 1] : null;
    var m = morphAt(cue, t);
    var tail = tailAt(cue, t);

    var morphing = m > 0.004 && prevCue && prevCue.bleed !== false;

    if (morphing) {
      ctx.save();
      /* both pictures squeezed toward a common midpoint, then released */
      var sc = 1 - m * 0.075;
      /* plain stage units: this file is not a plate, so it has no `U`. One
         stage unit is one drawing unit by construction. */
      ctx.translate(0, m * 8);
      ctx.scale(sc, sc);
      ctx.rotate(m * 0.020);
    }

    if (tail > 0.004 && prevCue && prevCue.bleed !== false) {
      var prevList = REG[prevCue.scene];
      /* a held cue has no plate: the one before it simply keeps playing, and
         its duration already covers the whole stretch (see 20_lyrics.js) */
      if (prevList) {
        var pp = prevCue.dur > 0 ? clamp((t - prevCue.t) / prevCue.dur, 1, 1.6) : 1;
        exec(prevList, w, pp, t, prevCue, tail);
      }
    }

    /* ---------------------------------------------------------------------
       THE PLATE FOR THIS CUE.

       `cue` is always one that owns a picture: a held cue has already been
       resolved away by EM.Lyrics.at(), and the owner's duration was extended to
       span the held stretch. So there is no special case here — the picture is
       simply run at the owner's own progress, which is what makes the ending one
       continuous shot rather than a shot that fades out and a stretch of nothing.
       --------------------------------------------------------------------- */
    var list = REG[cue.scene];
    if (list) {
      var p = cue.dur > 0 ? clamp((t - cue.t) / cue.dur, 0, 1) : 0;
      exec(list, w, p, t, cue, 1);
    }

    if (morphing) ctx.restore();
    return !!list;
  }

  function progress(id, t, cue) {
    return cue.dur > 0 ? clamp((t - cue.t) / cue.dur, 0, 1) : 0;
  }

  function plates() { return ORDER.slice(); }
  function faultList() {
    return faultSeq.map(function (f) { return f.id + ': ' + f.message; });
  }

  EM.Scenes = S;
  EM.SceneReg = REG;
  EM.SceneOrder = ORDER;
  EM.drawScene = draw;
  EM.drawSequence = drawSequence;
  EM.sceneProgress = progress;
  EM.registeredPlates = plates;
  EM.sceneFaults = faultList;
  EM.sceneFaultCount = function () { return faultCount; };
  EM.hasPlate = function (id) { return !!REG[id]; };
})(window.EM);
