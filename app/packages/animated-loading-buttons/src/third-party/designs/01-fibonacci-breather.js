import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 3.6;
const POINT_COUNT = 96;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const TAU = Math.PI * 2;

const fallbackPoints = Array.from({ length: POINT_COUNT }, (_, index) => {
  const y = 1 - (2 * (index + 0.5)) / POINT_COUNT;
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const azimuth = index * GOLDEN_ANGLE + 0.31;
  return [Math.cos(azimuth) * radius, y, Math.sin(azimuth) * radius];
});

function smoothstep(edge0, edge1, value) {
  const amount = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return amount * amount * (3 - 2 * amount);
}

function rotatePoint([x, y, z], phase) {
  const yaw = TAU * phase;
  const nod = 0.13 * Math.sin(TAU * phase);
  const lean = 0.075 * Math.cos(TAU * phase);

  const yawX = x * Math.cos(yaw) + z * Math.sin(yaw);
  const yawZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const nodY = y * Math.cos(nod) - yawZ * Math.sin(nod);
  const nodZ = y * Math.sin(nod) + yawZ * Math.cos(nod);

  return [
    yawX * Math.cos(lean) - nodY * Math.sin(lean),
    yawX * Math.sin(lean) + nodY * Math.cos(lean),
    nodZ,
  ];
}

function deformationAt(y, phase) {
  // Twenty discrete latitude bands make the crest hand-off every ~80 ms.
  const latitude = (1 - y) * 0.5;
  const band = Math.floor(Math.min(0.9999, latitude) * 20) / 19;
  const arrival = 0.165 + band * 0.42;
  const squeeze =
    smoothstep(arrival - 0.05, arrival + 0.024, phase) *
    (1 - smoothstep(arrival + 0.105, arrival + 0.17, phase));
  const rebound =
    smoothstep(arrival + 0.095, arrival + 0.165, phase) *
    (1 - smoothstep(arrival + 0.2, arrival + 0.285, phase));
  const farPole = smoothstep(0.73, 1, latitude);

  return {
    latitude,
    squeeze,
    rebound,
    scale: 1 - 0.255 * squeeze + (0.074 + 0.058 * farPole) * rebound,
  };
}

function drawFallback(context, time, _delta, width, height) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const size = Math.min(width, height);
  const globeRadius = size * 0.39;
  const cx = width * 0.5;
  const cy = height * 0.5;

  // Two depth passes preserve the rear shell without letting it muddy the face.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < fallbackPoints.length; index += 1) {
      const source = fallbackPoints[index];
      const motion = deformationAt(source[1], phase);
      const radial = motion.scale;
      const pinched = 1 - 0.07 * motion.squeeze;
      const point = rotatePoint(
        [source[0] * radial * pinched, source[1] * radial, source[2] * radial * pinched],
        phase,
      );
      const front = point[2] >= 0;
      if ((pass === 0) === front) continue;

      const depth = Math.min(1, Math.max(0, point[2] * 0.5 + 0.5));
      const perspective = 1 / (1 - 0.12 * point[2]);
      const crest = motion.squeeze * smoothstep(0.86, 0.96, depth);
      const pearl = crest ** 3;
      const tone = Math.round(122 + (25 - 122) * depth);
      const alpha = 0.45 + 0.49 * depth;
      const radius = size * (0.0093 + 0.0087 * depth + 0.0016 * motion.rebound);

      context.beginPath();
      context.arc(
        cx + point[0] * globeRadius * perspective,
        cy - point[1] * globeRadius * perspective,
        radius,
        0,
        TAU,
      );
      context.fillStyle = pearl > 0.28
        ? `rgba(250, 250, 247, ${0.72 + pearl * 0.22})`
        : `rgba(${tone}, ${tone}, ${tone}, ${alpha})`;
      context.fill();
    }
  }
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 3.6;
const int BEADS = 96;
const float GOLDEN_ANGLE = 2.399963229728653;

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

float pulse(float value, float rise0, float rise1, float fall0, float fall1) {
  return smoothstep(rise0, rise1, value) * (1.0 - smoothstep(fall0, fall1, value));
}

vec4 shade(vec2 uv, float time, float seed) {
  float phase = fract(time / LOOP);
  float yaw = TAU * phase;
  float nod = 0.13 * sin(TAU * phase);
  float lean = 0.075 * cos(TAU * phase);
  vec3 chosenColor = vec3(0.098);
  float chosenAlpha = 0.0;

  for (int index = 0; index < BEADS; index += 1) {
    float order = float(index);
    float y = 1.0 - 2.0 * (order + 0.5) / float(BEADS);
    float ringRadius = sqrt(max(0.0, 1.0 - y * y));
    float azimuth = order * GOLDEN_ANGLE + seed * 0.31;
    vec3 point = vec3(cos(azimuth) * ringRadius, y, sin(azimuth) * ringRadius);

    // The north-to-south crest advances one of twenty bands every ~80 ms.
    float latitude = (1.0 - y) * 0.5;
    float band = floor(min(0.9999, latitude) * 20.0) / 19.0;
    float arrival = 0.165 + band * 0.42;
    float squeeze = pulse(phase, arrival - 0.05, arrival + 0.024, arrival + 0.105, arrival + 0.17);
    float rebound = pulse(phase, arrival + 0.095, arrival + 0.165, arrival + 0.20, arrival + 0.285);
    float farPole = smoothstep(0.73, 1.0, latitude);
    float radial = 1.0 - 0.255 * squeeze + (0.074 + 0.058 * farPole) * rebound;

    point *= radial;
    point.xz *= 1.0 - 0.07 * squeeze;

    point.xz = rotate2d(yaw) * point.xz;
    point.yz = rotate2d(nod) * point.yz;
    point.xy = rotate2d(lean) * point.xy;

    float depth = clamp(point.z * 0.5 + 0.5, 0.0, 1.0);
    float perspective = 1.0 / (1.0 - 0.12 * point.z);
    vec2 center = point.xy * 0.78 * perspective;
    float beadRadius = 0.0186 + 0.0158 * pow(depth, 1.2) + 0.0032 * rebound;
    float distanceToBead = length(uv - center);
    float antialias = max(fwidth(distanceToBead), 0.003);
    float coverage = smoothstep(beadRadius + antialias, beadRadius - antialias, distanceToBead);

    float alpha = coverage * mix(0.45, 0.95, pow(depth, 0.82));
    vec3 beadColor = mix(vec3(0.48), vec3(0.098), pow(depth, 0.78));

    // A single pale front bead appears to carry the compression crest.
    float crest = squeeze * smoothstep(0.86, 0.96, depth);
    float pearl = crest * crest * crest;
    beadColor = mix(beadColor, vec3(0.98, 0.98, 0.965), pearl);
    alpha = mix(alpha, coverage * 0.95, pearl);

    if (alpha > chosenAlpha) {
      chosenColor = beadColor;
      chosenAlpha = alpha;
    }
  }

  return vec4(chosenColor, chosenAlpha);
}
`;

export default {
  id: "fibonacci-breather",
  name: "Fibonacci Breather",
  kind: "webgl",
  technique: "Analytic WebGL2 Fibonacci micro-beads",
  label: "Gathering",
  phaseOffset: 131,
  mount(container) {
    return createShaderVisual(container, {
      name: "Fibonacci Breather",
      seed: 1,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
