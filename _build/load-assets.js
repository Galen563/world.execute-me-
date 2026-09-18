/* ============================================================================
   load-assets.js — read the generated asset files the way a browser would.

   The generated files are browser scripts: they assign to `window.EM`. Node
   has no `window`, and assigning globalThis.window from inside a CommonJS
   module does not make it visible as a free variable to another module, so the
   files are evaluated in a throwaway VM context that provides one. That keeps
   the generator and the verifiers reading the exact same bytes the page loads,
   with no duplicate parsing logic that could disagree.
   ==========================================================================*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ASSETS = path.join(__dirname, '..', 'assets');

const FILES = ['onsets.js', 'waveform.js', 'timeline.js'];

/* In a browser `window.EM = {}` also creates the global binding `EM`, which is
   what the generated files then write through. A bare VM context has no such
   rule, so the context exposes `EM` as an accessor onto the same object the
   page would see. Getting this wrong looks exactly like a broken asset. */
function makeContext(win) {
  const sandbox = { window: win, console };
  Object.defineProperty(sandbox, 'EM', {
    get() { return win.EM; },
    set(v) { win.EM = v; },
    enumerable: true
  });
  return vm.createContext(sandbox);
}

function load(files) {
  const names = files || FILES;
  const win = {};
  const ctx = makeContext(win);
  for (const name of names) {
    const file = path.join(ASSETS, name);
    if (!fs.existsSync(file)) {
      throw new Error('missing generated asset: ' + file +
        '  — run the _build scripts first');
    }
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  }
  return win.EM;
}

module.exports = { load, makeContext, ASSETS, FILES };
