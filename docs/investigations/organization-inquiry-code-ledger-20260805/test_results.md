# 試験結果

更新日: 2026-08-05

## 現在までの結果

| 試験 | 結果 |
|---|---|
| Gateway、規則及び Migration | 179 件成功 |
| Builder Python | 14 件成功 |
| Portal | 18 File、152 件成功 |
| Portal Production Build | 成功 |
| Spring Backend | 成功 |
| PostgreSQL Migration 再実行 | 成功 |
| 外部 Code 例外値保存 | 成功 |
| 対応レコード UUID 物理 ID | 成功 |
| 機関 Code の既定値適用 | 成功 |
| 一時試験データ削除 | 成功 |

## 修正履歴

組織機関台帳へ並べ替え列を一つ追加したため、Portal の並べ替え関数件数契約を 10 件から 11 件へ更新した。更新後は Portal 152 件が全て成功した。

## 残る受入

正式配信後の Browser で、安全一致の対応 Code と競合及び未一致の空欄表示を確認した。Screenshot は `../organization-inquiry-customer-sync-20260805/organization_directory_final.jpg` に保存した。Browser Console の履歴取得は制御インターフェースの制約により未完了である。
