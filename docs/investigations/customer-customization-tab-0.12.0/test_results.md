# 試験結果

## 自動試験

| 試験 | 結果 |
| --- | --- |
| Portal 対象試験 | 18 Files、154 Tests 合格 |
| Gateway 全試験 | 200 Tests 合格 |
| Builder 全試験 | 14 Tests 合格 |
| Portal Production Build | 合格 |
| Spring Backend | 33 Tests 合格、7 Database Tests Skip |
| Operations Script | 9 Script Parse、全 Self Test 合格 |
| Version 同期 | `0.12.0`、旧 `0.11.0` 残存 0 件 |
| Patch Check | 合格 |

## Browser 試験

| 項目 | Desktop | 390px |
| --- | --- | --- |
| Tab 数 | 7 | 7 |
| 選択 Tab | カスタマイズ情報 | カスタマイズ情報 |
| 空状態 | 表示 | 表示 |
| Page Client/Scroll Width | 1897/1897 | 375/375 |
| Console Error | 0 | 0 |
| Console Warning | 0 | 0 |

## 配信試験

1. Continuous Delivery による配信は成功した。
2. 正式 Public Asset と Local Dist は `assets/index-mnao5iAm.js` で一致した。
3. 正式 Health は `UP`、Backend Version は `0.12.0` であった。
4. 手動追加配信は Nginx Reload Event Access Denied で失敗し、Index Rollback が実行された。
5. Rollback 後も正式 Asset、Health、Browser、Console は同じ 0.12.0 として合格した。
