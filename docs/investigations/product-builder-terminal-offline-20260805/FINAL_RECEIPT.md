# 最終受入回执

## 当初目的と制約

| 当初項目 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| ビルド端末停止中も製品構築ページを利用できる | 宿主状態 API を利用する Gateway 更新 | 停止中のページ HTTP 200、本文確認 | 合格 |
| 停止中も端末状態を確認できる | `/api/build-terminal/status` | HTTP 200、`stopped` | 合格 |
| 停止中も起動操作を実行できる | Hyper-V 応答契約の修正 | 起動 API が `requested` と `ok=true`、実機が `running` | 合格 |
| 停止状態を 502 として扱わない | Gateway 健康取得経路の修正 | `8092` と `8093` が `UP`、関連 502 が 0 件 | 合格 |
| ポートを変更しない | 既存 Runtime 構成 | `8092` 固定、`8093` 内部橋接、`8091` なし | 合格 |
| 原始 droneci 構築と打包処理を変更しない | OneOps 適配層だけの差分 | `D:\workspace\droneci` に変更なし | 合格 |
| 要件文書を更新する | `docs/PRODUCT_BUILDER_REQUIREMENTS.md` | 停止中の利用要件と受入条件を追加 | 合格 |
| 試験後に正式 Git へ反映する | 本タスクの commit | test、build、Runtime 受入後に `origin/master` へ push | 実行待ち |

## 返却状態

受入試験後、ビルド端末は `running` へ復旧した。OneOps の固定入口と内部橋接は `UP` である。
