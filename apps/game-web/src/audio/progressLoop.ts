/**
 * Reads a value once per animation frame and publishes it when it changes. Returns the stopper,
 * which cancels the queued frame so nothing keeps running after the recorder closes.
 */
export function startProgressLoop(
  read: () => number,
  publish: (value: number) => void,
  request: (callback: () => void) => number = (callback) => requestAnimationFrame(callback),
  cancel: (id: number) => void = (id) => cancelAnimationFrame(id),
): () => void {
  let frame = 0;
  let stopped = false;
  let last = Number.NaN;
  const tick = () => {
    if (stopped) return;
    const value = read();
    if (value !== last) {
      last = value;
      publish(value);
    }
    frame = request(tick);
  };
  frame = request(tick);
  return () => {
    stopped = true;
    cancel(frame);
  };
}
