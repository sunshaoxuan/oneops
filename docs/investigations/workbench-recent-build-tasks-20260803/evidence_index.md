# 証跡索引

| 確認事項 | 証跡 | 確度 | 制約 |
| --- | --- | --- | --- |
| 本機の構築履歴が残っている | `app/builder-data/standalone-builds/*/metadata.json`、件数確認結果 14 件 | 高 | Runtime データのため Git 管理対象外 |
| 構築端末にも履歴が残っている | `http://192.168.250.50:8090/api/builds`、件数確認結果 14 件 | 高 | 調査時点の状態 |
| Spring が空配列を返していた | 修正前 `WorkbenchController.snapshot()` の `tasks = List.of()` | 高 | 0.8.2 の実装 |
| 既存 Gateway は実スナップショットを生成する | `app/gateway/server.mjs` の `refreshSnapshot()`、`app/gateway/lib.mjs` の `buildSnapshot()` | 高 | 完全 Spring 移行までの互換経路 |
| 修正後 Controller は実スナップショットへ接続する | `app/backend/src/main/java/jp/onehr/oneops/workbench/web/WorkbenchController.java` | 高 | loopback 互換サービスが必要 |
