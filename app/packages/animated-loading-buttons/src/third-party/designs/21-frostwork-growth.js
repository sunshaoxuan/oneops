import { createCanvasVisual } from "../core/canvas.js";

const DURATION = 5;
const SEGMENT_TOTAL = 120;
const PEARL = "#f3f0e9";
const INK = "#1d1d1c";
const GRAPHITE = "#454440";

const BRANCH_SPECS = [
  { angle: -1.54, trunk: 13, twigs: 10, reach: 1 },
  { angle: -0.47, trunk: 11, twigs: 8, reach: 0.83 },
  { angle: 0.38, trunk: 12, twigs: 9, reach: 0.94 },
  { angle: 1.31, trunk: 9, twigs: 7, reach: 0.76 },
  { angle: 2.32, trunk: 11, twigs: 9, reach: 0.89 },
  { angle: 3.3, trunk: 12, twigs: 9, reach: 0.8 },
];

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0, edge1, value) {
  const amount = clamp01((value - edge0) / (edge1 - edge0));
  return amount * amount * (3 - 2 * amount);
}

function smootherstep(value) {
  const amount = clamp01(value);
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function hash01(key) {
  let value = key | 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

function buildFrostwork() {
  const segments = [];
  const terminalSegments = [];
  let serial = 0;

  for (let branch = 0; branch < BRANCH_SPECS.length; branch += 1) {
    const spec = BRANCH_SPECS[branch];
    const trunkPoints = [{ x: 0, y: 0 }];

    for (let step = 0; step < spec.trunk; step += 1) {
      const start = trunkPoints[step];
      const irregularity = hash01(1000 + branch * 97 + step * 13) - 0.5;
      const alternation = (step % 3) - 1;
      const heading =
        spec.angle + irregularity * 0.12 + alternation * 0.018;
      const length =
        (0.058 + hash01(2000 + branch * 71 + step * 19) * 0.012) *
        spec.reach;
      const end = {
        x: start.x + Math.cos(heading) * length,
        y: start.y + Math.sin(heading) * length,
      };
      const segment = {
        x0: start.x,
        y0: start.y,
        x1: end.x,
        y1: end.y,
        branch,
        twig: false,
        order: step + branch * 0.075,
        serial: serial++,
      };
      segments.push(segment);
      trunkPoints.push(end);

      if (step === spec.trunk - 1) terminalSegments.push(segment);
    }

    let emitted = 0;
    let twig = 0;
    while (emitted < spec.twigs) {
      const remaining = spec.twigs - emitted;
      const chainLength = Math.min(1 + ((twig + branch) % 3), remaining);
      const anchorIndex =
        2 + ((twig * 3 + branch * 2) % Math.max(2, spec.trunk - 3));
      const anchor = trunkPoints[anchorIndex];
      const side = (twig + branch) % 2 === 0 ? 1 : -1;
      const opening =
        0.62 + hash01(3000 + branch * 83 + twig * 29) * 0.28;
      let twigX = anchor.x;
      let twigY = anchor.y;
      let lastSegment;

      for (let twigStep = 0; twigStep < chainLength; twigStep += 1) {
        const heading =
          spec.angle +
          side * (opening + twigStep * 0.055) +
          (hash01(4000 + branch * 101 + twig * 17 + twigStep) - 0.5) *
            0.09;
        const length =
          (0.034 +
            hash01(5000 + branch * 113 + twig * 23 + twigStep) * 0.011) *
          spec.reach;
        const endX = twigX + Math.cos(heading) * length;
        const endY = twigY + Math.sin(heading) * length;
        lastSegment = {
          x0: twigX,
          y0: twigY,
          x1: endX,
          y1: endY,
          branch,
          twig: true,
          order: anchorIndex + 1.45 + twigStep * 0.68 + twig * 0.04,
          serial: serial++,
        };
        segments.push(lastSegment);
        twigX = endX;
        twigY = endY;
        emitted += 1;
      }

      terminalSegments.push(lastSegment);
      twig += 1;
    }
  }

  if (segments.length !== SEGMENT_TOTAL) {
    throw new Error(`Frostwork expected ${SEGMENT_TOTAL} segments`);
  }

  let furthestRadius = 0;
  for (const segment of segments) {
    furthestRadius = Math.max(
      furthestRadius,
      Math.hypot(segment.x0, segment.y0),
      Math.hypot(segment.x1, segment.y1),
    );
  }

  const normalization = 0.91 / furthestRadius;
  for (const segment of segments) {
    segment.x0 *= normalization;
    segment.y0 *= normalization;
    segment.x1 *= normalization;
    segment.y1 *= normalization;
  }

  let finalSegment = terminalSegments[0];
  for (const segment of terminalSegments) {
    if (
      Math.hypot(segment.x1, segment.y1) >
      Math.hypot(finalSegment.x1, finalSegment.y1)
    ) {
      finalSegment = segment;
    }
  }

  let lastOrder = -Infinity;
  for (const segment of segments) {
    lastOrder = Math.max(lastOrder, segment.order);
  }
  finalSegment.order = lastOrder + 0.85;
  finalSegment.final = true;

  segments.sort((a, b) => a.order - b.order || a.serial - b.serial);
  for (const segment of segments) {
    segment.radius =
      Math.hypot(
        (segment.x0 + segment.x1) * 0.5,
        (segment.y0 + segment.y1) * 0.5,
      ) / 0.91;
    segment.dust = hash01(6000 + segment.serial * 31);
  }

  return {
    segments,
    finalTip: { x: finalSegment.x1, y: finalSegment.y1 },
    maxOrder: finalSegment.order,
  };
}

const FROSTWORK = buildFrostwork();

function drawSeed(context, x, y, radius, opacity) {
  if (opacity <= 0) return;
  context.globalAlpha = opacity;
  context.fillStyle = PEARL;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function drawFrostwork(context, time, _delta, width, height) {
  const phase = (((time % DURATION) + DURATION) % DURATION) / DURATION;
  const growth = smootherstep((phase - 0.015) / 0.66);
  const warmth = smootherstep((phase - 0.56) / 0.4);
  const heatFront = -0.13 + warmth * 1.25;
  const growthPosition = growth * (FROSTWORK.maxOrder + 0.55);
  const scale = Math.min(width, height) * 0.46;
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  context.lineCap = "round";
  context.lineJoin = "round";

  for (let index = 0; index < FROSTWORK.segments.length; index += 1) {
    const segment = FROSTWORK.segments[index];
    const reveal = smoothstep(
      segment.order - 0.16,
      segment.order + 0.5,
      growthPosition,
    );
    if (reveal <= 0.001) break;

    const erased = smoothstep(
      segment.radius - 0.055,
      segment.radius + 0.045,
      heatFront,
    );
    const finalTipRetention = segment.final
      ? 1 - smoothstep(0.835, 0.91, phase)
      : 0;
    const opacity = reveal * Math.max(1 - erased, finalTipRetention);
    if (opacity <= 0.006) continue;

    const startX = centerX + segment.x0 * scale;
    const startY = centerY + segment.y0 * scale;
    const endX =
      centerX + (segment.x0 + (segment.x1 - segment.x0) * reveal) * scale;
    const endY =
      centerY + (segment.y0 + (segment.y1 - segment.y0) * reveal) * scale;
    const lineWidth = segment.twig ? 0.48 : 1.02 - segment.radius * 0.24;

    context.globalAlpha = opacity * (segment.twig ? 0.62 : 0.88);
    context.strokeStyle = segment.twig ? GRAPHITE : INK;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(startX, startY);
    context.lineTo(endX, endY);
    context.stroke();

    const waveEdge =
      1 - clamp01(Math.abs(segment.radius - heatFront) / 0.075);
    if (waveEdge > 0) {
      context.globalAlpha = waveEdge * reveal * 0.56;
      context.strokeStyle = PEARL;
      context.lineWidth = Math.max(0.38, lineWidth * 0.68);
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(endX, endY);
      context.stroke();

      const dustX = startX + (endX - startX) * segment.dust;
      const dustLift =
        smoothstep(
          segment.radius - 0.055,
          segment.radius + 0.045,
          heatFront,
        ) *
        (0.35 + segment.dust * 0.42);
      const dustDrift = (segment.dust - 0.5) * dustLift * 0.5;
      const dustY =
        startY + (endY - startY) * segment.dust - dustLift;
      context.globalAlpha = waveEdge * 0.42;
      context.fillStyle = PEARL;
      context.beginPath();
      context.arc(
        dustX + dustDrift,
        dustY,
        0.22 + segment.dust * 0.13,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    if (reveal > 0.025 && reveal < 0.995 && warmth < 0.72) {
      const tipStrength = Math.sin(reveal * Math.PI);
      drawSeed(
        context,
        endX,
        endY,
        0.4 + lineWidth * 0.18,
        tipStrength * 0.72 * (1 - warmth),
      );
    }
  }

  const openingSeed = 1 - smoothstep(0.055, 0.15, phase);
  drawSeed(context, centerX, centerY, 1.1, openingSeed * 0.92);

  const handoff = smoothstep(0.83, 0.985, phase);
  if (handoff > 0) {
    const travel = smootherstep(handoff);
    const tipX = centerX + FROSTWORK.finalTip.x * scale * (1 - travel);
    const tipY = centerY + FROSTWORK.finalTip.y * scale * (1 - travel);
    drawSeed(context, tipX, tipY, 0.66 + travel * 0.44, handoff * 0.92);
  }

  context.globalAlpha = 1;
}

export default {
  id: "frostwork-growth",
  name: "Frostwork Growth",
  kind: "canvas",
  technique: "Precomputed fractal accretion",
  label: "Freezing",
  mount(container) {
    return createCanvasVisual(container, drawFrostwork, { maxDpr: 3 });
  },
};
