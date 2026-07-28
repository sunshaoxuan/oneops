# 証拠索引

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 非 Latin-1 ファイル名が応答ヘッダー生成を失敗させた | 利用者提供画面の `ERR_INVALID_CHAR` と `Content-Disposition` 表示、`app/gateway/inquiry-support-routes.mjs` | 高 | 修正前の実環境応答本文は保存しない |
| Portal は原名を添付 URL に渡す | `app/apps/portal-shell/src/InquirySupportPage.tsx`、`app/packages/api-client/src/index.ts` | 高 | なし |
| ASCII 代替名と UTF-8 完全名で Node.js の検証を通過する | `app/gateway/inquiry-support.test.mjs` | 高 | テスト結果は `test_results.md` に記録する |
