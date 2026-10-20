/**
 * Put a dropped file on the hidden `<input type="file">`.
 *
 * The input is the component's only source of truth — every consumer reads the
 * selection in `onChange` — so a drop that only cleared the drag highlight
 * changed nothing: the files never reached the input, the upload never
 * happened, and the UI had already looked like it accepted them. Writing the
 * DataTransfer's FileList onto the native input and re-dispatching `change`
 * puts a drop on the same path as a click, so `onChange` fires exactly once
 * for both.
 *
 * The event bubbles because React attaches `onChange` at the root container,
 * not to the input itself.
 *
 * @param {HTMLInputElement} input the hidden file input to write to
 * @param {DataTransfer|null|undefined} dataTransfer the drop event's payload
 * @returns {FileList|null} the files now selected, or null when the drop
 *   carried none — an empty drop must never fake a selection
 */
export function applyDroppedFiles(input, dataTransfer) {
  const files = dataTransfer?.files;
  if (!files || files.length === 0) return null;

  input.files = files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return files;
}
