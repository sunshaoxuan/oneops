const LOOP_SECONDS = 2.8;
const TAU = Math.PI * 2;

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smootherstep(start, end, value) {
  const amount = clamp01((value - start) / (end - start));
  return amount ** 3 * (amount * (amount * 6 - 15) + 10);
}

function mix(start, end, amount) {
  return start + (end - start) * amount;
}

function stateAt(time) {
  const phase = ((time / LOOP_SECONDS) % 1 + 1) % 1;
  const bloom = smootherstep(0.015, 0.48, phase);
  const clear = smootherstep(0.895, 0.995, phase);
  const shadowArrival = smootherstep(0.48, 0.84, phase);
  const shadowRetreat = smootherstep(0.9, 0.99, phase);
  const coronaPresence = bloom * (1 - clear);
  const shadowPresence = shadowArrival * (1 - shadowRetreat);
  const haloSpan = mix(14, 280, coronaPresence);
  const shadowSpan = mix(14, 270, shadowArrival);
  // A restrained periodic drift slows to zero near the shadow conjunction at
  // three-quarter phase. Span and occlusion remain the dominant motion.
  const angle = -48 + Math.sin(TAU * phase) * 46;

  return {
    angle,
    haloInner: mix(78, 62, coronaPresence),
    haloScale: mix(0.975, 1, coronaPresence),
    haloSpan,
    shadowAngle: angle + mix(-54, -10, shadowArrival),
    shadowOpacity: shadowPresence,
    shadowScale: mix(0.7, 1, shadowPresence),
    shadowSpan,
  };
}

const styles = /* css */ `
  :host {
    display: block;
    width: 100%;
    height: 100%;
    contain: strict;
  }

  .eclipse {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    isolation: isolate;
  }

  .corona,
  .umbra,
  .core {
    position: absolute;
    pointer-events: none;
  }

  .corona,
  .umbra {
    inset: 0;
    border-radius: 50%;
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .corona {
    --halo-inner: 78%;
    --halo-span: 14deg;
    --halo-start: -14deg;
    background: conic-gradient(
      from var(--halo-start),
      rgba(117, 121, 122, 0) 0deg,
      rgba(117, 121, 122, 0.42) 2deg,
      rgba(117, 121, 122, 0.82) calc(var(--halo-span) - 11deg),
      rgba(248, 247, 242, 0.98) calc(var(--halo-span) - 10deg),
      rgba(248, 247, 242, 0.98) calc(var(--halo-span) - 1deg),
      rgba(248, 247, 242, 0) var(--halo-span),
      rgba(248, 247, 242, 0) 360deg
    );
    transform: rotate(-48deg) scale(0.975);
    -webkit-mask: radial-gradient(
      circle,
      transparent 0 calc(var(--halo-inner) - 2%),
      #000 var(--halo-inner) 88%,
      transparent 91%
    );
    mask: radial-gradient(
      circle,
      transparent 0 calc(var(--halo-inner) - 2%),
      #000 var(--halo-inner) 88%,
      transparent 91%
    );
  }

  .umbra {
    --shadow-span: 14deg;
    --shadow-start: -14deg;
    z-index: 1;
    background: conic-gradient(
      from var(--shadow-start),
      rgba(25, 25, 25, 0) 0deg,
      rgba(25, 25, 25, 0.9) 2deg,
      rgba(25, 25, 25, 0.98) calc(var(--shadow-span) - 2deg),
      rgba(25, 25, 25, 0) var(--shadow-span),
      rgba(25, 25, 25, 0) 360deg
    );
    opacity: 0;
    transform: rotate(-102deg) scale(0.7);
    -webkit-mask: radial-gradient(
      circle,
      transparent 0 60%,
      #000 63% 88%,
      transparent 91%
    );
    mask: radial-gradient(
      circle,
      transparent 0 60%,
      #000 63% 88%,
      transparent 91%
    );
  }

  .core {
    z-index: 2;
    inset: 19.5%;
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 29%,
      #4b4b48 0%,
      #292928 31%,
      #191919 62%,
      #0b0b0b 100%
    );
    box-shadow:
      inset 0.45px 0.55px 0 rgba(255, 255, 255, 0.18),
      inset -0.8px -0.9px 1.4px rgba(0, 0, 0, 0.34),
      0 0.5px 1px rgba(0, 0, 0, 0.12);
  }
`;

export default {
  id: "conic-eclipse",
  name: "Conic Eclipse",
  kind: "dom",
  technique: "Masked conic-gradient occlusion",
  label: "Aligning",
  phaseOffset: 1409,
  mount(container) {
    const host = document.createElement("span");
    host.className = "visual-dom";
    const shadowRoot = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    const eclipse = document.createElement("span");
    const corona = document.createElement("span");
    const umbra = document.createElement("span");
    const core = document.createElement("span");

    style.textContent = styles;
    eclipse.className = "eclipse";
    corona.className = "corona";
    umbra.className = "umbra";
    core.className = "core";
    eclipse.append(corona, umbra, core);
    shadowRoot.append(style, eclipse);
    container.replaceChildren(host);

    function render(time) {
      const state = stateAt(time);
      corona.style.setProperty("--halo-inner", `${state.haloInner}%`);
      corona.style.setProperty("--halo-span", `${state.haloSpan}deg`);
      corona.style.setProperty("--halo-start", `${-state.haloSpan}deg`);
      corona.style.transform = `rotate(${state.angle}deg) scale(${state.haloScale})`;
      umbra.style.setProperty("--shadow-span", `${state.shadowSpan}deg`);
      umbra.style.setProperty("--shadow-start", `${-state.shadowSpan}deg`);
      umbra.style.opacity = String(state.shadowOpacity);
      umbra.style.transform =
        `rotate(${state.shadowAngle}deg) scale(${state.shadowScale})`;
    }

    render(0);

    return {
      render,
      resize(width, height) {
        const size = Math.max(1, Math.min(width, height));
        host.style.width = `${size}px`;
        host.style.height = `${size}px`;
      },
      reset() {
        render(0);
      },
      destroy() {
        host.remove();
      },
    };
  },
};
