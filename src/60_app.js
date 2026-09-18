/* ============================================================================
   src/60_app.js — the engine.

   OWNERSHIP: this file owns the clock, the frame loop, the compositor, the
   transport and the DOM. It owns no drawing of the film itself — that belongs
   to 30_world.js (the world) and the plate files (the lines).

   THE CLOCK
     t = audio.currentTime + syncOffset
   and nothing else. The loop does not accumulate its own time, does not count
   frames, and keeps no state that a frame could depend on. That is the whole
   reason pause, resume and seek cannot desynchronise the picture from the
   sound: there is nothing to desynchronise.

   `audio.currentTime` is READ, never written except when the user seeks. The
   sync offset lives on the clock, not on a display field — an offset that only
   changes a number in the corner is a decoration, not a feature.
   ==========================================================================*/
(function (EM) {
  'use strict';

  var clamp = EM.clamp, lerp = EM.lerp, rgba = EM.rgba, hash = EM.hash;
  var D = EM.D;

  function $(id) { return document.getElementById(id); }

  /* ---------- DOM --------------------------------------------------------- */
  var audio = $('audio'), video = $('video'), view = $('view'), stage = $('stage');
  var vctx = view.getContext('2d', { alpha: false });

  /* the bloom buffer: a quarter-resolution copy of the frame, blurred, then
     added back. Real bloom rather than a glow filter, and cheap. */
  var fx = document.createElement('canvas');
  var fctx = fx.getContext('2d');

  var el = {
    state: $('state'), clock: $('clock'),
    lyricLine: $('lyric-line'),
    tCur: $('t-cur'), tTot: $('t-tot'),
    play: $('btn-play'), replay: $('btn-replay'), full: $('btn-full'),
    vol: $('vol'), volVal: $('vol-val'),
    wave: $('wave'), waveBuf: $('wave-buf'), waveFill: $('wave-fill'),
    marks: $('marks'), waveHead: $('wave-head'),
    boot: $('boot-msg'), hint: $('start-hint'), toast: $('toast-host')
  };

  var DUR = EM.AUDIO_END;

  /* ---------- state ------------------------------------------------------- */
  var CLIP_CANDIDATES = [
    'Mili - world.execute (me) ;.mp3',
    'Mili - world.execute(me) ;.mp3',
    'Mili - world.execute (me);.mp3',
    'Mili - world.execute(me);.mp3',
    'world.execute (me) ;.mp3',
    'audio.mp3'
  ];
  var syncOffset = 0;          /* seconds, user-tunable */
  var t = 0;                   /* the one clock, in song seconds */
  var rawT = 0;                /* audio.currentTime, unmodified */
  var running = false, started = false, ended = false;
  var lastCueIndex = -1, lastWall = 0;
  var frames = 0, fpsAcc = 60, fps = 60;
  var fatal = '';
  var audioOK = false;
  var fallbackClock = 0;       /* used ONLY when the browser could not open the file */
  var trackIndex = -1;
  var bootLog = [];

  var W = 1600, H = 900, U = 1, CW = 0, CH = 0, DPR = 1, offX = 0, offY = 0;
  var reduce = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var useVideo = !!EM.Settings.useVideo;

  var FADE_IN = 1.8, FADE_OUT = 3.4;

  /* ---------- boot -------------------------------------------------------- */
  function note(msg, isFatal) {
    bootLog.push({ t: Math.round((window.performance ? performance.now() : Date.now())), m: msg });
    if (isFatal) showBoot(msg, true);
    console.log('[world.execute(me);] ' + msg);
  }

  function showBoot(m, isFatal) {
    if (!el.boot) return;
    el.boot.textContent = m;
    el.boot.className = 'show' + (isFatal ? ' fatal' : '');
  }
  function hideBoot() { if (el.boot) el.boot.className = ''; }

  function toast(msg) {
    if (!el.toast) return;
    var d = document.createElement('div');
    d.className = 'toast';
    d.textContent = msg;
    el.toast.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1700);
  }

  /* Attach the audio. Several spellings are tried because the supplied
     filename contains two spaces that are extremely easy to lose on a rename,
     and "no sound" with no explanation is the worst possible failure. */
  function tryTrack(i) {
    if (i >= CLIP_CANDIDATES.length) return false;
    trackIndex = i;
    var name = CLIP_CANDIDATES[i];
    note('audio: trying "' + name + '"');
    audio.src = name;
    try { audio.load(); } catch (e) { /* the error handler reports it */ }
    return true;
  }

  var loadSettled = false;
  audio.addEventListener('loadedmetadata', function () {
    audioOK = true;
    loadSettled = true;
    var d = audio.duration;
    if (isFinite(d) && d > 1 && Math.abs(d - DUR) > 0.5) {
      note('audio reports ' + d.toFixed(3) + 's but the measured file length is ' +
        DUR.toFixed(3) + 's; keeping the measured value for the ending');
    }
    note('audio ready: "' + CLIP_CANDIDATES[trackIndex] + '" (' +
      (isFinite(d) ? d.toFixed(3) : '?') + 's)');
    hideBoot();
  });

  audio.addEventListener('error', function () {
    if (loadSettled) return;
    var code = audio.error ? audio.error.code : 0;
    var names = { 1: 'ABORTED', 2: 'NETWORK', 3: 'DECODE', 4: 'SRC_NOT_SUPPORTED' };
    note('audio failed on "' + CLIP_CANDIDATES[trackIndex] + '": ' +
      (names[code] || ('code ' + code)));
    if (tryTrack(trackIndex + 1)) return;
    /* nothing loaded: the film still runs, on a page timer, and says so */
    audioOK = false;
    showBoot('NO AUDIO\n\n' +
      'None of these files could be opened next to index.html:\n' +
      CLIP_CANDIDATES.map(function (n) { return '  ' + n; }).join('\n') +
      '\n\nPut the mp3 beside index.html (watch the two spaces in the name).\n' +
      'The animation will play anyway, on a page timer, so you can still watch it.', true);
  });

  /* ---------- geometry ---------------------------------------------------- */
  function resize() {
    var st = stage.getBoundingClientRect();
    CW = Math.max(320, Math.round(st.width));
    CH = Math.max(200, Math.round(st.height));
    DPR = Math.min(2, window.devicePixelRatio || 1);
    U = Math.min(CW / W, CH / H);
    offX = (CW - W * U) / 2;
    offY = (CH - H * U) / 2;

    view.width = Math.round(CW * DPR);
    view.height = Math.round(CH * DPR);
    view.style.width = CW + 'px';
    view.style.height = CH + 'px';

    fx.width = Math.max(64, Math.round(CW / 4));
    fx.height = Math.max(36, Math.round(CH / 4));

    rebuildGrain();
    EM.WorldLayer.frame(W, H, U, 0, 0);
    requestFrame();
  }
  window.addEventListener('resize', resize);

  /* set up the virtual-stage transform on the single canvas */
  function resetView() {
    D.bind(vctx, W, H);
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.fillStyle = '#000';
    vctx.fillRect(0, 0, view.width, view.height);
    vctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    vctx.translate(offX, offY);
    vctx.scale(U, U);
    vctx.translate(W / 2, H / 2);      /* origin at the centre of the stage */
    vctx.globalAlpha = 1;
    vctx.globalCompositeOperation = 'source-over';
    vctx.setLineDash([]);
    vctx.lineDashOffset = 0;
    vctx.shadowBlur = 0;
    vctx.filter = 'none';
  }

  /* ---------- film grain --------------------------------------------------
     A tiled deterministic dither, built once. It keeps the large near-black
     areas from banding and gives the whole thing the texture of something
     played back rather than freshly rendered.
     ---------------------------------------------------------------------- */
  var GRAIN = 128, grainTile = null, grainPattern = null;
  (function buildGrain() {
    try {
      var g = document.createElement('canvas');
      g.width = GRAIN; g.height = GRAIN;
      var gc = g.getContext('2d');
      var img = gc.createImageData(GRAIN, GRAIN);
      for (var i = 0; i < GRAIN * GRAIN; i++) {
        var v = 118 + Math.round((hash(i * 2654435761) - 0.5) * 74);
        img.data[i * 4] = v;
        img.data[i * 4 + 1] = v;
        img.data[i * 4 + 2] = v;
        img.data[i * 4 + 3] = 255;
      }
      gc.putImageData(img, 0, 0);
      grainTile = g;
      grainPattern = vctx.createPattern(g, 'repeat');
    } catch (e) { grainPattern = null; }
  })();

  function rebuildGrain() {
    if (!grainTile) return;
    try { grainPattern = vctx.createPattern(grainTile, 'repeat'); }
    catch (e) { grainPattern = null; }
  }

  /* ---------- seek bar ---------------------------------------------------- */
  function cssWave(mask) {
    /* Build the waveform strip as a data URL once, at the pixel width the bar
       actually is. Drawing 424 bars every frame for a decorative strip would
       be absurd; drawing them once is free. */
    var w = Math.max(64, Math.round(CW));
    var h = 42;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var g = c.getContext('2d');
    g.fillStyle = mask === 'fill' ? '#56d6e8' : '#1f4e5c';
    var WAVE = EM.WAVE || [];
    var n = WAVE.length;
    if (!n) return 'none';
    var bw = Math.max(1, Math.floor(w / n));
    for (var i = 0; i < n; i++) {
      var v = WAVE[i] / 255;
      var hh = Math.max(1, Math.round(v * (h - 8)));
      g.fillRect(i * (w / n), (h - hh) / 2, bw, hh);
    }
    return 'url(' + c.toDataURL() + ')';
  }

  function buildWaveBar() {
    var buf = cssWave('buf');
    el.waveBuf.style.backgroundImage = buf;
    el.waveFill.style.backgroundImage = cssWave('fill');
    el.waveBuf.style.backgroundSize = CW + 'px 42px';
    el.waveFill.style.backgroundSize = CW + 'px 42px';

    /* one mark per lyric cue: the strip shows where the lines are */
    var cues = EM.Lyrics.cues;
    var html = '';
    for (var i = 0; i < cues.length; i++) {
      var pct = clamp(cues[i].t / DUR, 0, 1) * 100;
      var big = /EXECUTION|LO-O-OVE|SIMULATION/i.test(cues[i].text);
      html += '<i class="' + (big ? 'big' : '') + '" style="left:' + pct.toFixed(3) + '%"></i>';
    }
    el.marks.innerHTML = html;
  }

  /* ---------- HUD --------------------------------------------------------- */
  var lastLyricIdx = -1;

  /* ONLY THE LINE. No index, no repeat count, no timestamp, no "next" preview
     — those were three extra rows of small type parked at the bottom of every
     frame, and they pulled the eye off the picture and into reading. The panel
     now shows the line being sung and nothing else. Everything the removed
     fields reported is still available: the debug overlay (D) carries the cue
     index, duration and progress, and the ticker carries the clock. */
  function refreshLyric(cue) {
    if (!cue) return;
    var txt = cue.text;
    var instrumental = /^\(/.test(txt);
    el.lyricLine.className = instrumental ? 'instrumental' : '';
    el.lyricLine.textContent = txt;
  }

  var lastStateLabel = '';
  function setState(label) {
    if (label === lastStateLabel) return;
    lastStateLabel = label;
    el.state.textContent = label;
    el.state.setAttribute('data-s', label);
  }

  var lastBarT = -1;
  function refreshBar(time) {
    var u = clamp(time / DUR, 0, 1);
    el.waveFill.style.width = (u * 100).toFixed(3) + '%';
    el.waveHead.style.left = (u * 100).toFixed(3) + '%';
    el.wave.setAttribute('aria-valuenow', Math.round(u * 100));
    if (Math.abs(time - lastBarT) > 0.05) {
      lastBarT = time;
      el.tCur.textContent = EM.fmtTime(time);
    }
  }

  function paintPlay() {
    el.play.classList.toggle('is-playing', running);
    el.play.setAttribute('aria-label', running ? '暂停' : '播放');
  }

  /* ---------- debug overlay ----------------------------------------------- */
  var dbgOn = false;
  function drawDebug(w, time, cue) {
    var pal = w.pal;
    var x = -W / 2 + 16, y = -H / 2 + 26;
    D.lw(1);
    D.strokeColour(rgba(pal.grid, 0.7));
    D.fillColour('rgba(3,5,10,0.72)');
    D.frect(x - 8, y - 20, 396, 344);
    D.srect(x - 8, y - 20, 396, 344);

    D.font(12.5);
    D.fillColour(pal.ink);
    var rows = [
      't          ' + time.toFixed(3) + '  (raw ' + rawT.toFixed(3) + ' + ' + syncOffset.toFixed(3) + ')',
      'fps        ' + fps.toFixed(1) + '   frames ' + frames,
      'cue        #' + cue.i + '  ' + cue.dur.toFixed(2) + 's',
      'plate      ' + cue.scene,
      'progress   ' + EM.sceneProgress(cue.scene, time, cue).toFixed(3),
      '',
      'struct     ' + w.struct.toFixed(3),
      'chaos      ' + w.chaos.toFixed(3),
      'warm       ' + w.warm.toFixed(3),
      'heat       ' + w.heat.toFixed(3),
      'rot        ' + w.rot.toFixed(3),
      'love       ' + w.love.toFixed(3),
      'topo       ' + w.topo + '   alarm ' + w.alarm,
      '',
      'notes      ' + EM.WorldLayer.notesPlayed(time) + ' / ' + (EM.ONSETS.length || 0),
      'plates     ' + EM.SceneOrder.length + ' registered, ' +
        EM.sceneFaultCount() + ' fault(s)',
      'selftest   ' + (EM.__selftest ? (EM.__selftest.ok ? 'PASS' : 'FAIL') : 'n/a'),
      'audio      ' + (audioOK ? 'ok' : 'unavailable (page timer)'),
      'stage      ' + W + 'x' + H + ' u=' + U.toFixed(3) + ' dpr=' + DPR
    ];
    for (var i = 0; i < rows.length; i++) {
      D.text(rows[i], x, y + i * 17);
    }
    /* faults are listed, not hidden */
    var faults = EM.sceneFaults();
    if (faults.length) {
      D.fillColour(rgba(pal.hot, 1));
      D.text('FAULTS', x, y + rows.length * 17 + 8);
      for (var k = 0; k < Math.min(3, faults.length); k++) {
        D.text(faults[k].slice(0, 46), x, y + rows.length * 17 + 8 + (k + 1) * 16);
      }
    }
  }

  /* ==========================================================================
     COMPOSITOR
     Bloom into a quarter-res buffer, chroma split and slice displacement while
     the world is under strain, film grain, and the opening/closing fades. All
     of it keyed off the same clock, so a seek into the middle of the climax
     looks exactly the way it did on the way through.
     ======================================================================== */
  function composite(w, time) {
    var c = vctx;
    var bloom = w.glow;

    if (bloom > 0.02) {
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      fctx.globalCompositeOperation = 'source-over';
      fctx.clearRect(0, 0, fx.width, fx.height);
      fctx.filter = 'blur(' + (3 + bloom * 7).toFixed(1) + 'px) brightness(' +
        (1.0 + bloom * 0.5).toFixed(2) + ')';
      fctx.drawImage(view, 0, 0, fx.width, fx.height);
      fctx.filter = 'none';
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = clamp(bloom * 0.38 * (reduce ? 0.5 : 1), 0, 0.5);
      c.imageSmoothingEnabled = true;
      c.drawImage(fx, 0, 0, view.width, view.height);
      c.restore();
    }

    /* chroma split only under real strain, and never on reduced motion */
    var chroma = clamp((w.heat - 0.35) * 1.5, 0, 1) *
                 clamp(w.shatter + w.chaos * 0.5, 0, 1);
    if (chroma > 0.03 && !reduce) {
      var off = (1.5 + chroma * 7) * DPR * (0.6 + 0.4 * Math.sin(time * 30));
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = chroma * 0.26;
      c.drawImage(view, -off, 0);
      c.drawImage(view, off, 0);
      c.restore();
    }

    /* slice displacement: an accent, gated hard so it never becomes texture */
    var glitch = 0;
    if (w.heat > 0.55) glitch = clamp((w.heat - 0.55) * 1.4, 0, 1) * 0.75;
    if (w.topo === 'tangle' && w.chaos > 0.55) {
      glitch = Math.max(glitch, (w.chaos - 0.55) * 0.9);
    }
    if (glitch > 0.05 && !reduce) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      var n = Math.round(3 + glitch * 10);
      for (var i = 0; i < n; i++) {
        var r1 = hash((i * 977 + Math.floor(time * 11) * 131) | 0);
        var sy = Math.floor(r1 * view.height);
        var sh = Math.max(2, Math.floor((0.004 + r1 * 0.035) * glitch * view.height));
        var dx = (hash((i * 313 + Math.floor(time * 11) * 71) | 0) - 0.5) * glitch * 70 * DPR;
        c.drawImage(view, 0, sy, view.width, sh, dx, sy, view.width, sh);
      }
      c.restore();
    }

    if (!reduce && grainPattern) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'overlay';
      c.globalAlpha = 0.052 + w.heat * 0.02;
      var gx = -Math.floor((time * 37) % GRAIN) * DPR;
      var gy = -Math.floor((time * 61) % GRAIN) * DPR;
      c.fillStyle = grainPattern;
      c.translate(gx, gy);
      c.fillRect(-gx - GRAIN, -gy - GRAIN, view.width + GRAIN * 2, view.height + GRAIN * 2);
      c.restore();
    }

    /* opens out of black, closes into it: the first line lands as an event and
       the last frame is allowed to be an ending */
    var fade = 1;
    if (time < FADE_IN) fade = Math.min(fade, Math.max(0, time / FADE_IN));
    if (time > DUR - FADE_OUT) fade = Math.min(fade, Math.max(0, (DUR - time) / FADE_OUT));
    if (fade < 0.999) {
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.fillStyle = 'rgba(0,0,0,' + (1 - fade).toFixed(4) + ')';
      c.fillRect(0, 0, view.width, view.height);
      c.restore();
    }
  }

  /* ==========================================================================
     THE FRAME LOOP
     ======================================================================== */
  var pending = 0, frameErrors = 0, lastFrameError = '';

  function requestFrame() {
    if (pending) return;
    pending = requestAnimationFrame(tick);
  }

  /* The heartbeat. Deliberately NOT gated on playback: if the audio could not
     be opened at all, a loop that only runs while "playing" would leave the
     viewer with a permanently black page and no explanation. */
  setInterval(function () { requestFrame(); }, 100);

  function tick(nowMs) {
    pending = 0;
    try {
      renderFrame(nowMs);
      lastFrameError = '';
    } catch (err) {
      frameErrors++;
      var msg = (err && err.message) ? err.message : String(err);
      if (msg !== lastFrameError) {
        lastFrameError = msg;
        console.error('[world.execute(me);] frame error:', err);
      }
      if (frameErrors === 3) {
        fatal = 'RENDER ERROR\n\n' + msg +
          '\n\npress D for the debug overlay, or reload the page';
        showBoot(fatal, true);
      }
    }
    /* ALWAYS re-armed while playing. A version of this loop that returned
       early on a pending frame died permanently the first time a frame threw,
       and drew nothing for the rest of the session without saying so. */
    if (running) requestFrame();
  }

  function renderFrame(nowMs) {
    var dt = lastWall ? Math.min((nowMs - lastWall) / 1000, 0.2) : 0;

    if (audioOK) {
      rawT = audio.currentTime || 0;
      if (useVideo && video.videoWidth && video.duration > 0.2) {
        var want = rawT % video.duration;
        if (Math.abs(video.currentTime - want) > 0.35) video.currentTime = want;
      }
    } else {
      /* The audio could not be opened: run a page timer of the same nominal
         length so the film, the transport and the seek bar all still work.
         The HUD says so, and the debug overlay says so again.

         The fallback clock is authoritative here. An earlier version read back
         `audio.currentTime` — non-zero whenever the element had got partway
         through a file it then failed on, and stale in every case — and that
         overwrote whatever the viewer had just seeked to, so dragging the
         progress bar snapped straight back to zero. rawT is now only ever
         moved by seek() or by this timer. */
      if (running) fallbackClock += dt;
      if (fallbackClock >= DUR - 0.002) {
        fallbackClock = DUR;
        running = false;
        ended = true;
        paintPlay();
      }
      rawT = fallbackClock;
    }

    t = rawT + syncOffset;
    if (t < 0) t = 0;

    frames++;
    if (lastWall) {
      var d = (nowMs - lastWall) / 1000;
      if (d > 0 && d < 1) { fpsAcc += (1 / d - fpsAcc) * 0.06; fps = fpsAcc; }
    }
    lastWall = nowMs;

    /* ---- world ---------------------------------------------------------- */
    var w = EM.World.at(t);
    w.time = t;
    w.pal = EM.World.palette(w);
    w.U = U;
    EM.__pal = w.pal;                 /* the plate helpers read the same palette */
    EM.M.bindStage();

    resetView();
    EM.WorldLayer.draw(w, w.pal, t);

    /* ---- the line ------------------------------------------------------- */
    var cue = EM.Lyrics.at(t);
    if (cue && cue.i !== lastCueIndex) {
      lastCueIndex = cue.i;
      refreshLyric(cue);
    }
    /* drawSequence, not drawScene: the outgoing line dissolves through the
       incoming one, so a line boundary is never an empty frame */
    if (cue) EM.drawSequence(cue, w, t);

    /* ---- compositor, HUD ------------------------------------------------ */
    composite(w, t);
    if (dbgOn) drawDebug(w, t, cue);
    refreshBar(t < 0 ? 0 : t);
    setState(running ? 'PLAYING' : (ended ? 'ENDED' : (audioOK ? (started ? 'PAUSED' : 'READY') : 'NO AUDIO')));
  }

  /* ==========================================================================
     TRANSPORT
     ======================================================================== */
  function play() {
    if (!audioOK) {
      /* no audio element to drive: advance the page timer instead */
      started = true;
      running = true;
      ended = false;
      if (el.hint) el.hint.className = 'gone';
      paintPlay();
      requestFrame();
      return;
    }
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function (err) {
        toast('播放被浏览器拦下：' + (err && err.name ? err.name : 'error'));
      });
    }
    started = true;
    running = true;
    ended = false;
    if (el.hint) el.hint.className = 'gone';
    paintPlay();
    requestFrame();
  }

  function pause() {
    running = false;
    if (audioOK) { try { audio.pause(); } catch (e) { /* ignore */ } }
    paintPlay();
    requestFrame();
  }

  function toggle() { running ? pause() : play(); }

  function seek(sec) {
    sec = clamp(sec, 0, DUR - 0.02);
    /* Both clocks are moved. Writing only the live one left the page-timer
       fallback holding its old value, and the very next frame read it back and
       undid the seek — so with no audio file the progress bar was inert. */
    fallbackClock = sec;
    if (audioOK) {
      try { audio.currentTime = sec; } catch (e) { /* ignore */ }
    }
    rawT = sec;
    /* keep the published clock consistent immediately, rather than only at the
       next frame: `t` is otherwise a frame-old value, which is fine for
       drawing but makes the state read back by the HUD and the verifier
       disagree with the seek that just happened */
    t = sec + syncOffset;
    if (t < 0) t = 0;
    ended = false;
    /* force the lyric panel to refresh even if the index is unchanged, so a
       seek backwards into the same line still re-renders its text */
    lastCueIndex = -1;
    requestFrame();
  }

  function replay() { seek(0); play(); }

  function setOffset(sec, quiet) {
    syncOffset = clamp(sec, -2, 2);
    /* move the published clock with the offset so a nudge is reflected at once
       rather than a frame later, and a read-back after adjusting agrees with
       what the next frame will draw */
    t = rawT + syncOffset;
    if (t < 0) t = 0;
    /* There is deliberately no slider for this. Millisecond sync is a keyboard
       adjustment ( , . / ) — the value is announced through a toast instead of
       being given permanent furniture in the transport bar. */
    if (!quiet) requestFrame();
  }

  function setVolume(v) {
    v = clamp(v, 0, 1);
    audio.volume = v;
    el.vol.value = v;
    el.volVal.textContent = Math.round(v * 100) + '%';
  }

  el.play.addEventListener('click', toggle);
  el.replay.addEventListener('click', replay);
  el.full.addEventListener('click', toggleFull);
  el.vol.addEventListener('input', function () { setVolume(+el.vol.value); });
  /* sync offset has no UI control by design: it is a keyboard adjustment */

  /* ---- scrubbing --------------------------------------------------------- */
  var scrubbing = false;
  function posFromEvent(e) {
    var r = el.wave.getBoundingClientRect();
    var cx = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    return clamp((cx - r.left) / Math.max(1, r.width), 0, 1) * DUR;
  }
  function beginScrub(e) {
    scrubbing = true;
    el.wave.classList.add('dragging');
    seek(posFromEvent(e));
    e.preventDefault();
  }
  function moveScrub(e) { if (scrubbing) { seek(posFromEvent(e)); e.preventDefault(); } }
  function endScrub() {
    if (!scrubbing) return;
    scrubbing = false;
    el.wave.classList.remove('dragging');
  }
  el.wave.addEventListener('mousedown', beginScrub);
  window.addEventListener('mousemove', moveScrub);
  window.addEventListener('mouseup', endScrub);
  el.wave.addEventListener('touchstart', beginScrub, { passive: false });
  window.addEventListener('touchmove', moveScrub, { passive: false });
  window.addEventListener('touchend', endScrub);

  el.wave.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 1 : 5;
    if (e.key === 'ArrowLeft') { seek((audioOK ? audio.currentTime : fallbackClock) - step); e.preventDefault(); }
    if (e.key === 'ArrowRight') { seek((audioOK ? audio.currentTime : fallbackClock) + step); e.preventDefault(); }
    if (e.key === 'Home') { seek(0); e.preventDefault(); }
    if (e.key === 'End') { seek(DUR - 0.05); e.preventDefault(); }
  });

  /* ---- fullscreen -------------------------------------------------------- */
  function toggleFull() {
    var d = document;
    var full = d.fullscreenElement || d.webkitFullscreenElement;
    if (full) {
      (d.exitFullscreen || d.webkitExitFullscreen || function () {}).call(d);
    } else {
      var target = d.documentElement;
      (target.requestFullscreen || target.webkitRequestFullscreen || function () {}).call(target);
    }
  }

  /* ---- keyboard ---------------------------------------------------------- */
  window.addEventListener('keydown', function (e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
      if (e.key !== ' ' && e.key !== 'Escape') return;
    }
    var big = e.shiftKey ? 1 : 5;
    switch (e.key) {
      case ' ': toggle(); e.preventDefault(); break;
      case 'ArrowLeft': seek((audioOK ? audio.currentTime : fallbackClock) - big); e.preventDefault(); break;
      case 'ArrowRight': seek((audioOK ? audio.currentTime : fallbackClock) + big); e.preventDefault(); break;
      case ',': setOffset(syncOffset - (e.shiftKey ? 0.001 : 0.01)); toast('同步偏移 ' + (syncOffset * 1000).toFixed(0) + ' ms'); break;
      case '.': setOffset(syncOffset + (e.shiftKey ? 0.001 : 0.01)); toast('同步偏移 ' + (syncOffset * 1000).toFixed(0) + ' ms'); break;
      case '/': setOffset(0); toast('同步偏移归零'); break;
      case 'r': case 'R': replay(); break;
      case 'f': case 'F': toggleFull(); break;
      case 'h': case 'H': document.body.classList.toggle('hide-ui'); break;
      case 'd': case 'D': dbgOn = !dbgOn; toast('调试叠层 ' + (dbgOn ? 'ON' : 'OFF')); break;
      case 'ArrowUp': setVolume(+el.vol.value + 0.05); e.preventDefault(); break;
      case 'ArrowDown': setVolume(+el.vol.value - 0.05); e.preventDefault(); break;
      case 'Home': seek(0); e.preventDefault(); break;
      case 'End': seek(DUR - 0.05); e.preventDefault(); break;
      default: break;
    }
  });

  /* first gesture: browsers require one before audio may start */
  function begin() {
    if (started) return;
    play();
  }
  if (el.hint) el.hint.addEventListener('click', begin);
  stage.addEventListener('click', function (e) {
    if (e.target === el.wave || el.wave.contains(e.target)) return;
    begin();
  });
  el.stage = stage;

  audio.addEventListener('ended', function () {
    running = false; ended = true; paintPlay();
  });
  audio.addEventListener('play', function () { running = true; paintPlay(); });
  audio.addEventListener('pause', function () {
    if (!ended) { running = false; paintPlay(); }
  });

  /* ---- expose the surface the offline verifier drives -------------------- */
  EM.__app = {
    tick: requestFrame,
    renderOnce: function (time) {
      /* render a specific instant without touching the media element: used by
         the verifier to compare frames after a seek */
      rawT = time;
      t = time;
      var w = EM.World.at(t);
      w.time = t;
      w.pal = EM.World.palette(w);
      w.U = U;
      EM.__pal = w.pal;
      EM.M.bindStage();
      resetView();
      EM.WorldLayer.draw(w, w.pal, t);
      var cue = EM.Lyrics.at(t);
      if (cue) EM.drawSequence(cue, w, t);
      composite(w, t);
      return cue;
    },
    seek: seek,
    play: play,
    pause: pause,
    now: function () { return { t: t, rawT: rawT, offset: syncOffset, running: running, ended: ended, audioOK: audioOK, u: U, dpr: DPR }; },
    setOffset: setOffset,
    setVolume: setVolume,
    isDebug: function () { return dbgOn; }
  };

  /* ---- go ---------------------------------------------------------------- */
  function init() {
    setVolume(0.85);
    setOffset(0, true);
    el.tTot.textContent = EM.fmtTime(DUR);
    note('stage ' + W + 'x' + H + ', measured audio ' + DUR.toFixed(5) + 's, ' +
      EM.ONSETS.length + ' accents, ' + EM.Lyrics.count + ' cues, ' +
      EM.SceneOrder.length + ' plates');
    tryTrack(0);
    resize();
    buildWaveBar();
    paintPlay();
    requestFrame();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  } else {
    setTimeout(init, 0);
  }
})(window.EM);
