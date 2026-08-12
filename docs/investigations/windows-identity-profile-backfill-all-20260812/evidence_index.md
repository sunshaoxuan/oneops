# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| Windows Identity は 14 件で全て TOKYO | Production Read-only 集計 | 高 | 個人値は出力していない |
| UPN、Username、表示名は全件存在する | Production Read-only 集計 | 高 | Browser 表示は配信後に確認する |
| Domain と Domain Username は全件 Metadata 未保存 | Production Read-only 集計 | 高 | Migration 適用前の値 |
| 企業メールは 12 件未登録 | Production Read-only 集計と EnvPortal 契約 | 高 | UPN を企業メールへ転用しない |
| Migration は 14 件を補完し欠損を 0 にする | Transaction Rollback 検証 | 高 | Production Apply は配信段階で実施する |
| 将来書込みも完全 Metadata を保存する | Identity Database、EnvPortal Import | 高 | 全量試験を実施する |
| 管理画面は全档案と未登録状態を表示する | IdentityManagementPage、UI 試験 | 高 | Browser を配信後に確認する |
