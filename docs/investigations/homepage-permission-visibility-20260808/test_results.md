# テスト結果

## 実行済み

| コマンド | 結果 |
| --- | --- |
| `node --test gateway/lib.test.mjs` | 合格、4 件 |
| `pnpm --filter @one-ops/portal-shell test` | 合格、21 ファイル、170 件 |
| `pnpm --filter @one-ops/portal-shell build` | 合格、TypeScript と Vite production build |
| `node --check gateway/server.mjs` | 合格 |
| `node --check gateway/lib.mjs` | 合格 |
| `git diff --check` | 合格 |
| `pnpm test` | 合格、Gateway 218 件、Worker 14 件、Portal 170 件 |
| `pnpm check` | 合格、全量テストと production build |
| `publish-portal.ps1 -Reason homepage-permission-visibility-20260808` | 合格、rolling build、Nginx 切替、主 Gateway 復帰 |
| `publish-portal.ps1 -Reason homepage-permission-sse-session-refresh-20260808` | 合格、SSE セッション再解決を含む再公開 |
| `GET http://127.0.0.1:8092/api/work-center/v1/health` | 合格、`UP`、version `0.16.0` |
| `GET https://192.168.20.54/` | 合格、HTTP 200 |
| 未認証 dashboard API | 合格、HTTP 401 |
| 未認証 events API | 合格、HTTP 401 |
| Browser 認証ページ | SSO ボタン表示、Console エラーなし、証拠画像あり |

## 未実行

| 項目 | 状態 |
| --- | --- |
| 全 Gateway、Worker、Portal、Backend の `pnpm test` | 実装中のため未実行 |
| 代理ログインで権限変更後の Browser、Console、スクリーンショット | 認証済み Browser セッションがなく、資格情報の送信を行わないため未実行。`evidence_missing` |

## Browser 証拠

ログイン画面の SSO 入口は [homepage-permission-visibility-sso-20260808.png](/D:/nginx/docs/evidence/homepage-permission-visibility-sso-20260808.png) に保存した。認証後ホーム画面の表示分岐、Network、SSE、Console、権限変更後の再表示は未確認であり、ここを完了扱いにしない。
