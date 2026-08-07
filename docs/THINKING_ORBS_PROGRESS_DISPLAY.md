# thinking-orbs 進行表示統合方針

更新日: 2026-08-05

## 目的

Portal の進行表示、読み込み表示及び状態表示へ、`thinking-orbs` の動的なオーブ表示を再利用できる共通入口を追加する。業務上の進捗値、API 契約及び保存データは変更しない。

## 依存関係

Portal の実行依存関係へ `thinking-orbs` の `0.2.0` を追加した。公式パッケージは React 18 以上と React DOM 18 以上を要求し、現行 Portal の React 19 と互換性がある。ライセンスは MIT である。

参照先:

1. [公式デモ](https://orbs.jakubantalik.com/)
2. [公式リポジトリ](https://github.com/Jakubantalik/thinking-orbs)
3. [npm パッケージ](https://www.npmjs.com/package/thinking-orbs)

## 共通コンポーネント

`app/apps/portal-shell/src/ProgressOrb.tsx` の `ProgressOrb` を画面側の利用入口とする。

1. `state` は `working`、`searching`、`solving`、`listening`、`connecting`、`weaving`、`composing`、`breathing`、`shaping` から選択する。
2. `size` はライブラリの調整済みプリセットに合わせて `20` 又は `64` を使用する。
3. `label` は必須とし、キャンバスの `aria-label` へ渡す。
4. `className`、`style`、`data-*` などのキャンバス属性は共通コンポーネントから引き渡せる。
5. `motion=auto` は Library の `prefers-reduced-motion` 対応を維持する。
6. `motion=always` は利用者から常時 Animation の明示要求がある業務待機表示だけで使用する。描画 Mode、速度及び Frame 描画は Library の公開 `resolvePreset` と `MODE_DRAWS` を利用し、非表示 Tab と画面外では停止する。

## 現在の適用範囲

1. ワークベンチのシステム健全性 Card 内にある Memory 及び Disk の進行表示へ適用した。Memory は `working`、Disk は `searching` とし、数値表示と既存の Ant Design `Progress` は維持する。
2. 問合 AI 補助の実行中表示へ `solving`、Size 64、`motion=always` を適用した。Card 外周の紫青 Gradient 循環光跡は CSS が担当し、中央 Orb は Library の公開描画定義を使用する。

## 後続開発の利用基準

新しい非同期処理へ進行表示を追加する場合は、業務上の動作に対応する `state` と日本語の `label` を指定して `ProgressOrb` を利用する。既定は `motion=auto` とする。常時 Animation は明示要求と低干渉な表示設計がある場合だけ選択する。進捗値の計算、エラー処理、API ポーリング及び権限判定へ表示 Library の依存を持ち込まない。
