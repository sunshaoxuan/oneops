# 最終受入回执

| 当初目的と制約 | 成果物 | 証拠 | 判定 |
|---|---|---|---|
| 証明書と Key を画面からアップロードできる | OneOps 製品構築画面 | DOM と payload 単体試験 | 合格。認証後 Browser は未確認 |
| アップロード後に設定へ反映する | 二つの Nginx 設定 | ZIP 内容試験 | 合格 |
| 正式資材へ収録する | `web.zip` と `OneHrStandalone.zip` | 二重 ZIP 再読込試験 | 合格 |
| インストール後に直接起動可能な配置にする | `ohr-cicd/conf_prod` | テンプレート展開経路と封包試験 | 合格 |
| 私密内容を履歴、ログ、Git に保存しない | タスク専用 TLS ディレクトリ | metadata、履歴、Repository 検査 | 合格 |
| Azure 入力を選択時だけ表示する | OneOps 製品構築画面 | DOM と JavaScript 単体試験 | 合格。認証後 Browser は未確認 |
| MinIO、RustFS、Azure を単一選択にする | UI、API、二つの Proxy 設定 | 四状態と繰返し書換試験 | 合格 |
| Azure 値を Proxy と最終設定へ反映する | `api-proxy.conf`、debug 版、`config.ini` | 最終 ZIP 再読込試験 | 合格 |
| Azure 秘密値を公開データへ保存しない | タスク専用資格情報ファイル | metadata、履歴、公開 Job、Proxy 検査 | 合格 |
| 選択した証明書と Key の実ファイル名を画面へ反映する | 名称欄、Payload、タスク値 | JavaScript と Server 単体試験 | 合格。認証後 Browser は未確認 |
| 実ファイル名で封包して Nginx から参照する | `web.zip`、二つの Nginx 設定、最終 Standalone | 二重 ZIP 再読込 | 合格 |
| 不正なファイル名と同名衝突を拒否する | Server validation | Builder 単体試験 | 合格 |
| Nginx と Redis の既定ポートを編集可能にする | OneOps 製品構築画面 | DOM と JavaScript 単体試験 | 合格。認証後 Browser は未確認 |
| Nginx の全関連 `conf_prod` を同期する | 四つの Nginx 設定、Redirect、Portal Origin、`cicd.json` | カスタムポート二重 ZIP 試験 | 合格 |
| Redis サービスと Backend 呼出を同期する | `config.ini`、`redis.windows.conf`、インストール契約 | カスタムポート二重 ZIP 試験 | 合格 |
| 不正又は競合するポートを拒否する | Server validation | 範囲、重複、OHR 競合試験 | 合格 |
| 原始 droneci を変更しない | OneOps 適配だけを変更 | Git status と原始 Repository の読取境界 | 合格 |
| 固定端口を維持する | OneOps 8092、内部橋接 8093、HTTPS 443 | Runtime Listen と Health | 合格 |
| 正式 Runtime へ反映する | Continuous Delivery Log、Builder worker、Health | 16 時 54 分の配信成功、固定端口、Health `UP` | 合格 |
| 認証後画面を確認する | Browser、Console、Screenshot | 認証済み画面 | `evidence_missing` |

最終受入は認証後 Browser が未確認のため未完了とする。完了報告及び正式リリースは行わない。
