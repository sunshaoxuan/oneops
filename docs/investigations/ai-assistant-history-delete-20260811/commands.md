# コマンド記録

## 調査

1. `git fetch origin master --prune`
2. `rg` による履歴削除 Button、API Client、Gateway Route、Repository、Test の検索
3. PostgreSQL の Session 所有関係と状態の読取
4. PostgreSQL Transaction 内 DELETE と Rollback
5. `auth_audit_events` の対象 Conversation に関する READ、DELETE、結果の読取
6. Edge と In-app Browser による正式 URL の認証状態確認

## 検証

1. Portal 全試験
2. Workspace 一括試験と Production Build
3. Spring Backend 試験
4. version 0.18.8 の正式 Health、Browser、Console、Screenshot

## 配信

1. `.continuous-delivery.trigger` の更新
2. SYSTEM Continuous Delivery の `delivery_succeeded` 確認
3. 正式 HTTPS、Health、version、Asset の確認
4. Browser で削除 Modal、DELETE、Refresh、Console、Screenshot を確認
5. PostgreSQL と操作監査で削除結果を確認

Commit、Push、Tag 及び遠端一致は最終受入後に追記する。
