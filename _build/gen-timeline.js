/* ============================================================================
   parse-lrc.js — bind the film's scene ids to the supplied lyric timeline.

   BUILD step. The film must never fetch a lyric service, so the timeline is
   generated into a source file and ALSO embedded verbatim in index.html: two
   independent copies that the runtime cross-checks on every load. If either is
   edited the self-test fails loudly instead of quietly drifting.

   The running order itself lives in _build/scenes.js as data. This script
   binds it to the real cues and refuses to write anything if a single entry
   does not sit on the cue it claims to.

   Run:  node _build/parse-lrc.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] ||
  path.join(__dirname, '..', '..', '参考文件',
    'DeepSeek-V4-1-Flash-world.execute-me--main', 'original',
    'world.execute(me)-timeline.lrc');
const OUT = path.join(__dirname, '..', 'assets', 'timeline.js');
const EMBED = path.join(__dirname, '..', 'assets', 'lrc-embed.txt');

/* ---------- read the supplied timeline ---------------------------------- */
const raw = fs.readFileSync(SRC, 'utf8');
const re = /^\[(\d+):(\d+)[.:](\d{1,3})\](.*)$/;
const cues = [];
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(re);
  if (!m) continue;
  const frac = (m[3] + '00').slice(0, 3);
  const t = (+m[1]) * 60 + (+m[2]) + (+frac) / 1000;
  cues.push({ t: Math.round(t * 1000) / 1000, text: m[4].trim() });
}
if (!cues.length) { console.error('no cues parsed from ' + SRC); process.exit(1); }

/* ---------- read the running order ------------------------------------- */
const SCENES = require('./scenes.js');

const problems = [];

if (SCENES.length !== cues.length) {
  problems.push('scenes.js has ' + SCENES.length + ' entries but the timeline has ' +
    cues.length + ' cues');
}

/* Every entry is checked three ways: its index, its timestamp, and a word that
   must appear in that cue's actual lyric. Index alone is not enough — a table
   that is short in the middle and long at the end has the right total and maps
   every later line to the wrong words. */
const rows = [];
const seenIds = Object.create(null);
for (let i = 0; i < SCENES.length; i++) {
  const e = SCENES[i];
  if (!Array.isArray(e) || e.length < 3) {
    problems.push('scenes.js entry ' + i + ' is malformed');
    continue;
  }
  const idx = e[0], id = e[1], word = e[2];
  if (idx !== i) {
    problems.push('scenes.js entry ' + i + ' declares index ' + idx +
      ' — entries must be contiguous and in order');
  }
  if (seenIds[id]) problems.push('scene id used twice: ' + id);
  seenIds[id] = true;

  const cue = cues[idx];
  if (!cue) { problems.push('no cue at index ' + idx + ' for ' + id); continue; }
  if (word && cue.text.toLowerCase().indexOf(String(word).toLowerCase()) === -1) {
    problems.push('cue ' + idx + ' is "' + cue.text + '" but ' + id +
      ' expects to find "' + word + '" in it');
  }
  rows.push({ t: cue.t, text: cue.text, scene: id });
}

if (problems.length) {
  console.error('SCENE TABLE DOES NOT MATCH THE TIMELINE — refusing to emit.\n');
  for (const p of problems.slice(0, 24)) console.error('  x ' + p);
  if (problems.length > 24) console.error('  … ' + (problems.length - 24) + ' more');
  process.exit(1);
}

/* ---------- repeat bookkeeping -----------------------------------------
   Counts how many times the same line occurs, so a plate can ask "which time
   is this" without anyone hard-coding an index. */
const byText = {}, repeatOf = [];
for (let i = 0; i < rows.length; i++) {
  const key = rows[i].text.replace(/[^A-Za-z]/g, '').toUpperCase() || ('_' + i);
  byText[key] = (byText[key] || 0) + 1;
  repeatOf.push(byText[key] - 1);
}

const repeats = Object.keys(byText).filter(k => byText[k] > 1)
  .map(k => k.toLowerCase() + ' x' + byText[k]);

/* ---------------------------------------------------------------------------
   BLEED.

   drawSequence lets each plate fade out THROUGH the one that follows it, which
   is what stops a line boundary from being an empty frame. That is right for
   almost every plate in the film, and wrong for a plate whose content is
   literally the words being sung.

   The EXECUTION storm exposed it. Eighteen short cues chase each other at
   0.6-1.0 s, so for half a second after each one ends its plate is still on
   screen at fading alpha — and the frame therefore shows the word EXECUTION at
   moments when the song is singing something else entirely. The lyrics and the
   picture contradict each other, which is the one thing a film with words on
   screen must never do. It was not a random bug; it was a semantic one that the
   smooth-transition pass introduced.

   So a plate can declare `bleed: false`. Those are cross-CUT rather than
   cross-faded: the outgoing plate stops at the cue boundary and the frame is
   carried by the incoming plate alone, whose own entrance is generous enough
   that the frame is never empty.

   DEFAULT IS TRUE. The list below is the complete set of exceptions, and they
   are all cues whose plate displays the sung word as its subject.
   ------------------------------------------------------------------------- */
const NO_BLEED = new Set([
  'ex.first',
  'xs.r01', 'xs.r02', 'xs.r03', 'xs.r04', 'xs.r05', 'xs.r06',
  'xs.r07', 'xs.r08', 'xs.r09', 'xs.r10', 'xs.r11', 'xs.r12',
  'xs.r13', 'xs.r14', 'xs.r15', 'xs.r16',
  'ex.final'
]);
for (const r of rows) r.bleed = !NO_BLEED.has(r.scene);

console.log('source       : ' + SRC);
console.log('cues         : ' + rows.length);
console.log('scene ids    : ' + SCENES.length + '  (all unique, all verified against the lyric)');
console.log('repeated     : ' + (repeats.join(', ') || 'none'));
console.log('no-bleed     : ' + NO_BLEED.size + '  (cross-cut, not cross-faded: their word is the subject)');
console.log('first / last : ' + rows[0].t + ' s / ' + rows[rows.length - 1].t + ' s');
console.log('total span   : ' + (rows[rows.length - 1].t - rows[0].t).toFixed(3) + ' s');

let maxGap = 0, maxAt = 0;
for (let i = 1; i < rows.length; i++) {
  const g = rows[i].t - rows[i - 1].t;
  if (g > maxGap) { maxGap = g; maxAt = rows[i - 1].t; }
}
console.log('longest gap  : ' + maxGap.toFixed(3) + ' s after ' + maxAt + ' s');

/* ---------- emit -------------------------------------------------------- */
const list = rows.map((r, i) =>
  '  [' + r.t.toFixed(3) + ', ' + JSON.stringify(r.text) + ', ' +
  JSON.stringify(r.scene) + ', ' + repeatOf[i] + ', ' + (r.bleed ? 1 : 0) + ']').join(',\n');

const embed = cues.map(c => '[' +
  String(Math.floor(c.t / 60)).padStart(2, '0') + ':' +
  String(Math.floor(c.t % 60)).padStart(2, '0') + '.' +
  String(Math.round((c.t % 1) * 1000)).padStart(3, '0') + ']' + c.text).join('\n');

const out = `/* ============================================================================
   assets/timeline.js — GENERATED, do not edit by hand.
   Source : ${path.basename(SRC)}
   Command: node _build/parse-lrc.js

   ${rows.length} cues. Times are the measured ones from the supplied timeline, not a
   metronome grid: the recording is played by a person and sits about 0.11 s off
   a strict 130 BPM lattice, so the words follow the performer while the MIDI
   supplies the rhythm. Keeping those two jobs on separate sources is
   deliberate — mixing them gives a film that is rhythmically tidy and
   lyrically late.

   [time_seconds, text, scene_id, repeat_index, bleed]
   repeat_index counts earlier occurrences of the same line, so "EXECUTION"
   can know it is the 7th of 18 without anyone hard-coding 7.
   bleed = 1 means this plate may fade out through the next one; 0 means it must
   be cut at its own boundary, because its picture IS the sung word.
   ==========================================================================*/
window.EM = window.EM || {};
EM.CUES = [
${list}
];
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
fs.writeFileSync(EMBED, embed, 'utf8');
console.log('\nwrote ' + OUT + '  (' + (out.length / 1024).toFixed(1) + ' KB)');
console.log('wrote assets/lrc-embed.txt  (embedded verbatim into index.html)');
