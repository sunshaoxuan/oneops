# OneOps 常時稼働運用

更新日: 2026-07-30

## 1. 目的

OneOps を Windows ホスト上で長期間継続運転し、Docker Desktop、PostgreSQL、Gateway、自動 SSO、Nginx HTTPS の停止を自動検出して復旧します。

## 2. 稼働構成

Windows タスク `OneOps Runtime Supervisor` は、システム起動時と運用ユーザー `TS2DEVSERVER\Administrator` のログオン時に開始します。タスクは最高権限で実行し、30 秒間隔で次の状態を確認します。

1. Docker Engine が API 要求を処理できること。
2. 外部ボリューム `onehr-operations-postgres-data` が存在すること。
3. コンテナー `onehr-operations-postgres` が `healthy` であること。
4. Gateway タスク `OneHR Operations Compat Gateway` が認証設定を返すこと。
5. `windowsSsoEnabled` と `windowsSsoAutoLogin` が `true` であること。
6. SSO URL が `http://OHR0067:8998/oneops_sso.jsp` であること。
7. OHR0067 の 8998 番ポートへ接続できること。
8. `https://192.168.20.54/` が応答すること。

常駐監視自体が異常終了した場合、Windows タスクスケジューラは 1 分間隔で最大 999 回再起動します。実行時間の上限は設定しません。常駐監視が Docker Engine の停止を検出した場合は Docker Desktop を起動します。`com.docker.service` は自動起動とサービス再起動を設定します。

## 3. データ保護

PostgreSQL の正本データは Docker 外部ボリューム `onehr-operations-postgres-data` に保存します。復旧処理は既存コンテナーの起動、または同じ外部ボリュームを参照するコンテナー再作成だけを実行します。

外部ボリュームが見つからない場合、復旧処理は異常として停止し、空の代替ボリュームを作成しません。この動作により、データ消失を稼働復旧として誤認する状態を防ぎます。

`.env.local` の自動 SSO 値は原子的に更新します。共有秘密、データベース接続情報、その他の環境値は維持します。ログには秘密情報を記録しません。

## 4. インストール

管理者 PowerShell で次のコマンドを実行します。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\install-runtime-supervisor.ps1 -AppRoot D:\nginx\app
```

インストーラーは運用スクリプトの単体テストを実行した後、Windows タスクと Docker サービス起動設定を登録して常駐監視を開始します。

## 5. 状態確認

一回限りの復旧と確認は次のコマンドで実行します。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\ensure-oneops-runtime.ps1 -AppRoot D:\nginx\app
```

常駐タスクの確認は次のコマンドで実行します。

```powershell
Get-ScheduledTask -TaskName "OneOps Runtime Supervisor"
Get-ScheduledTaskInfo -TaskName "OneOps Runtime Supervisor"
Get-Content D:\nginx\app\logs\runtime-supervisor.log -Tail 50
```

ログは 5 MiB でローテーションし、直前のファイルを `runtime-supervisor.log.previous` として保持します。

## 6. 復旧動作

| 障害 | 自動復旧 |
| --- | --- |
| Docker Engine 停止 | Docker サービスと Docker Desktop を起動して API 応答を待機 |
| PostgreSQL コンテナー停止 | 保護済み外部ボリュームを維持して起動 |
| PostgreSQL コンテナー消失 | Compose から同じ外部ボリュームを参照して再作成 |
| Gateway 停止 | Windows タスクを起動し、認証設定の正常化を待機 |
| 自動 SSO 無効 | `.env.local` を原子的に修正し、Gateway を再起動 |
| Nginx 停止 | `D:\nginx\nginx.exe` を起動し、HTTPS 応答を待機 |
| SSO 代理到達不能 | ログへ記録し、次回の 30 秒巡検で再確認 |

## 7. 運用境界

この仕組みはホスト OS が稼働し、ローカルディスクと運用ユーザープロファイルが利用できる状態を対象にします。停電、ホスト障害、ネットワーク設備障害、OHR0067 自体の障害は別の可用性層です。これらの層には UPS、ホスト自動起動、ネットワーク監視、OHR0067 側の監視を組み合わせます。

Windows 更新などで再起動が必要な場合、再起動後の運用ユーザーログオンにより Docker Desktop と常駐監視が開始します。無人再起動を運用する場合は、対象 Windows 環境のサインイン方式と Docker Desktop のライセンス運用を事前に確認します。

## 8. ロールバック

常駐監視を解除する場合は次のコマンドを実行します。

```powershell
Unregister-ScheduledTask -TaskName "OneOps Runtime Supervisor" -Confirm:$false
```

Docker サービスの起動方式を手動へ戻す場合は次のコマンドを実行します。

```powershell
Set-Service -Name "com.docker.service" -StartupType Manual
```

ロールバックは OneOps のデータベースボリュームを変更しません。
