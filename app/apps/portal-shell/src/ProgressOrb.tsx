import {
  MODE_DRAWS,
  ThinkingOrb,
  resolvePreset,
  type OrbState,
  type OrbTheme,
  type ThinkingOrbProps,
} from "thinking-orbs";
import { useEffect, useRef } from "react";

export type ProgressOrbState = OrbState;

export interface ProgressOrbProps
  extends Omit<ThinkingOrbProps, "aria-label" | "size" | "state"> {
  label: string;
  motion?: "auto" | "always";
  size?: 20 | 64;
  state?: ProgressOrbState;
}

function resolveProgressOrbDarkTheme(
  canvas: HTMLCanvasElement,
  theme: OrbTheme,
) {
  if (theme === "dark") return true;
  if (theme === "light") return false;

  const themedAncestor = canvas.closest(
    '[data-theme="dark"], [data-theme="light"], .dark, .light',
  );
  if (themedAncestor?.matches('[data-theme="dark"], .dark')) return true;
  if (themedAncestor?.matches('[data-theme="light"], .light')) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function AlwaysAnimatedProgressOrb({
  label,
  paused = false,
  size,
  speed = 1,
  state,
  style,
  theme = "auto",
  ...props
}: Omit<ProgressOrbProps, "motion"> & {
  size: 20 | 64;
  state: ProgressOrbState;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * pixelRatio);
    canvas.height = Math.round(size * pixelRatio);
    const context = canvas.getContext("2d");
    if (!context) return;

    const preset = resolvePreset(state, size);
    const draw = MODE_DRAWS[preset.mode];
    const dark = resolveProgressOrbDarkTheme(canvas, theme);
    const drawFrame = (time: number) => {
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, size, size);
      draw(context, size, time, dark, preset.opts);
    };
    if (paused) {
      drawFrame(0.6);
      return;
    }

    let frame = 0;
    let visible = true;
    let running = false;
    const renderFrame = () => {
      drawFrame(performance.now() / 1_000 * preset.speed * speed);
      if (running) frame = window.requestAnimationFrame(renderFrame);
    };
    const start = () => {
      if (running || !visible || document.visibilityState === "hidden") return;
      running = true;
      frame = window.requestAnimationFrame(renderFrame);
    };
    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
    const observer = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        });
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    drawFrame(performance.now() / 1_000 * preset.speed * speed);
    observer?.observe(canvas);
    if (!observer) start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [paused, size, speed, state, theme]);

  return (
    <canvas
      {...props}
      ref={canvasRef}
      role="img"
      aria-label={label}
      data-progress-orb-motion="always"
      style={{ width: size, height: size, display: "block", ...style }}
    />
  );
}

// Portal の進行表示で共通利用する薄いラッパー。状態とアクセシブルなラベルを
// 呼び出し側で指定し、個別画面がライブラリの描画詳細に依存しないようにする。
export function ProgressOrb({
  label,
  motion = "auto",
  size = 20,
  state = "working",
  ...props
}: ProgressOrbProps) {
  if (motion === "always") {
    return (
      <AlwaysAnimatedProgressOrb
        {...props}
        label={label}
        size={size}
        state={state}
      />
    );
  }

  return (
    <ThinkingOrb
      {...props}
      aria-label={label}
      size={size}
      state={state}
    />
  );
}
