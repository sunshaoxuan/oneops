import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EditOutlined,
  LoginOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  createRole,
  fetchAuditEvents,
  fetchInternalWorkforce,
  fetchManagedUsers,
  fetchRoles,
  updateManagedUser,
  updateRole,
  type AuditEvent,
  type DepartmentMembership,
  type ManagedUser,
  type Organization,
  type Permission,
  type Role,
  type RoleAssignment,
  type ResponsibilityAssignment,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import {
  buildPermissionMatrix,
  type PermissionMatrixRow,
} from "./permission-matrix";
import { formatTimestamp } from "./utils";

const { Text, Title } = Typography;
const ALL_ORGANIZATIONS_SCOPE = "__ALL_ORGANIZATIONS__";

const copy = {
  "ja-JP": {
    title: "ユーザー管理",
    description: "ユーザー、ロール、権限とシステム操作監査を管理します。",
    users: "ユーザー管理",
    usersDescription: "ユーザーの状態、認証元とロール割当を管理します。",
    roles: "ロール・権限",
    rolesDescription: "ロールとロールに含まれる権限を管理します。",
    audit: "システム操作監査",
    auditDescription: "ログイン、機能利用、変更と AI 呼び出しの履歴を確認します。",
    username: "ユーザー名",
    displayName: "表示名",
    email: "メール",
    identity: "認証元",
    ssoBinding: "SSO バインド",
    windowsDomain: "Windows ドメイン",
    domainUsername: "ドメインユーザー名",
    domainAccount: "ドメインアカウント",
    domainUpn: "ドメイン UPN",
    status: "状態",
    role: "ロール",
    scope: "適用範囲",
    systemScope: "全体（すべての組織機関）",
    actions: "操作",
    editUser: "ユーザー権限を編集",
    impersonate: "代理ログイン",
    impersonateConfirm: "このユーザーとして代理ログインを開始しますか？",
    addAssignment: "ロールを追加",
    primaryDepartment: "主所属",
    additionalDepartments: "兼務所属",
    businessResponsibilities: "業務職責",
    department: "社内部門",
    responsibility: "職責",
    primary: "主担当",
    addDepartment: "所属を追加",
    addResponsibility: "職責を追加",
    save: "保存",
    addRole: "ロールを追加",
    editRole: "ロールを編集",
    roleCode: "ロールコード",
    roleName: "ロール名",
    roleDescription: "説明",
    permissions: "権限",
    permissionMatrix: "権限マトリクス",
    permissionMatrixDescription:
      "閲覧は情報の確認、管理はデータや設定の変更、実行は問合検索や AI 支援などの業務処理を表します。",
    permissionNode: "機能ノード",
    event: "イベント",
    actor: "実行者",
    target: "対象",
    requestIp: "接続元",
    capability: "利用機能",
    action: "操作",
    outcome: "結果",
    duration: "所要時間",
    tokenUsage: "Token 使用量",
    details: "詳細",
    all: "すべて",
    search: "検索",
    reset: "クリア",
    cancel: "キャンセル",
    from: "開始日時",
    to: "終了日時",
    unavailable: "未提供",
    records: "表示件数",
    successful: "成功",
    failed: "失敗・拒否",
    loadError: "ロール・権限の読み込みに失敗しました。",
    retry: "再試行",
    aiCalls: "AI 呼び出し",
    time: "日時",
  },
  "zh-CN": {
    title: "用户管理",
    description: "管理用户、角色、权限及系统操作审计。",
    users: "用户管理",
    usersDescription: "管理用户状态、认证来源和角色分配。",
    roles: "角色与权限",
    rolesDescription: "管理角色及角色包含的权限。",
    audit: "系统操作审计",
    auditDescription: "查看登录、功能使用、变更及 AI 调用记录。",
    username: "用户名",
    displayName: "显示名称",
    email: "电子邮件",
    identity: "认证来源",
    ssoBinding: "SSO 绑定",
    windowsDomain: "Windows 域",
    domainUsername: "域用户名",
    domainAccount: "域账号",
    domainUpn: "域 UPN",
    status: "状态",
    role: "角色",
    scope: "适用范围",
    systemScope: "全体（全部组织机构）",
    actions: "操作",
    editUser: "编辑用户权限",
    impersonate: "代理登录",
    impersonateConfirm: "要以该用户身份开始代理登录吗？",
    addAssignment: "添加角色",
    primaryDepartment: "主要部门",
    additionalDepartments: "兼任部门",
    businessResponsibilities: "业务职责",
    department: "内部部门",
    responsibility: "职责",
    primary: "主要",
    addDepartment: "添加部门",
    addResponsibility: "添加职责",
    save: "保存",
    addRole: "添加角色",
    editRole: "编辑角色",
    roleCode: "角色代码",
    roleName: "角色名称",
    roleDescription: "说明",
    permissions: "权限",
    permissionMatrix: "权限矩阵",
    permissionMatrixDescription:
      "查看用于浏览信息，管理用于修改数据或设置，执行用于运行问询查询、AI 支援等业务流程。",
    permissionNode: "功能节点",
    event: "事件",
    actor: "操作人",
    target: "对象",
    requestIp: "来源地址",
    capability: "使用功能",
    action: "操作",
    outcome: "结果",
    duration: "耗时",
    tokenUsage: "Token 使用量",
    details: "详情",
    all: "全部",
    search: "查询",
    reset: "清除",
    cancel: "取消",
    from: "开始时间",
    to: "结束时间",
    unavailable: "未提供",
    records: "显示记录",
    successful: "成功",
    failed: "失败及拒绝",
    loadError: "角色与权限加载失败。",
    retry: "重试",
    aiCalls: "AI 调用",
    time: "时间",
  },
  "en-US": {
    title: "User management",
    description: "Manage users, roles, permissions and system activity audit.",
    users: "User management",
    usersDescription: "Manage user status, identities and role assignments.",
    roles: "Roles and permissions",
    rolesDescription: "Manage roles and the permissions included in each role.",
    audit: "System activity audit",
    auditDescription: "Review sign-in, feature use, changes and AI calls.",
    username: "Username",
    displayName: "Display name",
    email: "Email",
    identity: "Identity",
    ssoBinding: "SSO binding",
    windowsDomain: "Windows domain",
    domainUsername: "Domain username",
    domainAccount: "Domain account",
    domainUpn: "Domain UPN",
    status: "Status",
    role: "Role",
    scope: "Scope",
    systemScope: "All organizations",
    actions: "Actions",
    editUser: "Edit user access",
    impersonate: "Impersonate user",
    impersonateConfirm: "Start an impersonated session as this user?",
    addAssignment: "Add role",
    primaryDepartment: "Primary department",
    additionalDepartments: "Additional departments",
    businessResponsibilities: "Business responsibilities",
    department: "Internal department",
    responsibility: "Responsibility",
    primary: "Primary",
    addDepartment: "Add department",
    addResponsibility: "Add responsibility",
    save: "Save",
    addRole: "Add role",
    editRole: "Edit role",
    roleCode: "Role Code",
    roleName: "Role name",
    roleDescription: "Description",
    permissions: "Permissions",
    permissionMatrix: "Permission matrix",
    permissionMatrixDescription:
      "View reads information, Manage changes data or settings, and Execute runs workflows such as inquiry searches or AI assistance.",
    permissionNode: "Functional node",
    event: "Event",
    actor: "Actor",
    target: "Target",
    requestIp: "Source",
    capability: "Capability",
    action: "Action",
    outcome: "Outcome",
    duration: "Duration",
    tokenUsage: "Token usage",
    details: "Details",
    all: "All",
    search: "Search",
    reset: "Clear",
    cancel: "Cancel",
    from: "From",
    to: "To",
    unavailable: "Not provided",
    records: "Records",
    successful: "Successful",
    failed: "Failed or denied",
    loadError: "Roles and permissions could not be loaded.",
    retry: "Retry",
    aiCalls: "AI calls",
    time: "Time",
  },
} as const;

const builtinRoleNames = {
  "ja-JP": {
    SYSTEM_ADMIN: "システム管理者",
    OPERATOR: "運用担当者",
    VIEWER: "閲覧者",
  },
  "zh-CN": {
    SYSTEM_ADMIN: "系统管理员",
    OPERATOR: "运维人员",
    VIEWER: "只读用户",
  },
  "en-US": {
    SYSTEM_ADMIN: "System administrator",
    OPERATOR: "Operator",
    VIEWER: "Viewer",
  },
} as const;

const builtinRoleDescriptions = {
  "ja-JP": {
    SYSTEM_ADMIN: "ユーザー、ロール、監査とすべての業務機能を管理します。",
    OPERATOR: "業務台帳を参照し、更新します。",
    VIEWER: "ワークベンチと業務台帳を参照します。",
  },
  "zh-CN": {
    SYSTEM_ADMIN: "管理用户、角色、审计和全部业务功能。",
    OPERATOR: "查看并维护业务档案。",
    VIEWER: "查看工作台和业务档案。",
  },
  "en-US": {
    SYSTEM_ADMIN: "Manage users, roles, audit and all business functions.",
    OPERATOR: "View and maintain business records.",
    VIEWER: "View the workbench and business records.",
  },
} as const;

const permissionNames: Record<
  LocaleKey,
  Record<string, string>
> = {
  "ja-JP": {
    "dashboard.read": "ワークベンチ参照",
    "organizations.read": "組織機関参照",
    "organizations.write": "組織機関更新",
    "environments.read": "環境参照",
    "environments.write": "環境更新",
    "environments.credentials.read": "環境認証情報閲覧",
    "environments.credentials.write": "環境認証情報管理",
    "catalog.read": "基本台帳参照",
    "catalog.write": "基本台帳更新",
    "inquiries.use": "問合支援実行",
    "inquiries.templates.read": "問合検索テンプレート閲覧",
    "inquiries.templates.write": "問合検索テンプレート管理",
    "personal.tasks.use": "個人タスク利用",
    "ai.assistant.use": "AI助手利用",
    "models.settings.read": "AI 設定閲覧",
    "models.settings.write": "AI 設定管理",
    "identity.users.read": "ユーザー参照",
    "identity.users.write": "ユーザー更新",
    "identity.users.impersonate": "代理ログイン実行",
    "identity.workforce.read": "業務部門・職責閲覧",
    "identity.workforce.write": "業務部門・職責管理",
    "identity.roles.read": "ロール参照",
    "identity.roles.write": "ロール更新",
    "audit.read": "監査参照",
  },
  "zh-CN": {
    "dashboard.read": "查看工作台",
    "organizations.read": "查看组织机构",
    "organizations.write": "维护组织机构",
    "environments.read": "查看环境",
    "environments.write": "维护环境",
    "environments.credentials.read": "查看环境凭据",
    "environments.credentials.write": "管理环境凭据",
    "catalog.read": "查看基础档案",
    "catalog.write": "维护基础档案",
    "inquiries.use": "执行问询支援",
    "inquiries.templates.read": "查看问合搜索模板",
    "inquiries.templates.write": "管理问合搜索模板",
    "personal.tasks.use": "使用个人任务",
    "ai.assistant.use": "使用 AI 助手",
    "models.settings.read": "查看 AI 设置",
    "models.settings.write": "管理 AI 设置",
    "identity.users.read": "查看用户",
    "identity.users.write": "维护用户",
    "identity.users.impersonate": "执行代理登录",
    "identity.workforce.read": "查看业务部门与职责",
    "identity.workforce.write": "管理业务部门与职责",
    "identity.roles.read": "查看角色",
    "identity.roles.write": "维护角色",
    "audit.read": "查看审计",
  },
  "en-US": {
    "dashboard.read": "View dashboard",
    "organizations.read": "View organizations",
    "organizations.write": "Maintain organizations",
    "environments.read": "View environments",
    "environments.write": "Maintain environments",
    "environments.credentials.read": "View environment credentials",
    "environments.credentials.write": "Manage environment credentials",
    "catalog.read": "View master data",
    "catalog.write": "Maintain master data",
    "inquiries.use": "Execute inquiry support",
    "inquiries.templates.read": "View inquiry search templates",
    "inquiries.templates.write": "Manage inquiry search templates",
    "personal.tasks.use": "Use personal tasks",
    "ai.assistant.use": "Use AI Assistant",
    "models.settings.read": "View AI settings",
    "models.settings.write": "Manage AI settings",
    "identity.users.read": "View users",
    "identity.users.write": "Maintain users",
    "identity.users.impersonate": "Impersonate users",
    "identity.workforce.read": "View departments and responsibilities",
    "identity.workforce.write": "Manage departments and responsibilities",
    "identity.roles.read": "View roles",
    "identity.roles.write": "Maintain roles",
    "audit.read": "View audit",
  },
};

const permissionResourceNames: Record<LocaleKey, Record<string, string>> = {
  "ja-JP": {
    dashboard: "ワークベンチ",
    organizations: "組織機関",
    environments: "環境",
    "environments.credentials": "環境認証情報",
    catalog: "基本台帳",
    inquiries: "問合支援",
    "inquiries.templates": "問合検索テンプレート",
    "personal.tasks": "個人タスク",
    "ai.assistant": "AI助手",
    "models.settings": "AI 設定",
    "identity.users": "ユーザー",
    "identity.workforce": "業務部門・職責",
    "identity.roles": "ロール",
    audit: "システム操作監査",
  },
  "zh-CN": {
    dashboard: "工作台",
    organizations: "组织机构",
    environments: "环境",
    "environments.credentials": "环境凭据",
    catalog: "基础档案",
    inquiries: "问询支援",
    "inquiries.templates": "问合搜索模板",
    "personal.tasks": "个人任务",
    "ai.assistant": "AI 助手",
    "models.settings": "AI 设置",
    "identity.users": "用户",
    "identity.workforce": "业务部门与职责",
    "identity.roles": "角色",
    audit: "系统操作审计",
  },
  "en-US": {
    dashboard: "Workbench",
    organizations: "Organizations",
    environments: "Environments",
    "environments.credentials": "Environment credentials",
    catalog: "Master data",
    inquiries: "Inquiry support",
    "inquiries.templates": "Inquiry search templates",
    "personal.tasks": "Personal tasks",
    "ai.assistant": "AI Assistant",
    "models.settings": "AI settings",
    "identity.users": "Users",
    "identity.workforce": "Departments and responsibilities",
    "identity.roles": "Roles",
    audit: "System activity audit",
  },
};

const permissionActionNames: Record<LocaleKey, Record<string, string>> = {
  "ja-JP": {
    read: "閲覧",
    write: "管理",
    use: "実行",
    impersonate: "代理ログイン",
  },
  "zh-CN": {
    read: "查看",
    write: "管理",
    use: "执行",
    impersonate: "代理登录",
  },
  "en-US": {
    read: "View",
    write: "Manage",
    use: "Execute",
    impersonate: "Impersonate",
  },
};

const auditEventNames: Record<LocaleKey, Record<string, string>> = {
  "ja-JP": {
    LOCAL_REGISTRATION_SUCCEEDED: "ローカルユーザー登録成功",
    LOCAL_REGISTRATION_FAILED: "ローカルユーザー登録失敗",
    LOCAL_LOGIN_SUCCEEDED: "ローカルログイン成功",
    LOCAL_LOGIN_FAILED: "ローカルログイン失敗",
    WINDOWS_USER_PROVISIONED: "Windows ユーザー自動登録",
    WINDOWS_IDENTITY_LINKED: "Windows ID を既存ユーザーに連携",
    WINDOWS_SSO_SUCCEEDED: "Windows SSO 成功",
    WINDOWS_SSO_FAILED: "Windows SSO 失敗",
    LOGOUT_SUCCEEDED: "ログアウト",
    PROFILE_UPDATED: "プロフィール更新",
    USER_ACCESS_UPDATED: "ユーザー権限更新",
    ROLE_CREATED: "ロール登録",
    ROLE_UPDATED: "ロール更新",
    FUNCTION_USED: "機能利用",
    INQUIRY_SEARCHED: "問い合わせ検索",
    INQUIRY_TICKET_OPENED: "チケット詳細参照",
    INQUIRY_ATTACHMENT_READ: "添付ファイル参照",
    INQUIRY_AI_RUN_CREATED: "AI 補助作成",
    INQUIRY_AI_RUN_READ: "AI 補助結果参照",
    INQUIRY_AI_RUN_STARTED: "AI 補助開始",
    INQUIRY_AI_RUN_COMPLETED: "AI 補助完了",
    INQUIRY_AI_RUN_FAILED: "AI 補助失敗",
    AUDIT_LOG_READ: "監査ログ検索",
  },
  "zh-CN": {
    LOCAL_REGISTRATION_SUCCEEDED: "本地用户注册成功",
    LOCAL_REGISTRATION_FAILED: "本地用户注册失败",
    LOCAL_LOGIN_SUCCEEDED: "本地登录成功",
    LOCAL_LOGIN_FAILED: "本地登录失败",
    WINDOWS_USER_PROVISIONED: "Windows 用户自动注册",
    WINDOWS_IDENTITY_LINKED: "Windows 身份已绑定现有用户",
    WINDOWS_SSO_SUCCEEDED: "Windows SSO 成功",
    WINDOWS_SSO_FAILED: "Windows SSO 失败",
    LOGOUT_SUCCEEDED: "退出登录",
    PROFILE_UPDATED: "个人资料更新",
    USER_ACCESS_UPDATED: "用户权限更新",
    ROLE_CREATED: "角色创建",
    ROLE_UPDATED: "角色更新",
    FUNCTION_USED: "功能使用",
    INQUIRY_SEARCHED: "问询查询",
    INQUIRY_TICKET_OPENED: "工单详情查看",
    INQUIRY_ATTACHMENT_READ: "附件查看",
    INQUIRY_AI_RUN_CREATED: "AI 辅助任务创建",
    INQUIRY_AI_RUN_READ: "AI 辅助结果查看",
    INQUIRY_AI_RUN_STARTED: "AI 辅助开始",
    INQUIRY_AI_RUN_COMPLETED: "AI 辅助完成",
    INQUIRY_AI_RUN_FAILED: "AI 辅助失败",
    AUDIT_LOG_READ: "审计日志查询",
  },
  "en-US": {
    LOCAL_REGISTRATION_SUCCEEDED: "Local registration succeeded",
    LOCAL_REGISTRATION_FAILED: "Local registration failed",
    LOCAL_LOGIN_SUCCEEDED: "Local sign in succeeded",
    LOCAL_LOGIN_FAILED: "Local sign in failed",
    WINDOWS_USER_PROVISIONED: "Windows user provisioned",
    WINDOWS_IDENTITY_LINKED: "Windows identity linked to existing user",
    WINDOWS_SSO_SUCCEEDED: "Windows SSO succeeded",
    WINDOWS_SSO_FAILED: "Windows SSO failed",
    LOGOUT_SUCCEEDED: "Signed out",
    PROFILE_UPDATED: "Profile updated",
    USER_ACCESS_UPDATED: "User access updated",
    ROLE_CREATED: "Role created",
    ROLE_UPDATED: "Role updated",
    FUNCTION_USED: "Feature used",
    INQUIRY_SEARCHED: "Inquiry searched",
    INQUIRY_TICKET_OPENED: "Ticket detail viewed",
    INQUIRY_ATTACHMENT_READ: "Attachment viewed",
    INQUIRY_AI_RUN_CREATED: "AI assist created",
    INQUIRY_AI_RUN_READ: "AI assist result viewed",
    INQUIRY_AI_RUN_STARTED: "AI assist started",
    INQUIRY_AI_RUN_COMPLETED: "AI assist completed",
    INQUIRY_AI_RUN_FAILED: "AI assist failed",
    AUDIT_LOG_READ: "Audit log searched",
  },
};

const auditTargetNames: Record<LocaleKey, Record<string, string>> = {
  "ja-JP": {
    USER: "ユーザー",
    ROLE: "ロール",
    SESSION: "セッション",
    INQUIRY: "問い合わせ",
    INQUIRY_TICKET: "問い合わせチケット",
    INQUIRY_ASSIST_RUN: "AI 補助タスク",
    AUDIT_LOG: "監査ログ",
  },
  "zh-CN": {
    USER: "用户",
    ROLE: "角色",
    SESSION: "会话",
    INQUIRY: "问询",
    INQUIRY_TICKET: "问询工单",
    INQUIRY_ASSIST_RUN: "AI 辅助任务",
    AUDIT_LOG: "审计日志",
  },
  "en-US": {
    USER: "User",
    ROLE: "Role",
    SESSION: "Session",
    INQUIRY: "Inquiry",
    INQUIRY_TICKET: "Inquiry ticket",
    INQUIRY_ASSIST_RUN: "AI assist run",
    AUDIT_LOG: "Audit log",
  },
};

function roleDisplayName(
  code: string | undefined,
  name: string | undefined,
  locale: LocaleKey,
) {
  return (
    builtinRoleNames[locale][code as keyof (typeof builtinRoleNames)[LocaleKey]] ??
    name ??
    code ??
    ""
  );
}

function roleDisplayDescription(role: Role, locale: LocaleKey) {
  return (
    builtinRoleDescriptions[locale][
      role.code as keyof (typeof builtinRoleDescriptions)[LocaleKey]
    ] ?? role.description
  );
}

function IdentityHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="identity-heading">
      <div className="identity-heading-copy">
        <span><SafetyCertificateOutlined /></span>
        <div>
          <Title level={2}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </div>
      </div>
      {action && <div className="identity-heading-action">{action}</div>}
    </section>
  );
}

export function IdentityManagementPage({
  locale,
  permissions,
  currentUserId,
  organizations,
  onImpersonate,
  section,
}: {
  locale: LocaleKey;
  permissions: string[];
  currentUserId: string;
  organizations: Organization[];
  onImpersonate: (userId: string) => Promise<void>;
  section: "users" | "roles" | "audit";
}) {
  const text = copy[locale];
  const availableSections = [
    permissions.includes("identity.users.read") && {
      key: "users",
      label: text.users,
      children: (
        <UserManagement
          locale={locale}
          organizations={organizations}
          writable={permissions.includes("identity.users.write")}
          canReadRoles={permissions.includes("identity.roles.read")}
          canReadWorkforce={permissions.includes("identity.workforce.read")}
          currentUserId={currentUserId}
          canImpersonate={permissions.includes("identity.users.impersonate")}
          onImpersonate={onImpersonate}
        />
      ),
    },
    permissions.includes("identity.roles.read") && {
      key: "roles",
      label: text.roles,
      children: (
        <RoleManagement
          locale={locale}
          writable={permissions.includes("identity.roles.write")}
        />
      ),
    },
    permissions.includes("audit.read") && {
      key: "audit",
      label: text.audit,
      children: <AuditLog locale={locale} />,
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    children: React.ReactNode;
  }>;
  const selectedSection = availableSections.find((item) => item.key === section);
  const sectionDescriptions = {
    users: text.usersDescription,
    roles: text.rolesDescription,
    audit: text.auditDescription,
  };

  return (
    <div className="identity-management">
      {selectedSection?.key !== "roles" && (
        <IdentityHeading
          title={selectedSection?.label ?? text.title}
          description={
            selectedSection
              ? sectionDescriptions[section]
              : text.description
          }
        />
      )}
      {selectedSection ? (
        selectedSection.children
      ) : (
        <Empty />
      )}
    </div>
  );
}

function UserManagement({
  locale,
  organizations,
  writable,
  canReadRoles,
  canReadWorkforce,
  currentUserId,
  canImpersonate,
  onImpersonate,
}: {
  locale: LocaleKey;
  organizations: Organization[];
  writable: boolean;
  canReadRoles: boolean;
  canReadWorkforce: boolean;
  currentUserId: string;
  canImpersonate: boolean;
  onImpersonate: (userId: string) => Promise<void>;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [status, setStatus] = useState<ManagedUser["status"]>("PENDING");
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [departmentMemberships, setDepartmentMemberships] =
    useState<DepartmentMembership[]>([]);
  const [responsibilityAssignments, setResponsibilityAssignments] =
    useState<ResponsibilityAssignment[]>([]);
  const usersQuery = useQuery({
    queryKey: ["managed-users"],
    queryFn: ({ signal }) => fetchManagedUsers(signal),
  });
  const rolesQuery = useQuery({
    queryKey: ["managed-roles"],
    queryFn: ({ signal }) => fetchRoles(signal),
    enabled: canReadRoles,
  });
  const workforceQuery = useQuery({
    queryKey: ["internal-workforce"],
    queryFn: ({ signal }) => fetchInternalWorkforce(signal),
    enabled: canReadWorkforce,
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      updateManagedUser(editing!.id, {
        status,
        roleAssignments: assignments,
        departmentMemberships,
        responsibilityAssignments,
      }),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    },
  });
  const impersonationMutation = useMutation({
    mutationFn: (userId: string) => onImpersonate(userId),
  });
  const openEditor = (user: ManagedUser) => {
    setEditing(user);
    setStatus(user.status);
    setAssignments(
      user.roleAssignments.map((assignment) => ({
        roleId: assignment.roleId,
        organizationId: assignment.organizationId,
      })),
    );
    setDepartmentMemberships(user.departmentMemberships ?? []);
    setResponsibilityAssignments(user.responsibilityAssignments ?? []);
    saveMutation.reset();
  };
  const windowsIdentity = (user: ManagedUser) =>
    user.identities.find((identity) => identity.provider === "WINDOWS");
  const columns: TableColumnsType<ManagedUser> = [
    {
      title: text.username,
      dataIndex: "username",
      width: 220,
      render: (value: string) => <span className="business-code">{value}</span>,
    },
    {
      title: text.ssoBinding,
      key: "ssoBinding",
      width: 340,
      render: (_, user) => {
        const identity = windowsIdentity(user);
        if (!identity) return "－";
        return (
          <Space direction="vertical" size={2}>
            <span>
              <Text type="secondary">{text.domainAccount}: </Text>
              <Text copyable>{identity.subject}</Text>
            </span>
            <span>
              <Text type="secondary">{text.domainUpn}: </Text>
              <Text copyable>{identity.upn || "－"}</Text>
            </span>
          </Space>
        );
      },
    },
    { title: text.displayName, dataIndex: "displayName", width: 140 },
    { title: text.email, dataIndex: "email", width: 220 },
    {
      title: text.identity,
      key: "identity",
      width: 130,
      render: (_, user) => (
        <Space wrap>
          {user.identities.map((identity) => (
            <Tag key={`${identity.provider}:${identity.subject}`}>
              {identity.provider}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: text.status,
      dataIndex: "status",
      width: 110,
      render: (value: ManagedUser["status"]) => (
        <Tag color={value === "ACTIVE" ? "success" : value === "SUSPENDED" ? "error" : "warning"}>
          {value}
        </Tag>
      ),
    },
    {
      title: text.role,
      key: "roles",
      width: 180,
      render: (_, user) => (
        <Space wrap>
          {user.roleAssignments.map((assignment) => (
            <Tag key={assignment.id ?? `${assignment.roleId}:${assignment.organizationId ?? "system"}`}>
              {roleDisplayName(
                assignment.roleCode,
                assignment.roleName,
                locale,
              )}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: text.primaryDepartment,
      key: "primaryDepartment",
      width: 150,
      render: (_, user) =>
        user.departmentMemberships?.find((item) => item.isPrimary)
          ?.departmentName ?? "－",
    },
    {
      title: text.businessResponsibilities,
      key: "responsibilities",
      width: 200,
      render: (_, user) => (
        <Space wrap>
          {(user.responsibilityAssignments ?? []).map((assignment) => (
            <Tag key={assignment.id ?? `${assignment.departmentId}:${assignment.responsibilityId}`}>
              {assignment.responsibilityName}
            </Tag>
          ))}
        </Space>
      ),
    },
    ...(writable || canImpersonate
      ? [{
          title: text.actions,
          key: "actions",
          width: canImpersonate && writable ? 112 : 64,
          fixed: "right" as const,
          render: (_: unknown, user: ManagedUser) => (
            <Space size={2}>
              {writable && (
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  aria-label={text.editUser}
                  onClick={() => openEditor(user)}
                />
              )}
              {canImpersonate &&
                user.id !== currentUserId &&
                user.status === "ACTIVE" && (
                  <Button
                    type="text"
                    icon={<LoginOutlined />}
                    aria-label={text.impersonate}
                    loading={impersonationMutation.isPending}
                    onClick={() =>
                      Modal.confirm({
                        title: text.impersonate,
                        content: `${text.impersonateConfirm} ${user.displayName}（${user.username}）`,
                        okText: text.impersonate,
                        cancelText: text.cancel,
                        onOk: () => impersonationMutation.mutateAsync(user.id),
                      })
                    }
                  />
                )}
            </Space>
          ),
        }]
      : []),
  ];

  return (
    <Card className="identity-table-card">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={usersQuery.data ?? []}
        loading={usersQuery.isLoading}
        scroll={{ x: 1750 }}
      />
      <Modal
        open={Boolean(editing)}
        title={text.editUser}
        okText={text.save}
        onCancel={() => setEditing(null)}
        onOk={() => saveMutation.mutate()}
        confirmLoading={saveMutation.isPending}
        width={960}
      >
        <Form layout="vertical">
          <Form.Item label={text.status}>
            <Select
              value={status}
              onChange={setStatus}
              options={["PENDING", "ACTIVE", "SUSPENDED"].map((value) => ({
                value,
                label: value,
              }))}
            />
          </Form.Item>
          <Text strong>{text.role}</Text>
          <div className="role-assignment-list">
            {assignments.map((assignment, index) => (
              <div className="role-assignment-row" key={`${index}:${assignment.roleId}`}>
                <Select
                  disabled={!canReadRoles}
                  value={assignment.roleId || undefined}
                  placeholder={text.role}
                  onChange={(roleId) =>
                    setAssignments((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, roleId } : item,
                      ),
                    )
                  }
                  options={(rolesQuery.data?.roles ?? [])
                    .filter((role) => role.assignable)
                    .map((role) => ({
                      value: role.id,
                      label: `${role.code}  ${roleDisplayName(
                        role.code,
                        role.name,
                        locale,
                      )}`,
                    }))}
                />
                <Select
                  disabled={!canReadRoles}
                  value={assignment.organizationId ?? ALL_ORGANIZATIONS_SCOPE}
                  onChange={(organizationId) =>
                    setAssignments((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              organizationId:
                                organizationId === ALL_ORGANIZATIONS_SCOPE
                                  ? null
                                  : organizationId,
                            }
                          : item,
                      ),
                    )
                  }
                  options={[
                    {
                      value: ALL_ORGANIZATIONS_SCOPE,
                      label: text.systemScope,
                    },
                    ...organizations.map((organization) => ({
                      value: organization.id,
                      label: `${organization.code}  ${organization.name}`,
                    })),
                  ]}
                />
                <Button
                  danger
                  type="text"
                  disabled={!canReadRoles}
                  onClick={() =>
                    setAssignments((current) =>
                      current.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          <Button
            icon={<PlusOutlined />}
            disabled={!canReadRoles}
            onClick={() =>
              setAssignments((current) => [
                ...current,
                {
                  roleId: rolesQuery.data?.roles.find((role) => role.assignable)?.id ?? "",
                  organizationId: null,
                },
              ])
            }
          >
            {text.addAssignment}
          </Button>
          <div className="identity-editor-section">
            <Text strong>{text.department}</Text>
            <div className="workforce-assignment-list">
              {departmentMemberships.map((membership, index) => (
                <div className="workforce-assignment-row" key={`${index}:${membership.departmentId}`}>
                  <Select
                    disabled={!canReadWorkforce}
                    value={membership.departmentId || undefined}
                    placeholder={text.department}
                    options={(workforceQuery.data?.departments ?? [])
                      .filter((department) => department.enabled)
                      .map((department) => ({
                        value: department.id,
                        label: `${department.code}  ${department.name}`,
                      }))}
                    onChange={(departmentId) =>
                      setDepartmentMemberships((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, departmentId } : item,
                        ),
                      )
                    }
                  />
                  <Checkbox
                    disabled={!canReadWorkforce}
                    checked={membership.isPrimary}
                    onChange={(event) =>
                      setDepartmentMemberships((current) =>
                        current.map((item, itemIndex) => ({
                          ...item,
                          isPrimary: itemIndex === index && event.target.checked,
                        })),
                      )
                    }
                  >
                    {text.primaryDepartment}
                  </Checkbox>
                  <Button
                    danger
                    type="text"
                    disabled={!canReadWorkforce}
                    onClick={() => {
                      const departmentId = membership.departmentId;
                      setDepartmentMemberships((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      );
                      setResponsibilityAssignments((current) =>
                        current.filter((item) => item.departmentId !== departmentId),
                      );
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <Button
              icon={<PlusOutlined />}
              disabled={!canReadWorkforce}
              onClick={() =>
                setDepartmentMemberships((current) => [
                  ...current,
                  {
                    departmentId:
                      workforceQuery.data?.departments.find(
                        (department) =>
                          department.enabled &&
                          !current.some((item) => item.departmentId === department.id),
                      )?.id ?? "",
                    isPrimary: current.length === 0,
                    validFrom: null,
                    validTo: null,
                  },
                ])
              }
            >
              {text.addDepartment}
            </Button>
          </div>
          <div className="identity-editor-section">
            <Text strong>{text.businessResponsibilities}</Text>
            <div className="workforce-assignment-list">
              {responsibilityAssignments.map((assignment, index) => (
                <div className="workforce-responsibility-row" key={`${index}:${assignment.departmentId}:${assignment.responsibilityId}`}>
                  <Select
                    disabled={!canReadWorkforce}
                    value={assignment.departmentId || undefined}
                    placeholder={text.department}
                    options={departmentMemberships.map((membership) => {
                      const department = workforceQuery.data?.departments.find(
                        (item) => item.id === membership.departmentId,
                      );
                      return {
                        value: membership.departmentId,
                        label: department
                          ? `${department.code}  ${department.name}`
                          : membership.departmentId,
                      };
                    })}
                    onChange={(departmentId) =>
                      setResponsibilityAssignments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, departmentId, isPrimary: false }
                            : item,
                        ),
                      )
                    }
                  />
                  <Select
                    disabled={!canReadWorkforce}
                    value={assignment.responsibilityId || undefined}
                    placeholder={text.responsibility}
                    options={(workforceQuery.data?.responsibilities ?? [])
                      .filter((responsibility) => responsibility.enabled)
                      .map((responsibility) => ({
                        value: responsibility.id,
                        label: `${responsibility.code}  ${responsibility.name}`,
                      }))}
                    onChange={(responsibilityId) =>
                      setResponsibilityAssignments((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, responsibilityId } : item,
                        ),
                      )
                    }
                  />
                  <Checkbox
                    disabled={!canReadWorkforce}
                    checked={assignment.isPrimary}
                    onChange={(event) =>
                      setResponsibilityAssignments((current) =>
                        current.map((item, itemIndex) => ({
                          ...item,
                          isPrimary:
                            item.departmentId === assignment.departmentId
                              ? itemIndex === index && event.target.checked
                              : item.isPrimary,
                        })),
                      )
                    }
                  >
                    {text.primary}
                  </Checkbox>
                  <Button
                    danger
                    type="text"
                    disabled={!canReadWorkforce}
                    onClick={() =>
                      setResponsibilityAssignments((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <Button
              icon={<PlusOutlined />}
              disabled={!canReadWorkforce || departmentMemberships.length === 0}
              onClick={() =>
                setResponsibilityAssignments((current) => [
                  ...current,
                  {
                    departmentId: departmentMemberships[0]?.departmentId ?? "",
                    responsibilityId:
                      workforceQuery.data?.responsibilities.find(
                        (responsibility) => responsibility.enabled,
                      )?.id ?? "",
                    isPrimary: false,
                  },
                ])
              }
            >
              {text.addResponsibility}
            </Button>
          </div>
          {saveMutation.isError && (
            <Alert type="error" showIcon message={saveMutation.error.message} />
          )}
        </Form>
      </Modal>
    </Card>
  );
}

function RoleManagement({
  locale,
  writable,
}: {
  locale: LocaleKey;
  writable: boolean;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Role | null | undefined>(undefined);
  const [form] = Form.useForm<{
    code: string;
    name: string;
    description: string;
    permissionCodes: string[];
  }>();
  const rolesQuery = useQuery({
    queryKey: ["managed-roles"],
    queryFn: ({ signal }) => fetchRoles(signal),
  });
  const saveMutation = useMutation({
    mutationFn: (values: {
      code: string;
      name: string;
      description: string;
      permissionCodes: string[];
    }) =>
      editing
        ? updateRole(
            editing.id,
            editing.systemRole
              ? {
                  ...values,
                  name: editing.name,
                  description: editing.description,
                }
              : values,
          )
        : createRole(values),
    onSuccess: async () => {
      setEditing(undefined);
      form.resetFields();
      await queryClient.invalidateQueries({ queryKey: ["managed-roles"] });
    },
  });
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ permissionCodes: [] });
  };
  const openEdit = (role: Role) => {
    setEditing(role);
    form.setFieldsValue({
      ...role,
      name: roleDisplayName(role.code, role.name, locale),
      description: roleDisplayDescription(role, locale),
    });
  };
  const columns: TableColumnsType<Role> = [
    {
      title: text.roleCode,
      dataIndex: "code",
      render: (value: string) => <span className="business-code">{value}</span>,
    },
    {
      title: text.roleName,
      key: "name",
      render: (_, role) => roleDisplayName(role.code, role.name, locale),
    },
    {
      title: text.roleDescription,
      key: "description",
      render: (_, role) => roleDisplayDescription(role, locale),
    },
    {
      title: text.permissions,
      key: "permissions",
      render: (_, role) => <Text>{role.permissionCodes.length}</Text>,
    },
    ...(writable
      ? [{
          title: text.actions,
          key: "actions",
          width: 64,
          render: (_: unknown, role: Role) => (
            <Button
              type="text"
              icon={<EditOutlined />}
              disabled={role.code === "SYSTEM_ADMIN"}
              aria-label={text.editRole}
              onClick={() => openEdit(role)}
            />
          ),
        }]
      : []),
  ];
  const permissionMatrix = useMemo(
    () => buildPermissionMatrix(rolesQuery.data?.permissions ?? []),
    [rolesQuery.data?.permissions],
  );
  const permissionColumns = useMemo<TableColumnsType<PermissionMatrixRow>>(
    () => [
      {
        title: text.permissionNode,
        dataIndex: "resource",
        key: "resource",
        width: 190,
        fixed: "left",
        render: (resource: string) => (
          <div className="permission-node">
            <Text strong>
              {permissionResourceNames[locale][resource] ?? resource}
            </Text>
          </div>
        ),
      },
      ...permissionMatrix.actions.map((action) => ({
        title: permissionActionNames[locale][action] ?? action,
        key: action,
        width: 128,
        align: "center" as const,
        render: (_: unknown, row: PermissionMatrixRow) => {
          const permission: Permission | undefined =
            row.permissionsByAction[action];
          if (!permission) {
            return <span className="permission-empty">－</span>;
          }
          const label =
            permissionNames[locale][permission.code] ??
            `${permissionResourceNames[locale][row.resource] ?? row.resource} ${
              permissionActionNames[locale][action] ?? action
            }`;
          return (
            <Tooltip
              title={
                <span className="permission-tooltip">
                  <span>{label}</span>
                  <code>{permission.code}</code>
                </span>
              }
            >
              <Checkbox
                className="permission-matrix-checkbox"
                value={permission.code}
                aria-label={`${permissionResourceNames[locale][row.resource] ?? row.resource} / ${
                  permissionActionNames[locale][action] ?? action
                } / ${permission.code}`}
              />
            </Tooltip>
          );
        },
      })),
    ],
    [locale, permissionMatrix.actions, text.permissionNode],
  );

  return (
    <>
      <IdentityHeading
        title={text.roles}
        description={text.rolesDescription}
        action={
          writable ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              {text.addRole}
            </Button>
          ) : undefined
        }
      />
      <Card className="identity-table-card">
        {rolesQuery.isError ? (
          <Alert
            type="error"
            showIcon
            message={text.loadError}
            action={
              <Button size="small" onClick={() => void rolesQuery.refetch()}>
                {text.retry}
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        ) : null}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rolesQuery.data?.roles ?? []}
          loading={rolesQuery.isLoading}
        />
      <Modal
        open={editing !== undefined}
        title={editing ? text.editRole : text.addRole}
        okText={text.save}
        onCancel={() => setEditing(undefined)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        width={960}
        className="role-permission-modal"
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item
            name="code"
            label={text.roleCode}
            rules={[{ required: true, pattern: /^[A-Z][A-Z0-9_]{2,63}$/ }]}
          >
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item name="name" label={text.roleName} rules={[{ required: true }]}>
            <Input maxLength={120} disabled={Boolean(editing?.systemRole)} />
          </Form.Item>
          <Form.Item name="description" label={text.roleDescription}>
            <Input.TextArea
              maxLength={1000}
              rows={3}
              disabled={Boolean(editing?.systemRole)}
            />
          </Form.Item>
          <Form.Item
            name="permissionCodes"
            label={text.permissionMatrix}
            extra={text.permissionMatrixDescription}
          >
            <Checkbox.Group className="permission-matrix-control">
              <Table
                className="permission-matrix"
                rowKey="key"
                columns={permissionColumns}
                dataSource={permissionMatrix.rows}
                pagination={false}
                size="small"
                tableLayout="fixed"
                scroll={{ x: 190 + permissionMatrix.actions.length * 128 }}
              />
            </Checkbox.Group>
          </Form.Item>
          {saveMutation.isError && (
            <Alert type="error" showIcon message={saveMutation.error.message} />
          )}
        </Form>
        </Modal>
      </Card>
    </>
  );
}

function AuditLog({ locale }: { locale: LocaleKey }) {
  const text = copy[locale];
  const [filters, setFilters] = useState<{
    actor?: string;
    capability?: string;
    outcome?: string;
    createdFrom?: string;
    createdTo?: string;
    limit: number;
  }>({ limit: 200 });
  const auditQuery = useQuery({
    queryKey: ["system-activity-audit", filters],
    queryFn: ({ signal }) => fetchAuditEvents(filters, signal),
  });
  const events = auditQuery.data ?? [];
  const summary = useMemo(
    () => ({
      total: events.length,
      success: events.filter((event) => event.outcome === "SUCCESS").length,
      failed: events.filter((event) =>
        ["FAILED", "DENIED"].includes(event.outcome)
      ).length,
      ai: events.filter(
        (event) => event.capability === "INQUIRY_AI_ASSIST",
      ).length,
    }),
    [events],
  );
  const columns: TableColumnsType<AuditEvent> = [
    {
      title: text.event,
      key: "event",
      width: 300,
      render: (_, event) => (
        <div className="audit-event-cell">
          <Text strong>
            {auditEventNames[locale][event.eventType] ?? event.eventType}
          </Text>
          <Space size={6} wrap>
            {event.capability && (
              <Tag bordered={false}>{event.capability}</Tag>
            )}
            <Text type="secondary">{event.action}</Text>
          </Space>
        </div>
      ),
    },
    {
      title: text.actor,
      key: "actor",
      width: 150,
      render: (_, event) =>
        event.actorDisplayName || event.actorUsername || "SYSTEM",
    },
    {
      title: text.outcome,
      dataIndex: "outcome",
      width: 105,
      render: (value: string, event) => (
        <Tag
          color={
            value === "SUCCESS"
              ? "green"
              : value === "DENIED"
                ? "orange"
                : "red"
          }
        >
          {value || event.statusCode || " "}
        </Tag>
      ),
    },
    {
      title: text.target,
      key: "target",
      width: 180,
      render: (_, event) => {
        const label =
          auditTargetNames[locale][event.targetType] ??
          (event.targetType || " ");
        const reference = String(event.details?.resourceRef ?? "");
        return reference ? `${label} ${reference}` : label;
      },
    },
    {
      title: text.tokenUsage,
      key: "tokenUsage",
      width: 175,
      render: (_, event) => {
        const usage = event.details?.tokenUsage as
          | {
              inputTokens?: number | null;
              outputTokens?: number | null;
              totalTokens?: number | null;
            }
          | undefined;
        if (
          usage?.totalTokens !== null &&
            usage?.totalTokens !== undefined
        ) {
          return `I ${usage.inputTokens ?? "?"} / O ${
            usage.outputTokens ?? "?"
          } / Σ ${usage.totalTokens}`;
        }
        return event.capability === "INQUIRY_AI_ASSIST"
          ? text.unavailable
          : " ";
      },
    },
    {
      title: text.duration,
      dataIndex: "durationMs",
      width: 100,
      render: (value: number | null) =>
        value === null || value === undefined ? " " : `${value} ms`,
    },
    {
      title: text.time,
      dataIndex: "createdAt",
      width: 150,
      render: (value: string) => formatTimestamp(value, locale),
    },
  ];
  return (
    <Card className="identity-table-card audit-workspace-card">
      <div className="audit-summary-grid">
        <div>
          <Text type="secondary">{text.records}</Text>
          <strong>{summary.total}</strong>
        </div>
        <div>
          <Text type="secondary">{text.successful}</Text>
          <strong>{summary.success}</strong>
        </div>
        <div>
          <Text type="secondary">{text.failed}</Text>
          <strong>{summary.failed}</strong>
        </div>
        <div>
          <Text type="secondary">{text.aiCalls}</Text>
          <strong>{summary.ai}</strong>
        </div>
      </div>
      <Form
        layout="vertical"
        className="audit-filter-form"
        onFinish={(values) =>
          setFilters({
            actor: values.actor?.trim() || undefined,
            capability: values.capability || undefined,
            outcome: values.outcome || undefined,
            createdFrom: values.createdFrom
              ? new Date(values.createdFrom).toISOString()
              : undefined,
            createdTo: values.createdTo
              ? new Date(values.createdTo).toISOString()
              : undefined,
            limit: 200,
          })
        }
      >
        <Form.Item name="actor" label={text.actor}>
          <Input allowClear />
        </Form.Item>
        <Form.Item name="capability" label={text.capability}>
          <Select
            allowClear
            options={[
              "AUTHENTICATION",
              "IDENTITY_MANAGEMENT",
              "INQUIRY_SEARCH",
              "INQUIRY_DETAIL",
              "INQUIRY_ATTACHMENT",
              "INQUIRY_AI_ASSIST",
              "INQUIRY_SOURCE_SETTINGS",
              "AI_MODEL_SETTINGS",
              "AGENT_GATEWAY",
              "ENVIRONMENT_MANAGEMENT",
              "MASTER_DATA_MANAGEMENT",
              "ORGANIZATION_MANAGEMENT",
              "STANDALONE_BUILDER",
              "SYSTEM_AUDIT",
            ].map((value) => ({ value, label: value }))}
          />
        </Form.Item>
        <Form.Item name="outcome" label={text.outcome}>
          <Select
            allowClear
            options={["SUCCESS", "FAILED", "DENIED"].map((value) => ({
              value,
              label: value,
            }))}
          />
        </Form.Item>
        <Form.Item name="createdFrom" label={text.from}>
          <Input type="datetime-local" />
        </Form.Item>
        <Form.Item name="createdTo" label={text.to}>
          <Input type="datetime-local" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {text.search}
            </Button>
            <Button
              htmlType="reset"
              onClick={() => setFilters({ limit: 200 })}
            >
              {text.reset}
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={events}
        loading={auditQuery.isLoading}
        scroll={{ x: 1160 }}
        expandable={{
          expandedRowRender: (event) => (
            <div className="audit-expanded">
              <div>
                <Text type="secondary">Request ID</Text>
                <code>{event.requestId || " "}</code>
              </div>
              <div>
                <Text type="secondary">Session ID</Text>
                <code>{event.sessionId || " "}</code>
              </div>
              <div>
                <Text type="secondary">HTTP</Text>
                <code>{event.statusCode ?? " "}</code>
              </div>
              <div>
                <Text type="secondary">{text.requestIp}</Text>
                <code>{event.requestIp || " "}</code>
              </div>
              <pre className="audit-details">
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
          ),
          rowExpandable: () => true,
        }}
      />
    </Card>
  );
}
