/* ============================================================================
   build.js — the whole project's data pipeline, one command.

     1. parse the supplied .mid   -> assets/onsets.js    (measured accents)
     2. measure the .mp3          -> assets/waveform.js  (length + envelope)
     3. parse the lyric timeline  -> assets/timeline.js  (cues + scene ids)
     4. derive the world curve    -> src/01_world.js     (from those cues)
     5. inject the lyric text     -> index.html          (the second copy)

   Steps 1-3 shell out to the individual scripts so each one stays runnable and
   debuggable on its own; steps 4-5 are done here because they consume what
   steps 1-3 produced.

   Run:  node build.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const step = (n, title) => console.log('\n' + '='.repeat(74) + '\n  ' + n + '. ' + title + '\n' + '='.repeat(74));

function run(file, args) {
  const r = spawnSync(process.execPath, [path.join(ROOT, '_build', file)].concat(args || []),
    { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('\nFAILED: ' + file + ' (exit ' + r.status + ')');
    process.exit(r.status || 1);
  }
}

step(1, 'MIDI  -> assets/onsets.js   (accent table)');
run('parse-midi.js', process.argv.slice(2));

step(2, 'MP3   -> assets/waveform.js (measured length + envelope)');
run('parse-mp3.js', process.argv.slice(2));

step(3, 'LRC   -> assets/timeline.js (cue table + scene ids)');
run('gen-timeline.js', process.argv.slice(2));

step(4, 'cues  -> src/01_world.js    (world curve, derived from the lyrics)');
run('gen-world.js');

step(5, 'inject the lyric text into index.html (the second, verbatim copy)');
(function embed() {
  const src = path.join(ROOT, 'index.src.html');
  const out = path.join(ROOT, 'index.html');
  const lrc = path.join(ROOT, 'assets', 'lrc-embed.txt');

  if (!fs.existsSync(src)) { console.error('missing ' + src); process.exit(1); }
  if (!fs.existsSync(lrc)) { console.error('missing ' + lrc); process.exit(1); }

  const html = fs.readFileSync(src, 'utf8');
  const text = fs.readFileSync(lrc, 'utf8').replace(/\s+$/, '');

  const MARK = '<!--LRC-EMBED-->';
  if (html.indexOf(MARK) === -1) {
    console.error('index.src.html has no ' + MARK + ' placeholder');
    process.exit(1);
  }

  const built = html.replace(MARK, text);
  fs.writeFileSync(out, built, 'utf8');

  const lines = text.split('\n').length;
  console.log('injected ' + lines + ' lyric lines (' + text.length + ' bytes)');
  console.log('wrote ' + out);
})();

/* --------------------------------------------------------------------------
   A quick sanity pass over what was just produced, so a broken build fails
   here rather than in the browser with a blank screen.
   ------------------------------------------------------------------------ */
step(6, 'verify the generated files agree with each other');
(function verify() {
  const EM = require('./_build/load-assets').load();

  const problems = [];
  const cues = EM.CUES || [];
  if (!cues.length) problems.push('timeline.js produced no cues');
  if (!EM.ONSETS || !EM.ONSETS.length) problems.push('onsets.js produced no accents');
  if (!EM.WAVE || !EM.WAVE.length) problems.push('waveform.js produced no envelope');
  if (typeof EM.AUDIO_END !== 'number' || !(EM.AUDIO_END > 60)) {
    problems.push('waveform.js did not measure a plausible duration');
  }
  for (let i = 1; i < cues.length; i++) {
    if (cues[i][0] <= cues[i - 1][0]) { problems.push('cue ' + i + ' does not advance'); break; }
  }

  /* scene ids unique */
  const seen = Object.create(null);
  for (const c of cues) {
    if (seen[c[2]]) problems.push('scene id used twice: ' + c[2]);
    seen[c[2]] = true;
  }

  /* the embedded copy in index.html must match the generated cue table */
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const block = html.match(/<script id="lrc-source" type="text\/plain">([\s\S]*?)<\/script>/);
  if (!block) {
    problems.push('index.html has no embedded lyric block');
  } else {
    const re = /^\[(\d+):(\d+)[.:](\d{1,3})\](.*)$/;
    const embedded = [];
    for (const line of block[1].split('\n')) {
      const m = line.match(re);
      if (m) embedded.push({ t: (+m[1]) * 60 + (+m[2]) + (+(m[3] + '00').slice(0, 3)) / 1000, text: m[4].trim() });
    }
    if (embedded.length !== cues.length) {
      problems.push('embedded=' + embedded.length + ' cues but table=' + cues.length);
    } else {
      let worst = 0;
      for (let i = 0; i < cues.length; i++) {
        worst = Math.max(worst, Math.abs(embedded[i].t - cues[i][0]) * 1000);
        if (embedded[i].text !== cues[i][1]) {
          problems.push('text mismatch at ' + i + ': "' + embedded[i].text + '" vs "' + cues[i][1] + '"');
          break;
        }
      }
      if (worst > 0.5) problems.push('worst timestamp delta ' + worst.toFixed(3) + ' ms');
      console.log('  embedded copy vs cue table: ' + embedded.length +
        ' cues, worst delta ' + worst.toFixed(3) + ' ms');
    }
  }

  console.log('  duration  : ' + EM.AUDIO_END.toFixed(5) + ' s  (' +
    EM.AUDIO_FRAMES + ' MPEG frames)');
  console.log('  accents   : ' + EM.ONSETS.length);
  console.log('  cues      : ' + cues.length);
  console.log('  envelope  : ' + EM.WAVE.length + ' bins');

  if (problems.length) {
    console.error('\nBUILD PROBLEMS:');
    for (const p of problems) console.error('  x ' + p);
    process.exit(1);
  }
  console.log('\nBUILD OK');
})();
