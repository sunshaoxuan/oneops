# OneOps Portal

OneHR の保守運用ワークセンターを構成する Portal Shell、リアルタイム互換 Gateway、PostgreSQL 組織機関台帳です。

Spring Boot バックエンドは `backend` に配置します。現行 API 契約を維持するため、移行済みの認証、基本台帳、環境 API を Spring が処理し、移行対象外の既存 API は Spring が管理する本機専用互換ブリッジへ転送します。ブリッジは外部公開せず、127.0.0.1:8093 だけを使用します。

現行バージョンは `0.18.21` です。ルートの `VERSION`、`CHANGELOG.md`、`docs/VERSIONING.md` にプロジェクトバージョンとリリース規約を記録します。

プロジェクトルートは `D:\nginx` です。詳細な規約と要件は次の文書を参照してください。

* `D:\nginx\docs\PROJECT_RULES.md`
* `D:\nginx\docs\ORGANIZATION_DIRECTORY_REQUIREMENTS.md`
* `D:\nginx\docs\ENVIRONMENT_MANAGEMENT_REQUIREMENTS.md`
* `D:\nginx\docs\AUTHENTICATION_AND_RBAC_REQUIREMENTS.md`
* `D:\nginx\docs\PERSONAL_TASKS_REQUIREMENTS.md`
* <code>D:\nginx\docs\SPRING_BOOT_BACKEND_DETAILED_DESIGN.md</code>

## コマンド

```powershell
D:\nginx\start.ps1
```

Spring Boot バックエンドのテストと JAR 作成:

```powershell
D:\nginx\app\backend\mvnw.cmd test
D:\nginx\app\backend\mvnw.cmd package
```

Windows タスクの切替前に Portal の完全テストと Java のテストを実行します。切替後の復旧はタスク Action を旧 Gateway 起動へ戻し、8092 Health と Portal を確認します。

組織機関台帳は物理 ID を主キーとし、業務コードを一意に保ちます。一般画面には物理 ID を表示しません。データソース一覧は `config/system.config.json` に保存し、Excel データソースから区分、機関 Code、機関名、略称、保守有無を増分インポートします。

環境情報機能は利用可能です。現在の組織機関物理 ID に基づき、環境グループ、環境、製品版数の関係を読み込み、編集、絞込み、複製、並べ替え、アーカイブ、復元を行えます。サーバー接続先を追加・編集でき、接続先のアカウントとパスワードは暗号化保存、表示、コピー、更新に対応します。VPN、資料証跡、AI 解析は後続段階で実装します。

個人タスク機能は、期限タスクと長期タスク、外部サービスから取得した候補、AI Prompt を現在の OneOps ユーザー単位で管理します。問合せサイトと Backlog の個人認証情報は暗号化し、本人だけが表示、コピー、接続確認、同期を実行できます。Backlog の検索条件は接続先から取得したプロジェクト及び状態の物理 ID を選択して保存します。外部案件は候補として取り込み、利用者が確認した後に正式なタスクへ変換します。

製品と版数は、組織区分と同じ階層にあるシステム共通の基本台帳です。台帳内は製品、版数、機能モジュールの 3 階層で管理します。組織環境は製品版数の物理 ID を参照し、その版数で実際に購入した機能モジュールを登録します。

EnvPortal データは一回限りのインポートコマンドで移行します。既定ではドライランを実行し、`--apply` 指定時だけデータベースへ書き込みます。インポーターはファイルハッシュと秘匿化した行フィンガープリントで重複を排除し、既存の同名環境を競合レポートへ出力します。ログイン ID、パスワード、データベースユーザーは暗号化認証情報テーブルへ保存し、ステージング行、レポート、ログには項目数だけを記録します。

移行時は OneOps に登録済みの機関別製品資料も読み取り、環境範囲に応じたグループへ配置し、URL、DB、RDP を接続先へ分離します。根拠のある製品は確認待ち候補として登録します。UHR は独立製品 U-PDS給与明細として識別し、実際の版数は機能モジュール単位で確認します。機関単位の製品列はモジュール候補として保持し、正式な機能モジュール台帳と完全一致した場合だけ関係を作成します。

```powershell
D:\nginx\runtime\node\node.exe --env-file=.env.local scripts/import-envportal.mjs --source-root D:\workspace\envPortal --dry-run
```

ユーザー登録、ログイン、セッション、Windows SSO 自動登録、標準 RBAC はワークセンター Gateway に接続済みです。最初の登録ユーザーがシステム管理者の初期設定を完了し、その後のユーザーはシステム管理者が審査して、システム範囲または組織機関範囲のロールを割り当てます。

本番ホストは初回アクセス時に Windows SSO を自動試行し、ログイン画面にも SSO の入口を常時表示します。SSO 認証に失敗した場合、または利用者が明示的にログアウトした場合は OneOps が管理するユーザー名とパスワードの入力へ戻ります。ユーザー台帳、外部アイデンティティ、Session と Role は OneOps が独立管理します。

常時稼働は Windows タスク `OneOps Runtime Supervisor` が 30 秒間隔で監視します。Docker Desktop、保護済み PostgreSQL ボリューム、データベースコンテナー、Spring と内部 Node Gateway の複合 Readiness、自動 SSO 設定、Nginx HTTPS を確認し、停止した構成要素を復旧します。SSO 認証に失敗した場合は画面上のローカルログインへ戻ります。インストールと運用手順は `D:\nginx\docs\RUNTIME_AVAILABILITY.md` を参照してください。

ユーザーロール割当の範囲選択では、既定値として「全体」を選択します。この値はロール権限がすべての組織機関に適用されることを表します。単一の組織機関へ制限する場合に具体的な組織を選択します。

EnvPortal 本番ユーザーは独立した一回限りのインポートコマンドで移行します。インポーターは既定でドライランを行い、完全な Windows ドメインアカウントと信頼できる企業メールで既存ユーザーを統合し、既存 OneOps ロールを維持します。新規ユーザーの旧 `admin` は全体範囲の `OPERATOR`、その他の旧ロールは全体範囲の `VIEWER` へ変換します。企業メールを推測せず、移行元スナップショット、移行先スナップショット、ハッシュ、移行レポート、監査イベントを保存します。

ローカル検証コマンド:

```powershell
$env:PATH="D:\nginx\runtime\node;$env:PATH"
pnpm check
pnpm import:envportal-users -- --source-root "\\192.168.20.38\C$\workspace\envPortal" --output-dir "D:\nginx\backups\identity-migrations\<batch>"
```

本番ビルドは `D:\nginx\app\apps\portal-shell\dist`、ローカル HTTPS 配信先は `D:\nginx\html` です。
