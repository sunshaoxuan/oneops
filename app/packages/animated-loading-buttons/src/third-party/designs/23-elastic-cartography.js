import { createCanvasVisual } from "../core/canvas.js";

const GRID_SIZE = 7;
const NODE_COUNT = GRID_SIZE * GRID_SIZE;
const LOOP_SECONDS = 3.6;

const EDGES = (() => {
  const pairs = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let column = 0; column < GRID_SIZE; column += 1) {
      const index = row * GRID_SIZE + column;
      if (column + 1 < GRID_SIZE) pairs.push(index, index + 1);
      if (row + 1 < GRID_SIZE) pairs.push(index, index + GRID_SIZE);
    }
  }
  return new Uint8Array(pairs);
})();

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(start, end, value) {
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function windowed(start, full, release, end, value) {
  return smoothstep(start, full, value) * (1 - smoothstep(release, end, value));
}

function ricker(distance, width) {
  const squared = (distance * distance) / (width * width);
  return (1 - 2 * squared) * Math.exp(-squared);
}

function traceEdges(context, points, offsetX = 0, offsetY = 0) {
  context.beginPath();
  for (let edge = 0; edge < EDGES.length; edge += 2) {
    const from = EDGES[edge] * 2;
    const to = EDGES[edge + 1] * 2;
    context.moveTo(points[from] + offsetX, points[from + 1] + offsetY);
    context.lineTo(points[to] + offsetX, points[to + 1] + offsetY);
  }
}

export default {
  id: "elastic-cartography",
  name: "Elastic Cartography",
  kind: "canvas",
  technique: "Analytic spring-mesh relief",
  label: "Adjusting",
  mount(container) {
    const points = new Float32Array(NODE_COUNT * 2);
    const relief = new Float32Array(NODE_COUNT);

    return createCanvasVisual(
      container,
      (context, time, _delta, width, height) => {
        const phase = (((time % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS) / LOOP_SECONDS;
        const extent = Math.max(1, Math.min(width, height) * 0.72);
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        const pressureProgress = smoothstep(0.025, 0.34, phase);
        const pressureEnvelope = windowed(0.012, 0.105, 0.31, 0.43, phase);
        const pressureX = -0.17 + pressureProgress * 0.71;
        const pressureY = 0.34 + 0.055 * Math.sin(pressureProgress * Math.PI);

        const travel = smoothstep(0.16, 0.59, phase);
        const waveFront = -0.11 + travel * 1.24;
        const waveEnvelope = windowed(0.145, 0.21, 0.59, 0.69, phase);

        const reflectionProgressX = smoothstep(0.51, 0.735, phase);
        const reflectionProgressY = smoothstep(0.555, 0.775, phase);
        const reflectionFrontX = 1.08 - reflectionProgressX * 0.73;
        const reflectionFrontY = 1.08 - reflectionProgressY * 0.69;
        const reflectionEnvelopeX = windowed(0.485, 0.545, 0.71, 0.79, phase);
        const reflectionEnvelopeY = windowed(0.53, 0.59, 0.75, 0.825, phase);

        const closingProgress = clamp01((phase - 0.775) / 0.225);
        const closingEnvelope =
          smoothstep(0, 0.12, closingProgress) *
          (1 - smoothstep(0.76, 1, closingProgress)) *
          Math.exp(-3.65 * closingProgress) *
          Math.sin(closingProgress * Math.PI * 5);

        for (let row = 0; row < GRID_SIZE; row += 1) {
          const normalizedY = row / (GRID_SIZE - 1);
          for (let column = 0; column < GRID_SIZE; column += 1) {
            const normalizedX = column / (GRID_SIZE - 1);
            const index = row * GRID_SIZE + column;
            const pointIndex = index * 2;
            const pinning = Math.sin(normalizedX * Math.PI) * Math.sin(normalizedY * Math.PI);

            const pressureDx = normalizedX - pressureX;
            const pressureDy = normalizedY - pressureY;
            const pressureFalloff = Math.exp(
              -(pressureDx * pressureDx * 25 + pressureDy * pressureDy * 31),
            );
            const pressure = pressureEnvelope * pressureFalloff * pinning;

            const diagonal = (normalizedX + normalizedY) * 0.5;
            const travelingWave =
              waveEnvelope * ricker(diagonal - waveFront, 0.088) * pinning;
            const reflectedX =
              reflectionEnvelopeX * ricker(normalizedX - reflectionFrontX, 0.105) * pinning;
            const reflectedY =
              reflectionEnvelopeY * ricker(normalizedY - reflectionFrontY, 0.11) * pinning;
            const standingMode =
              closingEnvelope *
              Math.sin(normalizedX * Math.PI) *
              Math.sin(normalizedY * Math.PI) *
              Math.cos((normalizedX - normalizedY) * Math.PI);

            const displacementX =
              -pressureDx * pressure * 0.1 +
              travelingWave * 0.018 -
              reflectedY * 0.012 +
              standingMode * 0.006;
            const displacementY =
              pressure * 0.086 -
              travelingWave * 0.047 +
              reflectedX * 0.025 +
              reflectedY * 0.016 -
              standingMode * 0.019;

            points[pointIndex] = centerX + (normalizedX - 0.5 + displacementX) * extent;
            points[pointIndex + 1] = centerY + (normalizedY - 0.5 + displacementY) * extent;
            relief[index] = Math.min(
              1,
              Math.abs(pressure) * 0.9 +
                Math.abs(travelingWave) * 0.65 +
                (Math.abs(reflectedX) + Math.abs(reflectedY)) * 0.35 +
                Math.abs(standingMode) * 0.25,
            );
          }
        }

        context.lineCap = "round";
        context.lineJoin = "round";

        traceEdges(context, points, 0.42, 0.55);
        context.strokeStyle = "rgba(24, 25, 26, 0.10)";
        context.lineWidth = 0.78;
        context.stroke();

        for (let row = 0; row < GRID_SIZE - 1; row += 1) {
          for (let column = 0; column < GRID_SIZE - 1; column += 1) {
            const topLeft = row * GRID_SIZE + column;
            const topRight = topLeft + 1;
            const bottomLeft = topLeft + GRID_SIZE;
            const bottomRight = bottomLeft + 1;
            const depth =
              (relief[topLeft] + relief[topRight] + relief[bottomLeft] + relief[bottomRight]) *
              0.25;
            if (depth < 0.035) continue;

            context.beginPath();
            context.moveTo(points[topLeft * 2], points[topLeft * 2 + 1]);
            context.lineTo(points[topRight * 2], points[topRight * 2 + 1]);
            context.lineTo(points[bottomRight * 2], points[bottomRight * 2 + 1]);
            context.lineTo(points[bottomLeft * 2], points[bottomLeft * 2 + 1]);
            context.closePath();
            context.fillStyle = `rgba(247, 246, 241, ${Math.min(0.16, depth * 0.18)})`;
            context.fill();
          }
        }

        traceEdges(context, points);
        context.strokeStyle = "rgba(34, 35, 36, 0.66)";
        context.lineWidth = 0.5;
        context.stroke();

        context.beginPath();
        for (let edge = 0; edge < EDGES.length; edge += 2) {
          const fromNode = EDGES[edge];
          const toNode = EDGES[edge + 1];
          if ((relief[fromNode] + relief[toNode]) * 0.5 < 0.2) continue;
          const from = fromNode * 2;
          const to = toNode * 2;
          context.moveTo(points[from], points[from + 1]);
          context.lineTo(points[to], points[to + 1]);
        }
        context.strokeStyle = "rgba(241, 240, 235, 0.58)";
        context.lineWidth = 0.62;
        context.stroke();

        if (pressureEnvelope > 0.002) {
          const contactX = centerX + (pressureX - 0.5) * extent;
          const contactY =
            centerY + (pressureY - 0.5 + pressureEnvelope * 0.069) * extent;
          const radius = 0.72 + pressureEnvelope * 0.38;

          context.beginPath();
          context.arc(contactX + 0.32, contactY + 0.42, radius * 1.12, 0, Math.PI * 2);
          context.fillStyle = `rgba(25, 26, 27, ${pressureEnvelope * 0.16})`;
          context.fill();

          context.beginPath();
          context.arc(contactX, contactY, radius, 0, Math.PI * 2);
          context.fillStyle = `rgba(248, 247, 242, ${Math.min(0.96, pressureEnvelope * 1.3)})`;
          context.fill();
          context.strokeStyle = `rgba(40, 41, 42, ${pressureEnvelope * 0.72})`;
          context.lineWidth = 0.42;
          context.stroke();
        }
      },
      { maxDpr: 3 },
    );
  },
};
