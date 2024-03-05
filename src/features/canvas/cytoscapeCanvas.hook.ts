import {Core} from 'cytoscape';

export function cyCanvas(cy: Core, args?: any) {
  const container = cy.container()!;

  const canvas = document.createElement("canvas");

  container.appendChild(canvas);

  const defaults = {
    zIndex: -1,
    pixelRatio: "auto",
  };

  const options = Object.assign({}, defaults, args);

  if (options.pixelRatio === "auto") {
    options.pixelRatio = window.devicePixelRatio || 1;
  }

  function resize() {
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    const canvasWidth = width * options.pixelRatio;
    const canvasHeight = height * options.pixelRatio;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    cy.trigger("cyCanvas.resize");
  }

  cy.on("resize", () => resize());

  canvas.setAttribute(
    "style",
    `position:absolute; top:0; left:0; z-index:${options.zIndex};`,
  );

  resize();

  return {
    getCanvas() {  return canvas; },
    clear(ctx: CanvasRenderingContext2D) {
      const width = cy.width();
      const height = cy.height();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width * options.pixelRatio, height * options.pixelRatio);
      ctx.restore();
    },
    resetTransform(ctx: CanvasRenderingContext2D) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    setTransform(ctx: CanvasRenderingContext2D) {
      const pan = cy.pan();
      const zoom = cy.zoom();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(pan.x * options.pixelRatio, pan.y * options.pixelRatio);
      ctx.scale(zoom * options.pixelRatio, zoom * options.pixelRatio);
    },
  };
}