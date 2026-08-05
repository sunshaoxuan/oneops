# 検証結果

## 自動試験及び Build

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| Gateway | 166 件合格 | `node --test gateway/*.test.mjs` |
| Builder | 14 件合格 | `HV_HYPERV_VM_NAME=oneops-test-vm python -m unittest builder/oneops_worker_test.py` |
| Portal | 137 件合格 | `vitest run` |
| Portal Production Build | 合格 | Vite 3405 modules |
| Spring Backend | 通常モード 33 件合格、7 件 Skip。Database モード 33 件合格、Skip 0 件 | `mvnw.cmd test`、`ONEOPS_DATABASE_INTEGRATION_TEST=true mvnw.cmd test` |
| Migration 028 | 合格 | 独立 PostgreSQL 18.4 |
| Database 操作 | 合格 | 契約、VPN、Backlog 対応、有効サービス、revision 更新 |

Spring Database 試験の初回実行は独立試験 DB に有効利用者 Fixture がなく 2 件失敗した。`integration_user` と `SYSTEM_ADMIN` ロールを追加した後、完全試験の先頭から再実行して 33 件すべて合格した。

最新 `origin/master` の Builder 試験は `HV_HYPERV_VM_NAME` を実行前提とする。初回全量試験では未設定のため 1 件失敗した。現在の検証範囲に限定した非機密の試験値を設定し、Gateway から全量試験を再実行して 166 件、14 件、137 件がすべて合格した。

Database モードの最初の再確認では `OPS_CREDENTIAL_ENCRYPTION_KEY` が未設定で Spring が安全に起動を拒否した。現在の試験プロセスだけへ試験鍵を設定し、33 件を先頭から再実行して Skip 0 件で合格した。

## Browser

| 項目 | 結果 |
| --- | --- |
| 旧 `/environments` の `/customers` 正規化 | 合格 |
| 六頁の順序と内容 | 合格 |
| 基本情報、契約、サービス、VPN、サーバー詳細 | 合格 |
| 問合第 2 頁 | 合格。問合番号 94031 を確認 |
| Backlog 第 3 頁 | 合格。チケット C001-43 を確認 |
| VPN 状態の日本語表示 | 合格 |
| 広幅の頁全体横方向溢れ | なし |
| 705 px の頁全体横方向溢れ | なし。`scrollWidth` と `clientWidth` は 705 |
| Console warning | 0 件 |
| Console error | 0 件 |
| Screenshot | 2 件保存 |

Browser は隔離 Fixture API を使用した。正式 HTTPS 配信の確認は配信判断後に実施する。
