# 証拠索引

| 主張 | 証拠 | 確信度 | 制約 |
|---|---|---|---|
| 変更前は80番 Port を待受していない | `Get-NetTCPConnection`、変更前 `conf/nginx.conf` | 高 | 2026-08-12 JST の観測値 |
| HTTP は HTTPS へだけ転送する | `conf/nginx.conf`、専用回帰試験、Runtime HTTP Response | 高 | Root、GET、POST で確認済み |
| Path と Query String を保持する | `$host$request_uri`、Runtime Location Header | 高 | 深い Path と複数 Query で確認済み |
| 443番 Port の既存契約を維持する | Nginx 構文検査、HTTPS Portal 200、Health `UP` | 高 | Backend Version は0.18.20 |
| 実 Browser も HTTPS へ遷移する | Browser 最終 URL、Console 0件 | 高 | Screenshot は Layout Metrics Timeout により `evidence_missing` |
