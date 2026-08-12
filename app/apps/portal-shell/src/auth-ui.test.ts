import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const app = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");
const authPage = readFileSync(resolve(process.cwd(), "src/AuthPage.tsx"), "utf8");
const identityPage = readFileSync(
  resolve(process.cwd(), "src/IdentityManagementPage.tsx"),
  "utf8",
);
const profileDialog = readFileSync(
  resolve(process.cwd(), "src/ProfileDialog.tsx"),
  "utf8",
);
const styles = readFileSync(
  resolve(process.cwd(), "src/styles.css"),
  "utf8",
);
const apiClient = readFileSync(
  resolve(process.cwd(), "../../packages/api-client/src/index.ts"),
  "utf8",
);

describe("authentication and RBAC user interface", () => {
  it("gates the portal with a recoverable server session", () => {
    expect(app).toContain('queryKey: ["auth-session"]');
    expect(app).toContain("refetchInterval: 10_000");
    expect(app).toContain("fetchAuthSession");
    expect(app).toContain("<AuthPage");
    expect(app).toContain("<AuthenticatedPortal");
    expect(app).toContain("logoutAccount");
    expect(app).toContain('className="user-menu-container"');
    expect(app).toContain('className="user-menu-popup"');
    expect(app).toContain("aria-expanded={profileMenuOpen}");
    expect(app).toContain('className="user-button-info"');
    expect(app).toContain('key: "logout"');
    expect(app).toContain('key: "stop-impersonation"');
    expect(app).toContain("WINDOWS_SSO_AUTO_ATTEMPTED_KEY");
    expect(app).toContain(
      'window.sessionStorage.setItem(WINDOWS_SSO_AUTO_ATTEMPTED_KEY, "1")',
    );
    expect(app).toMatch(
      /onSuccess: async \(\) => \{\s+window\.sessionStorage\.setItem\(WINDOWS_SSO_AUTO_ATTEMPTED_KEY, "1"\);\s+queryClient\.setQueryData/,
    );
    expect(app).toContain('const dashboardReadable = can("dashboard.read")');
    expect(app).toContain("enabled: dashboardDataReadable");
    expect(app).toContain("navigationUsesDashboardData(activeNavigation)");
    expect(app).toContain("if (!dashboardLiveReadable)");
    expect(app).toContain("const snapshot = dashboardDataReadable");
    expect(app).toContain("if (!visibleNavigation.some((item) => item.key === navigationKey))");
    expect(styles).toContain(".user-button-info");
    expect(styles).toContain("max-width: 220px");
  });

  it("automatically starts Windows SSO with a recoverable local login", () => {
    expect(authPage).toContain("loginLocalAccount");
    expect(authPage).not.toContain("registerLocalAccount");
    expect(authPage).not.toContain('value: "register"');
    expect(authPage).not.toContain("submitRegister");
    expect(authPage).toContain("windowsSsoEnabled");
    expect(authPage).toContain("windowsSsoAutoLogin");
    expect(authPage).toContain("export const WINDOWS_SSO_AUTO_ATTEMPTED_KEY");
    expect(authPage).toContain("WINDOWS_SSO_AUTO_ATTEMPTED_KEY");
    expect(authPage).toContain("window.location.replace");
    expect(authPage).toContain("window.location.assign");
    expect(authPage).toContain('windowsAccountAuth: "Windows アカウント認証"');
    expect(authPage).toContain(
      'windowsSso: "Windows にログイン中のアカウントで認証"',
    );
    expect(authPage).toContain(
      'ssoStarting: "Windows にログイン中のアカウントを確認しています。"',
    );
    expect(authPage).toContain("{text.windowsAccountAuth}");
    expect(authPage).not.toContain('<Text type="secondary">SSO</Text>');
  });

  it("keeps self-registration disabled in the client contract", () => {
    expect(apiClient).not.toContain("export function registerLocalAccount");
    expect(authPage).not.toContain("registerMutation");
    expect(authPage).not.toContain("UserAddOutlined");
    expect(authPage).not.toContain("Segmented");
  });

  it("manages users, scoped role assignments, roles and audit", () => {
    expect(identityPage).toContain("fetchManagedUsers");
    expect(identityPage).toContain("createManagedUser");
    expect(identityPage).toContain("text.addUser");
    expect(identityPage).toContain("text.passwordRequirements");
    expect(identityPage).toContain("(?=.*[a-z])(?=.*[A-Z])");
    expect(identityPage).toContain("createForm.setFields");
    expect(identityPage).toContain("updateManagedUser");
    expect(identityPage).toContain("identity.users.impersonate");
    expect(identityPage).toContain("impersonationMutation");
    expect(identityPage).toContain("LoginOutlined");
    expect(identityPage).toContain("organizationId");
    expect(identityPage).toContain("fetchRoles");
    expect(identityPage).toContain("canReadRoles");
    expect(identityPage).toContain("enabled: canReadRoles");
    expect(identityPage).toContain("disabled={!canReadRoles}");
    expect(identityPage).toContain("permissionCodes");
    expect(identityPage).toContain("buildPermissionMatrix");
    expect(identityPage).toContain('className="permission-matrix"');
    expect(identityPage).toContain('className="permission-matrix-checkbox"');
    expect(identityPage).toContain("width: 190");
    expect(identityPage).toContain("width: 112");
    expect(identityPage).toContain("width={960}");
    expect(identityPage).toContain('className="role-permission-modal"');
    expect(identityPage).toContain("190 + permissionMatrix.actions.length * 112");
    expect(identityPage).toContain("PERMISSION_MATRIX_SCROLL_Y");
    expect(identityPage).toContain("y: PERMISSION_MATRIX_SCROLL_Y");
    expect(identityPage).toContain("centered");
    expect(identityPage).toContain('"customer.knowledge": "System management > Customer information CAG analysis"');
    expect(identityPage).toContain('"customer.knowledge.manage": "顧客情報 CAG 分析の管理"');
    expect(identityPage).not.toContain('"customer.knowledge.scan"');
    expect(identityPage).not.toContain('"customer.knowledge.review"');
    expect(identityPage).toContain("filterActivePermissionCodes");
    expect(identityPage).toContain('"environments.credentials.read"');
    expect(identityPage).toContain('"models.settings.write"');
    expect(identityPage).toContain('"inquiries.use"');
    expect(identityPage).toContain('"inquiries.deleted.read": "削除済み AI 補助履歴の参照"');
    expect(identityPage).toContain('"inquiries.deleted.read": "查看已删除 AI 辅助历史"');
    expect(identityPage).toContain('"inquiries.deleted.read": "View deleted AI assistance history"');
    expect(identityPage).toContain('"inquiries.deleted": "問合支援 > 削除済み AI 補助履歴"');
    expect(identityPage).toContain('"inquiries.deleted": "问询支援 > 已删除 AI 辅助历史"');
    expect(identityPage).toContain('"inquiries.deleted": "Inquiry support > Deleted AI assistance history"');
    expect(identityPage).toContain('"ai.assistant.use"');
    expect(identityPage).toContain('"builder.use"');
    expect(identityPage).toContain('"knowledge.use"');
    expect(identityPage).toContain('"code.insight.use"');
    expect(identityPage).toContain('"reports.read"');
    expect(identityPage).toContain('"ai.assistant": "AIアシスタント"');
    expect(identityPage).toContain('"ai.assistant.use": "AIアシスタント利用"');
    expect(identityPage).toContain('"ai.assistant": "AI 助手"');
    expect(identityPage).toContain('"ai.assistant.use": "使用 AI 助手"');
    expect(identityPage).toContain('"ai.assistant": "AI Assistant"');
    expect(identityPage).toContain('"ai.assistant.use": "Use AI Assistant"');
    expect(identityPage).not.toContain("AAIアシスタント");
    expect(identityPage).toContain('builder: "製品構築"');
    expect(identityPage).toContain('knowledge: "ナレッジ"');
    expect(identityPage).toContain('"code.insight": "コードインサイト"');
    expect(identityPage).toContain('reports: "レポート"');
    expect(identityPage).not.toContain("?? permission.name");
    expect(identityPage).toContain("roleDisplayName(role.code, role.name)");
    expect(identityPage).toContain("updateRole(editing.id, values)");
    expect(identityPage).not.toContain("disabled={Boolean(editing)}");
    expect(identityPage).not.toContain("disabled={Boolean(editing?.systemRole)}");
    expect(identityPage).not.toContain('disabled={role.code === "SYSTEM_ADMIN"}');
    expect(identityPage).not.toContain("SYSTEM_ADMIN_IMMUTABLE");
    expect(styles).toContain(".permission-matrix-control");
    expect(styles).toContain(".permission-matrix-checkbox");
    expect(styles).toContain(".role-permission-modal .ant-modal-container");
    expect(styles).toContain("height: calc(100vh - 48px)");
    expect(styles).toContain("max-height: calc(100vh - 48px)");
    expect(styles).toContain(".role-permission-modal .ant-modal-body");
    expect(styles).toContain("overflow: hidden");
    expect(styles).toContain("overflow-y: auto");
    expect(styles).toContain(".role-permission-modal .permission-matrix-control");
    expect(styles).toContain(".role-permission-modal .permission-matrix .ant-table-cell");
    expect(styles).not.toContain(".permission-grid");
    expect(identityPage).toContain("fetchAuditEvents");
    expect(identityPage).toContain('"system-activity-audit"');
    expect(identityPage).toContain("INQUIRY_AI_RUN_COMPLETED");
    expect(identityPage).toContain("tokenUsage");
    expect(identityPage).toContain('className="audit-filter-form"');
    expect(app).toContain('key: "audit-group"');
    expect(app.indexOf('key: "audit-group"')).toBeGreaterThan(
      app.indexOf('key: "identity-group"'),
    );
    expect(identityPage).toContain("WINDOWS_IDENTITY_LINKED");
    expect(identityPage).toContain("PROFILE_UPDATED");
    expect(identityPage).toContain('section: "users" | "roles" | "audit"');
    expect(identityPage).not.toContain("<Tabs");
    expect(identityPage).toContain('rowKey="id"');
    expect(identityPage).toContain("windowsDomain");
    expect(identityPage).toContain("domainUsername");
    expect(identityPage).toContain("domainAccount");
    expect(identityPage).toContain("domainUpn");
    expect(identityPage).toContain("ssoBinding");
    expect(identityPage).toContain('PENDING: "承認待ち"');
    expect(identityPage).toContain('ACTIVE: "有効"');
    expect(identityPage).toContain('SUSPENDED: "停止"');
    expect(identityPage).toContain('PENDING: "待审核"');
    expect(identityPage).toContain('ACTIVE: "启用"');
    expect(identityPage).toContain('SUSPENDED: "停用"');
    expect(identityPage).toContain('PENDING: "Pending approval"');
    expect(identityPage).toContain('ACTIVE: "Active"');
    expect(identityPage).toContain('SUSPENDED: "Suspended"');
    expect(identityPage).toContain("text.userStatuses[value]");
    expect(identityPage).toContain("<UserStatusSelect");
    expect(identityPage).toContain('className="user-status-select"');
    expect(identityPage).toContain("showSearch={false}");
    expect(identityPage).toContain("label: labels.PENDING");
    expect(identityPage).toContain("label: labels.ACTIVE");
    expect(identityPage).toContain("label: labels.SUSPENDED");
    expect(identityPage).toContain('editingUser: "編集中のユーザー"');
    expect(identityPage).toContain('editingUser: "正在编辑的用户"');
    expect(identityPage).toContain('editingUser: "User being edited"');
    expect(identityPage).toContain('className="user-editor-modal"');
    expect(identityPage).toContain('className="user-editor-context"');
    expect(identityPage).toContain('aria-label={text.editingUser}');
    expect(identityPage).toContain('`${text.editUser}: ${editing.displayName || editing.username}`');
    expect(identityPage).toContain('{text.username}: <span className="business-code">{editing.username}</span>');
    expect(identityPage).toContain('{editing.email && <Text copyable>{editing.email}</Text>}');
    expect(identityPage).toContain('{text.domainAccount}: {editingWindowsIdentity.subject}');
    expect(identityPage).toContain("bindManagedUserWindowsIdentity");
    expect(identityPage).toContain("unbindManagedUserWindowsIdentity");
    expect(identityPage).toContain('windowsBinding: "Windows SSO バインド"');
    expect(identityPage).toContain('windowsBinding: "Windows SSO 绑定"');
    expect(identityPage).toContain('windowsBinding: "Windows SSO binding"');
    expect(identityPage).toContain('name="subject"');
    expect(identityPage).toContain('name="upn"');
    expect(identityPage).toContain("windowsIdentityForm.submit()");
    expect(identityPage).toContain("windowsIdentityUnbindMutation.mutateAsync()");
    expect(identityPage).toContain("WINDOWS_IDENTITY_CONFLICT");
    expect(identityPage).toContain('component={false}');
    expect(apiClient).toContain("bindManagedUserWindowsIdentity");
    expect(apiClient).toContain("unbindManagedUserWindowsIdentity");
    expect(styles).toContain(".windows-identity-fields");
    expect(styles).toContain(".user-editor-context");
    expect(styles).toContain(".user-editor-context-details");
    expect(identityPage).toContain('const ALL_ORGANIZATIONS_SCOPE = "__ALL_ORGANIZATIONS__"');
    expect(identityPage).toContain("assignment.organizationId ?? ALL_ORGANIZATIONS_SCOPE");
    expect(identityPage).toContain("organizationId === ALL_ORGANIZATIONS_SCOPE");
    expect(identityPage).toContain("label: text.systemScope");
    expect(identityPage).toContain("<IdentityHeading");
    expect(identityPage).toContain('className="identity-heading-action"');
    expect(identityPage).not.toContain('className="identity-add-button"');
    expect(styles).toMatch(
      /\.identity-heading\s*\{[\s\S]*?justify-content:\s*space-between/,
    );
  });

  it("opens a profile dialog and saves the current user's display name", () => {
    expect(app).toContain("<ProfileDialog");
    expect(app).toContain("setProfileOpen(true)");
    expect(app).toContain('queryClient.setQueryData<AuthSession>');
    expect(profileDialog).toContain("updateProfile");
    expect(profileDialog).toContain('name="displayName"');
    expect(profileDialog).toContain("maxLength={120}");
    expect(profileDialog).toContain('identity.provider === "WINDOWS"');
    expect(profileDialog).not.toContain('t("profileWindowsDomain")');
    expect(profileDialog).not.toContain('t("profileDomainUsername")');
    expect(profileDialog).toContain('t("profileDomainAccount")');
    expect(profileDialog).toContain('t("profileDomainUpn")');
    expect(apiClient).toContain('authRequest("/profile"');
    expect(apiClient).toContain('method: "PUT"');
  });

  it("sends the session bound CSRF token on mutations", () => {
    expect(apiClient).toContain('cookieValue("oneops_csrf")');
    expect(apiClient).toContain('"X-OneOps-CSRF": token');
    expect(apiClient.match(/csrfHeaders\(\)/g)?.length).toBeGreaterThan(4);
  });
});
