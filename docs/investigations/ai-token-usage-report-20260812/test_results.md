# Test結果

* 全量Gateway Test: 290件合格
* Python Worker Test: 14件合格
* Portal全Test: 229件合格
* Portal Production Build: 合格
* Migration 046 PostgreSQL適用: 合格
* 権限付与照合: `SYSTEM_ADMIN` のみ

初回全量確認ではMigration 046の権限種子が保存済みロールを再変更するTestに失敗した。`permission_seed_enabled` 条件を追加し、最終受入を先頭から再実行して全件合格した。

Runtime、Browser、Console及びScreenshotは最終受入で実施する。
