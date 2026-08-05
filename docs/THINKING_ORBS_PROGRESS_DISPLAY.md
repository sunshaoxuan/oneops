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
5. ライブラリの `prefers-reduced-motion` 対応を維持し、画面側で別のアニメーション実装を追加しない。

## 現在の適用範囲

ワークベンチのシステム健全性カード内にあるメモリ及びディスクの進行表示へ適用した。メモリは `working`、ディスクは `searching` とし、数値表示と既存の Ant Design `Progress` はそのまま維持する。

## 後続開発の利用基準

新しい非同期処理へ進行表示を追加する場合は、業務上の動作に対応する `state` と日本語の `label` を指定して `ProgressOrb` を利用する。進捗値の計算、エラー処理、API ポーリング及び権限判定へ表示ライブラリの依存を持ち込まない。
