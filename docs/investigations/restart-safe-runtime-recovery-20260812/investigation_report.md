# 再起動後 Runtime 復旧の調査報告

## 要求

Windows 再起動後も OneOps の公開 HTTPS、PostgreSQL、Backend 及び自動 SSO を復旧し、運用ユーザーの対話 Session 継続へ依存しない状態にします。

## 根因

2026-08-12 08:05、08:08、08:09 に Windows Update の計画再起動が発生しました。Docker Desktop WSL Backend は OS により終了し、Docker Engine と PostgreSQL の 55433 Port が停止しました。Gateway は Database 接続拒否で終了し、Nginx は停止済み 8092 を参照して SSO Start を HTTP 502 としました。

旧 Runtime Supervisor は `Interactive` Logon Type でした。Boot Trigger があっても運用ユーザーの Interactive Token がない状態では常駐できず、09:36 の対話ログオン後に開始して `0xC000013A` で終了しました。また Docker Desktop CLI が成功を返して Engine が未起動の場合、実行ファイルを直接起動する条件がありませんでした。

## 修正

1. Runtime Supervisor を運用ユーザーの `S4U` Principal へ変更しました。Password を保存せず、対話ログオンを待たずに Startup Trigger で実行します。
2. Docker Desktop CLI の終了 Code に関係なく Engine Readiness を再確認し、Engine が停止中で Docker Desktop Process がない場合は実行ファイルを直接起動します。
3. Installer Self Test と運用 Script Test に S4U Principal と Docker 実行ファイル直接起動の検証を追加しました。
4. 常時稼働文書へ非対話起動、S4U の境界及び直接起動動作を記録しました。

## 現在の復旧結果

- Docker Engine 29.7.2
- 保護済み `onehr-operations-postgres` は healthy
- 8092 と 8093 は Listen
- HTTPS Health は UP、upstream.online は true、Version は 0.18.20
- windowsSsoEnabled と windowsSsoAutoLogin は true
- OHR0067:8998 と 192.168.20.38:8999 は TCP 接続成功
- S4U Supervisor は Running で、開始後に `runtime_healthy` を記録
- 正式 Browser の Console Error と Warning は 0 件

## 制約

再起動そのものは現在の利用者接続を終了するため、本番 Host の追加再起動は実施していません。Startup Trigger、S4U Principal、非対話 Task Process、同一 Recovery Script の実行及び全 Runtime Readiness を組み合わせて検証しました。
