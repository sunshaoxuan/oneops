export type TaskStatus =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "unknown";

export interface WorkTask {
  id: string;
  status: TaskStatus;
  organization: string;
  productVariant: string;
  materialNumber: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Organization {
  id: string;
  classificationId: string;
  classificationCode: string;
  classificationName: string;
  code: string;
  name: string;
  shortName: string;
  maintenanceStatus: string;
  remarks: string;
}

export type OrganizationInput = Pick<
  Organization,
  | "classificationId"
  | "code"
  | "name"
  | "shortName"
  | "maintenanceStatus"
  | "remarks"
>;

export interface OrganizationClassification {
  id: string;
  code: string;
  name: string;
}

export type OrganizationClassificationInput = Pick<
  OrganizationClassification,
  "code" | "name"
>;

export type EnvironmentScope = "CUSTOMER" | "INTERNAL";
export type EnvironmentPurpose =
  | "PRODUCTION"
  | "VERIFICATION"
  | "DEVELOPMENT"
  | "TRAINING"
  | "OTHER";
export type EnvironmentStatus =
  | "ACTIVE"
  | "PREPARING"
  | "SUSPENDED"
  | "RETIRED";
export type ProductUsageStatus =
  | "ACTIVE"
  | "PLANNED"
  | "SUSPENDED"
  | "RETIRED";

export interface EnvironmentGroup {
  id: string;
  organizationId: string;
  name: string;
  sortOrder: number;
  archivedAt: string | null;
}

export type EnvironmentGroupInput = Pick<
  EnvironmentGroup,
  "organizationId" | "name" | "sortOrder"
>;

export interface ProductVersion {
  id: string;
  productId: string;
  version: string;
  displayVersion: string;
  lifecycleStatus: "ACTIVE" | "RETIRED";
  modules: ProductVersionModule[];
}

export interface ProductVersionModule {
  id: string;
  productVersionId: string;
  code: string;
  name: string;
  shortName: string;
  lifecycleStatus: "ACTIVE" | "RETIRED";
  sortOrder: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  shortName: string;
  lifecycleStatus: "ACTIVE" | "RETIRED";
  sortOrder: number;
  versions: ProductVersion[];
}

export interface ProductInput {
  code: string;
  name: string;
  shortName: string;
  sortOrder: number;
}

export interface ProductVersionInput {
  productId: string;
  version: string;
  displayVersion: string;
}

export interface ProductVersionModuleInput {
  productVersionId: string;
  code: string;
  name: string;
  shortName: string;
  sortOrder: number;
}

export interface EnvironmentProductVersion {
  productVersionId: string;
  productId: string;
  productCode: string;
  productName: string;
  version: string;
  displayVersion: string;
  usageStatus: ProductUsageStatus;
  confirmationStatus: "PENDING" | "CONFIRMED" | "REJECTED";
  notes: string;
  modules: ProductVersionModule[];
}

export interface EnvironmentEndpoint {
  id: string;
  environmentId: string;
  name: string;
  role:
    | "AP"
    | "DB"
    | "BASTION"
    | "LOAD_BALANCER"
    | "FILE_SERVER"
    | "OTHER";
  hostname: string;
  ipAddress: string;
  port: number | null;
  protocol: string;
  databaseType: string;
  databaseVersion: string;
  databaseName: string;
  notes: string;
  status: EnvironmentStatus;
  sortOrder: number;
}

export interface EnvironmentRecord {
  id: string;
  organizationId: string;
  groupId: string;
  groupName: string;
  name: string;
  scope: EnvironmentScope;
  purpose: EnvironmentPurpose;
  status: EnvironmentStatus;
  url: string;
  ownerName: string;
  notes: string;
  sortOrder: number;
  revision: number;
  lastVerifiedAt: string;
  archivedAt: string | null;
  products: EnvironmentProductVersion[];
  endpoints: EnvironmentEndpoint[];
}

export interface EnvironmentInput {
  organizationId: string;
  groupId: string;
  name: string;
  scope: EnvironmentScope;
  purpose: EnvironmentPurpose;
  status: EnvironmentStatus;
  url: string;
  ownerName: string;
  notes: string;
  sortOrder: number;
  revision: number;
  lastVerifiedAt: string;
  products: Array<{
    productVersionId: string;
    usageStatus: ProductUsageStatus;
    notes: string;
    moduleIds: string[];
  }>;
}

export interface EnvironmentInventory {
  organizationId: string;
  groups: EnvironmentGroup[];
  environments: EnvironmentRecord[];
  summary: {
    total: number;
    production: number;
    verification: number;
    internal: number;
    retired: number;
  };
}

export interface WorkCenterSnapshot {
  generatedAt: string;
  correlationId: string;
  upstream: {
    online: boolean;
    latencyMs: number | null;
    message: string;
  };
  summary: {
    total: number;
    running: number;
    failed: number;
    completed: number;
    organizations: number;
  };
  resources: {
    cpuCount: number | null;
    memoryAvailableBytes: number | null;
    diskFreeBytes: number | null;
  };
  tasks: WorkTask[];
  organizations: Organization[];
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  email: string;
  locale: "ja-JP" | "zh-CN" | "en-US";
  identities?: ExternalIdentity[];
}

export interface ExternalIdentity {
  provider: "LOCAL" | "WINDOWS";
  subject: string;
  windowsDomain: string;
  domainUsername: string;
  upn: string;
}

export interface AuthSession {
  authenticated: boolean;
  user: AuthUser | null;
  permissions: string[];
}

export interface AuthConfig {
  bootstrapRequired: boolean;
  windowsSsoEnabled: boolean;
  windowsSsoAutoLogin: boolean;
  windowsSsoUrl: string;
}

export interface RoleAssignment {
  id?: string;
  roleId: string;
  roleCode?: string;
  roleName?: string;
  organizationId: string | null;
  organizationCode?: string;
  organizationName?: string;
}

export interface ManagedUser extends AuthUser {
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLoginAt: string | null;
  identities: ExternalIdentity[];
  roleAssignments: RoleAssignment[];
}

export interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  name: string;
  description: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  systemRole: boolean;
  assignable: boolean;
  permissionCodes: string[];
}

export interface AuditEvent {
  id: string;
  eventType: string;
  targetType: string;
  targetId: string | null;
  requestIp: string;
  details: Record<string, unknown>;
  createdAt: string;
  actorUsername: string;
  actorDisplayName: string;
}

function cookieValue(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  const item = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : "";
}

export function csrfHeaders(): Record<string, string> {
  const token = cookieValue("oneops_csrf");
  return token ? { "X-OneOps-CSRF": token } : {};
}

export async function fetchDashboard(
  signal?: AbortSignal,
): Promise<WorkCenterSnapshot> {
  const response = await fetch("/api/work-center/v1/dashboard", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Dashboard request failed with ${response.status}`);
  }
  return response.json() as Promise<WorkCenterSnapshot>;
}

export function subscribeDashboard(
  onSnapshot: (snapshot: WorkCenterSnapshot) => void,
  onState: (connected: boolean) => void,
): () => void {
  const source = new EventSource("/api/work-center/v1/events");
  source.addEventListener("snapshot", (event) => {
    onSnapshot(JSON.parse((event as MessageEvent<string>).data));
    onState(true);
  });
  source.onopen = () => onState(true);
  source.onerror = () => onState(false);
  return () => source.close();
}

export async function fetchOrganizations(
  signal?: AbortSignal,
): Promise<Organization[]> {
  const response = await fetch("/api/work-center/v1/organizations", {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Organization request failed with ${response.status}`);
  }
  const payload = (await response.json()) as {
    organizations: Organization[];
  };
  return payload.organizations;
}

export async function fetchOrganizationClassifications(
  signal?: AbortSignal,
): Promise<OrganizationClassification[]> {
  const response = await fetch(
    "/api/work-center/v1/organization-classifications",
    {
      headers: { Accept: "application/json" },
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(
      `Organization classification request failed with ${response.status}`,
    );
  }
  const payload = (await response.json()) as {
    classifications: OrganizationClassification[];
  };
  return payload.classifications;
}

export async function createOrganizationClassification(
  classification: OrganizationClassificationInput,
): Promise<OrganizationClassification> {
  return saveOrganizationClassification(
    "/api/work-center/v1/organization-classifications",
    "POST",
    classification,
  );
}

export async function updateOrganizationClassification(
  id: string,
  classification: OrganizationClassificationInput,
): Promise<OrganizationClassification> {
  return saveOrganizationClassification(
    `/api/work-center/v1/organization-classifications/${encodeURIComponent(id)}`,
    "PUT",
    classification,
  );
}

async function saveOrganizationClassification(
  url: string,
  method: "POST" | "PUT",
  classification: OrganizationClassificationInput,
): Promise<OrganizationClassification> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...csrfHeaders(),
    },
    body: JSON.stringify(classification),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(
      payload?.error?.message ??
        `Organization classification save failed with ${response.status}`,
    );
  }
  const payload = (await response.json()) as {
    classification: OrganizationClassification;
  };
  return payload.classification;
}

export async function createOrganization(
  organization: OrganizationInput,
): Promise<Organization> {
  return saveOrganization("/api/work-center/v1/organizations", "POST", organization);
}

export async function updateOrganization(
  id: string,
  organization: OrganizationInput,
): Promise<Organization> {
  return saveOrganization(
    `/api/work-center/v1/organizations/${encodeURIComponent(id)}`,
    "PUT",
    organization,
  );
}

async function saveOrganization(
  url: string,
  method: "POST" | "PUT",
  organization: OrganizationInput,
): Promise<Organization> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...csrfHeaders(),
    },
    body: JSON.stringify(organization),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message ?? `Organization save failed with ${response.status}`);
  }
  const payload = (await response.json()) as {
    organization: Organization;
  };
  return payload.organization;
}

async function environmentRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(!["GET", "HEAD"].includes(options.method ?? "GET")
        ? csrfHeaders()
        : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null;
    const error = new Error(
      payload?.error?.message ??
        `Environment request failed with ${response.status}`,
    ) as Error & { code?: string; status?: number };
    error.code = payload?.error?.code;
    error.status = response.status;
    throw error;
  }
  return response.json() as Promise<T>;
}

export async function fetchEnvironmentInventory(
  organizationId: string,
  includeArchived = false,
  signal?: AbortSignal,
): Promise<EnvironmentInventory> {
  return environmentRequest(
    `/api/work-center/v1/organizations/${encodeURIComponent(
      organizationId,
    )}/environment-inventory?includeArchived=${includeArchived}`,
    { signal },
  );
}

export async function fetchProducts(
  signal?: AbortSignal,
): Promise<Product[]> {
  const payload = await environmentRequest<{ products: Product[] }>(
    "/api/work-center/v1/products",
    { signal },
  );
  return payload.products;
}

export async function createProduct(
  product: ProductInput,
): Promise<Product> {
  const payload = await environmentRequest<{ product: Product }>(
    "/api/work-center/v1/products",
    { method: "POST", body: JSON.stringify(product) },
  );
  return payload.product;
}

export async function createProductVersion(
  productVersion: ProductVersionInput,
): Promise<ProductVersion> {
  const payload = await environmentRequest<{
    productVersion: ProductVersion;
  }>("/api/work-center/v1/product-versions", {
    method: "POST",
    body: JSON.stringify(productVersion),
  });
  return payload.productVersion;
}

export async function createProductVersionModule(
  productVersionModule: ProductVersionModuleInput,
): Promise<ProductVersionModule> {
  const payload = await environmentRequest<{
    productVersionModule: ProductVersionModule;
  }>("/api/work-center/v1/product-version-modules", {
    method: "POST",
    body: JSON.stringify(productVersionModule),
  });
  return payload.productVersionModule;
}

export async function createEnvironmentGroup(
  group: EnvironmentGroupInput,
): Promise<EnvironmentGroup> {
  const payload = await environmentRequest<{ group: EnvironmentGroup }>(
    "/api/work-center/v1/environment-groups",
    { method: "POST", body: JSON.stringify(group) },
  );
  return payload.group;
}

export async function updateEnvironmentGroup(
  id: string,
  group: EnvironmentGroupInput,
): Promise<EnvironmentGroup> {
  const payload = await environmentRequest<{ group: EnvironmentGroup }>(
    `/api/work-center/v1/environment-groups/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(group) },
  );
  return payload.group;
}

export async function archiveEnvironmentGroup(
  id: string,
  organizationId: string,
): Promise<EnvironmentGroup> {
  const payload = await environmentRequest<{ group: EnvironmentGroup }>(
    `/api/work-center/v1/environment-groups/${encodeURIComponent(id)}/archive`,
    {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    },
  );
  return payload.group;
}

export async function createEnvironment(
  environment: EnvironmentInput,
): Promise<EnvironmentRecord> {
  const payload = await environmentRequest<{
    environment: EnvironmentRecord;
  }>("/api/work-center/v1/environments", {
    method: "POST",
    body: JSON.stringify(environment),
  });
  return payload.environment;
}

export async function updateEnvironment(
  id: string,
  environment: EnvironmentInput,
): Promise<EnvironmentRecord> {
  const payload = await environmentRequest<{
    environment: EnvironmentRecord;
  }>(`/api/work-center/v1/environments/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(environment),
  });
  return payload.environment;
}

export async function setEnvironmentArchived(
  id: string,
  organizationId: string,
  archived: boolean,
): Promise<EnvironmentRecord> {
  const payload = await environmentRequest<{
    environment: EnvironmentRecord;
  }>(
    `/api/work-center/v1/environments/${encodeURIComponent(id)}/${
      archived ? "archive" : "restore"
    }`,
    {
      method: "POST",
      body: JSON.stringify({ organizationId }),
    },
  );
  return payload.environment;
}

async function authRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/work-center/v1/auth${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(!["GET", "HEAD"].includes(options.method ?? "GET")
        ? csrfHeaders()
        : {}),
      ...options.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: { code?: string; message?: string; details?: unknown } }
    | null;
  if (!response.ok) {
    const authPayload = payload as
      | { error?: { code?: string; message?: string; details?: unknown } }
      | null;
    const error = new Error(
      authPayload?.error?.message ?? `Authentication request failed with ${response.status}`,
    ) as Error & { code?: string; status?: number; details?: unknown };
    error.code = authPayload?.error?.code;
    error.status = response.status;
    error.details = authPayload?.error?.details;
    throw error;
  }
  return payload as T;
}

export function fetchAuthConfig(signal?: AbortSignal): Promise<AuthConfig> {
  return authRequest<AuthConfig>("/config", { signal });
}

export function fetchAuthSession(signal?: AbortSignal): Promise<AuthSession> {
  return authRequest<AuthSession>("/session", { signal });
}

export function updateProfile(input: {
  displayName: string;
}): Promise<{ user: AuthUser }> {
  return authRequest("/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function registerLocalAccount(input: {
  username: string;
  email: string;
  displayName: string;
  password: string;
}): Promise<{
  authenticated: boolean;
  pendingApproval?: boolean;
  bootstrap: boolean;
  user: AuthUser & { status: string };
}> {
  return authRequest("/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loginLocalAccount(input: {
  login: string;
  password: string;
}): Promise<{ authenticated: boolean; user: AuthUser }> {
  return authRequest("/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logoutAccount(): Promise<{ authenticated: false }> {
  return authRequest("/logout", { method: "POST" });
}

export async function fetchManagedUsers(
  signal?: AbortSignal,
): Promise<ManagedUser[]> {
  const payload = await authRequest<{ users: ManagedUser[] }>("/users", {
    signal,
  });
  return payload.users;
}

export async function updateManagedUser(
  userId: string,
  input: { status: ManagedUser["status"]; roleAssignments: RoleAssignment[] },
): Promise<ManagedUser> {
  const payload = await authRequest<{ user: ManagedUser }>(
    `/users/${encodeURIComponent(userId)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  return payload.user;
}

export async function fetchRoles(
  signal?: AbortSignal,
): Promise<{ roles: Role[]; permissions: Permission[] }> {
  return authRequest("/roles", { signal });
}

export async function createRole(input: {
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}): Promise<Role> {
  const payload = await authRequest<{ role: Role }>("/roles", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.role;
}

export async function updateRole(
  roleId: string,
  input: {
    code: string;
    name: string;
    description: string;
    permissionCodes: string[];
  },
): Promise<Role> {
  const payload = await authRequest<{ role: Role }>(
    `/roles/${encodeURIComponent(roleId)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  return payload.role;
}

export async function fetchAuditEvents(
  signal?: AbortSignal,
): Promise<AuditEvent[]> {
  const payload = await authRequest<{ events: AuditEvent[] }>("/audit", {
    signal,
  });
  return payload.events;
}
