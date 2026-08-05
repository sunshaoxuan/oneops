# 製品構築端末停止時の 502 調査

## 結論

ビルド端末停止時の 502 は、OneOps Gateway の互換性スナップショットがリモート端末の `/api/system-resources` を直接取得し、その失敗を Gateway 全体の障害として扱っていたことが原因である。

旧 One構築の責務境界では、製品構築画面、履歴、端末状態、電源操作は Hyper-V 宿主側が提供し、ビルド端末はリモート実行ノードとして扱う。OneOps も同じ境界へ修正し、宿主 worker の `/api/build-terminal/status` を参照するようにした。

## 挙動経路

1. Spring Backend は固定ポート `127.0.0.1:8092` で OneOps API を提供する。
2. 内部 Node Gateway は `127.0.0.1:8093` で動作し、Python builder worker を標準入出力で管理する。
3. builder worker は宿主上で画面、履歴、端末状態、Hyper-V 電源操作を提供する。
4. ビルド端末停止時は `/api/build-terminal/status` が HTTP 200 と `stopped` を返す。
5. リモート資源値が存在しない場合は空の資源値としてスナップショットへ反映し、Gateway の健康状態を `UP` に維持する。

## 追加で確認した制御応答契約

`hyperv_host.vm_action()` は `(成功フラグ, メッセージ)` を返す。OneOps 側の包装処理はこの契約に合わせ、成功時に `requested` と `ok: true` を返すよう修正した。`D:\workspace\droneci` は変更していない。

## 配信境界

変更対象は OneOps の Gateway 適配、宿主制御包装、テスト、要件文書に限定した。構築処理、打包処理、成果物契約は変更していない。
