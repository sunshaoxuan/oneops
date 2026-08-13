# 個人タスク外部連携集中化調査記録

## 調査目的

個人ごとに分散していたドメイン、Backlog、問合せサイトの外部ユーザー対応と外部タスク接続を、システム管理に集中できるか調査した。候補取込の実行間隔、所有者割当、新規候補通知、画面再取得も対象とした。

## 調査結果

1. 候補画面は表示時の API 取得と 60 秒ごとの再取得を行う。
2. Gateway は 60 秒ごとに同期対象を起動し、外部タスク設定の `sync_interval_minutes` が経過したユーザー外部档案を同期する。現行設定は UPDS と Backlog の両方で 10 分である。
3. `external_systems` と `user_external_profiles` を導入し、OneOps ユーザー物理 ID と外部システム物理 ID を外部キーで関連付けた。
4. システム共通認証情報と同期間隔はシステム管理の外部タスクで管理する。ユーザーごとの外部 ID 及び Code はユーザー管理で管理する。
5. Backlog は外部ユーザー物理 ID を `assigneeId[]` に使用する。問合せサイトは選択肢の外部担当者物理値を使用する。
6. 新規候補の初回登録と同一 Transaction で `user_notifications` へ通知を登録する。通知の遷移先は `/tasks?view=candidates` である。
7. 旧個人接続 API、クライアント型、Repository 操作、画面入口は削除した。旧テーブル `personal_task_external_accounts` と `personal_task_sync_runs` も削除した。

## 実データの確認

2026 年 8 月 13 日の実行環境で、Backlog の外部ユーザー物理 ID `544539`、問合せサイトの外部担当者物理値 `113210`、問合せ業務 Code `X02851` を現行外部サイトの応答から確認した。集中同期は Backlog 67 件、問合せ 0 件で成功し、Backlog の新規候補 13 件に対して未読通知 13 件を作成した。

## 検証証跡

| 対象 | 結果 | 証跡 |
| --- | --- | --- |
| Node 全検査 | Gateway 312 件、Builder 16 件、Portal 269 件、Production Build 成功 | `pnpm --dir app check` |
| Java | 45 件実行、0 失敗、8 環境 Skip、JAR 作成成功 | `app/backend/mvnw.cmd test package` |
| Migration | 全 Migration 再実行成功 | `MIGRATIONS_OK` |
| Nginx | 構文確認成功 | `nginx.exe -t` |
| Runtime | Actuator Health 200 UP、Auth Config 200、HTTPS 200 | 2026 年 8 月 13 日確認 |
| 配信資源 | Build と HTTPS はどちらも `index-DDDa7j23.js` | `app/apps/portal-shell/dist/index.html`、`html/index.html` |
| 候補画面 | URL から候補 Tab を開き、66 件を表示 | Codex Browser キャプチャ |
| 通知 | 鈴 13 件、Drawer 表示、候補遷移を確認 | Codex Browser キャプチャ |
| 集中設定 | UPDS と Backlog の 10 分同期を確認 | Codex Browser キャプチャ |
| ユーザー外部档案 | Backlog と問合せの ID 及び Code を確認 | Codex Browser キャプチャ |

## 制約

使用したブラウザー制御インターフェースに Console ログ取得 API が存在しない。DOM、API 動作、資源配信、画面キャプチャは確認済みであり、Console ログの直接検査は `evidence_missing` とする。
