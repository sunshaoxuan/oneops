# アニメーションローディングボタン統合 調査報告

## 調査目的

ユーザー提示の Appllama ローダーボタン工程を OneOps に導入し、後続の業務画面が必要なアニメーションを共通契約から利用できる状態にする。

## 調査結果

| 調査項目 | 確認結果 | 証拠 |
|---|---|---|
| 公開内容 | 25 種類。WebGL 13、SVG 6、Canvas 4、DOM 2 | 公開ページ、公開 `README.md`、variant metadata 検査 |
| 実行依存 | 上流ソースは外部 package 依存を持たない | `src/core`、`src/designs` の import 追跡 |
| ソース規模 | 28 JavaScript ファイル、278,922 bytes、8,220 行 | 取得時の再帰 import 検査 |
| ライセンス | GNU General Public License Version 3 | 公開 `LICENSE` と収録済み `LICENSE` |
| OneOps 互換性 | React 19.2.8、Ant Design 6.5.1、Vite 8.1.5 で型検査及び build 成功 | Portal `package.json`、production build |
| 描画契約 | `mount` が `render`、`resize`、`reset`、`destroy` を返す | 公開 `src/main.js`、`src/core`、各 design |

## 実装判断

上流ソースを独立 workspace package の `src/third-party` に無改変で収録した。OneOps 側は 25 種類の metadata と動的 import を公開し、React アダプターで Ant Design Button のラベル、無効化、`aria-busy` を維持する。初期 bundle への一括混入を防ぐため、图库と各 variant を個別 chunk に分離した。第三者 snapshot は取得時 hash を維持し、第一者 source の日本語説明コメント検査から分離した。

## 実装結果

1. `@one-ops/animated-loading-buttons` を追加し、GPL、README、core 2 ファイル、design 26 ファイルを保持した。
2. 25 種類の安定 variant ID、型定義、metadata、動的 loader を公開した。
3. `AnimatedLoadingButton` を追加し、最大 30fps の共通描画、可視範囲、タブ表示状態、縮小モーション、破棄処理を実装した。
4. `/ui/loader-buttons` に 25 種類の選択图库を追加した。
5. 要件、上流更新方法、ロールバック、試験及び最終受入証拠を文書化した。

## 制約

既存業務ボタンの一括置換は実施していない。処理時間、重要度、画面密度及び利用者への意味を確認し、各業務画面で `loaderVariant` を選定する。
