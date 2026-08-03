# OneOps トランザクション型バックエンド移行リスク調査

更新日: 2026-08-03

## 結論

現在の OneOps は Node.js Gateway、React Portal、PostgreSQL、Nginx、製品構築用の Python Worker で構成されています。Node.js から PostgreSQL のトランザクションを利用できない構造ではありません。環境、認証、個人タスクの主要 Repository には `BEGIN`、`COMMIT`、`ROLLBACK`、`FOR UPDATE`、PostgreSQL Advisory Lock が実装されています。

一方、トランザクション境界は Repository ごとの手動実装です。HTTP 操作、監査、外部同期、セッション発行をまたぐ共通のアプリケーションサービス境界はありません。単一プロセスの同時実行は現行の非同期 I/O と PostgreSQL で対応できますが、100 人規模の同時利用、複数 Gateway プロセス、長時間運用を前提にすると、整合性と運用管理のリスクは中高となります。

Spring 等のトランザクション管理を備えたバックエンドへ移行する方向は合理的です。フロントエンドを維持した段階的な Strangler 移行を採用し、既存 API 契約、Cookie、CSRF、SSE、暗号化、物理 ID を最初から固定する必要があります。全機能の一括書き換えは、認証、環境、個人タスク、問合支援、AI、製品構築を同時に壊す可能性が高く、推奨しません。

## 現行構造

| 領域 | 実装 | 証拠 |
| --- | --- | --- |
| HTTP、認証、RBAC、業務 API | Node.js ESM Gateway、`127.0.0.1:8092` | `app/gateway/server.mjs` |
| ブラウザー画面 | React、TypeScript、Vite | `app/apps/portal-shell/package.json` |
| 業務データ | PostgreSQL、`pg` Pool、SQL マイグレーション | `app/gateway/*.mjs`、`app/db/migrations` |
| 製品構築 | Node Gateway が標準入出力で Python Worker を起動 | `app/gateway/builder-worker.mjs`、`app/builder/oneops_worker.py` |
| HTTPS、公開 | Nginx | `conf/nginx.conf`、`app/scripts/publish-portal.ps1` |

Python Worker は製品構築、Hyper-V、成果物作成と旧構築データ処理だけを担当します。認証、環境、個人タスク、問合支援、AI 設定の HTTP API を Python が提供しているわけではありません。

## 現在確認できるトランザクション

1. 環境 Repository は共通 `withTransaction` を持ち、環境本体と製品版数、モジュール関係を同一トランザクションで更新します。
2. Identity Repository は登録、Windows プロビジョニング、ユーザーとロール権限の更新でトランザクションと行ロックを利用します。
3. Personal Task Repository はタスクとイベント、候補採用と外部リンク、外部アカウント更新を同一トランザクションで扱います。
4. Personal Task の同期開始は、接続単位の Advisory Lock と一意制約で重複実行を抑制します。
5. PostgreSQL の主キー、外部キー、CHECK、UNIQUE、revision 条件がアプリケーション外の整合性境界を提供します。

## 現行リスク

| リスク | 評価 | 根拠と影響 |
| --- | --- | --- |
| Repository 間の共通トランザクション不足 | 高 | セッション発行と監査、ユーザー更新と監査、タスク状態とイベントが別操作です。監査失敗は `auditSafely` で握りつぶされるため、業務更新と監査の原子性を保証できません。 |
| 一部更新の部分成功 | 中高 | 個人タスクのアーカイブは本体更新後にイベントを別クエリで追加します。候補同期は項目ごとに upsert するため、途中障害時はバッチの一部だけ確定します。 |
| 複数 Gateway プロセス | 高 | SSO nonce、ログイン試行回数、組織同期状態、SSE クライアント、定期同期タイマーがプロセス内メモリにあります。プロセス間で共有されず、二重実行や認証状態差が発生します。 |
| PostgreSQL 接続数 | 高 | 8 個の Repository が個別 Pool を持ち、設定上の最大値合計は 31 接続です。プロセスを複数化すると上限がプロセス数に比例して増えます。 |
| 起動時マイグレーション | 中高 | Gateway 起動時に全 SQL ファイルを順番に実行します。複数インスタンスの同時起動を統括する専用マイグレーションロックと履歴管理が見当たりません。 |
| 外部サービスと DB の境界 | 中高 | 問合せ、Backlog、CAG、構築端末への通信は DB トランザクションの外側です。外部処理成功後の DB 更新失敗、または逆順の失敗を再実行設計で処理する必要があります。 |
| 暗号化と物理 ID の互換性 | 高 | 環境資格情報と個人接続情報の暗号化コンテキストに物理 ID が含まれます。移行時に ID、AAD、暗号文、Cookie、セッションハッシュを変更すると復号や再ログインが壊れます。 |
| Python Worker 境界 | 中 | 標準入出力 JSON、Worker 再起動、成果物ファイル、リモート端末 API の互換性を維持する必要があります。Spring 移行時に Worker まで同時変更すると範囲が広がります。 |

## Spring 等への移行リスク

### 一括書き換え

評価は高リスクです。フロントエンドが利用する URL、JSON 形、エラー Code、CSRF Cookie、SSE イベント、添付ファイルのストリーミング、代理ログインの監査を完全一致させる必要があります。データ移行では BIGINT 系台帳 ID と UUID 系認証・個人タスク ID を混在したまま保持し、暗号化認証情報を再暗号化せずに利用できるようにする必要があります。

### 段階移行

評価は中リスクです。Node Gateway を公開 API の互換層として残し、機能ごとに Spring Backend へルーティングする方式が適切です。最初の対象は組織、製品、環境の台帳系が候補です。認証と SSO は全 API の前提であるため、互換テストが整うまで Node 側へ残します。製品構築の Python Worker は Node または Spring のどちらからでも標準入出力契約で起動できるようにします。

## 推奨実施順序

### 第 0 段階: 実測基準

1. 100 同時利用者、読み取りと更新の混在、SSE 接続、個人タスク同期を含む負荷試験を作成します。
2. p95、p99、Pool 待機時間、DB ロック待機、Deadlock、エラー率、Gateway メモリを記録します。
3. 2 プロセス以上で SSO、定期同期、監査、マイグレーションの重複挙動を確認します。

### 第 1 段階: 現行 Node の境界強化

1. `withTransaction`、楽観ロック、監査書き込みを共通のアプリケーションサービスへ集約します。
2. 本体とイベントを同一トランザクションに入れ、監査を Outbox として保存して非同期配信します。
3. SSO nonce、レート制限、定期ジョブ、SSE 管理を PostgreSQL または Redis 等の共有基盤へ移します。
4. Pool を共有管理し、DB 接続上限とプロセス数から最大接続数を計算します。
5. 起動時 SQL 実行を Flyway、Liquibase または同等の履歴管理へ置き換え、分散ロックを追加します。

### 第 2 段階: 互換 Spring Backend

Spring 側では HTTP Controller、Application Service、Repository、Transaction boundary、Outbox を分離します。既存 SQL と物理 ID の互換性を優先し、最初から全テーブルを ORM の自動マッピングへ置き換えません。既存 API の契約テストを Node と Spring の双方へ適用します。

### 第 3 段階: 機能単位の切り替え

組織、製品、環境、個人タスク、問合支援、AI、認証の順に、機能単位で切り替えます。各段階で読み取り比較、更新の二重記録ではなく Outbox と監査比較、失敗時の即時 Node ルート復帰を確認します。

## 受入ゲート

1. 100 同時利用者でデータ欠落、重複、越境、Deadlock が発生しない。
2. 本体更新、イベント、監査が同一失敗単位で復旧できる。
3. 二つの Gateway プロセスで SSO、同期、レート制限、SSE が一貫する。
4. 既存フロントエンドの API 契約テストが Node と Spring で同じ結果になる。
5. 既存の暗号化認証情報、セッション、Cookie、物理 ID、監査履歴を復元できる。
6. Python Worker の標準入出力、成果物、停止、再起動、失敗隔離が回帰しない。
7. Nginx、Windows Supervisor、Gateway health、ロールバックを含む本番切り替えを検証する。

## 推奨判断

トランザクション管理と水平拡張の要求を考慮し、Spring 等の大規模バックエンドへの段階移行準備を開始する価値があります。現行 Node を直ちに廃止する判断は避け、まず第 0 段階の負荷基準と第 1 段階のトランザクション境界強化を完了してから、機能単位の移行へ進むことを推奨します。
