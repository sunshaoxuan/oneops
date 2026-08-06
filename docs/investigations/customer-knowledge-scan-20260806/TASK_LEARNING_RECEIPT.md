# タスク学習記録

- task_type: 顧客台帳と学習済みナレッジの連携
- reusable_pattern: 非同期 Scan 物理記録、Citation 照合、候補物理 ID、確認後反映、可視 Learning Gap
- failure_or_correction: CAG 0.22.8 の Knowledge Retrieval が API Process を阻害し、Cancel Request が Lease 回復時に消去された
- candidate_skill: enterprise-knowledge-to-ledger-scan
- candidate_validator: knowledge citation foreign-reference validator
- install_status: candidate only
- evidence_paths: `investigation_report.md`、`evidence_index.md`、CAG Gateway Supervisor Log

## 受入方法

1. 根拠 Citation と一致しない候補が保存されないこと。
2. CAG が Timeout しても OneOps 画面が応答し、失敗理由を表示すること。
3. 反映した契約及び VPN が組織機関物理 ID を保持すること。
4. Scan、Candidate 及び反映先の物理 ID と外部キーを確認すること。

## Rollback

Migration 032 の Table と Scan API、Portal Scan Card を同一変更として削除する。既存の契約、VPN、環境台帳は変更しない。
