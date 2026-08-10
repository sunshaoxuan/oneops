# 試験結果

| 検証項目 | 結果 | 証拠 |
| --- | --- | --- |
| 認証表示回帰試験 | 合格 | `auth-ui.test.ts` 5 Test |
| Gateway 単体試験 | 合格 | 218 Test |
| Worker 単体試験 | 合格 | 14 Test |
| Portal 単体試験 | 合格 | 24 File、176 Test |
| Spring Backend 単体試験 | 合格 | 34 Test、環境依存 8 Test は Skip |
| 運用 Script 試験 | 合格 | 9 Script、Rolling Switch を含む全判定 `true` |
| Project Language 試験 | 合格 | 3 Test |
| Production Build | 合格 | TypeScript Compile、Vite Build |
| 正式ローリング配信 | 合格 | SYSTEM Task、`delivery_succeeded` |
| Nginx 主従復旧時の連続 HTTPS | 合格 | 100 Request、HTTP 200 は 100 件、失敗 0 件 |
| 公開 Health | 合格 | Local と HTTPS が `UP`、Version 0.16.2 |
| 公開静的資材 | 合格 | Dist と WebRoot の `index.html` SHA256 一致、主 Bundle に新文言各 1 件 |
| Browser 表示 | 合格 | 見出し 1 件、操作 1 件、単独 `SSO` 0 件 |
| 自動認証待機状態 | 合格 | 新しい日本語待機文言を実 Browser で確認 |
| Console | 合格 | Warning 0 件、Error 0 件 |
| Screenshot | 合格 | `docs/evidence/windows-account-auth-label-20260810.png` |
| Nginx 設定 | 合格 | `nginx -t` |
| Source 差分形式 | 合格 | `git diff --check` |
