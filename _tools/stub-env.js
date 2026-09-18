/* ============================================================================
   _tools/stub-env.js — a headless DOM / Canvas / Audio harness.

   The canvas RECORDS every drawing call it receives. That single decision buys
   two things the project needs and cannot get any other way:

     1. INK, NOT REGISTRATION. "131 plates registered, coverage 100%" was true
        of a version of this film in which every plate was throwing and drawing
        nothing. Counting primitives proves a picture happened.

     2. FRAME FINGERPRINTS. Hashing the call stream means two frames with the
        same hash are the same picture. That is what makes "seeking to t
        restores frame t" a testable claim instead of a hope.

   It loads the project's real scripts in order in a vm context, so the code
   under test is the code that ships.
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

/* the drawing primitives that actually put ink on the canvas */
const INK_OPS = /^(moveTo|lineTo|quadraticCurveTo|bezierCurveTo|arc|ellipse|rect|fillRect|strokeRect|fillText|strokeText)$/;

const SCRIPT_ORDER = [
  'assets/onsets.js',
  'assets/waveform.js',
  'assets/timeline.js',
  'src/00_core.js',
  'src/01_world.js',
  'src/10_draw.js',
  'src/15_sceneapi.js',
  'src/20_lyrics.js',
  'src/30_world.js',
  'src/32_annotate.js',
  'src/35_motifs.js',
  'src/40_plates_boot.js',
  'src/41_plates_theorem.js',
  'src/42_plates_condition.js',
  'src/43_plates_flesh.js',
  'src/44_plates_absence.js',
  'src/45_plates_execution.js',
  'src/46_plates_love.js',
  'src/50_selftest.js',
  'src/60_app.js'
];

function makeCtx(log, stats, canvas) {
  const st = {
    fillStyle: '#000', strokeStyle: '#fff', lineWidth: 1, font: '',
    textAlign: 'left', textBaseline: 'alphabetic', globalAlpha: 1,
    globalCompositeOperation: 'source-over', lineDashOffset: 0,
    shadowBlur: 0, shadowColor: '', filter: 'none',
    lineCap: 'butt', lineJoin: 'miter', imageSmoothingEnabled: true
  };
  const num = v => (typeof v === 'number' && isFinite(v) ? Math.round(v * 1000) / 1000 : v);
  const rec = (op, args) => {
    log.push(op + '(' + args.map(num).join(',') + ')');
    stats.calls++;
    if (INK_OPS.test(op)) stats.ink++;
  };
  const grad = () => ({ addColorStop(o, c) { log.push('stop(' + num(o) + ',' + c + ')'); } });

  const ctx = {
    canvas,
    save() { rec('save', []); stats.depth++; if (stats.depth > stats.maxDepth) stats.maxDepth = stats.depth; },
    restore() { rec('restore', []); stats.depth--; if (stats.depth < 0) stats.unbalanced++; },
    setTransform() { rec('setTransform', []); }, resetTransform() { rec('resetTransform', []); },
    translate(...a) { rec('translate', a); }, rotate(...a) { rec('rotate', a); }, scale(...a) { rec('scale', a); },
    beginPath() { rec('beginPath', []); }, closePath() { rec('closePath', []); },
    moveTo(...a) { rec('moveTo', a); }, lineTo(...a) { rec('lineTo', a); },
    quadraticCurveTo(...a) { rec('quadraticCurveTo', a); }, bezierCurveTo(...a) { rec('bezierCurveTo', a); },
    arc(...a) { rec('arc', a); }, arcTo(...a) { rec('arcTo', a); }, ellipse(...a) { rec('ellipse', a); },
    rect(...a) { rec('rect', a); },
    stroke() { rec('stroke', [st.strokeStyle, st.lineWidth]); },
    fill() { rec('fill', [st.fillStyle]); },
    clip() { rec('clip', []); },
    fillRect(...a) { rec('fillRect', a); }, strokeRect(...a) { rec('strokeRect', a); },
    clearRect(...a) { rec('clearRect', a); },
    fillText(t, x, y) {
      rec('fillText', [String(t).slice(0, 48), x, y, st.font, st.textAlign, st.fillStyle]);
    },
    strokeText(t, x, y) { rec('strokeText', [String(t).slice(0, 48), x, y, st.font]); },
    /* Monospace metrics that track the font size. Returning a constant width
       made every centred string sit in the wrong place and quietly invalidated
       layout checks, so the size is parsed back out of the font string. */
    measureText(t) {
      const s = String(t);
      const m = st.font.match(/(\d+(?:\.\d+)?)px/);
      const px = (m ? parseFloat(m[1]) : 14) || 14;
      const mono = !/sans|serif/i.test(st.font);
      return { width: s.length * px * (mono ? 0.60 : 0.52) };
    },
    setLineDash(a) { rec('setLineDash', a || []); }, getLineDash() { return []; },
    createLinearGradient(...a) { rec('linearGradient', a); return grad(); },
    createRadialGradient(...a) { rec('radialGradient', a); return grad(); },
    createPattern() { return null; },
    drawImage() { rec('drawImage', []); },
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
  Object.keys(st).forEach(k => {
    Object.defineProperty(ctx, k, {
      get: () => st[k], set: v => { st[k] = v; }, enumerable: true
    });
  });
  return ctx;
}

function makeElement(tag, log, stats) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    nodeName: String(tag || 'div').toUpperCase(),
    id: '', className: '', textContent: '', innerHTML: '', title: '', src: '',
    width: 1600, height: 900, videoWidth: 0, videoHeight: 0,
    duration: 211.98367, currentTime: 0, volume: 1, paused: true, ended: false,
    /* seeking a real media element updates currentTime synchronously for the
       purposes of the next read, which is what the film's clock relies on */
    _ct: 0,
    style: new Proxy({}, {
      get(t, k) { return k in t ? t[k] : ''; },
      set(t, k, v) { t[k] = v; return true; }
    }),
    dataset: {},
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, on) { if (on === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else if (on) this._s.add(c); else this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    children: [], childNodes: [],
    appendChild(c) { this.children.push(c); this.childNodes.push(c); return c; },
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) { this.children.splice(i, 1); this.childNodes.splice(i, 1); }
      return c;
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    removeAttribute(k) { delete this[k]; },
    addEventListener() {}, removeEventListener() {},
    /* a realistic stage viewport, so window-relative layout is exercised */
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720, right: 1280, bottom: 720, x: 0, y: 0 }; },
    get clientWidth() { return 1280; },
    get clientHeight() { return 720; },
    get offsetWidth() { return 1280; },
    get offsetHeight() { return 720; },
    getContext(kind) {
      if (!this._ctx) this._ctx = makeCtx(log, stats, this);
      return this._ctx;
    },
    toDataURL() { return 'data:image/png;base64,'; },
    play() { this.paused = false; return { then() {}, catch() {} }; },
    pause() { this.paused = true; },
    load() {},
    requestFullscreen() {}, exitFullscreen() {},
    focus() {}, blur() {}, click() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    insertBefore(c) { return this.appendChild(c); },
    closest() { return null; },
    contains() { return false; }
  };
  Object.defineProperty(el, 'currentTime', {
    get() { return el._ct; },
    set(v) { el._ct = v; },
    enumerable: true, configurable: true
  });
  return el;
}

/* --------------------------------------------------------------------------
   createEnv — build a window with the project's scripts already executed.
   ------------------------------------------------------------------------ */
function createEnv(opts) {
  opts = opts || {};
  const log = [];
  const stats = { calls: 0, ink: 0, depth: 0, maxDepth: 0, unbalanced: 0 };
  const elements = Object.create(null);
  const audioListeners = Object.create(null);
  /* Timers are collected rather than run, so a caller can drive the app's
     start-up deliberately (and assert on what it scheduled). Nothing here
     relies on a timer actually firing. */
  const pendingTimeouts = [];
  const pendingIntervals = [];

  const win = {
    devicePixelRatio: 1,
    performance: { now: () => Date.now() },
    matchMedia: () => ({ matches: false, addListener() {}, addEventListener() {} }),
    requestAnimationFrame() { return 0; },
    cancelAnimationFrame() {},
    setTimeout(fn, ms) { pendingTimeouts.push({ fn, ms }); return pendingTimeouts.length; },
    clearTimeout() {},
    setInterval(fn, ms) { pendingIntervals.push({ fn, ms }); return pendingIntervals.length; },
    clearInterval() {},
    console: opts.quiet ? { log() {}, warn() {}, error() {}, info() {} } : console,
    addEventListener() {},
    removeEventListener() {},
    getComputedStyle: () => ({ getPropertyValue: () => '' })
  };
  win.window = win;
  win.self = win;
  win.document = {
    readyState: 'complete',
    documentElement: makeElement('html', log, stats),
    body: makeElement('body', log, stats),
    fullscreenElement: null,
    createElement(tag) { return makeElement(tag, log, stats); },
    getElementById(id) {
      if (!elements[id]) {
        const el = makeElement(id === 'view' ? 'canvas' : (id === 'audio' || id === 'video' ? id : 'div'), log, stats);
        el.id = id;
        if (id === 'audio' || id === 'video') {
          el.addEventListener = (type, fn) => { (audioListeners[type] = audioListeners[type] || []).push(fn); };
        }
        elements[id] = el;
      }
      return elements[id];
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {}
  };

  const ctx = vm.createContext(win);

  /* The runtime self-test reads the lyric timeline out of a <script
     type="text/plain"> block in index.html. Give the stub the real block, so
     the verifier is checking the same two copies the browser compares rather
     than skipping the check entirely. */
  const indexPath = path.join(ROOT, 'index.html');
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    const m = html.match(/<script id="lrc-source" type="text\/plain">([\s\S]*?)<\/script>/);
    if (m) {
      const el = win.document.getElementById('lrc-source');
      el.textContent = m[1];
    }
  }

  const loaded = [];
  for (const rel of SCRIPT_ORDER) {
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) {
      if (opts.requireAll === false) continue;
      throw new Error('missing script: ' + rel + '  (is the plate file written yet?)');
    }
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
    loaded.push(rel);
  }

  const EM = win.EM;
  /* bind the drawing kernel to the headless canvas so plates can run */
  if (opts.bind !== false && EM && EM.D) {
    EM.D.bind(win.document.getElementById('view').getContext('2d'), 1600, 900);
    EM.M.bindStage();
    EM.__pal = EM.World.palette(EM.World.at(0));
  }

  return {
    win, EM, log, stats, els: elements, listeners: audioListeners,
    loaded,
    pendingTimeouts, pendingIntervals,
    /* run everything the app queued with setTimeout — its init() runs this way,
       because it waits for the DOM to be ready */
    flushTimeouts() {
      let ran = 0;
      while (pendingTimeouts.length) {
        const t = pendingTimeouts.shift();
        t.fn();
        ran++;
        if (ran > 50) break;
      }
      return ran;
    },
    reset() { log.length = 0; stats.calls = 0; stats.ink = 0; },
    /* hash of the recorded call stream = fingerprint of the frame */
    fingerprint() {
      let h = 2166136261;
      for (let i = 0; i < log.length; i++) {
        const s = log[i];
        for (let k = 0; k < s.length; k++) {
          h ^= s.charCodeAt(k);
          h = (h * 16777619) >>> 0;
        }
      }
      return h;
    },
    /* render one instant the way the film does, and report what came out */
    frameAt(t) {
      const w = EM.World.at(t);
      w.time = t;
      w.pal = EM.World.palette(w);
      w.U = 1;
      EM.__pal = w.pal;
      const before = { calls: stats.calls, ink: stats.ink };
      EM.WorldLayer.draw(w, w.pal, t);
      const cue = EM.Lyrics.at(t);
      if (cue) EM.drawScene(cue.scene, w, t, cue);
      return {
        cue: cue,
        plate: cue ? cue.scene : null,
        calls: stats.calls - before.calls,
        ink: stats.ink - before.ink,
        faults: EM.sceneFaults()
      };
    }
  };
}

module.exports = { createEnv, makeCtx, makeElement, SCRIPT_ORDER, INK_OPS, ROOT };
