import {
  loadLoaderDesign,
  type LoaderDesignId,
  type LoaderVisualInstance,
} from "@one-ops/animated-loading-buttons";
import { Button, type ButtonProps } from "antd";
import { useEffect, useRef } from "react";
import "./animated-loading-button.css";

const activeRenderers = new Set<(time: number) => void>();
let animationFrame = 0;
let previousPaint = 0;

function renderActiveLoaders(time: number) {
  animationFrame = 0;
  if (previousPaint && time - previousPaint < 32.8) {
    animationFrame = window.requestAnimationFrame(renderActiveLoaders);
    return;
  }
  previousPaint = time;
  activeRenderers.forEach((render) => render(time));
  if (activeRenderers.size > 0) {
    animationFrame = window.requestAnimationFrame(renderActiveLoaders);
  }
}

function addRenderer(render: (time: number) => void) {
  activeRenderers.add(render);
  if (!animationFrame) {
    previousPaint = 0;
    animationFrame = window.requestAnimationFrame(renderActiveLoaders);
  }
}

function removeRenderer(render: (time: number) => void) {
  activeRenderers.delete(render);
  if (activeRenderers.size === 0 && animationFrame) {
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

function AnimatedLoader({ variant }: { variant: LoaderDesignId }) {
  const slotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    let cancelled = false;
    let cleanup = () => {};

    void loadLoaderDesign(variant).then((design) => {
      if (cancelled) return;

    let instance: LoaderVisualInstance | null = null;
    let visible = true;
    let registered = false;
    let startTime = performance.now();
    let previousTime = startTime;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")
      .matches ?? false;

    const resize = () => {
      if (!instance) return;
      const bounds = slot.getBoundingClientRect();
      instance.resize?.(
        bounds.width || 20,
        bounds.height || 20,
        window.devicePixelRatio || 1,
      );
    };
    const render = (time: number) => {
      if (!instance) return;
      const delta = Math.min(0.05, Math.max(0, (time - previousTime) / 1_000));
      previousTime = time;
      instance.render?.(Math.max(0, (time - startTime) / 1_000), delta);
    };
    const stop = () => {
      if (!registered) return;
      registered = false;
      removeRenderer(render);
    };
    const start = () => {
      if (registered || reducedMotion || !visible || document.hidden) return;
      registered = true;
      previousTime = performance.now();
      addRenderer(render);
    };

    try {
      instance = design.mount(slot);
      resize();
      instance.render?.(0, 0);
      instance.reset?.();
      startTime = performance.now();
      previousTime = startTime;
    } catch (error) {
      slot.dataset.loaderError = "true";
      console.error(`[${design.name}] ローダーの初期化に失敗しました`, error);
      return;
    }

    const intersectionObserver = typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) start();
          else stop();
        }, { rootMargin: "80px", threshold: 0.01 });
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(resize);
    const handleVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    intersectionObserver?.observe(slot);
    resizeObserver?.observe(slot);
    document.addEventListener("visibilitychange", handleVisibility);
    if (!intersectionObserver) start();

    cleanup = () => {
      stop();
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      instance?.destroy?.();
      slot.replaceChildren();
    };
    }).catch((error) => {
      if (cancelled) return;
      slot.dataset.loaderError = "true";
      console.error(`[${variant}] ローダーの読込に失敗しました`, error);
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [variant]);

  return (
    <span
      ref={slotRef}
      aria-hidden="true"
      className="oneops-animated-loader-slot"
      data-loader-variant={variant}
    />
  );
}

export interface AnimatedLoadingButtonProps extends Omit<ButtonProps, "loading"> {
  loading?: boolean;
  loaderVariant?: LoaderDesignId;
}

export function AnimatedLoadingButton({
  children,
  disabled,
  icon,
  loading = false,
  loaderVariant = "mechanical-iris",
  ...props
}: AnimatedLoadingButtonProps) {
  return (
    <Button
      {...props}
      aria-busy={loading}
      className={`oneops-animated-loading-button ${props.className ?? ""}`.trim()}
      disabled={disabled || loading}
      icon={loading ? <AnimatedLoader variant={loaderVariant} /> : icon}
    >
      {children}
    </Button>
  );
}
