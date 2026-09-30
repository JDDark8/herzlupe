// Virtual clock for frame-exact capture: the renderer advances time itself, one video frame per __vstep call.
(() => {
  let vt = 0;
  const queue = [];
  performance.now = () => vt;
  window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
  window.cancelAnimationFrame = () => {};
  window.__vstep = ms => { vt += ms; for (const cb of queue.splice(0)) cb(vt); };
})();
