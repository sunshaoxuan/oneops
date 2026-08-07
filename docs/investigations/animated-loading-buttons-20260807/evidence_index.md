# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
|---|---|---|---|
| 上流は 25 種類を提供する | 公開 `README.md`、`src/designs/index.js`、metadata 検査結果 25 件かつ ID 重複 0 | 高 | 2026-08-07 snapshot |
| 上流 snapshot は取得元と一致する | LICENSE、README、28 source files の合計 30 files で SHA-256 mismatch 0 | 高 | 2026-08-07 再取得比較 |
| ライセンスは GPL v3 | 公開 `LICENSE`、`app/packages/animated-loading-buttons/LICENSE` | 高 | 法的助言ではない |
| 25 種類を按需読込できる | `src/index.js` の 25 個の動的 import、production build の個別 chunk | 高 | 初回利用時に対応 chunk を取得する |
| ローディング時の再送信を防ぐ | `AnimatedLoadingButton.tsx`、単体試験 | 高 | 呼出側は実際の pending 状態を渡す |
| 実ブラウザーで全 variant が掛載された | 25 cards、25 variants、25 unique IDs、loader error 0 | 高 | ローカル開発 URL で確認 |
| アニメーションが進行した | 第一 preview の 300ms 間隔 screenshot SHA-256 が相違 | 高 | 代表 WebGL variant で確認 |
| デスクトップに横溢れがない | viewport 1265、document width 1265 | 高 | 既定 Browser viewport |
| モバイルに横溢れがない | viewport 375、document width 375、grid 343px | 高 | 390 x 844 指定時の実効 viewport |
| Console が正常 | error と warning の最終件数 0 | 高 | 同一ブラウザーセッション |
| 視覚証拠が存在する | `docs/evidence/loader-buttons-gallery-top-20260807.png`、`loader-buttons-gallery-bottom-20260807.png`、`loader-buttons-gallery-mobile-20260807.png` | 高 | 動画自体は静止画二枚と frame hash で検証 |
