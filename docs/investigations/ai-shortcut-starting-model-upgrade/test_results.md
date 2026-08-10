# 試験結果

## 自動試験

| 試験 | 結果 | 証拠 |
|---|---|---|
| Gateway | 合格 | 226 件合格 |
| Builder Worker | 合格 | 14 件合格 |
| Portal | 合格 | 189 件合格 |
| Portal 本番 Build | 合格 | Vite 3444 modules、成果物 `index-Bgg0jF_9.js` |
| Spring Backend | 合格 | 34 件中 26 件合格、DB 前提 8 件 Skip、BUILD SUCCESS |

## Migration と Runtime

| 項目 | 結果 | 証拠 |
|---|---|---|
| 全 Migration 再実行 | 合格 | 固定ポート 8093 起動、Model 用途 `GENERAL` 1 件、`INQUIRY` 1 件 |
| クイックアシスタント開始 Model | 合格 | 有効 12 件、開始 Model 外部キー設定済み 12 件 |
| 正式 Health | 合格 | `127.0.0.1:8092`、status `UP`、version `0.17.0` |
| 正式 HTTPS | 合格 | `https://192.168.20.54/` HTTP 200、配信 Asset `index-Bgg0jF_9.js` |
| 自動交付 | 合格 | 2026-08-10 15:13:15 `delivery_succeeded` |

## 検出して修正した不具合

Migration 038 の種子挿入候補が Migration 039 の開始 Model 制約により `ON CONFLICT` 判定前に拒否された。038 の種子既定を無効へ変更し、039 で開始 Model を関連付けたシステム種子だけを有効化した。修正後に固定ポート起動、8 秒以上の継続 Health、起動ログを再確認し、同じ制約違反が再発しないことを確認した。

## Browser、Console、Screenshot

`evidence_missing`。Browser skill で正式 HTTPS のローカルネットワーク IP を開こうとしたが、Browser URL Policy により対象 URL が拒否された。同じ Policy が別 Browser Surface への切替も禁止するため、画面表示、Console、Screenshot の自動証拠を取得できなかった。
