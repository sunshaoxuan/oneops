# 上流工程情報

## 取得元

- 公開ページ: `https://loader-buttons.appllama.io/`
- canonical URL: `https://loader-buttons.experiments.appllama.io/`
- 取得日: 2026-08-07
- 上流説明: WebGL 13 種類及び SVG、Canvas、CSS 12 種類から成る、依存関係を持たない 25 種類のローディングボタン実験
- ライセンス: GNU General Public License Version 3

## 収録範囲

`src/third-party` には公開元の `src/core` と `src/designs` を無改変で収録する。上流の `LICENSE` と `README.md` もパッケージ直下に保持する。OneOps 固有の export、型定義、React アダプター及び画面は上流ファイルの外側へ配置する。第三者 source は原文と取得時 hash を維持するため、第一者 source の日本語説明コメント検査から分離する。

## 更新方法

1. 公開元の `LICENSE`、`README.md`、`src/core`、`src/designs` を取得する。
2. 既存 snapshot とファイル単位の SHA-256 を比較する。
3. variant ID、mount 契約、`render`、`resize`、`reset`、`destroy` 契約を確認する。
4. 全 variant の単体試験、production build、実ブラウザーの描画、Console、スクリーンショットを再検証する。

## ロールバック

当該 workspace package、Portal の `AnimatedLoadingButton` とギャラリー、Portal package dependency を同一変更単位で削除する。業務 API、データモデル及び認可契約には変更を加えない。
