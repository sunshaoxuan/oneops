# 証拠一覧

| ID | 確認事項 | 証拠 | 結果 |
| --- | --- | --- | --- |
| E1 | 実サイト顧客選択肢 | UPDS `/sssite/upds/helpdesk/` の `#id_cu` | 260 件 |
| E2 | Code 検索契約 | `organization-inquiry-sync.mjs` と実サイト `cuc` 検索 | 106 件を順次確認 |
| E3 | 安全な対応計画 | `organization-inquiry-sync.test.mjs` | 名称一意一致のみ保存 |
| E4 | 物理 ID と外部キー | Migration 030、031 | 対応 UUID、組織 ID、ソース設定 ID |
| E5 | 実データ保存 | PostgreSQL 反向確認 | 84 件、無効参照 0 件 |
| E6 | 非破壊同期 | 同期前後の組織件数 | 106 件を維持 |
| E7 | 競合保持 | 正式同期結果 | 同 Code 異名 19 件、未一致 3 件 |
| E8 | 正式 API の対応項目 | Spring `MasterDataService` | 対応台帳を物理 ID で読取及び保存 |
| E9 | 実 PostgreSQL CRUD | `MasterDataCrudDatabaseTest` | 作成、読取、更新、Rollback 合格 |
| E10 | Spring 配信監視 | `watch-and-publish.ps1` | Java、XML を監視対象へ追加 |
| E11 | 正式台帳の同期結果表示 | `https://192.168.20.54/master-data/organizations` | 安全一致だけを表示し、競合及び未一致は空欄 |
| E12 | 表頭並べ替えと状態保持 | 正式 Browser の機関 Code 表頭操作及び再読込 | 昇順、降順、再読込後保持を確認 |
| E13 | ページ件数 | 正式 Browser のページサイズ選択 | 20、50、100 件及び 6、3、2 頁を確認 |
| E14 | 列幅及び操作列 | 正式 Browser の DOM 寸法 | 7 調整ハンドル、機関 Code 列 239 px から 255 px、操作列 56 px |
| E15 | 正式画面 Screenshot | `organization_directory_final.jpg` | 機関 Code 昇順と固定操作列を記録 |
| E16 | Console | Browser 制御インターフェース | 履歴取得機能を利用できず `evidence_missing` |
