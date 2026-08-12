# 試験結果

## Builder

- builder test: 16 件成功
- Python compile: 成功
- 日文と版数規約 test: 5 件成功
- Gateway test: 306 件成功

## 実制品

源 SQL template directory を存在させず、顧客化 Help 単独構築を実行した。

| 項目 | 結果 |
|---|---|
| `製品/1.tenant` | 作成 |
| `製品/1.tenant/ohr_help.sql` | 作成 |
| `DELETE FROM ohr_help;` | 先頭に存在 |
| `製品/1.tenant/all.sql` | 作成 |
| `all.sql` の `ohr_help.sql` 参照 | 存在 |
| `製品/2.ohr` | 作成しない |

## 全体 check の基線制限

Portal test と production build は `origin/master` 既存の Windows identity API 不整合で失敗した。`IdentityManagementPage.tsx` が `bindManagedUserWindowsIdentity` と `unbindManagedUserWindowsIdentity` を参照する一方、API client に同 export が存在しない。本タスクの変更ファイルに Portal 差分はない。
