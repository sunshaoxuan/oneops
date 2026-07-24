import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  EditOutlined,
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
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  createRole,
  fetchAuditEvents,
  fetchManagedUsers,
  fetchRoles,
  updateManagedUser,
  updateRole,
  type AuditEvent,
  type ManagedUser,
  type Organization,
  type Role,
  type RoleAssignment,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import { formatTimestamp } from "./utils";

const { Text, Title } = Typography;

const copy = {
  "ja-JP": {
    title: "ユーザー管理",
    description: "ユーザー、ロール、権限と認証監査を管理します。",
    users: "ユーザー管理",
    usersDescription: "ユーザーの状態、認証元とロール割当を管理します。",
    roles: "ロール・権限",
    rolesDescription: "ロールとロールに含まれる権限を管理します。",
    audit: "認証監査",
    auditDescription: "登録、ログインと権限変更の履歴を確認します。",
    username: "ユーザー名",
    displayName: "表示名",
    identity: "認証元",
    status: "状態",
    role: "ロール",
    scope: "適用範囲",
    systemScope: "システム全体",
    actions: "操作",
    editUser: "ユーザー権限を編集",
    addAssignment: "ロールを追加",
    save: "保存",
    addRole: "ロールを追加",
    editRole: "ロールを編集",
    roleCode: "ロールコード",
    roleName: "ロール名",
    roleDescription: "説明",
    permissions: "権限",
    event: "イベント",
    actor: "実行者",
    target: "対象",
    requestIp: "接続元",
    time: "日時",
  },
  "zh-CN": {
    title: "用户管理",
    description: "管理用户、角色、权限及认证审计。",
    users: "用户管理",
    usersDescription: "管理用户状态、认证来源和角色分配。",
    roles: "角色与权限",
    rolesDescription: "管理角色及角色包含的权限。",
    audit: "认证审计",
    auditDescription: "查看注册、登录和权限变更记录。",
    username: "用户名",
    displayName: "显示名称",
    identity: "认证来源",
    status: "状态",
    role: "角色",
    scope: "适用范围",
    systemScope: "系统范围",
    actions: "操作",
    editUser: "编辑用户权限",
    addAssignment: "添加角色",
    save: "保存",
    addRole: "添加角色",
    editRole: "编辑角色",
    roleCode: "角色代码",
    roleName: "角色名称",
    roleDescription: "说明",
    permissions: "权限",
    event: "事件",
    actor: "操作人",
    target: "对象",
    requestIp: "来源地址",
    time: "时间",
  },
  "en-US": {
    title: "User management",
    description: "Manage users, roles, permissions and authentication audit.",
    users: "User management",
    usersDescription: "Manage user status, identities and role assignments.",
    roles: "Roles and permissions",
    rolesDescription: "Manage roles and the permissions included in each role.",
    audit: "Authentication audit",
    auditDescription: "Review registration, sign-in and access change history.",
    username: "Username",
    displayName: "Display name",
    identity: "Identity",
    status: "Status",
    role: "Role",
    scope: "Scope",
    systemScope: "System",
    actions: "Actions",
    editUser: "Edit user access",
    addAssignment: "Add role",
    save: "Save",
    addRole: "Add role",
    editRole: "Edit role",
    roleCode: "Role Code",
    roleName: "Role name",
    roleDescription: "Description",
    permissions: "Permissions",
    event: "Event",
    actor: "Actor",
    target: "Target",
    requestIp: "Source",
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
    "catalog.read": "基本台帳参照",
    "catalog.write": "基本台帳更新",
    "identity.users.read": "ユーザー参照",
    "identity.users.write": "ユーザー更新",
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
    "catalog.read": "查看基础档案",
    "catalog.write": "维护基础档案",
    "identity.users.read": "查看用户",
    "identity.users.write": "维护用户",
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
    "catalog.read": "View master data",
    "catalog.write": "Maintain master data",
    "identity.users.read": "View users",
    "identity.users.write": "Maintain users",
    "identity.roles.read": "View roles",
    "identity.roles.write": "Maintain roles",
    "audit.read": "View audit",
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
  },
};

const auditTargetNames: Record<LocaleKey, Record<string, string>> = {
  "ja-JP": { USER: "ユーザー", ROLE: "ロール", SESSION: "セッション" },
  "zh-CN": { USER: "用户", ROLE: "角色", SESSION: "会话" },
  "en-US": { USER: "User", ROLE: "Role", SESSION: "Session" },
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

export function IdentityManagementPage({
  locale,
  permissions,
  organizations,
  section,
}: {
  locale: LocaleKey;
  permissions: string[];
  organizations: Organization[];
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
      <section className="identity-heading">
        <span><SafetyCertificateOutlined /></span>
        <div>
          <Title level={2}>{selectedSection?.label ?? text.title}</Title>
          <Text type="secondary">
            {selectedSection
              ? sectionDescriptions[section]
              : text.description}
          </Text>
        </div>
      </section>
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
}: {
  locale: LocaleKey;
  organizations: Organization[];
  writable: boolean;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [status, setStatus] = useState<ManagedUser["status"]>("PENDING");
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const usersQuery = useQuery({
    queryKey: ["managed-users"],
    queryFn: ({ signal }) => fetchManagedUsers(signal),
  });
  const rolesQuery = useQuery({
    queryKey: ["managed-roles"],
    queryFn: ({ signal }) => fetchRoles(signal),
  });
  const saveMutation = useMutation({
    mutationFn: () =>
      updateManagedUser(editing!.id, { status, roleAssignments: assignments }),
    onSuccess: async () => {
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    },
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
    saveMutation.reset();
  };
  const columns: TableColumnsType<ManagedUser> = [
    {
      title: text.username,
      dataIndex: "username",
      render: (value: string) => <span className="business-code">{value}</span>,
    },
    { title: text.displayName, dataIndex: "displayName" },
    {
      title: text.identity,
      key: "identity",
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
      render: (value: ManagedUser["status"]) => (
        <Tag color={value === "ACTIVE" ? "success" : value === "SUSPENDED" ? "error" : "warning"}>
          {value}
        </Tag>
      ),
    },
    {
      title: text.role,
      key: "roles",
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
    ...(writable
      ? [{
          title: text.actions,
          key: "actions",
          width: 64,
          fixed: "right" as const,
          render: (_: unknown, user: ManagedUser) => (
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={text.editUser}
              onClick={() => openEditor(user)}
            />
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
        scroll={{ x: 900 }}
      />
      <Modal
        open={Boolean(editing)}
        title={text.editUser}
        okText={text.save}
        onCancel={() => setEditing(null)}
        onOk={() => saveMutation.mutate()}
        confirmLoading={saveMutation.isPending}
        width={720}
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
                  allowClear
                  value={assignment.organizationId ?? undefined}
                  placeholder={text.systemScope}
                  onChange={(organizationId) =>
                    setAssignments((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, organizationId: organizationId ?? null }
                          : item,
                      ),
                    )
                  }
                  options={organizations.map((organization) => ({
                    value: organization.id,
                    label: `${organization.code}  ${organization.name}`,
                  }))}
                />
                <Button
                  danger
                  type="text"
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
    }) => editing ? updateRole(editing.id, values) : createRole(values),
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
    form.setFieldsValue(role);
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
  const permissionOptions = useMemo(
    () =>
      (rolesQuery.data?.permissions ?? []).map((permission) => ({
        label: `${permission.code}  ${
          permissionNames[locale][permission.code] ?? permission.name
        }`,
        value: permission.code,
      })),
    [rolesQuery.data?.permissions],
  );

  return (
    <Card className="identity-table-card">
      {writable && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
          className="identity-add-button"
        >
          {text.addRole}
        </Button>
      )}
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
        width={760}
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
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="description" label={text.roleDescription}>
            <Input.TextArea maxLength={1000} rows={3} />
          </Form.Item>
          <Form.Item name="permissionCodes" label={text.permissions}>
            <Checkbox.Group className="permission-grid" options={permissionOptions} />
          </Form.Item>
          {saveMutation.isError && (
            <Alert type="error" showIcon message={saveMutation.error.message} />
          )}
        </Form>
      </Modal>
    </Card>
  );
}

function AuditLog({ locale }: { locale: LocaleKey }) {
  const text = copy[locale];
  const auditQuery = useQuery({
    queryKey: ["authentication-audit"],
    queryFn: ({ signal }) => fetchAuditEvents(signal),
  });
  const columns: TableColumnsType<AuditEvent> = [
    {
      title: text.event,
      dataIndex: "eventType",
      render: (value: string) => auditEventNames[locale][value] ?? value,
    },
    {
      title: text.actor,
      key: "actor",
      render: (_, event) =>
        event.actorDisplayName || event.actorUsername || "SYSTEM",
    },
    {
      title: text.target,
      key: "target",
      render: (_, event) =>
        auditTargetNames[locale][event.targetType] ??
        (event.targetType || " "),
    },
    { title: text.requestIp, dataIndex: "requestIp" },
    {
      title: text.time,
      dataIndex: "createdAt",
      render: (value: string) => formatTimestamp(value, locale),
    },
  ];
  return (
    <Card className="identity-table-card">
      <Table
        rowKey="id"
        columns={columns}
        dataSource={auditQuery.data ?? []}
        loading={auditQuery.isLoading}
      />
    </Card>
  );
}
