const LOOP_SECONDS = 3;
const BASE_RADIUS = 4.35;

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

function mixPoint(start, end, amount) {
  return [mix(start[0], end[0], amount), mix(start[1], end[1], amount)];
}

function cubicPoint(start, controlA, controlB, end, amount) {
  const inverse = 1 - amount;
  return [
    inverse ** 3 * start[0] + 3 * inverse ** 2 * amount * controlA[0] +
      3 * inverse * amount ** 2 * controlB[0] + amount ** 3 * end[0],
    inverse ** 3 * start[1] + 3 * inverse ** 2 * amount * controlA[1] +
      3 * inverse * amount ** 2 * controlB[1] + amount ** 3 * end[1],
  ];
}

function cubicTangent(start, controlA, controlB, end, amount) {
  const inverse = 1 - amount;
  return [
    3 * inverse ** 2 * (controlA[0] - start[0]) +
      6 * inverse * amount * (controlB[0] - controlA[0]) +
      3 * amount ** 2 * (end[0] - controlB[0]),
    3 * inverse ** 2 * (controlA[1] - start[1]) +
      6 * inverse * amount * (controlB[1] - controlA[1]) +
      3 * amount ** 2 * (end[1] - controlB[1]),
  ];
}

function stateAt(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const outbound = phase < 0.5;
  const local = (phase % 0.5) * 2;
  const sourceCenter = outbound ? [5.4, 15] : [24.6, 15];
  const destinationCenter = outbound ? [24.6, 15] : [5.4, 15];
  const start = outbound ? [8.25, 11.8] : [21.75, 18.2];
  const controlA = outbound ? [10.5, 9.25] : [19.5, 20.75];
  const controlB = outbound ? [19.5, 9.25] : [10.5, 20.75];
  const end = outbound ? [21.75, 11.8] : [8.25, 18.2];
  const sourceInner = mixPoint(sourceCenter, start, 0.47);
  const destinationInner = mixPoint(destinationCenter, end, 0.47);
  const launch = smootherstep(0.02, 0.24, local);
  const flight = smootherstep(0.2, 0.77, local);
  const absorb = smootherstep(0.75, 0.96, local);
  const detach = pulse(local, 0.1, 0.2, 0.27, 0.38);
  const contact = pulse(local, 0.68, 0.77, 0.89, 0.99);
  const sourceReach = pulse(local, 0.01, 0.13, 0.25, 0.38);
  const destinationReach = pulse(local, 0.62, 0.75, 0.88, 0.995);
  const curvePoint = cubicPoint(start, controlA, controlB, end, flight);
  const tangent = cubicTangent(start, controlA, controlB, end, flight);
  let courier = mixPoint(sourceInner, curvePoint, launch);
  courier = mixPoint(courier, destinationInner, absorb);

  const sourceNeck = mixPoint(sourceInner, start, sourceReach);
  const destinationNeck = mixPoint(destinationInner, end, destinationReach);
  const sourceRecoil = pulse(local, 0.23, 0.29, 0.35, 0.47);
  const destinationRecoil = pulse(local, 0.77, 0.84, 0.91, 0.995);
  const upperSign = outbound ? 1 : -1;
  const left = { x: 5.4, y: 15, r: BASE_RADIUS };
  const right = { x: 24.6, y: 15, r: BASE_RADIUS };
  const source = outbound ? left : right;
  const destination = outbound ? right : left;
  const outwardSign = outbound ? -1 : 1;

  source.x += outwardSign * 0.34 * sourceRecoil;
  source.y += upperSign * 0.13 * sourceRecoil;
  source.r -= detach * 0.1;
  destination.x -= outwardSign * 0.3 * destinationRecoil;
  destination.y += upperSign * 0.12 * destinationRecoil;
  destination.r += contact * 0.14;

  return {
    left,
    right,
    courier,
    courierRadius: mix(0.22, 1.48, launch) * mix(1, 0.15, absorb),
    courierAngle: Math.atan2(tangent[1], tangent[0]) * 180 / Math.PI,
    courierStretch: detach * 0.46 + contact * 0.28,
    leftNeck: outbound ? sourceNeck : destinationNeck,
    rightNeck: outbound ? destinationNeck : sourceNeck,
    leftNeckRadius: outbound
      ? mix(0.62, 1.62, sourceReach)
      : mix(0.62, 1.48, destinationReach),
    rightNeckRadius: outbound
      ? mix(0.62, 1.48, destinationReach)
      : mix(0.62, 1.62, sourceReach),
    start,
    end,
    startGlint: detach,
    endGlint: contact,
    glintAngle: Math.atan2(tangent[1], tangent[0]) * 180 / Math.PI,
  };
}

const styles = /* css */ `
  :host { display: block; width: 100%; height: 100%; contain: strict; }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
    shape-rendering: geometricPrecision;
  }
  .body circle { fill: rgb(37 39 41); }
  .glint {
    fill: none;
    stroke: rgb(250 249 244);
    stroke-width: 0.72;
    stroke-linecap: round;
  }
`;

const markup = /* html */ `
  <svg viewBox="0 0 30 30" role="presentation" aria-hidden="true">
    <defs>
      <filter id="mercury-goo" filterUnits="userSpaceOnUse"
        x="-2" y="-2" width="34" height="34" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
        <feColorMatrix in="blur" type="matrix" result="goo"
          values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -6.5" />
      </filter>
    </defs>
    <g class="body" filter="url(#mercury-goo)">
      <circle class="left" /><circle class="right" />
      <circle class="courier" cx="0" cy="0" />
      <circle class="left-neck" /><circle class="right-neck" />
    </g>
    <path class="glint start-glint" d="M -0.62 0 Q 0 -0.42 0.62 0" />
    <path class="glint end-glint" d="M -0.62 0 Q 0 -0.42 0.62 0" />
  </svg>
`;

function setCircle(circle, state) {
  circle.setAttribute("cx", String(state.x));
  circle.setAttribute("cy", String(state.y));
  circle.setAttribute("r", String(state.r));
}

export default {
  id: "mercury-relay",
  name: "Mercury Relay",
  kind: "svg",
  technique: "Five-circle alpha-threshold relay",
  label: "Relaying",
  phaseOffset: 1601,
  mount(container) {
    const host = document.createElement("span");
    host.className = "visual-dom";
    const shadowRoot = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    const shell = document.createElement("span");

    style.textContent = styles;
    shell.innerHTML = markup;
    const svg = shell.querySelector("svg");
    const body = svg.querySelector(".body");
    const circles = {
      left: svg.querySelector(".left"),
      right: svg.querySelector(".right"),
      courier: svg.querySelector(".courier"),
      leftNeck: svg.querySelector(".left-neck"),
      rightNeck: svg.querySelector(".right-neck"),
    };
    const startGlint = svg.querySelector(".start-glint");
    const endGlint = svg.querySelector(".end-glint");
    const filterSupported = "SVGFEGaussianBlurElement" in window &&
      "SVGFEColorMatrixElement" in window;
    if (!filterSupported) body.removeAttribute("filter");
    shadowRoot.append(style, svg);
    container.replaceChildren(host);

    function render(time) {
      const state = stateAt(time);
      setCircle(circles.left, state.left);
      setCircle(circles.right, state.right);
      setCircle(circles.leftNeck, {
        x: state.leftNeck[0], y: state.leftNeck[1], r: state.leftNeckRadius,
      });
      setCircle(circles.rightNeck, {
        x: state.rightNeck[0], y: state.rightNeck[1], r: state.rightNeckRadius,
      });
      circles.courier.setAttribute("r", String(state.courierRadius));
      const stretch = state.courierStretch;
      circles.courier.setAttribute("transform",
        `translate(${state.courier[0]} ${state.courier[1]}) ` +
        `rotate(${state.courierAngle}) scale(${1 + stretch} ${1 - stretch * 0.28})`);
      startGlint.setAttribute("opacity", String(state.startGlint));
      startGlint.setAttribute("transform",
        `translate(${state.start[0]} ${state.start[1]}) rotate(${state.glintAngle})`);
      endGlint.setAttribute("opacity", String(state.endGlint));
      endGlint.setAttribute("transform",
        `translate(${state.end[0]} ${state.end[1]}) rotate(${state.glintAngle + 180})`);
    }

    render(0);
    return {
      render,
      resize(width, height) {
        const size = Math.max(1, Math.min(width, height));
        host.style.width = `${size}px`;
        host.style.height = `${size}px`;
      },
      reset() { render(0); },
      destroy() { host.remove(); },
    };
  },
};
