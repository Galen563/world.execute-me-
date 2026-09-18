/* ============================================================================
   gen-world.js — derive the world's timeline from the lyric timeline.

   BUILD step. The world state is what turns 131 discrete plates into one
   continuous film: a handful of slow parameters (order, disorder, warmth,
   heat, organic growth and the forbidden "love" variable) that every plate
   reads. If that curve were authored independently of the lyrics it would
   drift out of step the first time anyone touched a timestamp.

   So it is derived from the cues. This file declares only *intent* — "at this
   line the world has this character" — and the curve is generated, printed as
   a readable score, and written to src/01_world.js.

   Run:  node _build/gen-world.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CUES = require('./load-assets').load(['timeline.js']).CUES;

const cueAt = (scene) => CUES.find(c => c[2] === scene);
const T = (scene) => {
  const c = cueAt(scene);
  if (!c) throw new Error('no cue bound to scene "' + scene + '"');
  return c[0];
};

const DUR = 211.984;

/* ---------------------------------------------------------------------------
   ANCHORS. Each line is a moment the world must be in a specific condition.
   Everything between two anchors is a smooth ramp, so the film never jumps —
   the decay is continuous and the lyric lands on top of it.

     struct   how much the drawn world still obeys its own rules   1 -> 0
     chaos    geometric disorder, jitter, shatter                  0 -> 1
     warm     0 = monitor blue, 1 = body heat
     heat     0 = safe, 1 = alarm / metal under strain
     rot      0 = clean code, 1 = organic growth
     love     the variable this machine was never supposed to hold
     density  how many particles / nodes are alive
     scale    camera zoom, 1 = wide
     shatter  displacement applied to world geometry
     glow     bloom
     topo     grid -> lattice -> wave -> organic -> tangle -> open
     alarm    idle | warn | error | exec
   ------------------------------------------------------------------------- */
const A = [
  /* t,                    struct chaos warm heat  rot  love dens  scale shatter glow topo       alarm */
  [T('boot.empty'),        0.05, 0.10, 0.00, 0.00, 0.00, 0.00, 0.10, 1.32, 0.00, 0.28, 'screen',  'idle'],
  [T('boot.power'),        0.22, 0.07, 0.00, 0.00, 0.00, 0.00, 0.22, 1.26, 0.00, 0.34, 'screen',  'idle'],
  [T('boot.init'),         0.68, 0.04, 0.02, 0.00, 0.00, 0.00, 0.50, 1.06, 0.00, 0.44, 'screen',  'idle'],
  [T('boot.sim'),          0.94, 0.02, 0.03, 0.00, 0.00, 0.00, 0.70, 0.98, 0.00, 0.50, 'screen',  'idle'],
  [T('inst.boot'),         0.88, 0.06, 0.08, 0.00, 0.01, 0.00, 0.62, 1.02, 0.00, 0.46, 'lattice', 'idle'],

  [T('th.points'),         0.92, 0.05, 0.03, 0.00, 0.00, 0.00, 0.76, 0.96, 0.00, 0.34, 'lattice', 'idle'],
  [T('th.sine'),           0.88, 0.06, 0.06, 0.00, 0.00, 0.00, 0.82, 0.94, 0.00, 0.36, 'wave',    'idle'],
  [T('th.current'),        0.84, 0.08, 0.10, 0.00, 0.00, 0.00, 0.84, 0.94, 0.00, 0.38, 'wave',    'idle'],
  [T('th.dizzy'),          0.62, 0.26, 0.06, 0.02, 0.00, 0.00, 0.72, 1.00, 0.06, 0.34, 'wave',    'warn'],
  [T('th.unite'),          0.80, 0.12, 0.16, 0.00, 0.02, 0.02, 0.78, 0.92, 0.02, 0.40, 'wave',    'idle'],

  [T('cd.ifIcan'),         0.82, 0.10, 0.18, 0.00, 0.02, 0.04, 0.78, 0.92, 0.00, 0.40, 'wave',    'idle'],
  [T('cd.satis'),          0.76, 0.14, 0.26, 0.00, 0.04, 0.06, 0.80, 0.90, 0.00, 0.42, 'organic', 'idle'],
  [T('ex.first'),          0.72, 0.20, 0.24, 0.10, 0.03, 0.05, 0.78, 0.92, 0.03, 0.46, 'organic', 'warn'],
  [T('cd.sim2'),           0.68, 0.22, 0.22, 0.04, 0.03, 0.05, 0.74, 0.92, 0.02, 0.44, 'organic', 'idle'],

  [T('fl.eggplant'),       0.66, 0.20, 0.34, 0.00, 0.42, 0.06, 0.74, 0.90, 0.00, 0.40, 'organic', 'idle'],
  [T('fl.cat'),            0.62, 0.20, 0.44, 0.00, 0.58, 0.08, 0.74, 0.90, 0.00, 0.40, 'organic', 'idle'],
  [T('fl.existence'),      0.58, 0.22, 0.46, 0.00, 0.62, 0.14, 0.76, 0.90, 0.00, 0.44, 'organic', 'idle'],
  [T('gn.role'),           0.50, 0.30, 0.34, 0.02, 0.44, 0.14, 0.74, 0.94, 0.04, 0.44, 'organic', 'idle'],
  [T('gn.trance'),         0.42, 0.40, 0.22, 0.04, 0.30, 0.10, 0.70, 0.98, 0.08, 0.40, 'tangle',  'warn'],

  [T('ab.ifIcan2'),        0.46, 0.36, 0.24, 0.02, 0.18, 0.12, 0.72, 0.96, 0.06, 0.36, 'tangle',  'idle'],
  [T('ab.completion'),     0.52, 0.30, 0.28, 0.02, 0.10, 0.18, 0.70, 0.94, 0.06, 0.34, 'tangle',  'idle'],
  [T('lf.you1'),           0.38, 0.44, 0.00, 0.06, 0.00, 0.00, 0.40, 1.00, 0.16, 0.22, 'tangle',  'warn'],
  [T('lf.you5'),           0.26, 0.54, 0.00, 0.10, 0.00, 0.00, 0.26, 1.06, 0.24, 0.16, 'tangle',  'warn'],
  [T('lf.isolation'),      0.20, 0.60, 0.00, 0.12, 0.00, 0.00, 0.18, 1.10, 0.30, 0.12, 'tangle',  'error'],
  [T('fr.fragments'),      0.14, 0.70, 0.02, 0.30, 0.00, 0.00, 0.34, 1.04, 0.40, 0.26, 'tangle',  'error'],
  [T('fr.disheartened'),   0.10, 0.78, 0.02, 0.52, 0.00, 0.00, 0.44, 1.00, 0.48, 0.36, 'tangle',  'error'],
  [T('ag.challenge'),      0.08, 0.82, 0.00, 0.76, 0.00, 0.00, 0.58, 0.98, 0.54, 0.52, 'tangle',  'exec'],
  [T('ag.made'),           0.06, 0.86, 0.00, 0.90, 0.00, 0.00, 0.68, 1.00, 0.60, 0.62, 'tangle',  'exec'],
  [T('ag.illegal'),        0.05, 0.90, 0.00, 1.00, 0.00, 0.00, 0.78, 1.02, 0.66, 0.72, 'tangle',  'exec'],
  [T('inst.stack'),        0.05, 0.92, 0.00, 1.00, 0.00, 0.02, 0.86, 1.04, 0.70, 0.78, 'tangle',  'exec'],

  [T('xs.r01'),            0.06, 0.92, 0.00, 0.98, 0.00, 0.02, 0.88, 1.04, 0.70, 0.78, 'tangle',  'exec'],
  [T('xs.r06'),            0.05, 0.94, 0.00, 1.00, 0.00, 0.03, 0.92, 1.06, 0.74, 0.84, 'tangle',  'exec'],
  [T('xs.r12'),            0.04, 0.96, 0.00, 1.00, 0.00, 0.04, 0.96, 1.08, 0.78, 0.90, 'tangle',  'exec'],
  [T('xs.count1'),         0.04, 0.96, 0.00, 1.00, 0.00, 0.04, 0.96, 1.08, 0.78, 0.90, 'tangle',  'exec'],
  [T('xs.r13'),            0.04, 0.97, 0.00, 1.00, 0.00, 0.05, 0.98, 1.10, 0.82, 0.94, 'tangle',  'exec'],
  [T('xs.r16'),            0.03, 0.98, 0.02, 1.00, 0.00, 0.06, 1.00, 1.12, 0.86, 0.98, 'tangle',  'exec'],
  [T('xs.trapped2'),       0.03, 0.96, 0.08, 0.94, 0.00, 0.14, 0.98, 1.14, 0.84, 0.96, 'tangle',  'exec'],

  /* the turn: order is gone for good, but the world becomes warm, and the
     parameterised geometry is replaced by something drawn by hand */
  [T('lv.studied'),        0.10, 0.74, 0.34, 0.66, 0.02, 0.36, 0.86, 1.14, 0.62, 0.84, 'open',   'error'],
  [T('lv.lo1'),            0.14, 0.60, 0.52, 0.40, 0.04, 0.58, 0.76, 1.16, 0.44, 0.72, 'open',   'warn'],
  [T('lv.lo2'),            0.12, 0.46, 0.66, 0.24, 0.04, 0.78, 0.64, 1.18, 0.30, 0.62, 'open',   'warn'],
  [T('lv.lo3'),            0.08, 0.34, 0.76, 0.12, 0.02, 0.90, 0.52, 1.20, 0.18, 0.54, 'open',   'idle'],
  [T('lv.lo4'),            0.06, 0.24, 0.82, 0.06, 0.00, 0.96, 0.44, 1.22, 0.10, 0.50, 'open',   'idle'],
  [T('inst.loop'),         0.04, 0.14, 0.84, 0.02, 0.00, 1.00, 0.38, 1.26, 0.04, 0.46, 'open',   'idle'],
  [T('ex.final'),          0.03, 0.12, 0.84, 0.10, 0.00, 1.00, 0.30, 1.28, 0.02, 0.44, 'open',   'idle'],
  [T('outro'),             0.02, 0.08, 0.86, 0.04, 0.00, 1.00, 0.22, 1.32, 0.00, 0.42, 'open',   'idle'],
  [DUR,                    0.00, 0.05, 0.88, 0.00, 0.00, 1.00, 0.12, 1.38, 0.00, 0.38, 'open',   'idle']
];

const NUM = ['struct', 'chaos', 'warm', 'heat', 'rot', 'love',
             'density', 'scale', 'shatter', 'glow'];

/* ---------------------------------------------------------------------------
   TILT is authored as its own track rather than as a column in the table above.

   Two reasons. First, forty-odd rows with eleven columns each is exactly the
   kind of thing that gets an off-by-one silently; a separate list of
   [time, degrees] pairs cannot. Second, the tilt has a different character from
   the other parameters — they all decay monotonically toward the ending, while
   this one should be nearly flat and let the SEESAW do the moving:

     WorldLayer.seesaw() swings the whole scene about the centre of the frame,
     and it is added on top of this. So the authored tilt is the piece's held
     attitude and the seesaw is its breathing. Keeping them in separate places
     means the rocking can be retuned without touching the narrative curve.
   ------------------------------------------------------------------------- */
const TILT = [
  [0,           0.0],
  [T('inst.boot'),  0.4],
  [T('th.sine'),   -0.3],
  [T('th.current'), 0.5],
  [T('th.dizzy'),   0.9],
  [T('th.unite'),  -0.4],
  [T('cd.ifIcan'),  0.3],
  [T('cd.satis'),  -0.6],
  [T('ex.first'),   0.7],
  [T('cd.sim2'),   -0.5],
  [T('fl.eggplant'), 0.4],
  [T('fl.cat'),     -0.4],
  [T('gn.role'),    0.8],
  [T('gn.trance'), -1.1],
  [T('ab.ifIcan2'), 0.6],
  [T('ab.completion'), -0.5],
  [T('lf.you1'),    0.9],
  [T('lf.isolation'), 0.0],
  [T('fr.disheartened'), -1.2],
  [T('ag.challenge'), 0.8],
  [T('ag.illegal'),  -0.7],
  [T('inst.stack'),  0.5],
  [T('xs.r08'),      1.1],
  [T('xs.r16'),     -1.0],
  [T('xs.trapped2'), 0.3],
  [T('lv.studied'), -0.4],
  [T('lv.lo2'),      0.5],
  [T('lv.lo4'),     -0.3],
  [T('inst.loop'),   0.2],
  [DUR,              0.0]
];

function tiltAt(t) {
  for (let i = 0; i < TILT.length - 1; i++) {
    if (t >= TILT[i][0] && t <= TILT[i + 1][0]) {
      const u = TILT[i + 1][0] === TILT[i][0] ? 0
        : (t - TILT[i][0]) / (TILT[i + 1][0] - TILT[i][0]);
      const e = u * u * (3 - 2 * u);
      return TILT[i][1] + (TILT[i + 1][1] - TILT[i][1]) * e;
    }
  }
  return t <= TILT[0][0] ? TILT[0][1] : TILT[TILT.length - 1][1];
}

/* ---------- validate ----------------------------------------------------- */
for (let i = 1; i < A.length; i++) {
  if (A[i][0] <= A[i - 1][0]) {
    console.error('anchors out of order at row ' + i + ' (' + A[i][0] + ')');
    process.exit(1);
  }
}
if (A[0][0] !== 0) A.unshift([0, 0.05, 0.10, 0.00, 0.00, 0.00, 0.00, 0.10, 1.32, 0.00, 0.28, 'grid', 'idle']);
if (A[A.length - 1][0] !== DUR) A.push([DUR].concat(A[A.length - 1].slice(1)));

/* ---------- readable score ---------------------------------------------- */
console.log('WORLD ARC — derived from the lyric timeline\n');
console.log('   time  act            struct chaos warm heat  rot  love  dens scale shat glow  topo      alarm');
const rows = A.map(r => {
  const mm = String(Math.floor(r[0] / 60)).padStart(2, '0');
  const ss = String(Math.floor(r[0] % 60)).padStart(2, '0');
  const num = r.slice(1, 11).map(v => String(v.toFixed(2)).padStart(5)).join(' ');
  return '  ' + mm + ':' + ss + '  ' + r.slice(1).slice(-2).join(' ').padEnd(14) +
    num.slice(0) + '  ' + String(r[11]).padEnd(9) + ' ' + r[12];
});
/* the two discrete fields sit at the end of each row */
const printed = A.map(r => {
  const mm = String(Math.floor(r[0] / 60)).padStart(2, '0');
  const ss = String(Math.floor(r[0] % 60)).padStart(2, '0');
  return '  ' + mm + ':' + ss + '   ' +
    r.slice(1, 11).map(v => v.toFixed(2).padStart(5)).join(' ') +
    '   ' + r[11].padEnd(8) + ' ' + r[12];
});
console.log(printed.join('\n'));

/* ---------- emit --------------------------------------------------------- */
const keyRows = A.map(r =>
  '    [' + r[0].toFixed(3) + ', { struct: ' + r[1].toFixed(2) +
  ', chaos: ' + r[2].toFixed(2) + ', warm: ' + r[3].toFixed(2) +
  ', heat: ' + r[4].toFixed(2) + ', rot: ' + r[5].toFixed(2) +
  ', love: ' + r[6].toFixed(2) + ', density: ' + r[7].toFixed(2) +
  ', scale: ' + r[8].toFixed(2) +
  ', tilt: ' + tiltAt(r[0]).toFixed(2) +
  ', shatter: ' + r[9].toFixed(2) +
  ', glow: ' + r[10].toFixed(2) + ", topo: '" + r[11] + "', alarm: '" + r[12] + "' }]"
).join(',\n');

const out = `/* ============================================================================
   src/01_world.js — GENERATED by _build/gen-world.js, do not edit by hand.
   Edit the ANCHORS table in that script and re-run it.

   The continuous state the whole film lives inside. Every plate reads these
   values, which is what keeps 131 discrete tableaux feeling like one take
   instead of a slideshow: the world decays, warms and finally stops computing
   underneath the per-line drawings.

   The curve is DERIVED FROM THE LYRIC TIMELINE. Each anchor is written as
   "at the line <scene id>, the world is in this condition", so retiming a
   lyric moves the world with it and the two can never drift apart.

     struct   how much of the world still obeys its own rules   1 -> 0
     chaos    geometric disorder / jitter / shatter             0 -> 1
     warm     0 = monitor blue, 1 = body heat
     heat     0 = safe, 1 = alarm / metal under strain
     rot      0 = clean code, 1 = organic growth
     love     the variable this machine was never meant to hold
     density  how many particles / nodes are alive
     scale    camera zoom, 1 = wide
     shatter  displacement applied to world geometry
     glow     bloom
     topo     grid -> lattice -> wave -> organic -> tangle -> open
     alarm    idle | warn | error | exec

   ${A.length} anchors. Sampled with smoothstep so the derivative never jumps, which
   matters because the camera zoom and the vignette are both driven from here
   and a linear ramp between distant keys reads as a visible corner.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var KEYS = [
${keyRows}
  ];

  var NUM = ['struct', 'chaos', 'warm', 'heat', 'rot', 'love',
             'density', 'scale', 'tilt', 'shatter', 'glow'];
  var DISCRETE = ['topo', 'alarm'];

  /* piecewise smoothstep: cheap, stable, and exactly frame-rate independent */
  function sample(t) {
    var i, lo = KEYS[0], hi = KEYS[KEYS.length - 1];
    for (i = 0; i < KEYS.length - 1; i++) {
      if (t >= KEYS[i][0] && t <= KEYS[i + 1][0]) { lo = KEYS[i]; hi = KEYS[i + 1]; break; }
    }
    if (t <= KEYS[0][0]) { lo = hi = KEYS[0]; }
    if (t >= KEYS[KEYS.length - 1][0]) { lo = hi = KEYS[KEYS.length - 1]; }

    var a = lo[1], b = hi[1];
    var u = (hi[0] === lo[0]) ? 0 : (t - lo[0]) / (hi[0] - lo[0]);
    u = u < 0 ? 0 : (u > 1 ? 1 : u);
    var e = u * u * (3 - 2 * u);

    var out = {};
    for (var k = 0; k < NUM.length; k++) {
      var key = NUM[k];
      var va = a[key] === undefined ? 0 : a[key];
      var vb = b[key] === undefined ? va : b[key];
      out[key] = va + (vb - va) * e;
    }
    for (var d = 0; d < DISCRETE.length; d++) {
      out[DISCRETE[d]] = (e < 0.5 ? a[DISCRETE[d]] : b[DISCRETE[d]]) || a[DISCRETE[d]];
    }
    out.time = t;
    return out;
  }

  /* --------------------------------------------------------------------------
     THE PALETTE. One set of base inks, mixed by the world state.

     Kept deliberately dark and instrument-like: this is a machine's own
     display, not an illustration. Cold cyan is the resting state; warmth only
     arrives where the song earns it, and the alarm red is reserved for the
     stretch where the machine stops asking and starts executing.
     ------------------------------------------------------------------------ */
  var C = EM.color;

  var INK = {
    void:  [3, 5, 9],
    deep:  [7, 11, 18],
    panel: [12, 18, 28],
    line:  [44, 78, 106],
    cyan:  [86, 214, 232],
    white: [228, 242, 250],
    warn:  [246, 176, 62],
    red:   [232, 62, 54],
    magenta: [242, 108, 176],
    green: [124, 226, 150],
    paper: [246, 236, 216],
    violet: [150, 116, 220]
  };

  function mix(a, b, u) {
    u = u < 0 ? 0 : (u > 1 ? 1 : u);
    return [a[0] + (b[0] - a[0]) * u,
            a[1] + (b[1] - a[1]) * u,
            a[2] + (b[2] - a[2]) * u];
  }

  function palette(w) {
    /* accent: cyan at rest -> amber as it strains -> red under alarm ->
       organic pink while it grows -> paper while it loves */
    var accent = mix(INK.cyan, INK.white, w.warm * 0.45);
    accent = mix(accent, INK.warn, w.heat * 0.80);
    accent = mix(accent, INK.red, w.heat * w.heat * 0.92);
    var organicFree = (1 - w.heat) * (1 - w.heat);
    accent = mix(accent, INK.magenta, w.rot * 0.60 * organicFree);
    accent = mix(accent, INK.paper, w.love * 0.48 * organicFree);

    var grid = mix(INK.line, accent, 0.32);
    var hot = mix(mix(INK.red, INK.warn, 0.30), INK.magenta, w.love * 0.40);
    var calm = mix(INK.deep, INK.cyan, 0.14 * (1 - w.heat));

    return {
      bgInner: C.rgba(mix(INK.deep, mix(INK.panel, INK.warn, 0.22),
                          w.warm * 0.40 + w.heat * 0.12)),
      bgOuter: C.rgba(mix(INK.void, INK.panel, w.warm * 0.50)),
      accent: accent,
      accentCSS: C.rgba(accent),
      grid: grid,
      gridCSS: C.rgba(grid),
      hot: hot,
      hotCSS: C.rgba(hot),
      ink: C.rgba(mix(INK.white, INK.paper, w.warm)),
      dim: C.rgba(mix(INK.line, accent, 0.20), 0.55),
      paper: C.rgba(mix(INK.white, INK.paper, 0.65)),
      love: C.rgba(mix(INK.magenta, INK.paper, w.warm * 0.55)),
      calm: C.rgba(calm),
      phosphor: C.rgba(mix(INK.green, INK.cyan, w.heat)),
      signal: C.rgba(mix(INK.cyan, INK.warn, w.heat)),
      cold: C.rgba(mix(INK.line, INK.cyan, 0.5 * (1 - w.heat)))
    };
  }

  EM.World = { at: sample, palette: palette, mix: mix, INK: INK, KEYS: KEYS };
})(window.EM);
`;

fs.mkdirSync(path.join(ROOT, 'src'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src', '01_world.js'), out, 'utf8');
console.log('\nwrote src/01_world.js  (' + (out.length / 1024).toFixed(1) + ' KB, ' + A.length + ' anchors)');
