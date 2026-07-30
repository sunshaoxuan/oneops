# OneOps 常時稼働調査報告

調査日: 2026-07-30

## 1. 対象

OneOps の HTTPS 入口、Nginx、Gateway、PostgreSQL、Docker Desktop、OHR0067 の EnvPortal SSO 代理、Windows 起動方式を対象としました。

## 2. 初期状態

調査開始時は Nginx の静的画面が応答していました。Docker Desktop は停止し、PostgreSQL の 55433 番ポートは接続不能、Gateway API は 502、Gateway タスクの直近結果は 1 でした。OHR0067 の 8998 番ポートは応答し、未認証アクセスへ 401 を返していました。

`D:\nginx\app\.env.local` の `OPS_SSO_AUTO_LOGIN` は `false` でした。OneOps の画面が利用できても、認証処理は自動 SSO を開始しない状態でした。

## 3. データ確認

Docker Desktop と既存 PostgreSQL コンテナーを起動し、外部ボリューム `onehr-operations-postgres-data` の継続利用を確認しました。復旧後のデータ件数は次のとおりです。

| 項目 | 件数 |
| --- | ---: |
| OneOps ユーザー | 12 |
| Windows 外部アイデンティティ | 12 |
| EnvPortal ユーザー移行監査 | 12 |
| SYSTEM_ADMIN | 1 |
| OPERATOR | 2 |
| VIEWER | 9 |

スーパー管理者 `sun.shaoxuan@onehr.jp` は ACTIVE、表示名 `孫　紹煊`、Windows アカウント `TOKYO\x02851`、UPN `x02851@tokyo.scientia.co.jp`、ロール `SYSTEM_ADMIN` を維持していました。

## 4. 原因

サービス停止の直接原因は Docker Desktop の停止です。Nginx は静的資産を配信できるためログイン画面が表示され、PostgreSQL と Gateway を必要とする API は利用できない状態になりました。

自動 SSO が始まらない直接原因は `OPS_SSO_AUTO_LOGIN=false` です。ユーザーデータと SSO 外部アイデンティティは保護済み PostgreSQL ボリュームに残っていました。

Windows 起動時に Docker Desktop、PostgreSQL、Gateway、SSO、HTTPS を一体で検証して復旧する監視が存在しなかったため、ホスト再起動後の停止が継続しました。

## 5. 実装

次の運用スクリプトを追加しました。

* `ensure-oneops-runtime.ps1`
* `watch-oneops-runtime.ps1`
* `install-runtime-supervisor.ps1`

Windows タスク `OneOps Runtime Supervisor` はシステム起動時と運用ユーザーのログオン時に開始し、30 秒間隔で稼働状態を確認します。Docker Desktop の停止時は `docker desktop start` を要求し、PostgreSQL、Gateway、Nginx を順に復旧します。

PostgreSQL の復旧は外部ボリュームの存在を必須条件とします。ボリュームが見つからない状態では空データベースを作成しません。

## 6. 実装中に判明した失敗モード

最初の Docker Desktop 停止試験では、Docker CLI の標準エラーが PowerShell の停止例外になり、起動分岐へ到達しませんでした。CLI の準備判定だけエラー出力を抑制し、終了コードで判断するように修正しました。Docker Desktop の起動は `docker desktop start` を優先します。

修正後の同一試験では Docker Engine が復帰し、PostgreSQL は `unhealthy`、`starting`、`healthy` の順に回復しました。最終的に Gateway の健康状態 `UP`、自動 SSO `true`、8998 到達、ユーザー 12 件を確認しました。

## 7. 運用境界

本対策は Windows ホスト、ローカルディスク、運用ユーザープロファイルが利用できる状態を対象とします。停電、物理ホスト障害、ネットワーク設備障害、OHR0067 自体の障害は別の可用性層で監視します。

ホスト再起動そのものは業務影響を伴うため今回の受入試験には含めていません。開機トリガー、ログオントリガー、タスク再起動設定、Docker Desktop 停止からの実復旧を検証しました。
