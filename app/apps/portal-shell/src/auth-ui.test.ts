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
    expect(identityPage).toContain("fetchAuditEvents");
    expect(identityPage).toContain("WINDOWS_IDENTITY_LINKED");
    expect(identityPage).toContain("PROFILE_UPDATED");
    expect(identityPage).toContain('section: "users" | "roles" | "audit"');
    expect(identityPage).not.toContain("<Tabs");
    expect(identityPage).toContain('rowKey="id"');
  });

  it("opens a profile dialog and saves the current user's display name", () => {
    expect(app).toContain("<ProfileDialog");
    expect(app).toContain("setProfileOpen(true)");
    expect(app).toContain('queryClient.setQueryData<AuthSession>');
    expect(profileDialog).toContain("updateProfile");
    expect(profileDialog).toContain('name="displayName"');
    expect(profileDialog).toContain("maxLength={120}");
    expect(apiClient).toContain('authRequest("/profile"');
    expect(apiClient).toContain('method: "PUT"');
  });

  it("sends the session bound CSRF token on mutations", () => {
    expect(apiClient).toContain('cookieValue("oneops_csrf")');
    expect(apiClient).toContain('"X-OneOps-CSRF": token');
    expect(apiClient.match(/csrfHeaders\(\)/g)?.length).toBeGreaterThan(4);
  });
});
