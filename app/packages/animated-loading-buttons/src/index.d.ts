export type LoaderDesignId =
  | "fibonacci-breather"
  | "glass-tide-lens"
  | "binary-metaball-mitosis"
  | "curl-field-comet"
  | "living-reaction-seed"
  | "chladni-whisper"
  | "topology-courier"
  | "meridian-loom"
  | "voronoi-lantern"
  | "event-horizon-pulse"
  | "prismatic-caustic-coin"
  | "voxel-assembly-line"
  | "strange-attractor-scribe"
  | "conic-eclipse"
  | "orbital-calligraphy"
  | "mercury-relay"
  | "noise-chrysalis"
  | "contour-choir"
  | "shapeshifter-seal"
  | "murmuration-turn"
  | "frostwork-growth"
  | "sandpile-bloom"
  | "elastic-cartography"
  | "mechanical-iris"
  | "braille-flipwave";

export interface LoaderVisualInstance {
  render?(time: number, delta: number): void;
  resize?(width: number, height: number, devicePixelRatio?: number): void;
  reset?(): void;
  destroy?(): void;
}

export interface LoaderDesign {
  id: LoaderDesignId;
  name: string;
  kind: "webgl" | "canvas" | "svg" | "dom";
  technique: string;
  label?: string;
  phaseOffset?: number;
  mount(container: HTMLElement): LoaderVisualInstance;
}

export type LoaderDesignSummary = Omit<LoaderDesign, "mount" | "phaseOffset">;

export const loaderDesigns: readonly LoaderDesignSummary[];
export const loaderDesignIds: readonly LoaderDesignId[];
export function loadLoaderDesign(id: LoaderDesignId): Promise<LoaderDesign>;
