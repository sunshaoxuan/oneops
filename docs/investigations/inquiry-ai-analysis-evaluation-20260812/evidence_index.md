# 証拠索引

| Claim | Evidence | Confidence | Limitation |
|---|---|---|---|
| 評価は分析実行及び評価者の物理 ID と外部キーで結合される | `app/db/migrations/051_create_inquiry_assist_run_evaluations.sql`、実 PostgreSQL 制約照会 | high | なし |
| 同一利用者の再評価は同一行を更新する | Unique 制約、Gateway Upsert、正式 Browser で好評から差評へ更新、DB 評価 ID 一致 | high | 現行評価だけを保持する契約 |
| 差評理由は再読込後も回填される | 正式 Browser DOM 再読込、本機受入 Screenshot | high | 問合 No. 95168 の一件で確認。Screenshot は顧客情報を含むため Git 対象外 |
| 評価操作は監査される | `auth_audit_events` の `INQUIRY_AI_RUN_EVALUATED` 二件 | high | 管理画面の監査一覧表示は本変更範囲外 |
| 正式環境は 0.18.22 を配信済み | HTTPS Health、Direct Health、Continuous Delivery Log、配信資産 Hash | high | なし |
| Browser Console に Error 又は Warning がない | In App Browser `dev.logs` 0 件 | high | 受入操作中の対象 Tab |
