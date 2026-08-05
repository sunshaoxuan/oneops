# 実行記録

資格情報及び接続文字列は記録しない。

1. `node --test gateway/organization-inquiry-sync.test.mjs gateway/organization.test.mjs gateway/customer-information.test.mjs gateway/system-config.test.mjs`
2. `node --env-file=.env.local scripts/sync-inquiry-organizations.mjs --dry-run`
3. `node --env-file=.env.local scripts/sync-inquiry-organizations.mjs`
4. PostgreSQL で対応件数、UUID、組織外部キー、ソース外部キー及び同期日時を反向確認

## 正式 Browser 最終受入

- `https://192.168.20.54/master-data/organizations` を既存認証 Session で表示
- 機関 Code 表頭を操作し、昇順、降順及び再読込後の保持を確認
- ページサイズを 20、50、100 件へ順次切替
- 機関 Code 列の列幅調整を実行
- 表幅、操作列幅、調整ハンドル数及び表示行数を DOM 寸法で確認
- 正式画面を `organization_directory_final.jpg` へ保存
- Console 履歴取得 API を確認したが、現行 Browser 制御インターフェースでは利用不可
