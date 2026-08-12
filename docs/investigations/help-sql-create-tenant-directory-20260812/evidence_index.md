# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| Help 単独構築が 1.tenant を作成 | `test_help_only_custom_package_creates_the_tenant_product_directory` | 高 | 隔離実制品で再確認済み |
| Help SQL に削除文を付与 | 実制品 `help_sql_has_reset=true` | 高 | 固定 Help ZIP fixture |
| all.sql が Help SQL を参照 | 実制品 `all_sql_references_help=true` | 高 | 固定 Help ZIP fixture |
| 完全 SQL 資材の欠落は失敗 | `test_selected_sql_assets_still_require_complete_source_templates` | 高 | SQL 資材選択時 |
| 原始 droneci を変更しない | `git -C D:\workspace\droneci status --short` | 高 | ローカル working tree 確認 |
