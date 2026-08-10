# OneOps 常時稼働運用

更新日: 2026-08-10

## 1. 目的

OneOps を Windows ホスト上で長期間継続運転し、Docker Desktop、PostgreSQL、Gateway、自動 SSO、Nginx HTTPS の停止を自動検出して復旧します。Windows ドメイン利用者は最初に SSO を試行し、認証失敗時は OneOps のローカルログインへ戻ります。

## 2. 稼働構成

Windows タスク `OneOps Runtime Supervisor` は、システム起動時と運用ユーザー `TS2DEVSERVER\Administrator` のログオン時に開始します。タスクは最高権限で実行し、30 秒間隔で次の状態を確認します。

1. Docker Engine が API 要求を処理できること。
2. 外部ボリューム `onehr-operations-postgres-data` が存在すること。
3. コンテナー `onehr-operations-postgres` が `healthy` であること。
4. Gateway タスク `OneHR Operations Compat Gateway` の公開 Health が `UP`、`upstream.online=true` を返し、内部 Node Gateway の Database Migration と接続確認が完了していること。
5. `windowsSsoEnabled` と `windowsSsoAutoLogin` が `true` であること。
6. SSO URL が `http://OHR0067:8998/oneops_sso.jsp` であること。
7. OHR0067 の 8998 番ポートへ接続できること。
8. `https://192.168.20.54/` が応答すること。

常駐監視自体が異常終了した場合、Windows タスクスケジューラは 1 分間隔で最大 999 回再起動します。実行時間の上限は設定しません。常駐監視が Docker Engine の停止を検出した場合は Docker Desktop を起動します。`com.docker.service` は自動起動とサービス再起動を設定します。

継続的デリバリーがローリング配信を実行している間、常駐監視は復旧処理を見送ります。両処理は `Global\OneOpsContinuousDelivery` Mutex で排他し、公開の正常な Gateway 切替と障害復旧を区別します。

## 3. ローリング配信

Gateway を含む変更は、主系を稼働させたまま予備系 `8094` と内部互換 Gateway `8095` を起動する。予備系 Spring は自身の内部 Port `8095` だけへ未移行 API を転送する。予備系 Health の `status=UP`、`upstream.online=true`、ルート `VERSION` との一致が 5 秒間連続した後、`conf/oneops-backend-upstream.conf` を原子的に更新し、Nginx の設定試験と平滑 Reload で公開 API を予備系へ切り替える。

予備系が公開要求を処理している間に主系 `8092` と内部互換 Gateway `8093` を新成果物で起動する。主系 Health が同じ条件で 5 秒間連続して合格した後に Nginx を主系へ戻し、予備系を終了する。主系の再起動に失敗した場合は予備系への流量を維持し、公開可用性を保持した状態で異常を記録する。

Portal は Hash 付き Asset を先に配信し、Backend の切替後に `index.html.next` を `index.html` へ原子的に移動する。旧 HTML は新 Backend への切替中も利用でき、新 HTML の公開時点では対応 API が利用可能となる。

## 4. データ保護

PostgreSQL の正本データは Docker 外部ボリューム `onehr-operations-postgres-data` に保存します。復旧処理は既存コンテナーの起動、または同じ外部ボリュームを参照するコンテナー再作成だけを実行します。

Node Gateway の Migration 全体は同一 Database Session の PostgreSQL Advisory Lock 内で直列実行し、単一 Transaction で Commit します。途中で一件でも失敗した場合は全変更を Rollback します。再実行時は管理画面で変更した Role、製品台帳、社内部門、職責、顧客ナレッジ選択肢、既定 Model 及びクイックアシスタント設定を Seed 値へ戻しません。

外部ボリュームが見つからない場合、復旧処理は異常として停止し、空の代替ボリュームを作成しません。この動作により、データ消失を稼働復旧として誤認する状態を防ぎます。

`.env.local` の `OPS_ENVPORTAL_SSO_URL`、`OPS_ENVPORTAL_PROFILE_URL`、`OPS_SSO_AUTO_LOGIN` を SSO の正規値へ原子的に更新します。共有秘密、データベース接続情報、その他の環境値は維持します。ログには秘密情報を記録しません。

## 5. インストール

管理者 PowerShell で次のコマンドを実行します。

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\install-runtime-supervisor.ps1 -AppRoot D:\nginx\app
```

インストーラーは運用スクリプトの単体テストを実行した後、Windows タスクと Docker サービス起動設定を登録して常駐監視を開始します。

## 6. 状態確認

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

## 7. 復旧動作

| 障害 | 自動復旧 |
| --- | --- |
| Docker Engine 停止 | Docker サービスと Docker Desktop を起動して API 応答を待機 |
| PostgreSQL コンテナー停止 | 保護済み外部ボリュームを維持して起動 |
| PostgreSQL コンテナー消失 | Compose から同じ外部ボリュームを参照して再作成 |
| Gateway 停止、内部 Node Gateway 停止、Database Readiness 不成立 | Windows タスクを起動し、複合 Health と認証設定が 5 秒間連続して正常になるまで待機 |
| 自動 SSO 無効、または SSO URL 不整合 | `.env.local` の EnvPortal SSO URL、プロファイル検証 URL、自動ログイン設定を原子的に修正し、Gateway を再起動 |
| SSO 代理到達不能 | ログへ記録し、次回の 30 秒巡検で再確認 |
| Nginx 停止 | `D:\nginx\nginx.exe` を起動し、HTTPS 応答を待機 |

## 8. 運用境界

この仕組みはホスト OS が稼働し、ローカルディスクと運用ユーザープロファイルが利用できる状態を対象にします。停電、ホスト障害、ネットワーク設備障害、OHR0067 自体の障害は別の可用性層です。これらの層には UPS、ホスト自動起動、ネットワーク監視、OHR0067 側の監視を組み合わせます。

Windows 更新などで再起動が必要な場合、再起動後の運用ユーザーログオンにより Docker Desktop と常駐監視が開始します。無人再起動を運用する場合は、対象 Windows 環境のサインイン方式と Docker Desktop のライセンス運用を事前に確認します。

## 9. ロールバック

常駐監視を解除する場合は次のコマンドを実行します。

```powershell
Unregister-ScheduledTask -TaskName "OneOps Runtime Supervisor" -Confirm:$false
```

Docker サービスの起動方式を手動へ戻す場合は次のコマンドを実行します。

```powershell
Set-Service -Name "com.docker.service" -StartupType Manual
```

ロールバックは OneOps のデータベースボリュームを変更しません。
