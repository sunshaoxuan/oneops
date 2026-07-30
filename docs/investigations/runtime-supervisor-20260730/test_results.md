# テスト結果

実施日: 2026-07-30

## 自動テスト

| テスト | 結果 |
| --- | --- |
| Gateway Node テスト | 130 件成功 |
| 構築器 Python テスト | 4 件成功 |
| Portal Vitest | 98 件成功 |
| TypeScript と Vite 本番ビルド | 成功 |
| 運用スクリプト解析と SelfTest | 成功 |
| Nginx 設定検査 | 成功 |
| HTTPS 公開 | 成功 |

Vite は 1100 kB を超える JavaScript チャンクを警告しました。ビルド、公開、実行結果は正常です。

## 受入試験

### PostgreSQL と Gateway の停止

`onehr-operations-postgres` と `OneHR Operations Compat Gateway` を同時に停止しました。

| 経過 | PostgreSQL | Gateway |
| ---: | --- | --- |
| 5 秒 | unhealthy | Ready |
| 11 秒 | unhealthy | Ready |
| 16 秒 | starting | Ready |
| 22 秒 | healthy | Running |

結果: 自動復旧成功。

### Docker Desktop の停止

Docker Desktop 全体を停止しました。最初の試験で CLI エラー処理の欠陥を検出して修正しました。修正後の再試験結果は次のとおりです。

| 確認時刻 | Docker Engine | PostgreSQL |
| --- | --- | --- |
| 12:34:26 | 利用可能 | unhealthy |
| 12:34:31 | 利用可能 | starting |
| 12:34:36 | 利用可能 | healthy |

復旧ログは `docker_service_started`、`docker_desktop_start_requested`、`database_container_started` の順に記録されました。

結果: 自動復旧成功。

### 復旧後の状態

| 項目 | 結果 |
| --- | --- |
| HTTPS Health | UP |
| Windows SSO Enabled | true |
| Windows SSO Auto Login | true |
| Windows SSO URL | `http://OHR0067:8998/oneops_sso.jsp` |
| OHR0067 8998 TCP | 到達可能 |
| ユーザー | 12 件 |
| Windows 外部アイデンティティ | 12 件 |
| EnvPortal 移行監査 | 12 件 |

## ブラウザー

内蔵ブラウザーで自動 SSO 開始画面まで確認しました。内蔵ブラウザーには Windows ドメインログオン状態が存在しないため、EnvPortal の統合 Windows 認証完了は対象外です。

同じブラウザーでローカル管理者の予備ログインを使用し、公開済み画面を確認しました。

| 項目 | 結果 |
| --- | --- |
| URL | `https://192.168.20.54/` |
| 画面版数 | OneOps v0.5.1 |
| システム状態 | 正常 |
| ブラウザー Console warning | 0 |
| ブラウザー Console error | 0 |
| スクリーンショット | `docs/evidence/runtime-supervisor-sso-0.5.1.png` |

実ドメインユーザーによる統合 Windows 認証の最終確認は、`TOKYO` ドメインへログオン済みの Edge で実施します。サービス側の自動 SSO 設定、代理到達性、ユーザー関連付けは正常です。
