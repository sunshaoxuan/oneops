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
    expect(app).toContain("fetchAuthSession");
    expect(app).toContain("<AuthPage");
    expect(app).toContain("<AuthenticatedPortal");
    expect(app).toContain("logoutAccount");
  });

  it("automatically starts Windows SSO with a recoverable local login", () => {
    expect(authPage).toContain("registerLocalAccount");
    expect(authPage).toContain("loginLocalAccount");
    expect(authPage).toContain("windowsSsoEnabled");
    expect(authPage).toContain("windowsSsoAutoLogin");
    expect(authPage).toContain("oneops.windows-sso.auto-attempted");
    expect(authPage).toContain("window.location.replace");
    expect(authPage).toContain("window.location.assign");
    expect(authPage).toContain("bootstrapRequired");
    expect(authPage).toContain("setPending(true)");
  });

  it("manages users, scoped role assignments, roles and audit", () => {
    expect(identityPage).toContain("fetchManagedUsers");
    expect(identityPage).toContain("updateManagedUser");
    expect(identityPage).toContain("organizationId");
    expect(identityPage).toContain("fetchRoles");
    expect(identityPage).toContain("permissionCodes");
    expect(identityPage).toContain("buildPermissionMatrix");
    expect(identityPage).toContain('className="permission-matrix"');
    expect(identityPage).toContain('className="permission-matrix-checkbox"');
    expect(identityPage).toContain('"environments.credentials.read"');
    expect(identityPage).toContain('"models.settings.write"');
    expect(identityPage).toContain('"inquiries.use"');
    expect(identityPage).not.toContain("?? permission.name");
    expect(identityPage).toContain("editing.systemRole");
    expect(identityPage).toContain("roleDisplayName(role.code, role.name, locale)");
    expect(styles).toContain(".permission-matrix-control");
    expect(styles).toContain(".permission-matrix-checkbox");
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
