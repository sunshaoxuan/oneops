# 証跡索引

| ID | 要求 | 証跡 |
| --- | --- | --- |
| E-01 | 外部担当者物理値を使用する | `personal-task-connectors.mjs`、Gateway Test |
| E-02 | CLOSED 実値を使用する | Portal `close` Option、Portal Test |
| E-03 | 全件退行を保存しない | `sourceTruncated` Guard、Gateway Test |
| E-04 | 条件変更後に再生成する | `filter_revision`、`REGENERATE` Route |
| E-05 | 条件外候補を一覧から除く | Repository の `STALE` 照合 |
| E-06 | 採用済みと除外を保持する | Repository の Disposition CASE |
| E-07 | 一覧を動的更新する | React Query `refetchInterval: 60_000` |
| E-08 | Migration を適用できる | PostgreSQL Transaction 内 Dry Run |
| E-09 | 本番条件が自分かつ未完了である | DB `filter_json={"status":"open","assigneeMode":"ME"}` |
| E-10 | 旧候補を一覧から除く | 本番 `REGENERATE` の `stale_count=500`、`PENDING=0` |
| E-11 | 版数と候補件数を表示する | `docs/evidence/personal-task-candidate-final-20260806.jpg` |
| E-12 | 担当者、状態、高度条件を編集する | `docs/evidence/personal-task-connection-filter-final-20260806.jpg`、`docs/evidence/personal-task-advanced-filter-final-20260806.jpg` |
| E-13 | 狭幅で横方向超過を防ぐ | `docs/evidence/personal-task-connection-filter-narrow-final-20260806.jpg`、Browser Dimension 計測 |
| E-14 | Runtime と配信を確認する | Continuous Delivery Log、HTTPS Health、Nginx Test、Port 待受 |
| E-15 | Browser に実行時異常がない | `tab.dev.logs` の Error 0 件、Warning 0 件 |
