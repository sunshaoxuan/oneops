# 試験結果

実施日: 2026-08-12 JST

| 試験 | 結果 | 状態 |
|---|---|---|
| HTTP 転送設定回帰試験 | `Nginx HTTP redirect contract passed.` | 合格 |
| Windows PowerShell 5.1 | 専用 Test 終了 Code 0 | 合格 |
| PowerShell 7 | 専用 Test 終了 Code 0 | 合格 |
| Nginx 構文検査 | Syntax OK、Test successful | 合格 |
| HTTP Root 転送 | `308`、Location `https://192.168.20.54/` | 合格 |
| HTTP Path と Query 転送 | GET と POST の Path と Query が完全一致 | 合格 |
| Host 転送 | IP、`TS2DEVSERVER`、`localhost` が同じ HTTPS Host へ転送 | 合格 |
| HTTPS Portal と Health | Portal 200、`UP / 0.18.20` | 合格 |
| 80番及び443番 Listener | 両方 `192.168.20.54` で待受 | 合格 |
| Browser 最終 URL | 同じ HTTPS Path と Query へ遷移 | 合格 |
| Browser Console | Application Warning 0件、Error 0件 | 合格 |
| Browser Screenshot | Layout Metrics Timeout、Chrome 未接続 | `evidence_missing` |
