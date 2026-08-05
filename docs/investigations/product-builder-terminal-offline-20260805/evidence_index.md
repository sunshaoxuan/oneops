# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
|---|---|---|---|
| 旧実装がリモート資源 API の 502 を Gateway 障害へ伝播した | `app/gateway/server.mjs` の修正前 `refreshSnapshot()` と `app/logs/gateway.log` | 高 | Runtime log は Git 管理対象外 |
| 停止状態は宿主 worker から正常応答される | `app/builder/host_standalone_console.py`、実測 `pageStatus=200`、`terminal.status=stopped` | 高 | 認証済み画面のスクリーンショットは取得していない |
| 停止中も固定入口が利用可能 | `8092` と `8093` の health が `UP`、HTTPS が 200 | 高 | 検証時点の Runtime 状態 |
| 停止中の関連 502 が解消した | 最終受入観測区間の Gateway log 検索結果 `MATCH_COUNT=0` | 高 | 観測区間外の過去ログには修正前 502 が存在する |
| 電源操作の成功応答が正しい | 停止と起動の実測結果 `requested`、`ok=true` | 高 | Hyper-V 実機一台で検証 |
| 構築機が復旧した | 最終状態 `running`、資源値取得成功 | 高 | 検証時点の Runtime 状態 |
| 原始 droneci が変更されていない | `git -C D:\workspace\droneci status --short` | 高 | ローカル作業ツリー確認 |
