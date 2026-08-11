# AI 応答待機の視認性再調査

## 利用者指摘

0.18.13 の「AI の応答待ち」は、橙色の小さい点が並ぶ静止表示に見え、処理中の Animation を認識できない。

## 確認事実

1. 正式 Browser は `prefers-reduced-motion: true` を返す。
2. `generative-loaders@0.1.1` は Reduced Motion で Inline Loader 内部の `animation-duration` を `0.01ms`、`animation-iteration-count` を 1 回へ変更する。
3. Orbit の三点と Gravity の粒子は初期状態で停止する。
4. 0.18.11 の補正は外側の `1.35em` Indicator 全体を `opacity: 0.56` から `1` へ変化させるだけであり、利用者 Screenshot では変化範囲が小さすぎた。

## 原因

Animation の有無を Computed Style 数値だけで合格判定し、利用者が通常の閲覧距離で処理継続を即時認識できるかという初衷級判定が不足していた。

## 修正方針

1. 既存 `InlineLoader` と SSE 状態契約を維持する。
2. Loader を `1.55em` へ拡大し、OneOps の淡い Brand Surface 内へ配置する。
3. 五分割の活動 Meter を追加する。通常時は Scale と明暗、Reduced Motion では位置移動を伴わない明暗だけを連続変化させる。
4. Component の Mount 時刻から実経過秒数を計算して表示する。
5. 状態文言だけを Live Region で通知し、活動 Meter と毎秒更新値は支援技術から隠す。

## 非対象

SSE、Task 状態遷移、CAG 接続、回答 Streaming の契約は変更しない。
