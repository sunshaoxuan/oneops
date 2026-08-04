# 検証結果

## 自動試験

| 対象 | 結果 |
| --- | --- |
| 隔離 Gateway | 157 件成功 |
| 隔離 Builder | 12 件成功 |
| 隔離 Portal | 126 件成功 |
| 主作業区 Gateway | 157 件成功 |
| 主作業区 Builder | 12 件成功 |
| 主作業区 Portal | 130 件成功 |
| Spring Backend | 27 件実行、失敗 0、DB 条件 6 件 Skip |
| 生産 Build | 成功 |

## 正式環境

| 対象 | 結果 |
| --- | --- |
| Migration 027 | `api_url` 列と `INQUIRY` 制約を確認 |
| 既存 Model 移行 | `INQUIRY`、`gpt-5.6-terra` を確認 |
| Backend | `UP` |
| Legacy Gateway | `UP` |
| Nginx | 設定試験成功 |
| HTTPS | HTTP 200 |
| Portal Asset | `index-B_1z8S2T.js`、`index-0raKnS-u.css` |

## ブラウザー

メールとパスワードのログイン画面まで確認した。ログイン後画面、コンソール、スクリーンショットは未完了である。
