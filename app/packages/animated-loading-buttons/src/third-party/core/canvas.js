export function createCanvasVisual(container, draw, options = {}) {
  const canvas = document.createElement("canvas");
  canvas.className = "visual-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });

  let width = 1;
  let height = 1;
  let dpr = 1;

  function resize(nextWidth, nextHeight, nextDpr = window.devicePixelRatio || 1) {
    width = Math.max(1, nextWidth);
    height = Math.max(1, nextHeight);
    dpr = Math.min(options.maxDpr ?? 3, Math.max(1, nextDpr));
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
  }

  return {
    render(time, delta) {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.save();
      draw(context, time, delta, width, height);
      context.restore();
    },
    resize,
    reset() {},
    destroy() {
      canvas.remove();
    },
  };
}
