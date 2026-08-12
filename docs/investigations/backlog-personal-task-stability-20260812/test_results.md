# 試験結果

## 初回試験

| 対象 | 結果 |
| --- | --- |
| Gateway `personal-task.test.mjs` | 20 件合格 |
| Portal Vitest | 45 ファイル、257 件合格 |

## 最終試験

| 対象 | 結果 |
| --- | --- |
| `pnpm install --frozen-lockfile` | 合格 |
| Gateway 全量 | 306 件合格 |
| Python Worker | 14 件合格 |
| Portal 全量 | 45 ファイル、256 件合格 |
| Production Build | 3853 Modules、合格 |
| 実 Backlog 同期 | `SUCCESS`、取得 54 件、新規 54 件、更新 0 件、Stale 0 件 |
| HTTPS | 200 |
| Nginx upstream | `127.0.0.1:8092` |
| Browser | 正式 `/tasks` は Login 画面へ到達。Windows SSO 失敗により認証後画面は `evidence_missing` |
| Browser Console | Login 画面の Error 0 件、Warning 0 件。認証後画面は `evidence_missing` |
| Screenshot | Login 阻塞を保存。認証後 Backlog Drawer は `evidence_missing` |

`/health` は HTTP 500 を返した。Backlog 同期の Gateway 実行及び HTTPS Portal 200 は確認済みである。Health 異常は本修正の完了状態と分離して残存リスクへ記録する。
