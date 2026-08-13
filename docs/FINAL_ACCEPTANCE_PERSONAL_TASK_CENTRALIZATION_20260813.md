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
| `origin/master` への正式配信 | Commit `2a44ec8`、受入記録 Commit `e726761` | 合格。2026 年 8 月 13 日に `origin/master` へ Push 成功 |
| 外部終了案件を TASK 候補から除外する | 終了状態判定、Migration 054、通知取下げ | 合格。実行後 `PENDING=0`、通知 0 件 |
| 外部終了案件の再流入を防止する | Backlog 及び問合せ Connector、Repository 入庫防御 | 合格。実同期後の新規候補 0 件 |
| ユーザー編集を機能別に分割し、長大な Scroll を解消する | 基本情報、外部システム対応、ロールと権限、所属と職務の 4 Tab | 合格。Dialog 高 624px、選択 Tab のみ独立 Scroll |
| Tab 切替中の編集内容を保持する | 共通 State、共通 Save Footer | 合格。ブラウザで未保存値の保持と Cancel 再読込を確認 |
| 保存済み Windows UPN を Dialog 再表示時に復元する | 管理対象ユーザー応答の Metadata 展開、単体試験、PostgreSQL 統合試験 | 合格。`x03043` の保存後再表示で UPN を確認 |
| Windows UPN 修正の実行時 UI と Console を確認する | 継続配信、ブラウザ保存再表示、Console、スクリーンショット | 合格。Console Error 0 件、`docs/evidence/user-windows-upn-readback-20260813.png` |

全必須機能、実行結果及び正式配信は当初目的に一致した。Console 取得制約は受入証跡の欠落として明記し、ブラウザ DOM、API、配信資源、画像の各証跡を確定した。

Windows UPN 再表示修正では Browser の Console 取得 API を利用できたため、Error 及び Warning 0 件を確認した。
