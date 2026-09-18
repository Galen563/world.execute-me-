/* ============================================================================
   src/00_core.js — deterministic kernel.

   Owns: namespace, constants, easing, colour, tile grid, beat clock, hash.

   THE ONE RULE THIS FILE EXISTS TO ENFORCE
   ----------------------------------------
   Nothing here or anywhere downstream keeps mutable state between frames. A
   frame is a pure function of `t`. There is no Math.random(), no frame
   counter, no particle array that survives a tick.

   That is not tidiness, it is what makes scrubbing work. If the picture
   depended on how many frames had been drawn, dragging the progress bar
   backwards would render a different world from the one that played through
   it — and a music video you cannot seek in is not a music video.

   So: all "randomness" is a hash of an integer seed, and the seed is always
   derived from time or from an index. Same t in, same pixels out, forever.
   ==========================================================================*/
window.EM = window.EM || {};

(function (EM) {
  'use strict';

  EM.TAU = Math.PI * 2;
  EM.PI = Math.PI;

  /* --------------------------------------------------------------------------
     THE MEASURED AUDIO LENGTH.
     assets/waveform.js parses every MPEG frame header in the supplied file and
     writes EM.AUDIO_END from the real sample count: 8115 frames x 1152 samples
     / 44100 Hz = 211.98367 s. The fallback below only matters if that asset is
     missing, and it is deliberately not the same number so a silent fallback
     cannot masquerade as a measurement.
     ------------------------------------------------------------------------ */
  if (typeof EM.AUDIO_END !== 'number') {
    EM.AUDIO_END = 211.984;
    EM.AUDIO_MEASURED = false;
  } else {
    EM.AUDIO_MEASURED = true;
  }

  EM.Settings = {
    /* If a video file sits next to the page it can be used as a picture bed
       under the drawn film. Off by default: the mp3 is the only clock, and an
       optional bed must never be allowed to drift it. */
    useVideo: false,
    /* the film's virtual stage. Everything is drawn in these units and scaled
       to the window, so composition is resolution-independent. */
    stageW: 1600,
    stageH: 900
  };

  /* ==========================================================================
     MATH
     ======================================================================== */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  /* normalise v out of [a,b] into 0..1, clamped */
  function inv(a, b, v) { return b === a ? 0 : clamp((v - a) / (b - a), 0, 1); }
  /* an unclamped ramp, for callers that want to see it overshoot */
  function ramp(a, b, v) { return b === a ? 0 : (v - a) / (b - a); }
  function smoothstep(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  /* 0..1 pulse that is 1 at `centre` and reaches 0 at +-width */
  function bump(u, width) {
    var d = Math.abs(u) / (width || 1);
    return d >= 1 ? 0 : Math.pow(1 - d, 2);
  }
  function wrap(v, n) { return ((v % n) + n) % n; }
  function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
  /* a value that oscillates 0..1 with period `per`, deterministic from t */
  function wave(t, per, phase) {
    return 0.5 + 0.5 * Math.sin((t / (per || 1) + (phase || 0)) * EM.TAU);
  }

  /* ==========================================================================
     EASING
     ======================================================================== */
  var E = {
    lin: function (u) { return u; },
    inQuad: function (u) { return u * u; },
    outQuad: function (u) { return 1 - (1 - u) * (1 - u); },
    inOutQuad: function (u) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; },
    inCubic: function (u) { return u * u * u; },
    outCubic: function (u) { return 1 - Math.pow(1 - u, 3); },
    inQuart: function (u) { return u * u * u * u; },
    outQuart: function (u) { return 1 - Math.pow(1 - u, 4); },
    outQuint: function (u) { return 1 - Math.pow(1 - u, 5); },
    outExpo: function (u) { return u >= 1 ? 1 : 1 - Math.pow(2, -10 * u); },
    inExpo: function (u) { return u <= 0 ? 0 : Math.pow(2, 10 * u - 10); },
    outBack: function (u) {
      var c = 1.70158, c3 = c + 1;
      return 1 + c3 * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
    },
    outElastic: function (u) {
      if (u === 0 || u === 1) return u;
      var c4 = EM.TAU / 3;
      return Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * c4) + 1;
    },
    outBounce: function (u) {
      var n = 7.5625, d = 2.75;
      if (u < 1 / d) return n * u * u;
      if (u < 2 / d) { u -= 1.5 / d; return n * u * u + 0.75; }
      if (u < 2.5 / d) { u -= 2.25 / d; return n * u * u + 0.9375; }
      u -= 2.625 / d; return n * u * u + 0.984375;
    },
    /* instant attack, long settle — the shape of a struck object */
    hit: function (u) { return Math.pow(1 - clamp(u, 0, 1), 3); },
    /* fast in, tiny overshoot, settle — the shape of something arriving */
    pop: function (u) {
      u = clamp(u, 0, 1);
      return u < 0.18
        ? E.outExpo(u / 0.18)
        : 1 + 0.09 * Math.sin((u - 0.18) * 16) * Math.pow(1 - u, 2);
    },
    /* slow start, slow end, no overshoot — for things that drift */
    breathe: function (u) { return 0.5 - 0.5 * Math.cos(clamp(u, 0, 1) * EM.PI); }
  };

  /* ==========================================================================
     DETERMINISTIC HASH
     The only source of "randomness" in the film. Integer in, 0..1 out.
     ======================================================================== */
  function hash(n) {
    n = (n << 13) ^ n;
    n = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
    return n / 0x7fffffff;
  }
  /* signed variant, -1..1 */
  function hashs(n) { return hash(n) * 2 - 1; }
  /* value noise, smoothstep-interpolated */
  function noise1(x) {
    var i = Math.floor(x), f = x - i;
    return lerp(hash(i), hash(i + 1), smoothstep(f));
  }
  function noise2(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var xf = x - xi, yf = y - yi;
    var u = smoothstep(xf), v = smoothstep(yf);
    var a = hash(xi * 374761393 + yi * 668265263);
    var b = hash((xi + 1) * 374761393 + yi * 668265263);
    var c = hash(xi * 374761393 + (yi + 1) * 668265263);
    var d = hash((xi + 1) * 374761393 + (yi + 1) * 668265263);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  /* fract-of-sine style jitter: cheap, stable, good for hand-drawn wobble */
  function jitter(seed, amp) {
    return Math.sin(seed * 12.9898) * 43758.5453 % 1 * (amp || 1);
  }

  /* ==========================================================================
     COLOUR
     ======================================================================== */
  function rgba(c, a) {
    if (a === undefined) a = 1;
    if (typeof c === 'string') {
      var m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
      if (m) return 'rgba(' + (+m[1] | 0) + ',' + (+m[2] | 0) + ',' + (+m[3] | 0) + ',' + a + ')';
      return c;
    }
    return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')';
  }
  function parse(css) {
    if (typeof css !== 'string' || css.charAt(0) !== 'r') return null;
    var m = css.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  }
  /* WCAG relative luminance, used only to keep type legible */
  function lum(c) {
    function f(v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  }
  function mix(a, b, u) {
    u = clamp(u, 0, 1);
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  }
  function hex(c) {
    function h(v) { return ('0' + (clamp(v, 0, 255) | 0).toString(16)).slice(-2); }
    return '#' + h(c[0]) + h(c[1]) + h(c[2]);
  }

  /* ==========================================================================
     TILE GRID — what the machine is actually computing on.

     The world is a fixed lattice and every event fires *at a tile*. Beat k of
     the song corresponds to a specific cell, computed two-dimensionally so
     consecutive beats walk a path across the board rather than filling it like
     a progress bar. Accents and the love/hate axis are separate dimensions of
     the same grid, which is why the love section can be a diagonal wash across
     a board that the alarms had been scanning row by row.

     Pure functions of an integer beat index: seek anywhere, get the same tile.
     ======================================================================== */
  function tile(b) {
    var k = Math.floor(b);
    return { c: wrap(k * 7 + Math.floor(k / 8), 32), r: wrap(k * 13 + Math.floor(k / 4), 18) };
  }
  /* 0..1 coordinates of a tile centre on the stage */
  function tilePos(t_, stageW, stageH) {
    var cols = 32, rows = 18;
    return {
      x: (t_.c + 0.5) / cols * stageW - stageW / 2,
      y: (t_.r + 0.5) / rows * stageH - stageH / 2
    };
  }

  /* ==========================================================================
     BEAT CLOCK — accents read straight off the supplied MIDI.

     assets/onsets.js holds every note-on as
        [time_ms, lowest_pitch, highest_pitch, simultaneous_notes, velocity]
     so the film's impacts land on notes that were actually played rather than
     on a metronome guess. The recording sits about 0.11 s off a strict 130 BPM
     lattice, which is why the words follow the measured lyric timeline and
     only the *accents* come from here. Two jobs, two sources, never mixed.
     ======================================================================== */
  EM.ONSETS = EM.ONSETS || [];

  /* index of the last onset at or before t (binary search; called per frame) */
  var _cacheI = -1;
  function onsetIndex(t) {
    var arr = EM.ONSETS;
    if (!arr.length) return -1;
    var ms = t * 1000, lo = 0, hi = arr.length - 1, best = -1;
    /* the common case is the same or the next onset as last frame, so probe
       the cached index first and only search when it has moved on */
    if (_cacheI >= 0 && _cacheI < arr.length && arr[_cacheI][0] <= ms) {
      if (_cacheI + 1 >= arr.length || arr[_cacheI + 1][0] > ms) return _cacheI;
    }
    while (lo <= hi) {
      var mid = (lo + hi) >> 1;
      if (arr[mid][0] <= ms) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
    }
    _cacheI = best;
    return best;
  }

  /* decaying 0..1 value that spikes to 1 exactly on a note */
  function onsetPulse(t, win) {
    win = win || 0.24;
    var i = onsetIndex(t);
    if (i < 0) return 0;
    var dt = t - EM.ONSETS[i][0] / 1000;
    if (dt < 0 || dt > win) return 0;
    return Math.pow(1 - dt / win, 2.2);
  }

  /* the nearest onset within +-win seconds, or null */
  function onsetNear(t, win) {
    win = win || 0.12;
    var i = onsetIndex(t);
    if (i < 0) return null;
    var best = Math.abs(t - EM.ONSETS[i][0] / 1000), bi = i;
    if (i + 1 < EM.ONSETS.length) {
      var d2 = Math.abs(EM.ONSETS[i + 1][0] / 1000 - t);
      if (d2 < best) { best = d2; bi = i + 1; }
    }
    if (best > win) return null;
    var o = EM.ONSETS[bi];
    return { t: o[0] / 1000, lo: o[1], hi: o[2], voices: o[3], vel: o[4], i: bi };
  }

  function onsetsBetween(a, b) {
    var out = [], arr = EM.ONSETS;
    for (var i = 0; i < arr.length; i++) {
      var tt = arr[i][0] / 1000;
      if (tt >= a) { if (tt <= b) out.push(arr[i]); else break; }
    }
    return out;
  }

  /* the beat ordinal at time t — how many notes have sounded so far. This is
     the film's "how far has the machine got" counter and it drives the tiles. */
  function beatAt(t) { return onsetIndex(t) + 1; }

  /* local tempo estimate: seconds between the notes around t. Used to make
     motion speed up with the music instead of with a hard-coded constant. */
  function beatPeriod(t, fallback) {
    var i = onsetIndex(t), arr = EM.ONSETS;
    if (i < 1 || i >= arr.length) return fallback || 0.4615;
    var a = arr[i - 1][0] / 1000, b = arr[i][0] / 1000;
    var d = b - a;
    return (d > 0.05 && d < 2) ? d : (fallback || 0.4615);
  }

  /* ==========================================================================
     TIME FORMATTING
     ======================================================================== */
  function pad(n, w) {
    var s = String(Math.floor(Math.abs(n)));
    while (s.length < w) s = '0' + s;
    return s;
  }
  function fmtTime(sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    var ms = Math.round((sec - Math.floor(sec)) * 1000);
    if (ms === 1000) { ms = 0; s++; if (s === 60) { s = 0; m++; } }
    return m + ':' + pad(s, 2) + '.' + pad(ms, 3);
  }
  function fmtClock(sec) {
    sec = Math.max(0, sec);
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + pad(s, 2);
  }

  /* --------------------------------------------------------------------------
     pick: a small helper used all over the plate files to choose between
     cosmetic alternatives from a seed without a data table.
     ------------------------------------------------------------------------ */
  function pick(seed, list) {
    return list[Math.floor(hash(seed) * list.length) % list.length];
  }

  EM.clamp = clamp; EM.lerp = lerp; EM.inv = inv; EM.ramp = ramp;
  EM.smoothstep = smoothstep; EM.bump = bump; EM.wrap = wrap;
  EM.dist = dist; EM.wave = wave;
  EM.E = E; EM.ease = E;
  EM.hash = hash; EM.hashs = hashs; EM.noise1 = noise1; EM.noise2 = noise2;
  EM.jitter = jitter;
  EM.rgba = rgba; EM.parseCSS = parse; EM.lum = lum; EM.mix = mix; EM.hex = hex;
  EM.color = { rgba: rgba, parse: parse, lum: lum, mix: mix, hex: hex };
  EM.tile = tile; EM.tilePos = tilePos;
  EM.onsetIndex = onsetIndex; EM.onsetPulse = onsetPulse; EM.onsetNear = onsetNear;
  EM.onsetsBetween = onsetsBetween; EM.beatAt = beatAt; EM.beatPeriod = beatPeriod;
  EM.fmtTime = fmtTime; EM.fmtClock = fmtClock; EM.pad = pad;
  EM.pick = pick;
})(window.EM);
