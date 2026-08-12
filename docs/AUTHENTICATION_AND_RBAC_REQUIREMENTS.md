# 用户注册、SSO 与 RBAC 需求

更新时间：2026-07-24

## 1. 目标

OneOps 建立独立的用户、身份、会话、角色、权限和审计体系。Windows 域身份由 OHR0067 上既有的 EnvPortal 域认证代理完成，OneOps 复用 EnvPortal 验证后的短期身份令牌和用户档案。

用户档案、角色分配、权限判定、会话签发和审计记录均由 OneOps 数据库维护。EnvPortal 在线角色和权限不参与 OneOps 运行时判定。一次性用户迁移只读取 EnvPortal 用户档案，并按本需求规定的固定映射转换为 OneOps 标准角色；迁移完成后，用户和授权完全由 OneOps 管理。

## 2. 物理 ID

用户、外部身份、角色、权限、角色授权、用户角色分配、会话、一次性 SSO 票据和审计事件必须具有独立、稳定的物理 ID。

用户名、电子邮件、域账号、角色 Code 和权限 Code 是业务标识。表间强关联必须保存物理 ID，并由数据库外键保证引用完整性。普通用户画面不显示物理 ID。

## 3. 注册与账号状态

当前暂时停用未登录用户的本地自助注册。登录页只提供既有本地账号登录和 Windows SSO，公开 `POST /api/work-center/v1/auth/register` 返回 `403 REGISTRATION_DISABLED`，不创建用户、不签发会话。

系统管理员仍可通过具备 `identity.users.write` 权限的系统管理用户画面创建本地用户。Windows SSO 首次认证产生的自动建档不属于自助注册，继续按本需求执行。

管理者向けユーザー追加フォームは、送信前にユーザー名、メール及びパスワードの規則を表示して検証する。API が項目別の検証エラーを返した場合、画面は対応する入力欄へ現在の表示言語で操作可能な案内を表示する。

账号状态包括：

* `PENDING`：等待系统管理员审核。
* `ACTIVE`：允许登录。
* `SUSPENDED`：停止登录，既有会话应立即失效。

历史上的全新数据库首位注册用户引导规则保留在数据模型记录中。当前公开自助注册入口停用，初始化账号和后续本地账号由受控运维流程或系统管理员用户画面创建。

密码至少 12 个字符，并同时包含大写字母、小写字母、数字和符号。密码只保存带随机盐的 scrypt 派生结果。

## 4. Windows SSO 与自动建档

域认证代理部署在已加入域的 Windows 主机上，通过 Windows Integrated Authentication 获取当前登录域账号，并可读取 UPN、显示名、电子邮件、部门和职务。

EnvPortal 完成域认证后向浏览器签发短期 HMAC 身份令牌。浏览器通过顶层表单把令牌提交给 OneOps，OneOps 服务端再向 EnvPortal 验证令牌并读取以下身份数据：

* 域账号
* UPN
* 显示名
* 电子邮件
* 部门
* 职务
* EnvPortal 短期身份令牌

EnvPortal 令牌不会放入 URL，也不会写入 OneOps 日志或审计详情。域 UPN 与电子邮件是两个独立身份属性。当前 Windows 域 UPN 为 `账号@tokyo.scientia.co.jp`，企业邮箱为 `账号邮箱@onehr.jp`。旧版 8998 无法提供 UPN 时，EnvPortal 返回从可信 Windows 身份保存的域名，OneOps 使用 `OPS_SSO_WINDOWS_UPN_SUFFIXES` 还原域 UPN，并通过 `OPS_SSO_ALLOWED_DOMAINS` 校验 UPN 域。邮箱只接受 `OPS_SSO_ALLOWED_EMAIL_DOMAINS` 配置的域。

未登录用户访问 OneOps 时，前端自动发起一次 Windows SSO。浏览器当前已登录域用户的签名 UPN 必须具有精确的 `tokyo.scientia.co.jp` 后缀，或者可信 Windows 域名必须命中允许域配置并能映射到该 UPN 后缀。其他 UPN 域和其他 Windows 域均拒绝。认证失败或当前标签页已经尝试过自动认证时保留本地账号登录入口，避免循环跳转。用户主动退出后，同一标签页保持本地账号登录入口并保留 SSO 按钮，直到用户手动发起 SSO 或新标签页重新执行首次自动认证。

Windows Integrated Authentication 必须由 Browser Top-level Navigation 直接访问 `OPS_ENVPORTAL_SSO_URL` 的认证 Host。OneOps nginx 不得以 Hidden iframe 或 Reverse Proxy 把自身 Origin 的认证 Request 转发至 EnvPortal，因为 Negotiate / NTLM 的 Origin、SPN 及 Connection Context 必须与实际认证 Host 一致。自动认证使用 `window.location.replace`，手动 SSO 使用 `window.location.assign`。回到 OneOps 后使用 Session Storage 阻止同一 Tab 的自动循环，并保留 LOCAL Login 与手动 SSO 入口。

允许的 Windows 域用户首次通过 SSO，且能够取得允许的 `onehr.jp` 企业邮箱时，OneOps 自动创建用户档案和 `WINDOWS` 外部身份。新用户状态直接设为 `ACTIVE`，并取得系统范围 `VIEWER` 角色。SSO 自动建档不参与首位系统管理员引导，所有自动建档用户均保持 `VIEWER`。

AD 邮箱与既有用户电子邮件精确匹配时，系统把 `WINDOWS` 身份绑定到既有用户并保留原有角色。AD 邮箱暂时不可用时，`OPS_SSO_ACCOUNT_LINKS` 可按完整域 UPN 配置明确的账号邮箱映射。当前 `x02851@tokyo.scientia.co.jp` 映射到 `sun.shaoxuan@onehr.jp`，绑定现有 `SYSTEM_ADMIN`，不创建 VIEWER 副本。`PENDING` 用户完成域认证后转为 `ACTIVE`，`SUSPENDED` 用户保持停用状态。

### 4.1 EnvPortal 用户一次性迁移

迁移必须读取 OHR0067 当前部署目录中的生产 `users.json` 和 `roles.json`，本地开发目录仅用于代码参考。源文件保持只读，执行前保存源快照、目标用户快照、文件 SHA256 和脱敏迁移报告。

迁移按 Windows 完整域账号优先合并，企业邮箱精确匹配作为第二合并条件。已存在的 OneOps 用户保留显示名覆盖状态、账号状态和全部角色。无法可靠取得企业邮箱时保持邮箱为空，不根据域账号猜测企业邮箱。

旧用户缺少域元数据时，只有来源确认属于 TOKYO 域且账号符合真人账号规则，才生成 `TOKYO\账号` 和 `账号@tokyo.scientia.co.jp`。机器账号和无效账号不得迁移。EnvPortal 的首次、最后访问时间和旧角色写入 Windows 身份来源元数据，IP 地址不迁移。

角色映射固定如下：

| EnvPortal 角色 | OneOps 角色 | 范围 |
| --- | --- | --- |
| 已存在于 OneOps 的用户 | 保留现有角色 | 保留现有范围 |
| `admin` 新用户 | `OPERATOR` | 全体 |
| 其他新用户 | `VIEWER` | 全体 |

旧 `admin` 不直接转换为 `SYSTEM_ADMIN`。系统管理员必须由 OneOps 现有系统管理员显式授予。迁移工具默认预演，只有明确传入 `--apply` 才在单一数据库事务中写入；出现账号冲突时整体停止。每个成功迁移或合并的用户写入 `ENVPORTAL_USER_MIGRATED` 审计事件。

SSO 登录采用短期、单次使用的登录票据完成浏览器回跳。票据在数据库中只保存 SHA256 摘要，使用后立即失效。业务会话令牌不会放入 URL。

Windows 机器账号以 `$` 结尾，必须拒绝自动建档。

自动 SSO 使用 `http://OHR0067:8998/oneops_sso.jsp`。EnvPortal 中转端点和服务端档案验证端点可用后才启用。线上认证配置必须同时返回 `windowsSsoEnabled=true` 和 `windowsSsoAutoLogin=true`。最终验收必须使用真实的允许域用户浏览器完成自动登录、首次 `VIEWER` 建档和再次访问会话恢复。

初回自動 Windows SSO は OneOps のログイン画面を維持したまま同一Originの非表示認証Frameで開始する。認証 Session は 300ms 間隔で確認し、成功時は即時に主画面へ遷移する。5 秒経過時は認証試行を終了し、ユーザー名及びパスワードの入力画面を継続表示する。利用者へ追加のSSO画面又はPopupを表示しない。復帰後も Windows アカウント認証ボタンを表示し、手動再試行を許可する。

## 5. 个人资料

已登录用户可从页面右上角的“个人资料”入口查看用户名、电子邮件、显示名及自己的 Windows SSO 绑定，并修改自己的显示名。用户名、电子邮件和 SSO 绑定在个人资料画面中只读。

Windows SSO 绑定作为独立外部身份保存在 `auth_identities`，不得把域 UPN、企业邮箱和本地用户名合并为同一字段。底层分别保存 Windows 域、域用户名、完整域账号和域 UPN，用于身份校验与检索。画面只展示完整域账号和域 UPN，避免把可由完整域账号直接识别的域名与域用户名重复占位。完整域账号取外部身份 `subject`，例如 `TOKYO\x02851`；域 UPN 取身份元数据，例如 `x02851@tokyo.scientia.co.jp`。

プロフィール画面はデスクトップで 880px 幅を使用し、基本情報を二列で表示する。ユーザー名、メール、ドメインアカウント、UPN、所属及び職責の長い値を確認できる幅を確保する。720px 以下では一列へ切り替える。

Windows SSO 绑定作为独立外部身份保存在 `auth_identities`，不得把域 UPN、企业邮箱和本地用户名合并为同一字段。底层分别保存 Windows 域、域用户名、完整域账号和域 UPN，用于身份校验与检索。画面只展示完整域账号和域 UPN，避免把可由完整域账号直接识别的域名与域用户名重复占位。完整域账号取外部身份 `subject`，例如 `TOKYO\x02851`；域 UPN 取身份元数据，例如 `x02851@tokyo.scientia.co.jp`。

既存の TOKYO Windows Identity で UPN Metadata が空の場合、完全ドメインアカウントから確認できるユーザー名と現行の信頼済み UPN Suffix `tokyo.scientia.co.jp` を使用し、`048_backfill_windows_identity_upn.sql` で UPN を一度だけ保存する。機械アカウント及び TOKYO 以外の Identity は対象外とする。

Windows Domain 認証が有効な全利用者について、Identity Metadata に Windows Domain、Domain Username、UPN、表示名及び確認済み企業メールを保存する。`049_backfill_windows_identity_profiles.sql` は既存の Windows Identity を User Physical ID で User 基本档案と結合し、完全 Domain Account から確定できる Domain と Domain Username、既存の信頼済み UPN、User 表示名及び登録済み企業メールを補完する。機械 Account は対象外とし、存在しない企業メール、所属又は職責を推測しない。

ユーザー管理画面は OneOps Username、表示名、企業メール、Windows Domain、Domain Username、完全 Domain Account 及び UPN を同時に表示する。企業メールが信頼済み情報源に存在しない場合は「企業メール未登録」と明示し、Domain UPN を企業メールとして代用しない。編集画面にも同じ基本档案を表示し、対象 User Physical ID に結び付いた档案を確認できるようにする。

LOCAL Identity を持つ利用者だけに、右上の利用者 Dropdown へ「LOCAL パスワード変更」を表示し、独立 Dialog で現在のパスワード、新しいパスワード及び確認入力を受け付ける。Profile 編集画面には Password 操作を含めない。変更 API は現在のパスワードを scrypt Hash で照合し、新しいパスワードへ登録時と同じ強度規則を適用する。成功時は現在の Session を維持し、同一ユーザーの他 Session を取り消し、`LOCAL_PASSWORD_CHANGED` を監査する。Windows SSO の Identity と Session 契約は変更しない。

Profile Dialog を開くたびに現在 Session を再取得し、Migration、SSO 又は管理者操作で更新された最新の User Identity Metadata を表示する。初回 Login 時の Client Cache に残る古い UPN を表示し続けない。

### 管理者による Windows SSO バインド

`identity.users.write` 権限を持つ管理者は、ユーザー管理画面から既存 OneOps ユーザーへ Windows 外部アイデンティティをバインド、更新及び解除できる。管理者が追加したローカルユーザーも、バインド後は同じユーザー物理 ID、ロール及び業務データを維持したまま Windows SSO を利用する。

入力は完全なドメインアカウントと UPN の二項目とする。完全なドメインアカウントは `TOKYO\x03056`、UPN は `x03056@tokyo.scientia.co.jp` の形式とし、サーバーは許可済み Windows ドメイン、許可済み UPN サフィックス、両項目のユーザー名一致及び機械アカウント除外を検証する。

Windows 外部アイデンティティは `auth_identities.user_id` でユーザー物理 ID を参照し、`(provider, subject_normalized)` の一意制約及び Windows Provider に限定した `user_id` の一意制約を維持する。同じ Windows Subject を複数ユーザーへバインドできず、一人の OneOps ユーザーへ複数の Windows Identity もバインドできない。競合時は `409 WINDOWS_IDENTITY_CONFLICT` を返し、既存バインドを移動しない。解除は対象ユーザーの `WINDOWS` アイデンティティだけを削除し、`LOCAL` アイデンティティ、ユーザー、ロール、所属及び業務データを変更しない。

バインド及び解除 API は CSRF 検証と `identity.users.write` 権限を必須とし、`WINDOWS_IDENTITY_ADMIN_LINKED` 又は `WINDOWS_IDENTITY_ADMIN_UNLINKED` を監査へ記録する。

ユーザー編集画面では、Windows SSO の操作ボタン群と後続のロール項目見出しの間に管理画面の標準区画間隔 24px を確保する。操作ボタン、次項目の見出し及び入力欄を連続して密着表示しない。

显示名保存前去除首尾空白，长度必须为 1 至 120 个字符。修改成功后，页面顶栏和用户管理中的名称立即使用新值，并写入 `PROFILE_UPDATED` 审计事件。

用户手工保存显示名后，该值优先于 Windows SSO 提交的目录显示名。后续 SSO 登录继续同步电子邮件和登录信息，不覆盖用户手工显示名。尚未手工保存显示名的用户继续接收目录显示名更新。

## 6. 本地登录与会话

本地登录可使用用户名或电子邮件。登录成功后签发数据库会话。

会话令牌使用高强度随机数，数据库只保存 SHA256 摘要。浏览器通过 `HttpOnly`、`Secure`、`SameSite=Lax` Cookie 保存会话令牌。

修改类请求必须提交与会话绑定的 CSRF Token。CSRF Token 通过可读 Cookie 下发，前端放入 `X-OneOps-CSRF` 请求头，服务端比较摘要。

退出登录、账号停用和账号角色变更应支持撤销相关会话。会话超过有效期后不可继续使用。

## 7. RBAC

权限使用稳定 Code 表达资源和动作。第一阶段权限如下：

| 权限 Code | 说明 |
| --- | --- |
| `dashboard.read` | 查看工作台与实时事件 |
| `organizations.read` | 查看组织机构 |
| `organizations.write` | 维护组织机构 |
| `environments.read` | 查看环境台账与产品档案 |
| `environments.write` | 维护环境台账 |
| `catalog.read` | 查看系统共通基础档案 |
| `catalog.write` | 维护系统共通基础档案 |
| `identity.users.read` | 查看用户 |
| `identity.users.write` | 审核、启停、分配用户角色及新增本地用户（默认 VIEWER） |
| `identity.roles.read` | 查看角色与权限 |
| `identity.roles.write` | 新增和维护角色授权 |
| `customer.knowledge.manage` | 管理客户知识源、扫描、重新导入、重新分析及候选确认 |
| `audit.read` | 查看认证与授权审计 |

系统预置角色：

* `SYSTEM_ADMIN`：拥有全部权限。
* `OPERATOR`：可查看和维护业务档案，不可管理用户、角色和审计。
* `VIEWER`：只读查看工作台、组织机构、环境和基础档案。

ロールの初期権限は、初回作成時のシステムロールに対してだけ付与します。`roles.permission_seed_enabled` が有効なロールだけが、Gateway 起動時に再実行される初期権限 SQL の対象になります。ロールを管理画面から保存すると、この値を無効にして、保存した権限集合を確定します。既存データベースへ列を追加する場合の初期値も無効とし、運用中の権限を再追加しません。PostgreSQL の外部永続ボリュームと Gateway 再起動の組合せでも、管理者が削除した権限を保持します。

用户角色分配支持全体范围和组织机构范围。“全体”必须作为范围下拉框中的明确可选项，并作为新增角色分配的默认值，不得使用占位文字模拟选中状态。全体范围在数据层保存为 `organization_id = NULL`，表示该角色权限适用于全部组织机构；组织机构范围分配必须保存组织机构物理 ID 外键。系统级管理功能只接受全体范围权限。

后端 API 是权限判定的最终边界。前端根据权限隐藏无权入口，用于改善操作体验。

顧客ナレッジ管理は現段階でシステム管理者専用とする。`customer.knowledge.manage` はシステム範囲だけを受け付け、Scan 参照、開始、再取込、再分析、候補反映及び候補却下を同じ権限で保護する。一般利用者の顧客情報画面には顧客ナレッジ管理の入口又は操作を表示しない。

ロール編集の権限マトリクスでは、保存用の権限 Code を変更せずに資源及び操作の表示キーを正規化する。`CUSTOMER_KNOWLEDGE` と小文字の `customer.knowledge` は同じ「システム管理 > 顧客情報 CAG 分析」行へ統合する。現行の管理操作は `manage` だけを表示し、旧 `scan` と `review` はマトリクス及びロール保存対象から除外する。`organizations` は顧客情報そのものではなく、顧客情報が参照する組織機関台帳として「組織機関台帳」と表示する。操作の説明は、`read` を情報閲覧、`write` をデータ編集、`use` を業務機能利用、`review` を候補確認、`manage` を設定及び運用管理とする。

ロールの権限集合を変更した場合、以後のセッション解決では変更後の権限を使用する。代理ログイン開始時は対象利用者のロールと権限を再取得し、管理者側の古い権限表示や対象利用者の変更前権限を引き継がない。基本台帳の入口及び参照は `catalog.read`、更新操作は `catalog.write` で制御する。`catalog.read` がない利用者には基本台帳の入口を表示せず、基本台帳のルートを直接指定しても権限のある画面へ遷移させる。

機能画面は、入口、参照データ取得、変更操作、秘密情報の表示を同じ権限境界で制御する。環境台帳は `environments.read` を入口と参照の基準、`environments.write` を環境・グループ・端点の変更基準とし、資格情報は `environments.credentials.read` と `environments.credentials.write` を分離する。製品候補取得は環境更新操作と `catalog.read` の両方がある場合だけ許可する。`identity.roles.read` がないユーザー管理画面はロール一覧を取得せず、ロール割当を変更できない。`dashboard.read` がない利用者はダッシュボード取得、リアルタイムイベント接続、ワークベンチからの該当ショートカットを使用できない。

第1階層の製品構築、ナレッジ、コードインサイト及びレポートは `builder.use`、`knowledge.use`、`code.insight.use`、`reports.read` で入口を分離する。製品構築 API の全操作は `builder.use` で保護し、これらの権限を `dashboard.read` の代替として扱わない。

## 8. 管理功能

システム管理画面には以下を配置します。

* 用户管理：查询用户、查看电子邮件和 Windows SSO 绑定、审核账号、启停账号、分配系统或组织机构范围角色。
* ロールと権限：ロールの検索と作成、Code、Name、説明、権限集合の管理を行います。編集対象はロール物理 ID で識別し、Code と Name の変更後も利用者ロール割当、ロール権限、ロール対象バインディングは `role_id` 外部キーで同じロールを参照します。
* 认证审计：查看注册、登录、SSO 建档、退出、账号状态和角色授权变化。

系统管理页面不继承当前组织机构上下文。

系统管理左侧使用分组二级菜单。“用户管理”作为独立分组，与“基本档案管理”并列；用户管理、角色与权限、认证审计各自提供直接入口，不归入基本档案分类。

系统管理的一级菜单名称和页面大标题必须使用相同的完整名称。日文统一为“システム管理”，中文统一为“系统管理”，英文统一为“System management”。

## 9. 审计

以下事件必须写入结构化审计表：

* 本地注册成功或失败
* 本地登录成功或失败
* Windows SSO 成功或失败
* 自动建立域用户
* 退出登录
* 用户个人资料变化
* 用户状态变化
* 用户角色分配变化
* 角色权限变化

审计记录包含事件物理 ID、行为人用户物理 ID、目标类型、目标物理 ID、请求 IP、User Agent、时间和不含秘密的结构化详情。

密码、会话令牌、CSRF Token、SSO 票据和共享密钥禁止写入日志或审计详情。

## 10. 安全边界

域身份请求头只有在 HMAC 签名、时间戳和随机数全部校验通过时才可信。普通客户端自行提交同名请求头不能获得身份。

认证接口需要基础速率限制。认证失败采用统一错误提示，避免枚举用户名、电子邮件或账号状态。

所有写入接口进行服务端输入校验。系统角色 Code、权限 Code、用户名和域身份规范化值由数据库唯一约束保护。

## 11. 验收

完成条件：

* 数据库迁移可重复执行。
* 注册、登录、退出、会话恢复、CSRF、账号停用、RBAC 拒绝和允许路径具有自动化测试。
* SSO 签名校验、过期断言、重放、机器账号拒绝和一次性票据具有自动化测试。
* SSO 精确域后缀限制、自动登录配置和 `VIEWER` 自动建档具有自动化测试。
* 前端注册、登录、SSO 入口、个人资料、用户管理和角色管理具有自动化测试。
* 生产构建、Nginx 配置检查和本机 HTTPS 运行验证通过。
* 浏览器验证覆盖注册或登录、个人资料修改、受保护页面、无权入口隐藏、用户管理及退出登录。

## 12. 自動 SSO の常時稼働

本番の `OPS_SSO_AUTO_LOGIN` は常に `true` とします。Windows タスク `OneOps Runtime Supervisor` は 30 秒間隔で環境設定と Gateway の実効認証設定を確認し、値が無効になった場合は `.env.local` を原子的に修正して Gateway を再起動します。

復旧後は `/api/work-center/v1/auth/config` の `windowsSsoEnabled`、`windowsSsoAutoLogin`、`windowsSsoUrl` を検証します。OHR0067 の 8998 番ポート到達性も確認し、到達できない場合は運用ログへ記録して次回巡検で再確認します。

OneOps ユーザー、Windows 外部アイデンティティ、ロール、監査履歴は PostgreSQL の保護済み外部ボリュームに保存します。常駐監視はボリューム消失時に空の代替データベースを作成しません。

### ログイン画面の利用者向け表記

一般利用者向けログイン画面では、認証方式の見出しに技術略語 `SSO` を表示しません。日本語は見出しを「Windows アカウント認証」、操作を「Windows にログイン中のアカウントで認証」、自動認証の待機状態を「Windows にログイン中のアカウントを確認しています。」とします。中国語及び英語も同じ意味を各言語で表示します。内部設定名、API Field、監査 Event 及び認証処理の識別子は変更しません。
# AI Token使用量レポート

`reports.ai-token-usage.read` は管理者専用のAI Token使用量レポート権限とする。新規環境の初期権限種子及び既存環境の導入作業では `SYSTEM_ADMIN` だけへ付与する。保存済みロールはMigration再実行で変更しない。画面入口と `GET /api/work-center/v1/reports/ai-token-usage` の双方で検証する。
