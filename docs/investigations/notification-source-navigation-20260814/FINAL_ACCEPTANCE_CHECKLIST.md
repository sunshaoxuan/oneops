# 最終受入一覧

| No. | 原要求及び制約 | 成果物 | 検証証拠 | 状態 |
|---|---|---|---|---|
| 1 | 通知に発生元を内部記録し画面へ表示しない | Migration 055、Gateway、API 型、通知 Drawer | Gateway Test、Portal Test | 合格 |
| 2 | 通知に重要 ID を記録する | `resource_id`、`source_system_id`、`source_object_id` | Gateway Test、Migration | 合格 |
| 3 | 通知から実際の作業ノードへ入る | 候補物理 ID 付き `action_path`、候補 Drawer 自動表示 | Gateway Test、Portal Test | 合格 |
| 4 | 通知アイコンに薄い背景色を付ける | `.notification-button` | Portal Test、Production Build | 合格 |
| 5 | Hover 又は Focus で主色へ強調する | `.notification-button:hover`、`:focus-visible` | Portal Test、Production Build | 合格 |
| 6 | Badge を円形アイコンへ一部重ねる | Ant Design Badge `offset` | Portal Test、Production Build | 合格 |
| 7 | 通知タイトルと行が選択可能であることを示す | `notification-list-item`、手型カーソル、Hover、Focus、Enter、Space | Portal Test、Production Build、正式 Asset 本文は合格。認証済み Browser DOM は `evidence_missing` | `evidence_missing` |
| 8 | 浅い背景と通知文字の間に余白を設ける | `.notification-list-item` の `padding: 14px 16px`、`margin-bottom: 8px` | Portal Test、Production Build、正式 CSS 本文 | 確認中 |
| 9 | 変更した要求を日本語文書へ記録する | `PERSONAL_TASKS_REQUIREMENTS.md`、`CHANGELOG.md` | Diff 確認 | 合格 |
| 10 | 実 Database と実画面で確認する | 配信、Browser、Console、Screenshot | Database、配信、Runtime、ログイン頁 Console は合格。認証済み通知 Drawer DOM、Hover、Focus、Screenshot は `evidence_missing` | `evidence_missing` |
| 11 | 本タスクだけを Version 管理へ反映する | Patch 白名簿、Commit、Push | 最新 Commit、`HEAD=origin/master` | 確認中 |
