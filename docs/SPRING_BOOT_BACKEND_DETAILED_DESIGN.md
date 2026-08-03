# OneOps Spring Boot バックエンド詳細設計書

更新日: 2026-08-03

文書種別: 開発詳細設計

設計状態: 実装中

対象リリース: OneOps 0.8.0

対象リポジトリ: <code>D:\nginx</code>

## 1. 本書の位置付け

本書は、現行の Node.js Gateway を単一の Spring Boot バックエンドへ置き換えるための実装設計書です。機能の目的と画面要件は既存要件文書を正本とします。Java パッケージ、モジュール依存、HTTP 契約、トランザクション境界、SQL 実装、外部接続、プロセス管理、テスト、および切替手順を開発者が追加判断なしで実装できる粒度で規定します。

次の要件文書を業務仕様の正本とします。

- <code>AUTHENTICATION_AND_RBAC_REQUIREMENTS.md</code>
- <code>ENVIRONMENT_MANAGEMENT_REQUIREMENTS.md</code>
- <code>PERSONAL_TASKS_REQUIREMENTS.md</code>
- <code>INQUIRY_SUPPORT_REQUIREMENTS.md</code>
- <code>AI_ASSISTANT_REQUIREMENTS.md</code>
- <code>PRODUCT_BUILDER_REQUIREMENTS.md</code>

本書と既存要件が衝突した場合、業務挙動は要件文書、実装構造は本書を優先します。公開 API の挙動については、現行 Portal API Client と Node.js Gateway の契約を互換基準とします。

## 2. 確定済みの設計判断

1. バックエンドは単一の Spring Boot プロセスとします。
2. バックエンド内部は Spring Modulith による業務モジュールへ分割します。
3. 外部公開は Nginx HTTPS のみとします。
4. Spring Boot は <code>127.0.0.1:8092</code> だけを待ち受けます。
5. 業務モジュール間通信に HTTP、gRPC、追加ポート、サービスレジストリを使用しません。
6. フロントエンドの URL、API Client、JSON 契約、Cookie、CSRF、SSE を変更しません。
7. 既存 PostgreSQL の業務表、物理 ID、暗号文、履歴を引き継ぎます。
8. データアクセスは MyBatis と Spring JDBC を使用します。JPA と Hibernate は使用しません。
9. 業務更新のトランザクション境界は Application Service に置きます。
10. Python Worker は製品構築モジュールから標準入出力 JSON で起動します。待受ポートを持ちません。
11. 本番切替は Node.js Gateway の外部待受を停止し、Spring Boot を同じ 8092 で起動する一括切替とします。
12. 未移行 API の互換サービスは Spring Boot のライフサイクルから 127.0.0.1:8093 だけで起動し、外部入口と機能別公開ルーティングには使用しません。

## 3. 実行時構成

### 3.1 ポート

| 区分 | アドレス | 用途 | 公開範囲 |
| --- | --- | --- | --- |
| HTTPS | <code>192.168.20.54:443</code> | Portal UI、公開 API、SSE、添付ファイル | 利用者ネットワーク |
| Backend | <code>127.0.0.1:8092</code> | Spring Boot API、Actuator | ローカルホスト |
| Compatibility | <code>127.0.0.1:8093</code> | Spring 管理下の未移行 API 互換サービス | ローカルホストのみ |
| PostgreSQL | 現行設定を維持 | 業務データ | ローカルホスト |

Nginx は <code>/api/work-center/v1/</code> を <code>127.0.0.1:8092</code> へ転送します。UI は引き続き <code>D:\nginx\html</code> から配信します。Spring Boot は UI 静的ファイルを配信しません。

### 3.2 構成図

~~~mermaid
flowchart LR
    Browser["ブラウザー"] -->|"HTTPS 443"| Nginx["Nginx"]
    Nginx -->|"静的ファイル"| Portal["React Portal"]
    Nginx -->|"/api/work-center/v1/*"| Spring["OneOps Spring Boot :8092"]
    Spring --> DB["PostgreSQL"]
    Spring -->|"標準入出力 JSON"| Worker["Python Worker"]
    Spring -->|"HTTPS"| EnvPortal["EnvPortal / Windows SSO"]
    Spring -->|"HTTPS"| Inquiry["U-PDS 問合せサイト"]
    Spring -->|"HTTPS"| Backlog["Backlog"]
    Spring -->|"HTTP / SSE"| CAG["Agent Gateway / CAG"]
    Spring -->|"HTTP"| BuilderTerminal["構築端末"]
~~~

### 3.3 プロセス

Spring Boot は一つの実行可能 JAR とします。Windows タスク <code>OneHR Operations Compat Gateway</code> の名前を維持し、実行コマンドだけを Java 起動へ変更します。移行済み API は Spring が処理し、未移行 API は Spring が起動と停止を管理する本機専用互換サービスへ転送します。互換サービスは 127.0.0.1:8093 に限定し、外部から直接接続できません。

~~~text
D:\nginx\runtime\java\bin\java.exe
  -Dfile.encoding=UTF-8
  -XX:+ExitOnOutOfMemoryError
  -jar D:\nginx\app\backend\target\oneops-backend.jar
~~~

標準出力と標準エラーは <code>D:\nginx\app\logs</code> へ保存します。アプリケーションの作業ディレクトリは <code>D:\nginx\app</code> とします。

## 4. 技術基線

| 分類 | 採用技術 | 用途 |
| --- | --- | --- |
| Java | Java 21 LTS | 実行、ビルド |
| Backend | Spring Boot 4.1.x | HTTP、設定、ライフサイクル |
| Module | Spring Modulith 2.1.x | モジュール境界、モジュールテスト、設計検証 |
| HTTP | Spring MVC、Embedded Tomcat | REST、SSE、ストリーミング |
| Security | Spring Security | Session、CSRF、権限 |
| Database | PostgreSQL 18.x | 現行業務データ |
| SQL | MyBatis、Spring JDBC | Query、更新、明示ロック |
| Migration | Liquibase | 履歴、排他、既存 DB baseline |
| Pool | HikariCP | 単一 DataSource |
| JSON | Jackson | 公開 API、Worker JSON |
| Validation | Jakarta Validation | DTO 検証 |
| Metrics | Actuator、Micrometer | Health、Pool、HTTP、JVM |
| Test | JUnit 5、Spring Modulith Test、Testcontainers、WireMock | 単体、モジュール、外部接続 |

依存バージョンは Spring Boot BOM と Spring Modulith BOM で固定します。Maven Wrapper をリポジトリへ含め、マシン全体の Maven インストールへ依存しません。

## 5. ソース配置

Spring Boot ソースは <code>D:\nginx\app\backend</code> に配置します。

~~~text
app/
  backend/
    pom.xml
    mvnw
    mvnw.cmd
    .mvn/
    src/
      main/
        java/
          jp/onehr/oneops/
            OneOpsApplication.java
            platform/
            identity/
            masterdata/
            environment/
            support/
            ai/
            task/
            builder/
            workbench/
        resources/
          application.yaml
          application-local.yaml
          db/changelog/
          mybatis/
      test/
        java/
        resources/
    contract-test/
      fixtures/
      node/
      spring/
~~~

実行可能 JAR 名は <code>oneops-backend.jar</code> に固定します。Spring Boot のビルド結果は <code>app/backend/target</code> に出力します。

## 6. モジュール構成

Spring Modulith の業務モジュールは <code>jp.onehr.oneops</code> 直下のパッケージとして定義します。

| モジュール | 主責務 | 所有する表 |
| --- | --- | --- |
| <code>platform</code> | 共通 HTTP、例外、暗号、監査、DB、スケジューラー | 新設する基盤表 |
| <code>identity</code> | User、Identity、Session、Role、Permission、SSO、代理ログイン | <code>users</code>、<code>auth_*</code>、<code>roles</code>、<code>permissions</code>、割当表 |
| <code>masterdata</code> | 組織区分、組織機関、製品、版数、機能モジュール | <code>organization_*</code>、<code>organizations</code>、<code>products</code>、<code>product_*</code> |
| <code>environment</code> | 環境、環境グループ、製品構成、接続先、資格情報 | <code>environment_*</code>、<code>environments</code> |
| <code>support</code> | 問合せ設定、検索、詳細、添付、AI 補助履歴 | <code>inquiry_*</code> |
| <code>ai</code> | Model API、Agent Gateway、AI助手、会話、添付、SSE | <code>ai_*</code>、<code>agent_gateway_settings</code> |
| <code>task</code> | 個人タスク、候補、外部接続、同期、Prompt | <code>personal_task_*</code>、<code>personal_tasks</code> |
| <code>builder</code> | 製品構築 Worker、構築端末 proxy、成果物 | 既存ファイル領域 |
| <code>workbench</code> | Dashboard read model、共通イベント | 読み取り専用 |

### 6.1 パッケージ規則

各業務モジュールは次の内部構造を使用します。

~~~text
module/
  package-info.java
  api/
    ModuleFacade.java
    ModuleView.java
    ModuleEvent.java
  web/
    ModuleController.java
    ModuleRequest.java
    ModuleResponse.java
  application/
    ModuleCommandService.java
    ModuleQueryService.java
  domain/
    model/
    policy/
    repository/
  infrastructure/
    mybatis/
    client/
    file/
~~~

<code>api</code> だけを <code>@NamedInterface("api")</code> として他モジュールへ公開します。<code>web</code>、<code>application</code>、<code>domain</code>、<code>infrastructure</code> はモジュール内部 API とします。

### 6.2 依存方向

| 呼出元 | 許可する依存先 |
| --- | --- |
| <code>identity</code> | <code>platform</code> |
| <code>masterdata</code> | <code>platform</code> |
| <code>environment</code> | <code>platform</code>、<code>masterdata::api</code> |
| <code>ai</code> | <code>platform</code> |
| <code>support</code> | <code>platform</code>、<code>ai::api</code> |
| <code>task</code> | <code>platform</code>、<code>ai::api</code>、<code>support::api</code> |
| <code>builder</code> | <code>platform</code> |
| <code>workbench</code> | 各モジュールの <code>api</code> |

モジュール間で Mapper、Repository 実装、Entity を直接参照しません。循環依存はビルドエラーとします。

<code>ApplicationModules.of(OneOpsApplication.class).verify()</code> を全ビルドで実行します。各モジュールには少なくとも一つの <code>@ApplicationModuleTest</code> を配置します。

## 7. レイヤー責務

### 7.1 Web

- URL、HTTP Method、Header、Cookie、公開 DTO を扱います。
- Jakarta Validation を実行します。
- 現在ユーザーと組織コンテキストを Application Service へ渡します。
- SQL、暗号化、外部 HTTP 呼出しを実装しません。
- Controller で <code>@Transactional</code> を使用しません。

### 7.2 Application

- 一つの利用者操作を一つのメソッドとして表現します。
- 更新メソッドに <code>@Transactional</code> を付与します。
- Query メソッドに <code>@Transactional(readOnly = true)</code> を付与します。
- 権限、所有者、状態遷移、revision を確認します。
- Repository と外部接続 Port を呼び分けます。
- 監査情報と Outbox を業務更新と同じトランザクションへ保存します。

### 7.3 Domain

- 業務状態、値オブジェクト、状態遷移、制約を保持します。
- Spring MVC、MyBatis、Jackson、HTTP Client に依存しません。
- 物理 ID と業務 Code を別の型として扱います。

### 7.4 Infrastructure

- MyBatis Mapper、SQL、暗号化 Adapter、外部 HTTP Client、Worker Client、ファイル保存を実装します。
- PostgreSQL の SQLState を技術例外から業務例外へ変換します。
- 外部応答を正規化 DTO に変換してから Domain へ渡します。

## 8. HTTP リクエスト処理

### 8.1 Filter 順序

1. <code>ForwardedHeaderFilter</code>
2. <code>RequestIdFilter</code>
3. <code>SecurityHeaderFilter</code>
4. <code>SessionAuthenticationFilter</code>
5. Spring Security Authorization
6. <code>OneOpsCsrfFilter</code>
7. Controller
8. Application Service
9. <code>OperationAuditInterceptor</code>
10. Response

<code>RequestIdFilter</code> は受信した妥当な <code>X-Request-ID</code> を使用し、存在しない場合は UUID を発行します。レスポンスにも同じ値を返します。

### 8.2 更新処理の時系列

~~~mermaid
sequenceDiagram
    participant B as Browser
    participant C as Controller
    participant S as Application Service
    participant R as Repository
    participant D as PostgreSQL

    B->>C: PUT /api/work-center/v1/...
    C->>C: Session、CSRF、入力検証
    C->>S: Command + CurrentPrincipal
    S->>D: BEGIN
    S->>R: 対象を SELECT FOR UPDATE または revision 取得
    R->>D: SQL
    S->>R: 本体、関連、履歴、監査、Outbox を更新
    R->>D: SQL
    S->>D: COMMIT
    S-->>C: Result
    C-->>B: JSON + no-store
~~~

## 9. 公開 API 契約

### 9.1 共通規則

- Base path は <code>/api/work-center/v1</code> とします。
- JSON の <code>Content-Type</code> は <code>application/json; charset=utf-8</code> とします。
- API JSON は <code>Cache-Control: no-store</code> と <code>X-Content-Type-Options: nosniff</code> を返します。
- API フィールド名は現行と同じ camelCase とします。
- BIGINT および UUID の ID は公開 DTO で <code>String</code> として返します。
- 日時は UTC の ISO 8601 文字列として返します。
- 空文字、<code>null</code>、空配列の使い分けを現行 API Client と一致させます。
- 未定義フィールドをレスポンスへ追加する場合、フロントエンド互換テストを必須とします。

### 9.2 エラー形式

すべての業務エラーは次の形式へ統一します。

~~~json
{
  "error": {
    "code": "ENVIRONMENT_REVISION_CONFLICT",
    "message": "The environment has been updated. Reload before saving again.",
    "details": {}
  }
}
~~~

| HTTP | 用途 |
| --- | --- |
| 400 | 入力、状態遷移、参照関係の誤り |
| 401 | 未認証、無効 Session、無効 SSO |
| 403 | 権限、所有者、組織範囲の拒否 |
| 404 | 対象不存在または所有者不一致 |
| 409 | 一意制約、revision、実行中競合 |
| 413 | Body、添付、合計容量の超過 |
| 429 | ログイン頻度、同期頻度の超過 |
| 502 | 外部サービス、Worker、構築端末の失敗 |
| 503 | DB、必須設定、起動準備未完了 |
| 500 | 分類不能な内部障害 |

<code>@RestControllerAdvice</code> の <code>OneOpsExceptionHandler</code> が全例外を変換します。例外メッセージに SQL、秘密情報、内部 URL、Stack Trace を含めません。

入力項目エラーは <code>details.fields</code> に格納します。画面は <code>field</code> を使って対象入力欄へエラーを表示できます。

~~~json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request contains invalid fields.",
    "details": {
      "fields": [
        {
          "field": "nextReviewAt",
          "code": "INVALID_DATE",
          "message": "Enter a valid date."
        }
      ]
    }
  }
}
~~~

### 9.3 Body とファイル上限

| 対象 | 上限 |
| --- | ---: |
| Auth JSON | 32 KiB |
| 通常 JSON | 128 KiB |
| AI 関連 JSON | 4 MiB |
| AI 添付一件 | 25 MiB |
| 一メッセージの添付件数 | 10 |
| 一メッセージの添付合計 | 50 MiB |

Spring の multipart 設定、Controller、Attachment Service の三層で同じ上限を検証します。

## 10. Controller 対応

### 10.1 共通、Identity

| API | Controller | Application Service |
| --- | --- | --- |
| <code>GET /health</code> | <code>HealthController</code> | <code>HealthQueryService</code> |
| <code>GET /auth/config</code> | <code>AuthController</code> | <code>AuthConfigurationService</code> |
| <code>GET /auth/session</code> | <code>AuthController</code> | <code>SessionQueryService</code> |
| <code>POST /auth/register</code> | <code>AuthController</code> | <code>RegistrationService</code> |
| <code>POST /auth/login</code> | <code>AuthController</code> | <code>LocalLoginService</code> |
| <code>POST /auth/logout</code> | <code>AuthController</code> | <code>LogoutService</code> |
| <code>GET /auth/sso/windows/begin</code> | <code>SsoController</code> | <code>WindowsSsoService</code> |
| <code>POST /auth/sso/windows/callback</code> | <code>SsoController</code> | <code>WindowsSsoService</code> |
| <code>POST /auth/sso/envportal/callback</code> | <code>SsoController</code> | <code>EnvPortalSsoService</code> |
| <code>PUT /auth/profile</code> | <code>ProfileController</code> | <code>ProfileCommandService</code> |
| <code>GET /auth/users</code> | <code>UserManagementController</code> | <code>UserQueryService</code> |
| <code>PUT /auth/users/{id}</code> | <code>UserManagementController</code> | <code>UserCommandService</code> |
| <code>POST /auth/impersonation/{id}</code> | <code>ImpersonationController</code> | <code>ImpersonationService</code> |
| <code>POST /auth/impersonation/stop</code> | <code>ImpersonationController</code> | <code>ImpersonationService</code> |
| <code>GET /auth/roles</code> | <code>RoleController</code> | <code>RoleQueryService</code> |
| <code>POST /auth/roles</code> | <code>RoleController</code> | <code>RoleCommandService</code> |
| <code>PUT /auth/roles/{id}</code> | <code>RoleController</code> | <code>RoleCommandService</code> |
| <code>GET /auth/audit</code> | <code>AuditController</code> | <code>AuditQueryService</code> |

### 10.2 基本台帳、環境

| API group | Controller | Application Service |
| --- | --- | --- |
| <code>/organization-classifications</code> | <code>OrganizationClassificationController</code> | <code>OrganizationClassificationService</code> |
| <code>/organizations</code> | <code>OrganizationController</code> | <code>OrganizationService</code> |
| <code>/products</code> | <code>ProductController</code> | <code>ProductService</code> |
| <code>/product-versions</code> | <code>ProductVersionController</code> | <code>ProductVersionService</code> |
| <code>/product-version-modules</code> | <code>ProductVersionModuleController</code> | <code>ProductVersionModuleService</code> |
| <code>/organizations/{id}/environment-inventory</code> | <code>EnvironmentInventoryController</code> | <code>EnvironmentInventoryQueryService</code> |
| <code>/environment-groups</code> | <code>EnvironmentGroupController</code> | <code>EnvironmentGroupService</code> |
| <code>/environments</code> | <code>EnvironmentController</code> | <code>EnvironmentService</code> |
| <code>/environment-endpoints</code> | <code>EnvironmentEndpointController</code> | <code>EnvironmentEndpointService</code> |
| <code>/environment-endpoint-credentials/{id}</code> | <code>EnvironmentCredentialController</code> | <code>EnvironmentCredentialService</code> |

### 10.3 問合支援、AI

| API group | Controller | Application Service |
| --- | --- | --- |
| <code>/inquiry-support/settings</code> | <code>InquirySettingsController</code> | <code>InquirySettingsService</code> |
| <code>/inquiry-support/search</code> | <code>InquirySearchController</code> | <code>InquirySearchService</code> |
| <code>/inquiry-support/options</code> | <code>InquirySearchController</code> | <code>InquirySearchService</code> |
| <code>/inquiry-support/tickets/**</code> | <code>InquiryTicketController</code> | <code>InquiryTicketService</code> |
| <code>/inquiry-support/assist-runs/**</code> | <code>InquiryAssistController</code> | <code>InquiryAssistService</code> |
| <code>/model-settings</code> | <code>ModelSettingsController</code> | <code>ModelSettingsService</code> |
| <code>/ai-settings/**</code> | <code>AiSettingsController</code> | <code>AiSettingsService</code> |
| <code>/agent-gateways/**</code> | <code>AgentGatewayProxyController</code> | <code>AgentGatewayService</code> |
| <code>/ai-assistant/sessions/**</code> | <code>AiAssistantController</code> | <code>AiAssistantService</code> |
| <code>/ai-assistant/task-attachments/**</code> | <code>AiAttachmentController</code> | <code>AiAttachmentService</code> |

### 10.4 個人タスク、製品構築

| API group | Controller | Application Service |
| --- | --- | --- |
| <code>/personal-task-summary</code> | <code>PersonalTaskSummaryController</code> | <code>PersonalTaskQueryService</code> |
| <code>/personal-tasks/**</code> | <code>PersonalTaskController</code> | <code>PersonalTaskService</code> |
| <code>/personal-task-candidates/**</code> | <code>TaskCandidateController</code> | <code>TaskCandidateService</code> |
| <code>/personal-task-connections/**</code> | <code>TaskConnectionController</code> | <code>TaskConnectionService</code> |
| <code>/personal-task-sync-runs</code> | <code>TaskSyncController</code> | <code>TaskSyncService</code> |
| <code>/builder/**</code> | <code>BuilderController</code> | <code>BuilderWorkerService</code> |
| <code>/builder/build-terminal/**</code> | <code>BuilderTerminalController</code> | <code>BuilderTerminalProxyService</code> |

### 10.5 Workbench と Event

| API | Controller | Application Service |
| --- | --- | --- |
| <code>GET /dashboard</code> | <code>WorkbenchController</code> | <code>WorkbenchQueryService</code> |
| <code>GET /events</code> | <code>WorkbenchEventController</code> | <code>SseConnectionService</code> |

## 11. 認証と Session

### 11.1 Cookie

| Cookie | 属性 |
| --- | --- |
| <code>oneops_session</code> | Secure、HttpOnly、SameSite=Lax、Path=/ |
| <code>oneops_csrf</code> | Secure、HttpOnly=false、SameSite=Lax、Path=/ |

Cookie 名、Max-Age、失効 Cookie の形式を変更しません。Session Token と CSRF Token は 32 byte の暗号学的乱数を Base64URL で表現します。

DB には Token の SHA-256 を 64 文字小文字 hex として <code>token_hash</code> と <code>csrf_hash</code> に保存します。

### 11.2 CSRF

GET と HEAD 以外の認証済み API は次の三値を一致させます。

1. Header <code>X-OneOps-CSRF</code>
2. Cookie <code>oneops_csrf</code>
3. Header 値を SHA-256 化した DB の <code>csrf_hash</code>

不一致は <code>403 CSRF_VALIDATION_FAILED</code> とします。SSO callback の個別検証は既存契約に従います。

### 11.3 Password

既存 Password Hash の形式を維持します。

~~~text
scrypt$16384$8$1$<salt-base64url>$<hash-base64url>
~~~

Java 実装は <code>LegacyScryptPasswordCodec</code> とし、Bouncy Castle の SCrypt を使用します。

- N = 16384
- r = 8
- p = 1
- salt = 16 byte
- derived key = 64 byte

既存 Hash を再生成しません。ログイン成功後の自動再 Hash は 0.8.0 では実施しません。

### 11.4 CurrentPrincipal

<code>CurrentPrincipal</code> は次を保持します。

~~~java
public record CurrentPrincipal(
    UUID sessionId,
    UUID userId,
    UUID actorUserId,
    UUID impersonatorUserId,
    Set<String> systemPermissions,
    Map<Long, Set<String>> organizationPermissions,
    Locale locale
) {}
~~~

代理ログイン中の <code>userId</code> は対象者、<code>actorUserId</code> と <code>impersonatorUserId</code> は管理者です。業務権限は対象者の権限を使用し、監査 Actor は管理者を使用します。

### 11.5 Session 原子性

次の処理をそれぞれ一つのトランザクションにします。

- ローカルログイン成功記録、Session 作成、監査
- Windows SSO User 作成または更新、Identity 接続、Session 作成、監査
- Logout の Session 失効、監査
- 代理ログイン開始時の元 Session 失効、代理 Session 作成、監査
- 代理ログイン終了時の代理 Session 失効、管理者 Session 作成、監査

## 12. 認可

<code>PermissionAuthorizationManager</code> が <code>CurrentPrincipal</code> と API ごとの Permission Code を評価します。

組織範囲を持つ API は、URL、Query、または検証済み Request DTO から <code>organizationId</code> を取得します。Request Body を Filter で二重読取しません。Controller の Method Security へ組織 ID を渡します。

~~~java
@PreAuthorize("@oneOpsPermission.canWriteEnvironment(authentication, #request.organizationId())")
~~~

個人タスク、候補、外部接続、Prompt Run は Permission に加えて <code>owner_user_id = current.userId</code> を Repository SQL の WHERE 条件へ必ず含めます。管理者権限による所有者迂回を実装しません。

### 12.1 API Permission 対応

| API group | Read | Write または Use |
| --- | --- | --- |
| <code>/dashboard</code>、<code>/events</code> | <code>dashboard.read</code> | 同左 |
| <code>/personal-task*</code> | <code>personal.tasks.use</code> | 同左 |
| <code>/ai-assistant*</code> | <code>ai.assistant.use</code> | 同左 |
| <code>/inquiry-support/settings</code> | <code>models.settings.read</code> | <code>models.settings.write</code> |
| <code>/inquiry-support/**</code> | <code>inquiries.use</code> | 同左 |
| <code>/model-settings</code>、<code>/ai-settings</code>、<code>/agent-gateways</code> | <code>models.settings.read</code> | <code>models.settings.write</code> |
| <code>/builder/**</code> | <code>dashboard.read</code> | 同左 |
| <code>/organization-classifications</code> | <code>catalog.read</code> | <code>catalog.write</code> |
| <code>/organizations</code> | <code>organizations.read</code> | <code>organizations.write</code> |
| <code>/organizations/{id}/environment-inventory</code> | <code>environments.read</code> | 対象外 |
| <code>/environment-endpoint-credentials</code> | <code>environments.credentials.read</code> | <code>environments.credentials.write</code> |
| <code>/environment-endpoints</code>、<code>/environments</code>、<code>/environment-groups</code> | <code>environments.read</code> | <code>environments.write</code> |
| <code>/products</code>、<code>/product-versions</code>、<code>/product-version-modules</code> | <code>catalog.read</code> | <code>catalog.write</code> |

<code>GET /organizations/{id}/environment-inventory</code> は既存 API 契約を維持し、応答直下へ <code>organizationId</code>、<code>groups</code>、<code>environments</code>、<code>summary</code> を返します。追加の包装オブジェクトは設けません。

Identity 管理 API は既存の <code>identity.users.*</code>、<code>identity.roles.*</code>、<code>identity.audit.read</code>、<code>identity.users.impersonate</code> を Controller Method ごとに指定します。

## 13. 暗号化互換

### 13.1 形式

既存暗号文の形式を維持します。

~~~text
v1.<iv-base64url>.<tag-base64url>.<ciphertext-base64url>
~~~

<code>CredentialCipherV1</code> の仕様は次のとおりです。

- KDF: scrypt
- KDF salt: <code>OneOps environment endpoint credentials v1</code>
- KDF output: 32 byte
- scrypt parameter: N=16384、r=8、p=1
- Cipher: AES-256-GCM
- IV: 12 byte
- Authentication Tag: 16 byte
- AAD: UTF-8 の Context 文字列
- Base64: URL safe、padding なし

秘密鍵元は <code>OPS_CREDENTIAL_ENCRYPTION_KEY</code> を優先し、未設定時だけ既存互換として <code>ONE_OPS_DB_PASSWORD</code> を使用します。12 文字未満は起動失敗とします。

### 13.2 AAD Context

| 対象 | Context |
| --- | --- |
| 環境接続資格情報 | <code>environment-endpoint:{endpointId}</code> |
| Model API Key | <code>model-setting:{settingId}</code> |
| Agent Gateway Token | <code>agent-gateway-setting:{settingId}</code> |
| 問合せサイト資格情報 | <code>inquiry-source:{settingId}</code> |
| 個人タスク外部資格情報 | <code>personal-task-account:{ownerUserId}:{accountId}</code> |

物理 ID、Context、salt、文字コードを変更しません。Java 移行前に Node で生成した暗号文を Java で復号し、Java で生成した暗号文を Node で復号する双方向 Golden Test を作成します。

### 13.3 秘密情報の表示

通常の取得 API は秘密値を返しません。専用 Reveal API だけが原文を返します。

- 所有者または必要 Permission を検証します。
- <code>Cache-Control: no-store</code> を返します。
- Response Body、URL、監査 details、アクセスログへ秘密値を記録しません。
- Reveal、Copy、Test、Update の各操作を監査します。

## 14. DataSource と MyBatis

### 14.1 HikariCP

初期値は次のとおりです。

~~~yaml
spring:
  datasource:
    hikari:
      minimum-idle: 5
      maximum-pool-size: 30
      connection-timeout: 3000
      validation-timeout: 1000
      idle-timeout: 600000
      max-lifetime: 1800000
      auto-commit: false
~~~

全モジュールで一つの DataSource と一つの <code>DataSourceTransactionManager</code> を共有します。モジュール単位の Connection Pool を作成しません。

### 14.2 Mapper

Mapper interface は <code>infrastructure.mybatis</code> に配置します。複雑な SQL は XML Mapper、単純な一行 Query は Annotation を使用できます。

SQL では次を必須とします。

- 列名を明示し、<code>SELECT *</code> を使用しない。
- 更新時は物理 ID を WHERE 条件に使用する。
- 所有者データは物理 ID と <code>owner_user_id</code> の両方を使用する。
- 業務 Code と名称を強参照 Join Key に使用しない。
- Page Query は安定した ORDER BY と上限を持つ。
- Timestamp 比較は PostgreSQL の UTC 値を使用する。

### 14.3 型

| PostgreSQL | Domain | 公開 DTO |
| --- | --- | --- |
| BIGINT | <code>long</code> | <code>String</code> |
| UUID | <code>UUID</code> | <code>String</code> |
| timestamptz | <code>Instant</code> | ISO 8601 String |
| date | <code>LocalDate</code> | yyyy-MM-dd |
| jsonb | 型付き record または <code>JsonNode</code> | JSON |
| text enum | Java enum | 既存固定文字列 |

## 15. Transaction 設計

### 15.1 共通規則

- 更新: <code>Propagation.REQUIRED</code>
- Query: <code>readOnly = true</code>
- Isolation: PostgreSQL <code>READ COMMITTED</code>
- Transaction timeout: 通常 10 秒、Batch 30 秒
- 外部 HTTP、SSE 待機、Worker 待機を DB Transaction 内で実行しない
- <code>REQUIRES_NEW</code> は監査失敗を隠す用途に使用しない
- Deadlock と Serialization failure の自動再実行は冪等 Command に限り最大 2 回

外部接続を含む Query は、資格情報を取得する短い read-only Transaction と、Transaction 外の HTTP 呼出しへ分割します。外部応答待機中に Hikari Connection を保持しません。

### 15.2 業務単位

| Use case | 同一 Transaction に含める内容 |
| --- | --- |
| 組織作成、更新 | 組織本体、区分参照確認、監査 |
| 製品更新 | 製品本体、Alias、監査 |
| 版数更新 | 版数、revision、監査 |
| 環境作成、更新 | 環境本体、製品版数、購入モジュール、revision、監査 |
| 接続先更新 | Endpoint 本体、revision、監査 |
| 資格情報更新 | Endpoint 行ロック、暗号文、revision、監査 |
| User 更新 | User、Role assignment、監査 |
| Role 更新 | Role、Permission 関係、監査 |
| Task 作成、更新 | Task、本体 Event、revision、監査 |
| Candidate 採用 | Candidate 行ロック、Task、External link、Task event、Candidate 状態、監査 |
| Task archive | Task 状態、Task event、監査 |
| 外部アカウント更新 | Account、暗号文、監査 |
| AI 設定更新 | Setting、暗号文、監査 |
| 問合せ設定更新 | Setting、暗号文、監査 |

### 15.3 外部処理

外部処理は三段階で実装します。

1. 短い Transaction で Run を <code>PENDING</code> として保存する。
2. Transaction 外で外部サービスを呼び出す。
3. 別の短い Transaction で結果、Event、監査、次回 Cursor を保存する。

外部処理成功後に DB 保存が失敗した場合、同じ Run ID と Idempotency Key で保存だけを再実行します。外部サービスへの書込みを無条件に再実行しません。

## 16. 排他と同時実行

### 16.1 楽観ロック

revision を持つ既存表は次の形式で更新します。

~~~sql
UPDATE environments
   SET name = :name,
       revision = revision + 1,
       updated_at = CURRENT_TIMESTAMP
 WHERE id = :id
   AND revision = :expectedRevision
RETURNING revision
~~~

更新件数 0 は <code>409 ENVIRONMENT_REVISION_CONFLICT</code> へ変換します。

### 16.2 悲観ロック

次では <code>SELECT ... FOR UPDATE</code> を使用します。

- Candidate 採用
- Credential 更新
- Session 代理切替
- 同期 Run 完了
- 同じ対象へ複数関連行を再構築する処理

ロック順序は親、子、関連、履歴の順に固定します。

### 16.3 Scheduler Lock

定時処理は <code>oneops_scheduler_locks</code> を使用します。Lock 名は次に固定します。

- <code>organization-source-sync</code>
- <code>personal-task-account-scan</code>
- <code>personal-task-prompt-scan</code>
- <code>ai-attachment-cleanup</code>
- <code>outbox-publish</code>

手動同期と定時同期は外部アカウント物理 ID を用いた PostgreSQL Advisory Lock を共有します。

## 17. Liquibase 移行

### 17.1 Changelog

~~~text
app/backend/src/main/resources/db/changelog/
  db.changelog-master.yaml
  legacy/
    db.changelog-legacy.yaml
  spring/
    20260803-001-platform-tables.yaml
    20260803-002-auth-shared-state.yaml
~~~

既存 <code>app/db/migrations</code> は履歴資料と新規 DB 構築用 SQL の正本として保持します。重複する <code>009</code> と <code>010</code> は、Liquibase の ChangeSet ID に完全なファイル名を使用して区別します。

例:

~~~yaml
changeSet:
  id: legacy-009-create-identity-and-rbac
  author: oneops
  changes:
    - sqlFile:
        path: app/db/migrations/009_create_identity_and_rbac.sql
~~~

### 17.2 既存 DB baseline

既存 DB では次の順に実行します。

1. Table、Column、Constraint、Index の fingerprint を読取専用 SQL で検証する。
2. 不一致がある場合は切替を停止する。
3. Legacy ChangeSet だけを <code>changelogSync</code> で実行済み登録する。
4. Spring 基盤 ChangeSet を <code>update</code> する。
5. <code>validate</code> と二回目の <code>update</code> を実行し、二回目の変更件数が 0 であることを確認する。

新規 DB では Legacy ChangeSet と Spring ChangeSet を最初から実行します。

### 17.3 新設表

#### oneops_outbox_events

~~~sql
CREATE TABLE oneops_outbox_events (
    id uuid PRIMARY KEY,
    aggregate_type text NOT NULL,
    aggregate_id text NOT NULL,
    event_type text NOT NULL,
    idempotency_key text NOT NULL UNIQUE,
    payload jsonb NOT NULL,
    status text NOT NULL DEFAULT 'PENDING',
    attempts integer NOT NULL DEFAULT 0,
    available_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at timestamptz,
    last_error text NOT NULL DEFAULT ''
);
~~~

#### oneops_scheduler_locks

~~~sql
CREATE TABLE oneops_scheduler_locks (
    name text PRIMARY KEY,
    lock_until timestamptz NOT NULL,
    locked_at timestamptz NOT NULL,
    locked_by text NOT NULL
);
~~~

#### oneops_auth_nonces

~~~sql
CREATE TABLE oneops_auth_nonces (
    nonce_hash char(64) PRIMARY KEY,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
~~~

#### oneops_auth_rate_limits

~~~sql
CREATE TABLE oneops_auth_rate_limits (
    key_hash char(64) NOT NULL,
    window_started_at timestamptz NOT NULL,
    attempt_count integer NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (key_hash, window_started_at)
);
~~~

## 18. 監査

<code>AuditWriter</code> は既存 <code>auth_audit_events</code> へ記録します。

必須項目:

- event ID
- actor user ID
- target type と target ID
- session ID
- request ID
- capability
- action
- result
- client IP
- user agent
- details JSON
- created at

業務更新と同じ DB Transaction で保存可能な監査は同時保存します。外部処理結果は Run 状態更新と同時保存します。監査保存例外を握りつぶしません。

details へ次を保存しません。

- Password
- Session Token
- CSRF Token
- SSO Ticket
- API Key
- Access Token
- 暗号文
- 秘密を含む URL
- 添付ファイル本文

## 19. Identity モジュール詳細

### 19.1 主要クラス

| 分類 | クラス |
| --- | --- |
| API | <code>IdentityFacade</code>、<code>CurrentPrincipalProvider</code> |
| Web | <code>AuthController</code>、<code>SsoController</code>、<code>UserManagementController</code>、<code>RoleController</code> |
| Application | <code>RegistrationService</code>、<code>LocalLoginService</code>、<code>WindowsSsoService</code>、<code>ImpersonationService</code> |
| Domain | <code>User</code>、<code>Role</code>、<code>PermissionSet</code>、<code>Session</code> |
| Infrastructure | <code>IdentityMapper</code>、<code>SessionMapper</code>、<code>EnvPortalClient</code> |

### 19.2 SSO

HMAC canonical string、timestamp 許容差、nonce 消費、Windows machine account 拒否、許可 Domain、許可 UPN suffix を現行と一致させます。

nonce は SHA-256 を保存します。消費は次の一 SQL で実行します。

~~~sql
UPDATE oneops_auth_nonces
   SET consumed_at = CURRENT_TIMESTAMP
 WHERE nonce_hash = :hash
   AND consumed_at IS NULL
   AND expires_at > CURRENT_TIMESTAMP
RETURNING nonce_hash
~~~

結果が 0 件の場合は Replay または期限切れとして拒否します。

## 20. Masterdata と Environment モジュール詳細

### 20.1 参照

Environment は製品、版数、機能モジュールの物理 ID を Masterdata API で検証します。保存 SQL は物理外部キーを使用します。名称と Code は表示、検索、業務上の一意制約に限定します。

### 20.2 製品版数制約

- 単一版数型製品は一環境に一版数だけを許可します。
- 複数モジュール版数型製品は、同一モジュールに一版数だけを許可します。
- 異なるモジュールの異なる版数は同一環境に共存できます。
- U-HR、U-PDS、PHR の現行製品識別と Alias を維持します。

制約違反は次を返します。

- <code>PRODUCT_VERSION_CARDINALITY_CONFLICT</code>
- <code>PRODUCT_MODULE_VERSION_CONFLICT</code>
- <code>ENVIRONMENT_RELATION_INVALID</code>

### 20.3 資格情報

Endpoint 本体と資格情報を分離します。通常一覧では <code>hasCredential</code>、<code>revision</code> だけを返します。Reveal と Save は専用 Service を使用します。

資格情報 Save は Endpoint の存在と組織範囲を確認してから、Credential 行を <code>FOR UPDATE</code> し、暗号化して revision を増加します。

## 21. Support モジュール詳細

### 21.1 外部 Client

<code>InquirySourceClient</code> は次の Port を実装します。

~~~java
public interface InquirySourcePort {
    InquiryOptions fetchOptions(InquiryCredential credential);
    InquirySearchResult search(InquiryCredential credential, InquirySearchQuery query);
    InquiryTicketDetail fetchTicket(InquiryCredential credential, String ticketNo);
    InquiryAttachmentStream fetchAttachment(
        InquiryCredential credential,
        String ticketNo,
        String attachmentId
    );
}
~~~

検索条件、担当者、状態、期間、階層カテゴリ、複数語 AND 検索を現行と一致させます。HTML Parser は Golden HTML fixture で検証します。

### 21.2 添付

画像、PDF、Excel、Word は preview を許可し、それ以外は download とします。

<code>Content-Disposition</code> は ASCII fallback の <code>filename</code> と UTF-8 の <code>filename*</code> を同時に返します。日本語および中国語ファイル名を traditional header へ直接設定しません。

### 21.3 AI 補助

Run 作成 Transaction で <code>PENDING</code> を保存します。CAG Task 作成後に <code>RUNNING</code> へ更新し、SSE Event を DB に保存します。完了、失敗、取消は Compare-And-Set で一度だけ確定します。

## 22. AI モジュール詳細

### 22.1 Port

~~~java
public interface AgentGatewayPort {
    AgentConversation createConversation(AgentGatewayCredential credential, AgentConversationCommand command);
    AgentTask createTask(AgentGatewayCredential credential, AgentTaskCommand command);
    Flux<AgentEvent> streamTask(AgentGatewayCredential credential, String taskId, long afterSequence);
    AgentTask fetchTask(AgentGatewayCredential credential, String taskId);
}
~~~

通常 API は Spring <code>RestClient</code>、SSE は <code>WebClient</code> を使用します。外部 SSE を OneOps SSE へ転送する際、秘密 Header と内部 URL を Browser へ返しません。

### 22.2 AI助手 Session

すべての Session Query は <code>conversation_id</code> と <code>owner_user_id</code> を同時条件にします。別ユーザーの存在を推測できないよう、所有者不一致は 404 とします。

Prompt 内の問合せ Context、添付 Metadata、利用者 Message の区切り文字を現行と一致させます。ファイル内容は非信頼入力として扱い、Prompt Injection により System 指示を変更しません。

### 22.3 添付ファイル

保存 Root は <code>D:\nginx\app\ai-assistant-uploads</code> とします。

- ファイル名を保存パスに使用しない。
- 保存名は Attachment UUID とする。
- Metadata に owner user ID、conversation ID、元ファイル名、MIME、size、SHA-256、期限を保存する。
- Download 前に owner と conversation を検証する。
- 六時間ごとの Cleanup を Scheduler Lock 付きで実行する。

## 23. Task モジュール詳細

### 23.1 所有者境界

Repository interface も所有者 ID を必須引数にします。

~~~java
Optional<PersonalTask> findOwned(UUID taskId, UUID ownerUserId);
Optional<TaskCandidate> findOwnedCandidateForUpdate(UUID candidateId, UUID ownerUserId);
~~~

所有者を省略した <code>findById</code> を Task Repository に定義しません。

### 23.2 長期タスク

長期タスクの次回確認日は任意です。発動条件は <code>NONE</code>、<code>DATE</code>、<code>SEMANTIC</code> を使用します。

- <code>DATE</code>: 日時条件を保存する。
- <code>SEMANTIC</code>: AI Prompt を意味条件として保存する。
- 定期実行は利用者が明示的に有効化した場合だけ実行する。

### 23.3 Candidate 採用

~~~mermaid
sequenceDiagram
    participant U as User
    participant S as TaskCandidateService
    participant D as PostgreSQL

    U->>S: adopt(candidateId)
    S->>D: BEGIN
    S->>D: Candidate SELECT FOR UPDATE + owner
    S->>D: 既採用、既無視、Source 重複を確認
    S->>D: Personal Task INSERT
    S->>D: External Link INSERT
    S->>D: Task Event INSERT
    S->>D: Candidate ADOPTED UPDATE
    S->>D: Audit INSERT
    S->>D: COMMIT
    S-->>U: 201 PersonalTask
~~~

### 23.4 同期

外部 API 呼出し中は DB Transaction を保持しません。取得結果は最大 100 件単位で正規化し、一 Batch を一 Transaction で upsert します。Source object の一意 Key で重複を防ぎます。

429 は <code>Retry-After</code> を優先し、同一ユーザー、同一接続の同期を直列化します。

## 24. Builder モジュール詳細

### 24.1 Worker protocol

<code>BuilderWorkerClient</code> は次の一行 JSON Request を Worker stdin へ送ります。

~~~json
{
  "id": "uuid",
  "method": "POST",
  "path": "/api/work-center/v1/builder/...",
  "headers": {
    "Content-Type": "application/json",
    "Content-Length": "123"
  },
  "bodyBase64": "..."
}
~~~

Worker は一行 JSON Response を stdout へ返します。

~~~json
{
  "id": "uuid",
  "status": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "bodyBase64": "..."
}
~~~

Request ID 不一致、JSON 不正、Pipe 終了、timeout は <code>502 BUILDER_WORKER_UNAVAILABLE</code> とします。

大容量成果物を返す Response は <code>bodyBase64</code> の代わりに、Worker が検証済み絶対パス <code>filePath</code> を返せます。Spring 側はパスが Builder の正式成果物 Root 配下にあることを再確認し、ファイルを stream します。

### 24.2 Process 管理

- Python: <code>D:\nginx\runtime\python\python.exe</code>
- Worker: <code>D:\nginx\app\builder\oneops_worker.py</code>
- Option: <code>-u</code>
- 同時 Request: 一 Worker Process あたり最大 8 件
- Queue 上限: 100
- 通常 timeout: 60 秒
- Build 長時間 API: Worker 側 job 化し、HTTP Request を保持しない
- 異常終了: 1 秒、2 秒、5 秒、10 秒、30 秒で再起動
- 5 分間に 5 回失敗: Circuit open、Health DOWN

stderr は構造化ログへ取り込み、秘密値と Body を記録しません。

### 24.3 構築端末 proxy

<code>/builder/build-terminal/**</code> は既存 <code>OPS_BUILDER_TERMINAL_URL</code> へ転送します。Hop-by-hop Header を除去し、HTML、JavaScript、CSS の OneOps path 書換えを現行と一致させます。Binary は streaming response として転送します。

## 25. SSE

### 25.1 Endpoint

- <code>/events</code>
- <code>/inquiry-support/assist-runs/{id}/events</code>
- <code>/agent-gateways/{id}/tasks/{taskId}/events</code>
- <code>/agent-gateways/{id}/conversations/{conversationId}/events</code>
- <code>/ai-assistant/sessions/{id}/events</code>

### 25.2 Header

~~~text
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache, no-transform
Connection: keep-alive
X-Accel-Buffering: no
~~~

<code>SseConnectionService</code> は <code>SseEmitter</code> を使用します。Heartbeat は 15 秒、Emitter timeout は 60 分とし、Browser の再接続を前提とします。

Event ID は DB Event の sequence を使用します。<code>Last-Event-ID</code> または <code>after_sequence</code> 以降を再送します。所有者または Permission を接続開始時と再送 Query の両方で検証します。

Dashboard Event は再接続時に最新 Snapshot を一件送信します。単一 Spring Boot プロセスのため接続 Registry はメモリ保持できます。業務 Event は DB に保存し、プロセス再起動後も再送可能にします。

## 26. Scheduler

| Job | 初期周期 | Lock | 処理 |
| --- | ---: | --- | --- |
| Organization source sync | 現行環境変数 | <code>organization-source-sync</code> | 組織データ更新 |
| Personal task scan | 15 分 | <code>personal-task-account-scan</code> | 同期対象接続を Queue 化 |
| Prompt scan | 15 分 | <code>personal-task-prompt-scan</code> | 明示有効な Prompt を Queue 化 |
| Attachment cleanup | 6 時間 | <code>ai-attachment-cleanup</code> | 期限切れファイル削除 |
| Outbox publish | 5 秒 | <code>outbox-publish</code> | 外部副作用再実行 |
| Auth cleanup | 1 時間 | 専用 Lock | 期限切れ nonce、rate limit、session の整理 |

Job は一回に処理する件数を制限し、次回実行へ残件を引き継ぎます。全件を一 Transaction で処理しません。

## 27. 外部 HTTP

### 27.1 共通

- Connect timeout: 5 秒
- 通常 response timeout: 30 秒
- Connection test: 15 秒
- Redirect: 接続先ごとの allowlist に限定
- TLS 検証: 有効
- Proxy: 設定された場合だけ使用
- User-Agent: <code>OneOps/0.8.0</code>
- Trace: <code>X-Request-ID</code> を秘密を含まない接続先だけへ送る

GET、HEAD、および Idempotency Key を持つ安全な処理だけを自動再実行します。認証失敗、権限拒否、入力不正は再実行しません。

### 27.2 秘密情報

Authorization、Cookie、API Key、Password を request log、exception message、metric tag に含めません。外部 URL に API Key query を使用する場合、ログ用 URL から query 全体を削除します。

## 28. 設定

既存環境変数を維持し、Spring property へ次のように対応させます。

| 既存環境変数 | Spring property |
| --- | --- |
| <code>OPS_GATEWAY_HOST</code> | <code>server.address</code> |
| <code>OPS_GATEWAY_PORT</code> | <code>server.port</code> |
| <code>OPS_DATABASE_URL</code> | <code>oneops.database.url</code> |
| <code>ONE_OPS_DB_PASSWORD</code> | Credential key の既存 fallback |
| <code>OPS_SESSION_TTL_SECONDS</code> | <code>oneops.security.session-ttl</code> |
| <code>OPS_CREDENTIAL_ENCRYPTION_KEY</code> | <code>oneops.security.credential-key</code> |
| <code>OPS_PUBLIC_BASE_URL</code> | <code>oneops.public-base-url</code> |
| <code>OPS_GATEWAY_INTERNAL_URL</code> | <code>oneops.internal-base-url</code> |
| <code>OPS_WINDOWS_SSO_PROXY_URL</code> | <code>oneops.sso.windows.proxy-url</code> |
| <code>OPS_ENVPORTAL_PROFILE_URL</code> | <code>oneops.sso.envportal.profile-url</code> |
| <code>OPS_ENVPORTAL_SSO_URL</code> | <code>oneops.sso.envportal.sso-url</code> |
| <code>OPS_SSO_SHARED_SECRET</code> | <code>oneops.sso.shared-secret</code> |
| <code>OPS_SSO_ALLOWED_DOMAINS</code> | <code>oneops.sso.allowed-domains</code> |
| <code>OPS_SSO_ALLOWED_EMAIL_DOMAINS</code> | <code>oneops.sso.allowed-email-domains</code> |
| <code>OPS_SSO_ALLOWED_WINDOWS_DOMAINS</code> | <code>oneops.sso.allowed-windows-domains</code> |
| <code>OPS_SSO_WINDOWS_UPN_SUFFIXES</code> | <code>oneops.sso.windows-upn-suffixes</code> |
| <code>OPS_SSO_ACCOUNT_LINKS</code> | <code>oneops.sso.account-links</code> |
| <code>OPS_SSO_AUTO_LOGIN</code> | <code>oneops.sso.auto-login</code> |
| <code>OPS_BUILDER_PYTHON</code> | <code>oneops.builder.python</code> |
| <code>OPS_BUILDER_TERMINAL_URL</code> | <code>oneops.builder.terminal-url</code> |
| <code>OPS_AI_ASSISTANT_GATEWAY_ID</code> | <code>oneops.ai.default-gateway-id</code> |
| <code>OPS_AI_ASSISTANT_PROJECT_REF</code> | <code>oneops.ai.project-ref</code> |
| <code>OPS_AI_ASSISTANT_RUNTIME_PROFILE</code> | <code>oneops.ai.runtime-profile</code> |
| <code>OPS_ORGANIZATION_SOURCE_SYNC_INTERVAL_MS</code> | <code>oneops.jobs.organization-source.interval</code> |
| <code>OPS_PERSONAL_TASK_SYNC_SCAN_INTERVAL_MS</code> | <code>oneops.jobs.personal-task.interval</code> |
| <code>OPS_REFRESH_INTERVAL_MS</code> | <code>oneops.jobs.dashboard-refresh.interval</code> |

<code>.env.local</code> を Git 管理しません。Spring 起動 Script が既存 env file を読込み、Process environment として Java へ渡します。

必須設定不足は起動時に <code>@ConfigurationProperties</code> validation で停止します。

<code>OPS_DATABASE_URL</code> が <code>postgres://</code> または <code>postgresql://</code> 形式の場合、<code>PostgresConnectionStringAdapter</code> が user、password、host、port、database を分離し、JDBC URL へ変換します。変換前後の URL と password をログへ記録しません。

## 29. Health と可観測性

### 29.1 Health

公開互換:

~~~text
GET /api/work-center/v1/health
{"status":"UP"}
~~~

Supervisor:

~~~text
GET http://127.0.0.1:8092/actuator/health/readiness
GET http://127.0.0.1:8092/actuator/health/liveness
~~~

Nginx は <code>/actuator</code> を proxy しません。Actuator は loopback 以外から到達不能とします。

Readiness は次を確認します。

- PostgreSQL
- Liquibase 完了
- Credential key validation
- Python Worker 起動
- Scheduler 起動

外部 U-PDS、Backlog、CAG の一時障害は Backend 全体を DOWN にしません。個別 Component status として表示します。

### 29.2 Log

一行 JSON を使用します。

~~~json
{
  "timestamp": "2026-08-03T12:00:00Z",
  "level": "INFO",
  "service": "oneops-backend",
  "module": "environment",
  "requestId": "uuid",
  "userId": "uuid",
  "actorUserId": "uuid",
  "event": "environment.updated",
  "result": "SUCCESS",
  "elapsedMs": 42
}
~~~

秘密値、Request Body 全文、外部応答全文を記録しません。

### 29.3 Metrics

- HTTP request count、latency、status
- Active Session
- Hikari active、idle、pending、timeout
- Transaction count、rollback、deadlock
- SSE connection count
- Scheduler duration、success、failure
- Outbox pending、retry、dead letter
- Worker queue、restart、timeout
- External client latency、status、timeout

User ID、Ticket No、Task ID、URL を Metric label に使用しません。

## 30. Runtime Script

### 30.1 ensure-oneops-runtime.ps1

処理順序を次へ変更します。

1. Docker Desktop 確認
2. 外部 Volume 確認
3. PostgreSQL 起動と Health
4. Java Runtime 確認
5. Spring Boot Windows Task 確認
6. Spring readiness 確認
7. 自動 SSO 設定確認
8. Nginx 起動と HTTPS 確認

### 30.2 publish-portal.ps1

Build gate:

~~~text
pnpm test
pnpm build
app\backend\mvnw.cmd verify
nginx.exe -t
~~~

Release:

1. Portal dist と JAR を staging へ配置する。
2. PostgreSQL backup と Liquibase validate を確認する。
3. Windows Task を停止する。
4. 8092 の解放が 5 秒間継続することを確認する。
5. JAR を正式位置へ置換する。
6. Portal index を置換する。
7. Windows Task を開始する。
8. readiness と公開 health を確認する。
9. HTTPS Portal を確認する。

失敗時は Portal index と JAR を前版へ戻し、前版起動方式を復元します。

## 31. 一括切替

### 31.1 事前条件

- Spring の全 API contract test が合格している。
- Node 生成暗号文を Spring が復号できる。
- Spring 生成暗号文を Node が復号できる。
- PostgreSQL backup restore 演習が合格している。
- Liquibase baseline を本番 backup 複製へ適用済みである。
- Python Worker Golden Test が合格している。
- 100 同時利用者の負荷試験が合格している。
- Browser 受入が検証環境で合格している。

### 31.2 切替時系列

~~~mermaid
sequenceDiagram
    participant O as Operator
    participant N as Node Gateway
    participant D as PostgreSQL
    participant S as Spring Boot
    participant G as Nginx

    O->>D: Backup
    O->>D: Baseline fingerprint
    O->>N: Windows Task stop
    O->>O: 8092 release check
    O->>D: Liquibase baseline/update
    O->>S: Start on 127.0.0.1:8092
    O->>S: readiness/health
    O->>G: nginx -t and HTTPS smoke
    O->>S: API and Browser acceptance
~~~

### 31.3 Rollback

切替後に重大障害が発生した場合:

1. Spring Boot を停止する。
2. 8092 解放を確認する。
3. Node 用 Windows Task action を復元する。
4. Node Gateway を起動する。
5. Health、認証、環境、タスク、問合せ、AI、Builder を確認する。

Spring 用 DB 変更は追加表だけとし、既存 Node Gateway が無視できる構造にします。既存列の削除、型変更、名称変更は 0.8.0 で行いません。

## 32. Test 設計

### 32.1 Unit

- Domain policy
- DTO validation
- Error mapping
- Password Hash compatibility
- Credential encryption compatibility
- Permission evaluation
- External response normalization
- Worker protocol codec

### 32.2 Module

各モジュールに <code>@ApplicationModuleTest</code> を配置します。

- 非公開 Package への越境参照を検出する。
- Named Interface だけで Module 間を呼び出す。
- Transaction rollback を実 DB で確認する。

### 32.3 Database

Testcontainers の PostgreSQL 18.4 を使用します。

- 空 DB への全 migration
- 二回実行で差分 0
- 既存 schema fingerprint
- FK、UNIQUE、CHECK
- revision conflict
- FOR UPDATE
- Deadlock recovery
- owner_user_id isolation
- Liquibase lock

### 32.4 API Contract

同じ fixture を Node と Spring へ送信し、次を比較します。

- HTTP status
- JSON property
- ID と日時の表現
- Error code と details
- Header
- Cookie
- CSRF
- SSE event、id、data
- Content-Disposition
- Cache-Control

比較対象は <code>app/packages/api-client/src/index.ts</code> が公開する全関数とします。

### 32.5 External

WireMock または fixture server で次を検証します。

- EnvPortal SSO 正常、署名不正、nonce 再利用、期限切れ
- U-PDS login、検索、階層カテゴリ、詳細、添付
- Backlog pagination、401、403、429、timeout
- Agent Gateway Task、Conversation、SSE 再接続
- 構築端末 HTML 書換え、Binary stream、timeout

### 32.6 Worker

- 起動
- 一行 JSON
- Unicode
- Binary body
- Timeout
- stdout 不正
- 異常終了
- 再起動
- Queue 上限
- Build 履歴と成果物

### 32.7 性能

初期受入値:

- 認証済み同時利用者 100
- Read p95 500 ms 未満
- Write p95 1,000 ms 未満
- API error 1% 以下
- Deadlock 0
- Hikari timeout 0
- Worker queue overflow 0
- 100 SSE 接続を 60 分維持

### 32.8 Browser

正式 HTTPS で次を確認します。

- Login、Windows SSO
- Workbench
- 個人タスク
- 環境情報と資格情報
- 問合支援と添付 preview
- AI助手と SSE
- 製品構築
- 基本台帳
- User、Role、代理ログイン、監査
- Desktop と narrow layout
- Console error 0
- 失敗した Network request 0

## 33. 実装単位

実装は master 上で次の順に行います。各単位は build と test を通し、Spring runtime を有効化するまでは現行 Node Gateway を正式 runtime として維持します。本番切替は最後に一回だけ行います。

| ID | 実装単位 | 完了条件 |
| --- | --- | --- |
| D01 | Maven、Boot、Modulith、共通設定 | JAR 起動、module verify、health |
| D02 | Liquibase baseline、DataSource、MyBatis | 空 DB、既存 DB 複製の migration 合格 |
| D03 | 共通 HTTP、Error、Security、Audit、Crypto | Contract 基盤と暗号 Golden Test 合格 |
| D04 | Identity | Login、SSO、RBAC、代理ログイン contract 合格 |
| D05 | Masterdata、Environment | 台帳、環境、資格情報 contract 合格 |
| D06 | Support、AI | 問合せ、添付、CAG、SSE contract 合格 |
| D07 | Personal Task | CRUD、候補、同期、Prompt、所有者隔離合格 |
| D08 | Builder | Worker、端末 proxy、成果物 contract 合格 |
| D09 | Workbench、Scheduler、Observability | Dashboard、Job、metrics 合格 |
| D10 | Runtime、Publish、Rollback Script | 切替 rehearsal 合格 |
| D11 | 全 API、性能、Browser | 全受入 gate 合格 |
| D12 | 0.8.0 一括切替 | 8092 Spring 化、Node 停止、正式確認 |

## 34. 完了条件

本リリースの実装完了は、Spring が外部 API の唯一の入口となり、主要な認証、基本台帳、環境、Workbench API が Spring で処理され、未移行 API が 8093 の内部互換境界で維持される状態とします。D06 から D09 の直接 Spring モジュール化、負荷試験、最終互換サービス停止は継続課題です。

Spring Boot バックエンド置換は次をすべて満たした時点で完了とします。

1. Nginx の公開入口、Spring の 8092、Spring が管理する内部互換サービス 8093 以外に OneOps 業務待受ポートがない。
2. Node.js Gateway が外部の正式 runtime として 8092 で起動していない。
3. 現行フロントエンドのまま、全 API contract test が合格する。
4. 既存 Session、Password、暗号化資格情報、物理 ID、監査履歴を利用できる。
5. 業務更新、Event、監査が規定 Transaction で rollback する。
6. 外部通信が DB Transaction を保持しない。
7. Task 所有者と組織範囲を越境できない。
8. Python Worker が標準入出力だけで動作する。
9. 100 同時利用者と SSE の性能 gate が合格する。
10. Backup、切替、Rollback rehearsal が合格する。
11. 日本語の開発文書、運用手順、API 対応表、テスト証跡が更新される。
12. <code>VERSION</code>、各 package、画面版数、<code>CHANGELOG.md</code> が 0.8.0 に一致する。
13. テスト済み Commit が <code>origin/master</code> に反映され、<code>v0.8.0</code> Tag が存在する。

## 35. 実装時の参照

- <code>app/gateway/server.mjs</code>
- <code>app/gateway/auth-controller.mjs</code>
- <code>app/gateway/identity-database.mjs</code>
- <code>app/gateway/environment-database.mjs</code>
- <code>app/gateway/personal-task-database.mjs</code>
- <code>app/gateway/inquiry-support-routes.mjs</code>
- <code>app/gateway/ai-assistant-routes.mjs</code>
- <code>app/gateway/builder-worker.mjs</code>
- <code>app/gateway/credential-crypto.mjs</code>
- <code>app/packages/api-client/src/index.ts</code>
- <code>app/db/migrations</code>
- <code>app/scripts/publish-portal.ps1</code>
- <code>app/scripts/ensure-oneops-runtime.ps1</code>
- <code>conf/nginx.conf</code>

Framework 参考:

- Spring Boot System Requirements: https://docs.spring.io/spring-boot/system-requirements.html
- Spring Modulith Reference: https://docs.spring.io/spring-modulith/reference/
- Spring Modulith Testing: https://docs.spring.io/spring-modulith/reference/testing.html
- Spring Transaction Management: https://docs.spring.io/spring-framework/reference/data-access/transaction.html
- MyBatis Spring Boot Starter: https://mybatis.org/spring-boot-starter/
- Liquibase Documentation: https://docs.liquibase.com/
