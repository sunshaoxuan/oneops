# 最終受入チェックリスト

基準日: 2026-08-08

| 項目 | 成果物 | 検証証拠 | 判定 |
| --- | --- | --- | --- |
| Hero と個人タスク概要の接近原因を特定 | 調査記録の原因説明 | `styles.css` の変更前ルールと `App.tsx` の隣接構造 | 合格 |
| Hero の下に視認可能な間隔を確保 | `styles.css` の `margin-top: 18px` | `workbench-spacing.test.ts` | 合格 |
| 既存の機能とレスポンシブ列数を維持 | CSS 差分 | `git diff --check`、Portal テスト | 合格 |
| Portal のテストを実行 | テスト結果記録 | 22 ファイル、171 件合格 | 合格 |
| Gateway、Worker、ビルドを確認 | テスト結果記録 | `pnpm check` 合格 | 合格 |
| 実行環境へ公開 | 公開ログ | health `UP`、HTTPS 200、`delivery_succeeded` | 合格 |
| 公開中の CSS に変更を反映 | 配信 CSS | `/assets/index-cx8Vq2Yu.css` の `margin-top:18px` | 合格 |
| 認証後の実ホーム画面で間隔を計測 | Browser 証拠 | 認証待ち画面から進めず `evidence_missing` | 未確認 |
| ホーム画面 Console にエラーがないことを確認 | Browser Console 証拠 | Workbench 未到達のため `evidence_missing` | 未確認 |
| 変更後のホーム画面スクリーンショットを取得 | Browser スクリーンショット | 認証済み画面未取得のため `evidence_missing` | 未確認 |

## 受入判断

コード、静的テスト、ビルド及び公開は合格した。認証後 Browser の三項目は、現在の認証状態では検証できないため、完全受入の証拠としては未確認とする。
