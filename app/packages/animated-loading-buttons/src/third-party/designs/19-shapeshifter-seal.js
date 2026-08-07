const LOOP_SECONDS = 4.2;
const STATE_SECONDS = LOOP_SECONDS / 4;
const HOLD_SECONDS = 0.18;
const MORPH_START = 0.3;
const FOLLOW_SECONDS = 0.07;
const ECHO_LAG_SECONDS = 0.055;
const POINT_COUNT = 48;
const CENTER = 15;
const TAU = Math.PI * 2;
const SPLINE_TENSION = 0.7 / 6;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount ** 3 * (amount * (amount * 6 - 15) + 10);
}

function pulse(value, riseStart, riseEnd, fallStart, fallEnd) {
  return smootherstep(riseStart, riseEnd, value) *
    (1 - smootherstep(fallStart, fallEnd, value));
}

function mix(start, end, amount) {
  return start + (end - start) * amount;
}

function wrappedTime(time) {
  const safeTime = Number.isFinite(time) ? time : 0;
  return ((safeTime % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS;
}

function signedPower(value, exponent) {
  return Math.sign(value) * Math.abs(value) ** exponent;
}

function regularPolygonRadius(angle, sides, vertexAngle, circumradius) {
  const sector = TAU / sides;
  const halfSector = sector / 2;
  const local = ((angle - vertexAngle + halfSector) % sector + sector) % sector -
    halfSector;
  return circumradius * Math.cos(halfSector) /
    Math.cos(halfSector - Math.abs(local));
}

function createShape(pointAtAngle) {
  const points = new Float32Array(POINT_COUNT * 2);

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const angle = -Math.PI / 2 + index / POINT_COUNT * TAU;
    const point = pointAtAngle(angle);
    points[index * 2] = point[0];
    points[index * 2 + 1] = point[1];
  }

  return points;
}

const SHAPES = [
  createShape((angle) => [
    CENTER + Math.cos(angle) * 8.15,
    CENTER + Math.sin(angle) * 8.15,
  ]),
  createShape((angle) => {
    const polygonRadius = regularPolygonRadius(angle, 3, -Math.PI / 2, 10);
    const radius = mix(8.15, polygonRadius, 0.68);
    return [
      CENTER + Math.cos(angle) * radius * 0.99,
      CENTER + Math.sin(angle) * radius * 1.08,
    ];
  }),
  createShape((angle) => [
    CENTER + signedPower(Math.cos(angle), 0.56) * 7.95,
    CENTER + signedPower(Math.sin(angle), 0.56) * 7.95,
  ]),
  createShape((angle) => [
    CENTER + signedPower(Math.cos(angle), 2.65) * 9.4,
    CENTER + signedPower(Math.sin(angle), 2.65) * 9.4,
  ]),
];

function createCornerField(cornerCount, angleOffset) {
  const field = new Float32Array(POINT_COUNT);

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const angle = -Math.PI / 2 + index / POINT_COUNT * TAU;
    const cornerWave = 0.5 + 0.5 * Math.cos(cornerCount * (angle + angleOffset));
    field[index] = cornerWave ** 3;
  }

  return field;
}

const CORNER_FIELDS = [
  createCornerField(3, Math.PI / 2),
  createCornerField(4, Math.PI / 4),
  createCornerField(4, 0),
];

const FOLLOW_DIRECTIONS = [1, -1, 1];
const FOLLOW_LAGS = FOLLOW_DIRECTIONS.map((_, segment) => {
  const lags = new Float32Array(POINT_COUNT);

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const perimeter = ((index / POINT_COUNT + segment * 0.19) % 1 + 1) % 1;
    lags[index] = perimeter * FOLLOW_SECONDS;
  }

  return lags;
});

function writeMorphState(segment, localTime, output) {
  const source = SHAPES[segment];
  const target = SHAPES[segment + 1];
  const cornerField = CORNER_FIELDS[segment];
  const direction = FOLLOW_DIRECTIONS[segment];
  const followLags = FOLLOW_LAGS[segment];
  const anticipation = pulse(
    localTime,
    HOLD_SECONDS,
    MORPH_START,
    MORPH_START,
    0.47,
  );

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const offset = index * 2;
    const sourceX = source[offset];
    const sourceY = source[offset + 1];
    const targetX = target[offset];
    const targetY = target[offset + 1];
    const corner = cornerField[index];
    const radialSqueeze = anticipation * (0.055 + corner * 0.105);
    const sourceVectorX = sourceX - CENTER;
    const sourceVectorY = sourceY - CENTER;
    const anticipationTwist = anticipation * direction * (0.024 + corner * 0.036);
    const anticipatedX = CENTER + sourceVectorX * (1 - radialSqueeze) +
      sourceVectorY * anticipationTwist;
    const anticipatedY = CENTER + sourceVectorY * (1 - radialSqueeze) -
      sourceVectorX * anticipationTwist;
    const lag = followLags[index];
    const progress = smootherstep(MORPH_START + lag, STATE_SECONDS, localTime);
    const followThrough = pulse(
      localTime,
      0.71 + lag,
      0.84 + lag,
      0.91 + lag * 0.25,
      STATE_SECONDS,
    );
    const amount = progress + followThrough * corner * 0.042;
    const targetVectorX = targetX - CENTER;
    const targetVectorY = targetY - CENTER;
    const tangentOffset = followThrough * corner * direction * 0.16;

    output[offset] = mix(anticipatedX, targetX, amount) -
      targetVectorY * tangentOffset / 9.4;
    output[offset + 1] = mix(anticipatedY, targetY, amount) +
      targetVectorX * tangentOffset / 9.4;
  }
}

function writeCollapseState(localTime, output) {
  const spark = SHAPES[3];
  const circle = SHAPES[0];
  let shapeMix = 0;
  let scale = 1;
  let axisBias = 0;

  if (localTime >= HOLD_SECONDS && localTime < MORPH_START) {
    scale = mix(1, 0.86, smootherstep(HOLD_SECONDS, MORPH_START, localTime));
  } else if (localTime >= MORPH_START && localTime < 0.57) {
    shapeMix = smootherstep(0.34, 0.57, localTime);
    scale = mix(0.86, 0.09, smootherstep(MORPH_START, 0.57, localTime));
  } else if (localTime >= 0.57) {
    shapeMix = 1;
    const inflation = smootherstep(0.57, 0.91, localTime);
    const settle = pulse(localTime, 0.76, 0.9, 0.91, STATE_SECONDS);
    scale = mix(0.09, 1, inflation) + settle * 0.035;
    axisBias = pulse(localTime, 0.57, 0.74, 0.86, STATE_SECONDS) * 0.032;
  }

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const offset = index * 2;
    const x = mix(spark[offset], circle[offset], shapeMix);
    const y = mix(spark[offset + 1], circle[offset + 1], shapeMix);
    output[offset] = CENTER + (x - CENTER) * scale * (1 + axisBias);
    output[offset + 1] = CENTER + (y - CENTER) * scale * (1 - axisBias);
  }
}

function writeState(time, output) {
  const loopTime = wrappedTime(time);
  const segment = Math.min(3, Math.floor(loopTime / STATE_SECONDS));
  const localTime = loopTime - segment * STATE_SECONDS;

  if (segment === 3) {
    writeCollapseState(localTime, output);
  } else {
    writeMorphState(segment, localTime, output);
  }
}

function echoOpacityAt(time) {
  const loopTime = wrappedTime(time);
  const segment = Math.min(3, Math.floor(loopTime / STATE_SECONDS));
  const localTime = loopTime - segment * STATE_SECONDS;

  if (segment === 3) {
    const moving = pulse(localTime, 0.16, 0.29, 0.92, STATE_SECONDS);
    const furthestSeparation = pulse(localTime, 0.37, 0.5, 0.59, 0.73);
    return 0.27 + moving * 0.1 - furthestSeparation * 0.11;
  }

  return 0.27 + pulse(
    localTime,
    HOLD_SECONDS,
    MORPH_START,
    0.92,
    STATE_SECONDS,
  ) * 0.11;
}

function fixed(value) {
  return Math.abs(value) < 0.0005 ? "0" : value.toFixed(3);
}

function closedSpline(points) {
  let path = `M ${fixed(points[0])} ${fixed(points[1])}`;

  for (let index = 0; index < POINT_COUNT; index += 1) {
    const beforeIndex = (index - 1 + POINT_COUNT) % POINT_COUNT * 2;
    const currentIndex = index * 2;
    const nextIndex = (index + 1) % POINT_COUNT * 2;
    const afterIndex = (index + 2) % POINT_COUNT * 2;
    const controlAX = points[currentIndex] +
      (points[nextIndex] - points[beforeIndex]) * SPLINE_TENSION;
    const controlAY = points[currentIndex + 1] +
      (points[nextIndex + 1] - points[beforeIndex + 1]) * SPLINE_TENSION;
    const controlBX = points[nextIndex] -
      (points[afterIndex] - points[currentIndex]) * SPLINE_TENSION;
    const controlBY = points[nextIndex + 1] -
      (points[afterIndex + 1] - points[currentIndex + 1]) * SPLINE_TENSION;

    path += ` C ${fixed(controlAX)} ${fixed(controlAY)} ` +
      `${fixed(controlBX)} ${fixed(controlBY)} ` +
      `${fixed(points[nextIndex])} ${fixed(points[nextIndex + 1])}`;
  }

  return `${path} Z`;
}

const styles = /* css */ `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    contain: strict;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    shape-rendering: geometricPrecision;
  }

  .echo {
    fill: none;
    stroke: rgb(161 162 159);
    stroke-width: 0.66;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }

  .seal {
    fill: rgb(31 32 32);
    fill-opacity: 0.91;
  }
`;

const markup = /* html */ `
  <svg viewBox="0 0 30 30" role="presentation" aria-hidden="true" focusable="false">
    <path class="echo" />
    <path class="seal" />
  </svg>
`;

export default {
  id: "shapeshifter-seal",
  name: "Shapeshifter Seal",
  kind: "svg",
  technique: "Normalized four-emblem path interpolation",
  label: "Morphing",
  phaseOffset: 1901,
  mount(container) {
    const documentRef = container.ownerDocument;
    const host = documentRef.createElement("span");
    const shadowRoot = host.attachShadow({ mode: "closed" });
    const style = documentRef.createElement("style");
    const shell = documentRef.createElement("span");

    host.className = "visual-dom";
    style.textContent = styles;
    shell.innerHTML = markup;

    const svg = shell.querySelector("svg");
    const echo = svg.querySelector(".echo");
    const seal = svg.querySelector(".seal");
    const sealPoints = new Float32Array(POINT_COUNT * 2);
    const echoPoints = new Float32Array(POINT_COUNT * 2);
    let lastTime = Number.NaN;
    let destroyed = false;

    shadowRoot.append(style, svg);
    container.replaceChildren(host);

    function render(time, _delta) {
      if (destroyed) return;
      const safeTime = Number.isFinite(time) ? time : 0;
      if (safeTime === lastTime) return;
      lastTime = safeTime;

      writeState(safeTime, sealPoints);
      writeState(safeTime - ECHO_LAG_SECONDS, echoPoints);
      seal.setAttribute("d", closedSpline(sealPoints));
      echo.setAttribute("d", closedSpline(echoPoints));
      echo.setAttribute("stroke-opacity", fixed(echoOpacityAt(safeTime)));
    }

    render(0, 0);

    return {
      render,
      resize(width, height, _devicePixelRatio) {
        if (destroyed) return;
        const safeWidth = Number.isFinite(width) ? width : 30;
        const safeHeight = Number.isFinite(height) ? height : 30;
        const size = Math.max(1, Math.min(safeWidth, safeHeight));
        host.style.width = `${size}px`;
        host.style.height = `${size}px`;
      },
      reset() {
        if (destroyed) return;
        lastTime = Number.NaN;
        render(0, 0);
      },
      destroy() {
        if (destroyed) return;
        destroyed = true;
        lastTime = Number.NaN;
        host.remove();
      },
    };
  },
};
