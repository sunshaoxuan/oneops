# 最終受入一覧

| 原要求及び制約 | 成果物 | 検証証拠 | 状態 |
|---|---|---|---|
| 80番 Port へのアクセスを443番 Port へ転送する | HTTP 専用 Nginx Server | Root、GET、POST の `308` | 合格 |
| Path と Query String を保持する | `$host$request_uri` | 専用 Runtime Request | 合格 |
| 転送先へ `:80` を残さない | `$host` | Location Header | 合格 |
| HTTPS の既存機能を維持する | 既存443番 Server | Portal 200、Health `UP` | 合格 |
| 設定を自動検証する | 専用回帰試験 | Test Output | 合格 |
| 正式 Runtime へ反映する | SYSTEM 計画 Task 再起動 | 80番と443番 Listener | 合格 |
| 実 Browser で転送と Console を確認する | Browser HTTP URL | HTTPS 最終 URL、Console 0件 | 合格 |
| Browser Screenshot を保存する | Browser Screenshot | Layout Metrics Timeout、Chrome 未接続 | `evidence_missing` |
| 対象差分だけを Version 管理する | 設定、試験、文書 | 9ファイルの Git Staged Whitelist | 合格 |

## 最終判定

HTTP から HTTPS への転送契約、正式 Runtime、Browser URL、Console、対象差分の Version 管理は合格した。Screenshot だけは Browser 実行環境の Layout Metrics Timeout により `evidence_missing` である。今回の変更は UI を変更しておらず、Nginx の転送契約は Protocol、Listener、Browser 最終 URL 及び Console で受入済みである。
