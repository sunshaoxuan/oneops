# 個人タスク外部連携集中化最終受入

| 当初要求 | 成果物 | 検査結果 |
| --- | --- | --- |
| 域、Backlog、問合せと将来システムの対応を同一表で管理する | `external_systems`、`user_external_profiles`、ユーザー管理 UI | 合格 |
| 安定物理 ID と外部キーを使用する | Migration 053 の UUID PK と FK | 合格 |
| システム共通接続を外部タスクで集中管理する | システム管理の外部タスク UI | 合格 |
| UPDS と Backlog を 10 分ごとに同期する | `sync_interval_minutes=10`、Gateway 定期起動 | 合格 |
| ユーザー外部対応で候補を所有者へ割り当てる | 実 Backlog 67 件取込、問合せ同期成功 | 合格 |
| 新規候補をシステム通知する | `user_notifications`、鈴、Drawer、候補遷移 | 合格 |
| 今日、予定、長期、候補 Tab に 0 件以外の件数を表示する | `TabLabel`、ブラウザ表示 | 合格 |
| 完了 Tab に件数を表示しない | 完了 Tab の文字表示 | 合格 |
| 個人接続モードを廃止する | 旧 API、型、Repository、UI、テーブルの削除 | 合格 |
| 関連文書を更新する | 認証、外部タスク、個人タスク要件文書 | 合格 |
| テスト、実行、ブラウザ、スクリーンショット | 調査記録の検証証跡 | 合格。Console 直接取得は `evidence_missing` |
| `origin/master` への正式配信 | ローカル Commit `2a44ec8` | 未合格。GitHub 認証が無効のため Push 不成立 |

全必須機能と実行結果は当初目的に一致した。Console 取得制約は受入証跡の欠落として明記し、ブラウザ DOM、API、配信資源、画像の各証跡を確定した。正式配信は GitHub 再認証後に Push し、`HEAD` と `origin/master` の一致を確認するまで未完了とする。
