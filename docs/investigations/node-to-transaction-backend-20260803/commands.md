# 調査コマンド

| コマンド | 目的 | 結果 |
| --- | --- | --- |
| `git status --short` | 変更範囲の確認 | 既存 Builder 変更のみ、今回調査では編集なし |
| `rg -n -i "transaction|begin|commit|rollback|pool.query|for update|advisory|lock" app/gateway app/db app/scripts docs` | トランザクションとロックの実装を収集 | Repository ごとの手動トランザクションと Advisory Lock を確認 |
| `rg -n "new Pool|max:" app/gateway` | 接続 Pool 数と上限を収集 | 8 Pool、設定上限合計 31 接続 |
| `rg -n "new Map|setInterval|nonceStore|organizationSourceSyncing|personalTaskSyncTimer" app/gateway` | プロセス内状態と定期処理を収集 | 複数プロセス共有が必要な状態を確認 |
| `rg --files app -g 'pom.xml' -g 'build.gradle' -g 'build.gradle.kts'` | Spring 構成ファイルの確認 | 該当ファイルなし |
| `rg -n "org.springframework|spring-boot|@SpringBootApplication" app/gateway app/apps app/packages app/builder app/scripts` | Spring 実装参照の確認 | OneOps 実装参照なし。成果物メタデータの `Spring-Boot-Version` は別用途 |
