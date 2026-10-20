import { test } from 'node:test';
import assert from 'node:assert/strict';

import { applyDroppedFiles } from '../lib/fileDrop.js';

/**
 * A dropped file has to reach the hidden `<input type="file">`, because that
 * input is the component's only source of truth: every consumer reads the
 * selection in `onChange`. The fake below plays the browser's part — it holds
 * the current FileList and notifies listeners when an event is dispatched.
 */
function makeInput() {
  const listeners = [];
  return {
    files: null,
    addEventListener(type, handler) {
      listeners.push({ type, handler });
    },
    dispatchEvent(event) {
      listeners
        .filter((l) => l.type === event.type)
        .forEach((l) => l.handler(event));
      return true;
    },
    seen: [],
  };
}

function trackChange(input) {
  input.addEventListener('change', (event) => input.seen.push(event));
}

function makeTransfer(names) {
  const files = names.map((name) => ({ name }));
  files.length = files.length; // keep it array-like, like a FileList
  return { files };
}

test('a dropped file lands on the input and fires the change the consumer reads', () => {
  const input = makeInput();
  trackChange(input);

  const result = applyDroppedFiles(input, makeTransfer(['cover.png']));

  assert.equal(input.files.length, 1);
  assert.equal(input.files[0].name, 'cover.png');
  assert.equal(input.seen.length, 1, 'the consumer never hears about the drop');
  assert.equal(input.seen[0].type, 'change');
  assert.equal(input.seen[0].bubbles, true, 'React delegates from the root, not the input');
  assert.equal(result, input.files);
});

test('a drop with no files leaves the current selection untouched', () => {
  const input = makeInput();
  trackChange(input);
  input.files = [{ name: 'already-picked.png' }];

  const result = applyDroppedFiles(input, { files: [] });

  assert.equal(input.files[0].name, 'already-picked.png');
  assert.equal(input.seen.length, 0, 'an empty drop must not fake a selection');
  assert.equal(result, null);
});

test('a drop with no DataTransfer at all is ignored', () => {
  const input = makeInput();
  trackChange(input);

  assert.equal(applyDroppedFiles(input, null), null);
  assert.equal(applyDroppedFiles(input, undefined), null);
  assert.equal(input.seen.length, 0);
});
