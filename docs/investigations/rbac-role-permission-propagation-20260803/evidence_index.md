# 証跡索引

更新日: 2026-08-03

- `docs/evidence/rbac-basic-master-read-only-20260803.png`: `catalog.read` だけで基本台帳を参照し、書込操作が表示されない状態。
- `docs/evidence/rbac-role-permission-propagation-20260803.png`: `catalog.read` 撤回後に基本台帳入口が消え、ワークベンチへ遷移した状態。
- `docs/investigations/rbac-role-permission-propagation-20260803/investigation_report.md`: 原因と修正境界。
- `docs/investigations/rbac-role-permission-propagation-20260803/test_results.md`: テスト及び実環境ブラウザー検証結果。
