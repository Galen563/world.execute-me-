/* ============================================================================
   _tools/run-all.js — the acceptance suite, one command.

     node _tools/run-all.js

   Runs every check the film makes about itself and reports a single verdict.
   Add --verbose to see per-plate numbers.
   ==========================================================================*/
'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const verbose = process.argv.indexOf('--verbose') >= 0;

const CHECKS = [
  ['verify.js', 'the film\'s own invariants: timeline, coverage, measured length, ' +
                'determinism, seek safety, contiguous coverage, fingerprints'],
  ['check-plates.js', 'every one of the 131 plates runs and puts ink on the canvas'],
  ['gap-check.js', 'NO STILL FRAMES: walks the whole track and fails on any empty ' +
                   'frame, any frame identical to the one before it, or any throw'],
  ['boot-check.js', 'the real startup path headless: file:// prerequisites, init, ' +
                    'transport, the missing-audio path, and failure resilience']
];

console.log('='.repeat(78));
console.log('  world.execute(me); — running all checks');
console.log('='.repeat(78));

const results = [];
for (const [file, what] of CHECKS) {
  console.log('\n' + '='.repeat(78));
  console.log('  ' + file);
  console.log('  ' + what);
  console.log('='.repeat(78));
  const args = [path.join(__dirname, file)];
  if (verbose && file === 'verify.js') args.push('--verbose');
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  results.push([file, r.status === 0, r.status]);
}

/* The build is part of acceptance: if the generated assets cannot be
   regenerated from the supplied MIDI/MP3/LRC, the film is not reproducible.
   stdio is inherited rather than piped: build.js spawns the individual parsers
   itself, and capturing a child's output through piped stdio fails with EPERM
   under a confined sandbox. Judge by exit status, which is what matters. */
console.log('\n' + '='.repeat(78));
console.log('  build.js  — regenerating every generated file from the supplied sources');
console.log('='.repeat(78));
const b = spawnSync(process.execPath, [path.join(ROOT, 'build.js')], { stdio: 'inherit' });
const buildOk = b.status === 0;
results.push(['build.js', buildOk, b.status]);

console.log('\n' + '='.repeat(78));
console.log('  SUMMARY');
console.log('='.repeat(78));
let bad = 0;
for (const [f, ok, status] of results) {
  console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + f.padEnd(20) +
    (ok ? '' : '(exit ' + status + ')'));
  if (!ok) bad++;
}

/* A note on what this suite does NOT check, stated so nobody assumes it does:
   it cannot tell you whether a frame LOOKS right. For that, render frames and
   look at them. */
console.log('\n  Not covered here: composition and visual quality. Render frames with');
console.log('    node _tools/render-png.js 30 75 158        (or --sheet 12)');
console.log('  and look at the PNGs in frames-out/.');

console.log('\n  ' + (bad ? bad + ' of ' + results.length + ' checks FAILED' :
  'ALL ' + results.length + ' CHECKS PASSED'));
console.log('='.repeat(78));
process.exit(bad ? 1 : 0);
