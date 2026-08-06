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
