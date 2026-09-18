/* ============================================================================
   parse-midi.js — read the supplied .mid and emit the accent table.

   This is a BUILD step, not a runtime step. The film must never fetch
   anything, so the parsed result is baked into a source file.

   What we extract per note-on:  [time_ms, lo_pitch, hi_pitch, voices, velocity]

   Notes that start on the *same* millisecond are grouped into one entry with
   `voices` counting how many sounded together — a chord should read as one
   impact, not three.

   Run:  node _build/parse-midi.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] ||
  path.join(__dirname, '..', '..', '参考文件',
    'DeepSeek-V4-1-Flash-world.execute-me--main', 'original', 'world.execute (me) ;.mid');
const OUT = path.join(__dirname, '..', 'assets', 'onsets.js');

/* ---------- a minimal, strict SMF reader ---------------------------------- */
function readVarInt(b, p) {
  let v = 0, n = 0;
  for (;;) {
    const c = b[p++];
    v = (v << 7) | (c & 0x7f);
    n++;
    if (!(c & 0x80)) break;
    if (n > 4) throw new Error('varint too long at ' + p);
  }
  return [v, p];
}

function parse(buf) {
  if (buf.toString('ascii', 0, 4) !== 'MThd') throw new Error('not a MIDI file');
  const headerLen = buf.readUInt32BE(4);
  const format = buf.readUInt16BE(8);
  const nTracks = buf.readUInt16BE(10);
  const division = buf.readUInt16BE(12);
  if (division & 0x8000) throw new Error('SMPTE time division is not supported');

  let p = 8 + headerLen;
  const notes = [];              // { tick, pitch, vel }
  const tempos = [];             // { tick, usPerQuarter }

  for (let tr = 0; tr < nTracks && p < buf.length; tr++) {
    if (buf.toString('ascii', p, p + 4) !== 'MTrk') break;
    const len = buf.readUInt32BE(p + 4);
    const end = p + 8 + len;
    let q = p + 8;
    let tick = 0;
    let running = 0;

    while (q < end) {
      const [dt, np] = readVarInt(buf, q); q = np;
      tick += dt;
      let status = buf[q];
      if (status & 0x80) { q++; running = status; } else { status = running; }

      const type = status & 0xf0;
      if (status === 0xff) {                       // meta
        const meta = buf[q++];
        const [mlen, mp] = readVarInt(buf, q); q = mp;
        if (meta === 0x51 && mlen === 3) {
          tempos.push({ tick, usPerQuarter: (buf[q] << 16) | (buf[q + 1] << 8) | buf[q + 2] });
        }
        q += mlen;
      } else if (status === 0xf0 || status === 0xf7) {   // sysex
        const [slen, sp] = readVarInt(buf, q); q = sp + slen;
      } else if (type === 0x90) {
        const pitch = buf[q], vel = buf[q + 1]; q += 2;
        if (vel > 0) notes.push({ tick, pitch, vel });   // vel 0 == note off
      } else if (type === 0x80) {
        q += 2;
      } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
        q += 2;
      } else if (type === 0xc0 || type === 0xd0) {
        q += 1;
      } else {
        throw new Error('unknown status 0x' + status.toString(16) + ' at ' + (q - 1));
      }
    }
    p = end;
  }
  return { format, nTracks, division, notes, tempos };
}

/* ---------- ticks -> milliseconds ----------------------------------------
   Tempo changes are rare but must be honoured: we walk the tempo map and
   accumulate real time, so a file that changes tempo mid-song still lands
   every note on the right millisecond.                                      */
function tickToMsMap(division, tempos) {
  const map = tempos.length ? tempos.slice() : [{ tick: 0, usPerQuarter: 500000 }];
  map.sort((a, b) => a.tick - b.tick);
  if (map[0].tick !== 0) map.unshift({ tick: 0, usPerQuarter: 500000 });

  return function (tick) {
    let ms = 0;
    for (let i = 0; i < map.length; i++) {
      const cur = map[i];
      const next = map[i + 1];
      const spanEnd = next ? Math.min(tick, next.tick) : tick;
      if (spanEnd > cur.tick) {
        ms += (spanEnd - cur.tick) / division * (cur.usPerQuarter / 1000);
      }
      if (!next || tick <= next.tick) break;
    }
    return ms;
  };
}

/* ---------- main --------------------------------------------------------- */
const buf = fs.readFileSync(SRC);
const smf = parse(buf);
const toMs = tickToMsMap(smf.division, smf.tempos);

const all = smf.notes.map(n => ({
  ms: Math.round(toMs(n.tick)),
  pitch: n.pitch,
  vel: n.vel
})).sort((a, b) => a.ms - b.ms || a.pitch - b.pitch);

/* group notes sharing a millisecond */
const groups = [];
for (const n of all) {
  const last = groups[groups.length - 1];
  if (last && last.ms === n.ms) {
    last.lo = Math.min(last.lo, n.pitch);
    last.hi = Math.max(last.hi, n.pitch);
    last.voices++;
    last.vel = Math.max(last.vel, n.vel);
  } else {
    groups.push({ ms: n.ms, lo: n.pitch, hi: n.pitch, voices: 1, vel: n.vel });
  }
}

const first = groups[0] ? groups[0].ms : 0;
const last = groups[groups.length - 1] ? groups[groups.length - 1].ms : 0;
const tempos = smf.tempos.length
  ? smf.tempos.map(t => Math.round(60000000 / t.usPerQuarter))
  : [Math.round(60000000 / 500000)];

console.log('input        : ' + SRC);
console.log('format       : ' + smf.format + '   tracks: ' + smf.nTracks + '   division: ' + smf.division);
console.log('tempo        : ' + tempos.join(', ') + ' BPM');
console.log('note-ons     : ' + all.length);
console.log('accent groups: ' + groups.length + '   (notes sharing a millisecond merged)');
console.log('span         : ' + first + ' ms .. ' + last + ' ms');
console.log('pitch range  : ' + Math.min(...all.map(n => n.pitch)) + ' .. ' + Math.max(...all.map(n => n.pitch)));

/* ---------- emit --------------------------------------------------------- */
const rows = [];
for (let i = 0; i < groups.length; i += 8) {
  rows.push('  ' + groups.slice(i, i + 8)
    .map(g => '[' + g.ms + ',' + g.lo + ',' + g.hi + ',' + g.voices + ',' + g.vel + ']')
    .join(','));
}

const out = `/* ============================================================================
   assets/onsets.js — GENERATED, do not edit by hand.
   Source : ${path.basename(SRC)}
   Command: node _build/parse-midi.js

   Every accent in the film is fired from this table, so the hits land on the
   notes that were actually played instead of on a metronome guess.

   Row format: [time_ms, lowest_pitch, highest_pitch, simultaneous_notes, velocity]
   Notes sounding on the same millisecond are merged: a chord reads as one
   impact, with \`voices\` recording how many notes made it.

   ${groups.length} accents over ${all.length} note-ons, tempo ${tempos.join('/')} BPM,
   pitch ${Math.min(...all.map(n => n.pitch))}..${Math.max(...all.map(n => n.pitch))}.
   ==========================================================================*/
window.EM = window.EM || {};
EM.ONSETS = [
${rows.join(',\n')}
];
EM.MIDI_INFO = { tempt: null, bpm: [${tempos.join(',')}], notes: ${all.length}, accents: ${groups.length}, firstMs: ${first}, lastMs: ${last} };
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
console.log('\nwrote ' + OUT + '  (' + (out.length / 1024).toFixed(1) + ' KB)');
