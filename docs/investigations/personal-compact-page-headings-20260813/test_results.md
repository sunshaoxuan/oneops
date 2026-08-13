# 試験結果

| 試験 | 結果 | 証拠 |
|---|---|---|
| Portal 単体試験 | 合格 | 46 File、268 Test |
| Spring Backend | 合格 | 45 Test、8 件は DB 接続前提のため Skip |
| Gateway | 合格 | 308 Test |
| Python Worker | 合格 | 16 Test |
| Production Build | 合格 | TypeScript 及び Vite Build |
| 正式公開 | 合格 | `delivery_succeeded reason=personal-compact-page-headings-20260813`、幂等修正後の Watcher 公開も合格 |
| Migration 実 DB | 合格 | boolean、NOT NULL、DEFAULT false |
| nginx 及び Health | 合格 | `nginx -t`、HTTPS Health UP、0.18.22、legacyGatewayReady |
| Browser 到達及び Console | 一部合格 | 正式 Login Page 到達、warning/error 0 件 |
| 認証済み Profile と全画面 | evidence_missing | In App Browser は未 Login、Chrome Session は利用不可 |
| Screenshot | evidence_missing | `Page.captureScreenshot` Timeout |

## 発行門禁の返工

初回発行では候補 Instance が Migration 052 を適用した後、新主 Instance が同じ Migration を再実行し、既存列 Error で Ready にならなかった。`ADD COLUMN IF NOT EXISTS` へ修正し、起動時再実行契約の Test を追加した。
