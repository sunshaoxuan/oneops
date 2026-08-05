# 試験結果

更新日: 2026-08-05

| 試験 | 結果 | 詳細 |
|---|---|---|
| Gateway | 合格 | 166 件成功 |
| Builder | 合格 | 14 件成功 |
| Portal | 合格 | 17 files、141 件成功 |
| Spring | 合格 | 33 件、Failure 0、Error 0、Skip 7 |
| Production Build | 合格 | 3405 modules transformed |
| 運用 Script | 合格 | 9 scripts、Rolling Switch を含む全検査成功 |
| Nginx | 合格 | syntax ok、test successful |
| 通常幅 Browser | 合格 | 2 Column、グループ Bar 60 px、横 Overflow なし |
| 700 px Browser | 合格 | 1 Column、横 Overflow なし |
| グループ展開と折畳 | 合格 | 全グループ Tab、個別グループ Tab、閉じる操作を確認 |
| 認証情報読取権限あり | 合格 | 接続先行へ直接表示、追加 Dialog なし |
| 認証情報読取権限なし | 合格 | UI 0 件、取得 Request 0 件 |
| 内層 VPN | 合格 | 環境詳細 Panel 内 0 件 |
| Console | 合格 | Warning 0、Error 0 |
| Rolling 配信 | 合格 | 15:04:13 開始、15:04:56 成功 |
| 配信中 Availability | 合格 | 522 Sample、HTTP 200 が 522 件、失敗 0 件 |
| 配信後 Health | 合格 | status `UP`、version `0.9.4` |
| 配信後 Port | 合格 | 8092 と 8093 Listen、8094 と 8095 停止 |
| Nginx Upstream | 合格 | 127.0.0.1:8092 |
| 正式 Static Asset | 合格 | `index-oTjgBeAa.js` と `index-Zc99fetr.css` が Build と一致 |
| 配信一時 Artifact | 合格 | Rolling、Rollback、Next 残存 0 件 |

## Build 注意事項

JavaScript chunk が 1100 kB を超える既存 Warning が 1 件ある。今回の変更に起因する Build Error はない。

最初の Availability Monitor は Windows PowerShell 5.1 で未対応の `SkipCertificateCheck` を使用したため、監視器 Error となった。この結果は配信障害として扱わず、`curl.exe` を使用する Monitor へ修正して Rolling 配信を再実行し、上記 522 Sample を正式証拠とした。
