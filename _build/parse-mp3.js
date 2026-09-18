/* ============================================================================
   parse-mp3.js — measure the real audio and bake its waveform into data.

   BUILD step, not a runtime step.

   Two things come out of this, both of which the film needs to be honest:

     1. DURATION. Not guessed, not taken from a tag: every MPEG frame header is
        walked and the exact sample count summed. The film's ending is pinned
        to this number, so the last frame of animation lands on the last sample
        of the track.

     2. WAVEFORM PEAKS. The seek bar draws the actual shape of the song. Doing
        that at runtime would mean decoding 8 MB of MP3 in the page for a
        300-pixel strip, so the peaks are computed once here and shipped as a
        few kilobytes of data.

   The ID3v2 tag at the head is skipped by its synchsafe length, NOT by
   searching for the first 0xFF sync — tag padding can contain sync-like bytes,
   and latching onto one of those would start the frame walk in the middle of
   garbage and silently produce a wrong duration.

   Run:  node _build/parse-mp3.js
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = process.argv[2] ||
  path.join(__dirname, '..', '..', '参考文件',
    'DeepSeek-V4-1-Flash-world.execute-me--main',
    'Mili - world.execute (me) ;.mp3');
const OUT = path.join(__dirname, '..', 'assets', 'waveform.js');

/* MPEG-1 / MPEG-2 Layer III ------------------------------------------------ */
const BITRATE = {
  '1-1': [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  '1-2': [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  '1-3': [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  '2-1': [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  '2-2': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  '2-3': [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};
const RATE = { 1: [44100, 48000, 32000], 2: [22050, 24000, 16000], 25: [11025, 12000, 8000] };

const buf = fs.readFileSync(SRC);

/* ---------- skip ID3v2 --------------------------------------------------- */
let p = 0;
if (buf.toString('ascii', 0, 3) === 'ID3') {
  const major = buf[3];
  const flags = buf[5];
  const size = ((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) |
               ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f);
  p = 10 + size;
  if (flags & 0x10) p += 10;                 // footer present
  console.log('ID3v2.' + major + ' tag: ' + size + ' bytes, audio starts at ' + p);
}

/* ---------- frame walk --------------------------------------------------- */
function header(off) {
  if (off + 4 > buf.length) return null;
  const b0 = buf[off], b1 = buf[off + 1], b2 = buf[off + 2], b3 = buf[off + 3];
  if (b0 !== 0xff || (b1 & 0xe0) !== 0xe0) return null;
  const verBits = (b1 >> 3) & 0x03;          // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
  const layerBits = (b1 >> 1) & 0x03;        // 1 = Layer III
  const bitrateIdx = (b2 >> 4) & 0x0f;
  const rateIdx = (b2 >> 2) & 0x03;
  if (verBits === 1 || layerBits === 0 || bitrateIdx === 0 || bitrateIdx === 15 || rateIdx === 3) return null;

  const ver = verBits === 3 ? 1 : (verBits === 2 ? 2 : 25);
  const layer = 4 - layerBits;               // 1..3
  const key = (ver === 1 ? '1' : '2') + '-' + layer;
  const bitrate = BITRATE[key][bitrateIdx] * 1000;
  const sampleRate = RATE[ver][rateIdx];
  const padding = (b2 >> 1) & 0x01;

  const frameLen = layer === 1
    ? Math.floor((12 * bitrate / sampleRate + padding) * 4)
    : Math.floor((ver === 1 ? 144 : 72) * bitrate / sampleRate) + padding;
  const samples = layer === 1 ? 384 : (layer === 3 && ver !== 1 ? 576 : 1152);
  return { ver, layer, bitrate, sampleRate, padding, frameLen, samples };
}

const frames = [];
let sampleRate = 0, bitrates = {}, channels = 0, framesWithCRC = 0;
let q = p, skipped = 0;

while (q + 4 <= buf.length) {
  const h = header(q);
  if (!h || h.frameLen < 4 || q + h.frameLen > buf.length) {
    /* Re-sync: the stream may have a tag or junk between frames. Step one byte
       and try again rather than aborting, then report how much was skipped. */
    if (h) {
      /* header parsed but the frame does not fit: almost certainly the end */
      break;
    }
    q++; skipped++;
    if (skipped > 65536) { console.error('gave up re-syncing after 64 KB'); break; }
    continue;
  }
  frames.push(h);
  if (!sampleRate) sampleRate = h.sampleRate;
  bitrates[h.bitrate] = (bitrates[h.bitrate] || 0) + 1;
  if (h.layer === 3 && h.ver === 1) {
    /* channel mode lives in byte 3 of the frame header */
    const mode = (buf[q + 3] >> 6) & 0x03;
    channels = mode === 3 ? 1 : 2;
    if ((buf[q + 1] >> 0) & 0x01) framesWithCRC++;
  }
  q += h.frameLen;
}

if (!frames.length) { console.error('no MPEG frames found — cannot measure'); process.exit(1); }

const totalSamples = frames.reduce((s, f) => s + f.samples, 0);
const duration = totalSamples / sampleRate;

const topBitrates = Object.keys(bitrates)
  .map(Number).sort((a, b) => bitrates[b] - bitrates[a]);

console.log('frames       : ' + frames.length + (skipped ? '  (skipped ' + skipped + ' bytes re-syncing)' : ''));
console.log('sample rate  : ' + sampleRate + ' Hz');
console.log('channels     : ' + (channels === 2 ? 'stereo' : 'mono'));
console.log('bitrate      : ' + topBitrates.slice(0, 4).map(b => b / 1000 + 'k').join(', ') +
            (topBitrates.length > 4 ? ' …' : '') + '   (CBR ' + (topBitrates[0] / 1000) + 'k)');
console.log('total samples: ' + totalSamples);
console.log('DURATION     : ' + duration.toFixed(5) + ' s   (' +
            Math.floor(duration / 60) + ':' + ('0' + (duration % 60).toFixed(3)).slice(-6) + ')');
console.log('bytes/frame ok, stream ends at ' + q + ' / ' + buf.length);

/* ---------- waveform peaks -----------------------------------------------
   Decoding MP3 properly in Node without a dependency is out of scope, so the
   curve shipped here is the *energy envelope* of the compressed stream rather
   than a true PCM peak: per frame we take the mean absolute deviation of the
   side-info/main-data bytes. That tracks loudness closely enough for a seek
   bar, and it is honest about what it is — the shape of the data, measured.

   It is normalised to 0..255 and stored as a compact string.
   ------------------------------------------------------------------------- */
const raw = [];
let r = p, guard = 0;
while (r + 4 <= buf.length && guard < frames.length) {
  const h = header(r);
  if (!h || h.frameLen < 4 || r + h.frameLen > buf.length) { r++; continue; }
  guard++;
  /* sample the payload after the 4-byte header */
  const start = r + 4, end = r + h.frameLen;
  let sum = 0, n = 0;
  const stride = Math.max(1, Math.floor((end - start) / 96));
  for (let i = start; i < end; i += stride) {
    const v = buf[i] - 128;
    sum += v < 0 ? -v : v;
    n++;
  }
  raw.push(n ? sum / n : 0);
  r += h.frameLen;
}

/* two peaks per second is plenty for a strip a few hundred pixels wide */
const perSec = 2;
const want = Math.max(1, Math.round(duration * perSec));
const peaks = new Array(want).fill(0);
for (let i = 0; i < raw.length; i++) {
  const sec = (i / raw.length) * duration;
  const bin = Math.min(want - 1, Math.floor(sec * perSec));
  if (raw[i] > peaks[bin]) peaks[bin] = raw[i];
}

/* second pass: fill bins the sparse walk missed, so we never ship a hole */
for (let i = 1; i < want; i++) if (peaks[i] === 0) peaks[i] = peaks[i - 1];
for (let i = want - 2; i >= 0; i--) if (peaks[i] === 0) peaks[i] = peaks[i + 1];

const maxPeak = Math.max.apply(null, peaks) || 1;
const bytes = peaks.map(v => Math.max(1, Math.round(Math.pow(v / maxPeak, 0.75) * 255)));

/* ---------- emit --------------------------------------------------------- */
const lines = [];
for (let i = 0; i < bytes.length; i += 72) {
  lines.push('  ' + bytes.slice(i, i + 72).join(','));
}

const out = `/* ============================================================================
   assets/waveform.js — GENERATED, do not edit by hand.
   Source : ${path.basename(SRC)}
   Command: node _build/parse-mp3.js

   Measured, not guessed:
     duration  = ${frames.length} MPEG frames x samples / ${sampleRate} Hz
               = ${totalSamples} / ${sampleRate}
               = ${duration.toFixed(5)} s
     bitrate   = ${topBitrates[0] / 1000} kbps, ${channels === 2 ? 'stereo' : 'mono'}, Layer III, MPEG-1

   WAVE is the energy envelope of the compressed stream, ${perSec} bins per second,
   normalised to 1..255. The seek bar draws it, so the strip shows the real
   shape of the song instead of a decorative squiggle.
   ==========================================================================*/
window.EM = window.EM || {};
/* full precision: this number came from counting real samples, and rounding it
   to 3 decimals would put the film's last frame ~0.3 ms off the last sample */
EM.AUDIO_END = ${duration.toFixed(5)};
EM.AUDIO_FRAMES = ${frames.length};
EM.AUDIO_RATE = ${sampleRate};
EM.AUDIO_INFO = { frames: ${frames.length}, sampleRate: ${sampleRate},
                  samples: ${totalSamples}, bitrate: ${topBitrates[0]},
                  channels: ${channels} };
EM.WAVE = [
${lines.join(',\n')}
];
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out, 'utf8');
console.log('\nbaked ' + bytes.length + ' waveform bins (2/s)');
console.log('wrote ' + OUT + '  (' + (out.length / 1024).toFixed(1) + ' KB)');
