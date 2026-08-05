import {
  ThinkingOrb,
  type OrbState,
  type ThinkingOrbProps,
} from "thinking-orbs";

export type ProgressOrbState = OrbState;

export interface ProgressOrbProps
  extends Omit<ThinkingOrbProps, "aria-label" | "size" | "state"> {
  label: string;
  size?: 20 | 64;
  state?: ProgressOrbState;
}

// Portal の進行表示で共通利用する薄いラッパー。状態とアクセシブルなラベルを
// 呼び出し側で指定し、個別画面がライブラリの描画詳細に依存しないようにする。
export function ProgressOrb({
  label,
  size = 20,
  state = "working",
  ...props
}: ProgressOrbProps) {
  return (
    <ThinkingOrb
      {...props}
      aria-label={label}
      size={size}
      state={state}
    />
  );
}
