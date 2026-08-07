import { createShaderVisual } from "../core/webgl.js";

const LOOP_SECONDS = 5.2;
const RING_COUNT = 28;
const SIDE_COUNT = 15;
const POINT_COUNT = RING_COUNT * SIDE_COUNT;
const COURIER_INDEX = SIDE_COUNT + 4;
const TAU = Math.PI * 2;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function mix(from, to, amount) {
  return from + (to - from) * amount;
}

function smoother(edge0, edge1, value) {
  const amount = clamp01((value - edge0) / (edge1 - edge0));
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10);
}

function pulse(value, rise0, rise1, fall0, fall1) {
  return smoother(rise0, rise1, value) * (1 - smoother(fall0, fall1, value));
}

function spherePoint(ring, side) {
  const y = 1 - (2 * (side + 0.5)) / SIDE_COUNT;
  const latitudeRadius = Math.sqrt(Math.max(0, 1 - y * y));
  const azimuth = TAU * ((ring + 0.5 * (side % 2)) / RING_COUNT);
  return [
    Math.cos(azimuth) * latitudeRadius,
    y,
    Math.sin(azimuth) * latitudeRadius,
  ];
}

function knotPoint(ring, side) {
  // Spread the cross-section samples along the curve instead of stacking
  // visible 15-dot hoops. The irrational twist keeps the tiny silhouette a
  // continuous knotted tube rather than a flower made from repeated rings.
  const along = TAU * (ring + side / SIDE_COUNT) / RING_COUNT;
  const around = TAU * side / SIDE_COUNT + ring * 2.399963229728653;

  const centerX = (Math.sin(along) + 2 * Math.sin(along * 2)) * 0.218;
  const centerY = (Math.cos(along) - 2 * Math.cos(along * 2)) * 0.218;
  const centerZ = -Math.sin(along * 3) * 0.218;

  const tangentX = Math.cos(along) + 4 * Math.cos(along * 2);
  const tangentY = -Math.sin(along) + 4 * Math.sin(along * 2);
  const tangentZ = -3 * Math.cos(along * 3);
  const tangentLength = Math.hypot(tangentX, tangentY, tangentZ);
  const tx = tangentX / tangentLength;
  const ty = tangentY / tangentLength;
  const tz = tangentZ / tangentLength;

  const sideLength = Math.max(0.0001, Math.hypot(ty, tx));
  const sx = ty / sideLength;
  const sy = -tx / sideLength;
  const sz = 0;
  const bx = ty * sz - tz * sy;
  const by = tz * sx - tx * sz;
  const bz = tx * sy - ty * sx;
  const binormalLength = Math.max(0.0001, Math.hypot(bx, by, bz));
  const tubeRadius = 0.064;

  return [
    centerX + tubeRadius * (Math.cos(around) * sx + Math.sin(around) * bx / binormalLength),
    centerY + tubeRadius * (Math.cos(around) * sy + Math.sin(around) * by / binormalLength),
    centerZ + tubeRadius * (Math.cos(around) * sz + Math.sin(around) * bz / binormalLength),
  ];
}

function roundedCubePoint(sphere) {
  const largest = Math.max(Math.abs(sphere[0]), Math.abs(sphere[1]), Math.abs(sphere[2]));
  return [
    mix(sphere[0], sphere[0] / largest, 0.72) * 0.72,
    mix(sphere[1], sphere[1] / largest, 0.72) * 0.72,
    mix(sphere[2], sphere[2] / largest, 0.72) * 0.72,
  ];
}

const contactDirection = spherePoint(1, 4);

const fallbackCorrespondences = Array.from({ length: POINT_COUNT }, (_, index) => {
  const ring = Math.floor(index / SIDE_COUNT);
  const side = index % SIDE_COUNT;
  const sphere = spherePoint(ring, side);
  const knot = knotPoint(ring, side);
  const cube = roundedCubePoint(sphere);
  const contactDot =
    sphere[0] * contactDirection[0] +
    sphere[1] * contactDirection[1] +
    sphere[2] * contactDirection[2];
  const contactDistance = Math.sqrt(Math.max(0, (1 - contactDot) * 0.5));
  const knotDelay = ((ring - 1 + RING_COUNT) % RING_COUNT) / (RING_COUNT - 1);

  return {
    sphere,
    knot,
    cube,
    contactDot,
    contactDistance,
    knotDelay,
    exhaleDelay: 1 - contactDistance,
    along: TAU * (ring + side / SIDE_COUNT) / RING_COUNT,
    around: TAU * side / SIDE_COUNT + ring * 2.399963229728653,
    courier: index === COURIER_INDEX,
    x: 0,
    y: 0,
    z: 0,
    screenX: 0,
    screenY: 0,
    depth: 0,
    radius: 0,
    wave: 0,
  };
});

function resolveFallbackPoint(point, phase) {
  const contactEnvelope =
    smoother(0.025, 0.075, phase) * (1 - smoother(0.13, 0.205, phase));
  const arrival = 0.06 + 0.11 * point.contactDistance;
  const contactWave = pulse(
    phase,
    arrival - 0.025,
    arrival,
    arrival + 0.035,
    arrival + 0.09,
  );
  const dentInfluence = smoother(0.62, 1, point.contactDot) ** 2;

  let sphereX = point.sphere[0] * 0.72;
  let sphereY = point.sphere[1] * 0.72;
  let sphereZ = point.sphere[2] * 0.72;
  const dentScale = 1 - 0.255 * contactEnvelope * dentInfluence - 0.052 * contactWave;
  sphereX *= dentScale;
  sphereY *= dentScale;
  sphereZ *= dentScale;

  if (point.courier) {
    const press = smoother(0.018, 0.085, phase);
    const courierRadius = mix(0.86, 0.54, press);
    sphereX = contactDirection[0] * courierRadius;
    sphereY = contactDirection[1] * courierRadius;
    sphereZ = contactDirection[2] * courierRadius;
  }

  const returnCourierRadius = point.courier
    ? mix(0.72, 0.86, smoother(0.82, 0.95, phase))
    : 0.72;
  const returnSphereX = point.sphere[0] * returnCourierRadius;
  const returnSphereY = point.sphere[1] * returnCourierRadius;
  const returnSphereZ = point.sphere[2] * returnCourierRadius;

  const sphereToKnot = smoother(
    0.105 + 0.055 * point.contactDistance,
    0.205 + 0.055 * point.contactDistance,
    phase,
  );
  const knotToCube = smoother(
    0.34 + 0.06 * point.knotDelay,
    0.43 + 0.06 * point.knotDelay,
    phase,
  );
  const cubeToSphere = smoother(
    0.58 + 0.075 * point.exhaleDelay,
    0.715 + 0.075 * point.exhaleDelay,
    phase,
  );

  let x = mix(sphereX, point.knot[0], sphereToKnot);
  let y = mix(sphereY, point.knot[1], sphereToKnot);
  let z = mix(sphereZ, point.knot[2], sphereToKnot);

  const unwrapArc = Math.sin(Math.PI * sphereToKnot) * 0.095;
  x += (contactDirection[1] * point.sphere[2] - contactDirection[2] * point.sphere[1]) * unwrapArc;
  y += (contactDirection[2] * point.sphere[0] - contactDirection[0] * point.sphere[2]) * unwrapArc;
  z += (contactDirection[0] * point.sphere[1] - contactDirection[1] * point.sphere[0]) * unwrapArc;

  x = mix(x, point.cube[0], knotToCube);
  y = mix(y, point.cube[1], knotToCube);
  z = mix(z, point.cube[2], knotToCube);
  z += Math.sin(Math.PI * knotToCube) * Math.sin(point.along * 3 + point.around) * 0.052;

  x = mix(x, returnSphereX, cubeToSphere);
  y = mix(y, returnSphereY, cubeToSphere);
  z = mix(z, returnSphereZ, cubeToSphere);
  const length = Math.max(0.0001, Math.hypot(x, y, z));
  const exhale = Math.sin(Math.PI * cubeToSphere) * (0.045 + 0.03 * point.contactDistance);
  x += x / length * exhale;
  y += y / length * exhale;
  z += z / length * exhale;

  const yaw = 0.075 * Math.sin(TAU * phase) + 0.03 * Math.sin(TAU * phase * 2);
  const pitch = -0.09 + 0.05 * Math.cos(TAU * phase);
  const yawX = x * Math.cos(yaw) + z * Math.sin(yaw);
  const yawZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const pitchedY = y * Math.cos(pitch) - yawZ * Math.sin(pitch);
  const pitchedZ = y * Math.sin(pitch) + yawZ * Math.cos(pitch);

  point.x = yawX;
  point.y = pitchedY;
  point.z = pitchedZ;
  point.depth = clamp01(0.5 + pitchedZ * 0.66);
  point.wave = contactWave;
}

function drawFallback(context, time, _delta, width, height) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const size = Math.min(width, height);
  const centerX = width * 0.5;
  const centerY = height * 0.5;
  const scale = size * 0.5;

  for (const point of fallbackCorrespondences) {
    resolveFallbackPoint(point, phase);
    const perspective = 1 / (1 - 0.13 * point.z);
    point.screenX = centerX + point.x * scale * 1.02 * perspective;
    point.screenY = centerY - point.y * scale * 1.02 * perspective;
    point.radius = size * (0.0065 + 0.0086 * point.depth + 0.0024 * point.wave);
  }

  for (let pass = 0; pass < 2; pass += 1) {
    for (const point of fallbackCorrespondences) {
      if (point.courier || (point.depth >= 0.5 ? 1 : 0) !== pass) continue;
      const tone = Math.round(mix(158, 20, point.depth ** 0.78));
      const alpha = mix(0.27, 0.92, point.depth ** 0.86);
      const waveTone = Math.round(mix(tone, 18, point.wave * 0.58));

      context.beginPath();
      context.arc(point.screenX, point.screenY, point.radius, 0, TAU);
      context.fillStyle = `rgba(${waveTone}, ${waveTone}, ${waveTone}, ${alpha})`;
      context.fill();
    }
  }

  const courier = fallbackCorrespondences[COURIER_INDEX];
  const courierRadius = Math.max(size * 0.019, courier.radius * 1.2);
  context.beginPath();
  context.arc(courier.screenX, courier.screenY, courierRadius * 1.55, 0, TAU);
  context.fillStyle = "rgba(25, 25, 25, 0.38)";
  context.fill();
  context.beginPath();
  context.arc(courier.screenX, courier.screenY, courierRadius, 0, TAU);
  context.fillStyle = "rgba(250, 250, 247, 0.98)";
  context.fill();
}

const fragment = `
const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;
const float LOOP = 5.2;
const float RINGS = 28.0;
const float SIDES = 15.0;
const int POINTS = 420;
const float COURIER = 19.0;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float smoother(float edge0, float edge1, float value) {
  float amount = saturate((value - edge0) / (edge1 - edge0));
  return amount * amount * amount * (amount * (amount * 6.0 - 15.0) + 10.0);
}

float pulse(float value, float rise0, float rise1, float fall0, float fall1) {
  return smoother(rise0, rise1, value) * (1.0 - smoother(fall0, fall1, value));
}

mat2 rotate2d(float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine);
}

vec3 spherePoint(float ring, float side) {
  float y = 1.0 - 2.0 * (side + 0.5) / SIDES;
  float latitudeRadius = sqrt(max(0.0, 1.0 - y * y));
  float azimuth = TAU * (ring + 0.5 * mod(side, 2.0)) / RINGS;
  return vec3(cos(azimuth) * latitudeRadius, y, sin(azimuth) * latitudeRadius);
}

vec3 knotPoint(float ring, float side) {
  float along = TAU * (ring + side / SIDES) / RINGS;
  float around = TAU * side / SIDES + ring * 2.399963229728653;
  vec3 center = vec3(
    sin(along) + 2.0 * sin(along * 2.0),
    cos(along) - 2.0 * cos(along * 2.0),
    -sin(along * 3.0)
  ) * 0.218;
  vec3 tangent = normalize(vec3(
    cos(along) + 4.0 * cos(along * 2.0),
    -sin(along) + 4.0 * sin(along * 2.0),
    -3.0 * cos(along * 3.0)
  ));
  vec3 sideAxis = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
  vec3 binormal = normalize(cross(sideAxis, tangent));
  return center + 0.064 * (cos(around) * sideAxis + sin(around) * binormal);
}

vec3 roundedCubePoint(vec3 sphere) {
  float largest = max(abs(sphere.x), max(abs(sphere.y), abs(sphere.z)));
  return mix(sphere, sphere / largest, 0.72) * 0.72;
}

vec4 shade(vec2 uv, float timeSeconds, float seed) {
  float phase = fract(timeSeconds / LOOP);
  vec3 contact = spherePoint(1.0, 4.0);
  float contactEnvelope = smoother(0.025, 0.075, phase) *
    (1.0 - smoother(0.13, 0.205, phase));
  float yaw = 0.075 * sin(TAU * phase) + 0.03 * sin(TAU * phase * 2.0);
  float pitch = -0.09 + 0.05 * cos(TAU * phase + seed * 0.0);
  vec3 chosenColor = vec3(0.0);
  float chosenAlpha = 0.0;
  float chosenScore = -1.0;

  for (int index = 0; index < POINTS; index += 1) {
    float order = float(index);
    float ring = floor(order / SIDES);
    float side = order - ring * SIDES;
    float isCourier = 1.0 - step(0.5, abs(order - COURIER));
    vec3 sphere = spherePoint(ring, side);
    vec3 knot = knotPoint(ring, side);
    vec3 cube = roundedCubePoint(sphere);
    float contactDot = dot(sphere, contact);
    float contactDistance = sqrt(max(0.0, (1.0 - contactDot) * 0.5));
    float knotDelay = mod(ring - 1.0 + RINGS, RINGS) / (RINGS - 1.0);
    float exhaleDelay = 1.0 - contactDistance;

    float arrival = 0.06 + 0.11 * contactDistance;
    float contactWave = pulse(
      phase,
      arrival - 0.025,
      arrival,
      arrival + 0.035,
      arrival + 0.09
    );
    float dentInfluence = pow(smoother(0.62, 1.0, contactDot), 2.0);
    float dentScale = 1.0 - 0.255 * contactEnvelope * dentInfluence - 0.052 * contactWave;
    vec3 dentedSphere = sphere * 0.72 * dentScale;

    if (isCourier > 0.5) {
      float press = smoother(0.018, 0.085, phase);
      dentedSphere = contact * mix(0.86, 0.54, press);
    }

    float returnCourierRadius = mix(0.72, 0.86, smoother(0.82, 0.95, phase));
    vec3 returnSphere = sphere * mix(0.72, returnCourierRadius, isCourier);
    float sphereToKnot = smoother(
      0.105 + 0.055 * contactDistance,
      0.205 + 0.055 * contactDistance,
      phase
    );
    float knotToCube = smoother(
      0.34 + 0.06 * knotDelay,
      0.43 + 0.06 * knotDelay,
      phase
    );
    float cubeToSphere = smoother(
      0.58 + 0.075 * exhaleDelay,
      0.715 + 0.075 * exhaleDelay,
      phase
    );

    vec3 point = mix(dentedSphere, knot, sphereToKnot);
    point += cross(contact, sphere) * sin(PI * sphereToKnot) * 0.095;
    point = mix(point, cube, knotToCube);
    float along = TAU * (ring + side / SIDES) / RINGS;
    float around = TAU * side / SIDES + ring * 2.399963229728653;
    point.z += sin(PI * knotToCube) * sin(along * 3.0 + around) * 0.052;
    point = mix(point, returnSphere, cubeToSphere);
    point += point / max(length(point), 0.0001) * sin(PI * cubeToSphere) *
      (0.045 + 0.03 * contactDistance);

    point.xz = rotate2d(yaw) * point.xz;
    point.yz = rotate2d(pitch) * point.yz;
    float depth = saturate(0.5 + point.z * 0.66);
    float perspective = 1.0 / (1.0 - 0.13 * point.z);
    vec2 center = point.xy * 1.02 * perspective;
    float beadRadius = mix(0.013, 0.0302, pow(depth, 0.84)) + 0.0048 * contactWave;
    float distanceToBead = length(uv - center);
    float antialias = max(fwidth(distanceToBead), 0.0022);

    float coverage = smoothstep(
      beadRadius + antialias,
      beadRadius - antialias,
      distanceToBead
    );
    vec3 color = mix(vec3(0.62), vec3(0.06), pow(depth, 0.76));
    color = mix(color, vec3(0.055), contactWave * 0.58);
    float alpha = coverage * mix(0.27, 0.93, pow(depth, 0.86));

    if (isCourier > 0.5) {
      float courierRadius = max(0.038, beadRadius * 1.2);
      float rim = smoothstep(
        courierRadius * 1.55 + antialias,
        courierRadius * 1.55 - antialias,
        distanceToBead
      );
      float core = smoothstep(
        courierRadius + antialias,
        courierRadius - antialias,
        distanceToBead
      );
      coverage = rim;
      color = mix(vec3(0.095), vec3(0.98, 0.98, 0.965), core);
      alpha = max(rim * 0.43, core * 0.98);
    }

    float score = alpha + isCourier * 0.72 + depth * 0.012;
    if (coverage > 0.001 && score > chosenScore) {
      chosenColor = color;
      chosenAlpha = alpha;
      chosenScore = score;
    }
  }

  return vec4(chosenColor, chosenAlpha);
}
`;

export default {
  id: "topology-courier",
  name: "Topology Courier",
  kind: "webgl",
  technique: "WebGL2 wave-delayed 420-point correspondence",
  label: "Mapping",
  phaseOffset: 907,
  mount(container) {
    return createShaderVisual(container, {
      name: "Topology Courier",
      seed: 7,
      fragment,
      fallback: drawFallback,
      maxDpr: 3,
    });
  },
};
