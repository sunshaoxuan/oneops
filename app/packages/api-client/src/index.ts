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
  productModuleId: string;
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
  versionSelectionMode: "SINGLE" | "MODULE_SCOPED";
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
  relationType: "VERSION" | "CANDIDATE";
  candidateId: string;
  productVersionId: string;
  productId: string;
  productCode: string;
  productName: string;
  productShortName: string;
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
  credentialConfigured: boolean;
  credentialHasUsername: boolean;
  credentialHasPassword: boolean;
}

export type EnvironmentEndpointInput = Omit<
  EnvironmentEndpoint,
  | "id"
  | "credentialConfigured"
  | "credentialHasUsername"
  | "credentialHasPassword"
> & {
  organizationId: string;
};

export interface EnvironmentEndpointCredential {
  endpointId: string;
  username: string;
  password: string;
  revision: number;
}

export interface EnvironmentEndpointCredentialStatus {
  endpointId: string;
  credentialConfigured: boolean;
  hasUsername: boolean;
  hasPassword: boolean;
  revision: number;
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

export interface ModelSettings {
  id: string | null;
  purpose: "GENERAL" | "SIMPLE";
  provider: "OPENAI";
  endpoint: string;
  model: string;
  apiKey: string;
  apiKeyConfigured: boolean;
  updatedAt: string | null;
  updatedBy: string;
}

export interface ModelSettingsInput {
  provider: "OPENAI";
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface AgentGatewaySettings {
  id: string;
  name: string;
  endpoint: string;
  accessToken: string;
  accessTokenConfigured: boolean;
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string;
}

export interface AgentGatewaySettingsInput {
  id: string | null;
  name: string;
  endpoint: string;
  accessToken: string;
  enabled: boolean;
}

export interface AISettings {
  models: ModelSettings[];
  agentGateways: AgentGatewaySettings[];
}

export type InquiryMessageKind =
  | "INTERNAL_DISCUSSION"
  | "CUSTOMER_VISIBLE_REPLY"
  | "SYSTEM_EVENT"
  | "ATTACHMENT_EVENT";

export interface InquiryParticipant {
  id: string | null;
  displayName: string;
  role: string;
}

export interface InquiryAttachment {
  id: string;
  name: string;
  type: string;
  size: number | null;
  parsingStatus: string;
}

export interface InquiryQuestion {
  createdAt: string;
  requestedReplyAt: string | null;
  body: string;
  attachments: InquiryAttachment[];
}

export interface InquiryMessage {
  messageKey: string;
  kind: InquiryMessageKind;
  author: InquiryParticipant | null;
  relation: "CURRENT_USER" | "OTHER_SUPPORT" | "SYSTEM";
  visibility: "INTERNAL" | "CUSTOMER_VISIBLE" | "SYSTEM";
  createdAt: string;
  body: string;
  attachments: InquiryAttachment[];
}

export interface InquiryQuestionThread {
  questionKey: string;
  sequence: number;
  customerQuestion: InquiryQuestion;
  messages: InquiryMessage[];
}

export interface InquiryEvaluation {
  satisfaction: string;
  comment: string;
  submittedAt: string | null;
}

export interface InquiryTicketDetail {
  ticketNo: string;
  title: string;
  status: string;
  subStatus: string;
  assignee: InquiryParticipant | null;
  customer: {
    id: string | null;
    name: string;
    contactName: string;
    email: string;
    phone: string;
  };
  category: string[];
  urgency: string | null;
  createdAt: string;
  updatedAt: string;
  requestedReplyAt: string | null;
  attachments: InquiryAttachment[];
  evaluation: InquiryEvaluation | null;
  questionThreads: InquiryQuestionThread[];
  sourceUrl: string;
}

export interface InquirySearchInput {
  ticketNo?: string;
  content?: string;
  createdFrom?: string;
  createdTo?: string;
  assignee?: string;
  status: string;
  aiProcessedOnly?: boolean;
}

export interface InquirySearchTicket {
  ticketNo: string;
  title: string;
  assignee: string | null;
  status: string;
  updatedAt: string;
  createdAt: string;
  requestedReplyAt: string | null;
  customer: string;
}

export interface InquirySearchResult {
  actualCount: number;
  displayedCount: number;
  sourceTruncated: boolean;
  tickets: InquirySearchTicket[];
}

export interface InquirySupportOptions {
  assignees: Array<{ value: string; label: string }>;
}

export interface InquiryAnalysis {
  facts: unknown[];
  disputes: unknown[];
  missingInformation: unknown[];
  risks: unknown[];
  recommendedChecks: unknown[];
  evidence: Array<{ messageKey: string; reason: string }>;
}

export interface InquiryAssistRun {
  id: string;
  ticketNo: string;
  questionKey: string;
  focusMessageKey: string | null;
  provider: "MODEL" | "AGENT_GATEWAY";
  providerLabel: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  analysis: InquiryAnalysis | null;
  draftReply: string;
  error: { code: string; message: string } | null;
  tokenUsage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  } | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface InquirySupportSettings {
  id: string | null;
  baseUrl: string;
  productCode: "UPDS";
  username: string;
  password?: string;
  passwordConfigured: boolean;
  enabled: boolean;
  analysisProvider: "MODEL" | "AGENT_GATEWAY";
  modelSettingId: string | null;
  agentGatewaySettingId: string | null;
  agentGatewayProjectRef: string;
  revision: number;
  updatedAt: string | null;
  updatedBy: string;
}

export interface InquirySupportSettingsPayload {
  settings: InquirySupportSettings;
  models: Array<{
    id: string;
    purpose: "GENERAL" | "SIMPLE";
    model: string;
  }>;
  agentGateways: Array<{
    id: string;
    name: string;
    enabled: boolean;
  }>;
}

export interface AgentGatewayConnectionTestResult {
  success: boolean;
  code: string;
  statusCode: number | null;
  latencyMs: number;
  projectsCount: number;
  testedAt: string;
}

export interface AgentGatewayTask {
  id: string;
  task_id?: string;
  conversation_id: string | null;
  project_id: string;
  status: string;
  [key: string]: unknown;
}

export interface AgentGatewayConversation {
  id: string;
  project_id: string;
  title: string | null;
  [key: string]: unknown;
}

export interface ModelConnectionTestResult {
  success: boolean;
  code: string;
  statusCode: number | null;
  latencyMs: number;
  modelAvailable: boolean;
  modelsCount: number;
  testedAt: string;
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
  sessionId: string | null;
  requestId: string;
  capability: string;
  action: string;
  outcome: string;
  statusCode: number | null;
  durationMs: number | null;
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

export async function fetchModelSettings(
  signal?: AbortSignal,
): Promise<ModelSettings> {
  const payload = await environmentRequest<{ settings: ModelSettings }>(
    "/api/work-center/v1/model-settings",
    { signal },
  );
  return payload.settings;
}

export async function fetchAISettings(
  signal?: AbortSignal,
): Promise<AISettings> {
  return environmentRequest<AISettings>(
    "/api/work-center/v1/ai-settings",
    { signal },
  );
}

export async function saveAIModelSettings(
  purpose: "GENERAL" | "SIMPLE",
  settings: ModelSettingsInput,
): Promise<ModelSettings> {
  const payload = await environmentRequest<{ settings: ModelSettings }>(
    `/api/work-center/v1/ai-settings/models/${purpose}`,
    {
      method: "PUT",
      body: JSON.stringify(settings),
    },
  );
  return payload.settings;
}

export async function testAIModelConnection(
  purpose: "GENERAL" | "SIMPLE",
  settings: ModelSettingsInput,
): Promise<ModelConnectionTestResult> {
  const payload = await environmentRequest<{
    result: ModelConnectionTestResult;
  }>("/api/work-center/v1/ai-settings/models/test", {
    method: "POST",
    body: JSON.stringify({ ...settings, purpose }),
  });
  return payload.result;
}

export async function saveAgentGatewaySettings(
  settings: AgentGatewaySettingsInput,
): Promise<AgentGatewaySettings> {
  const payload = await environmentRequest<{
    settings: AgentGatewaySettings;
  }>("/api/work-center/v1/ai-settings/agent-gateways", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  return payload.settings;
}

export async function deleteAgentGatewaySettings(id: string): Promise<void> {
  await environmentRequest<{ removed: boolean }>(
    `/api/work-center/v1/ai-settings/agent-gateways/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function testAgentGatewaySettings(
  settings: AgentGatewaySettingsInput,
): Promise<AgentGatewayConnectionTestResult> {
  const payload = await environmentRequest<{
    result: AgentGatewayConnectionTestResult;
  }>("/api/work-center/v1/ai-settings/agent-gateways/test", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  return payload.result;
}

export function searchInquiryTickets(
  input: InquirySearchInput,
): Promise<InquirySearchResult> {
  return environmentRequest("/api/work-center/v1/inquiry-support/search", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchInquirySupportOptions(
  signal?: AbortSignal,
): Promise<InquirySupportOptions> {
  return environmentRequest(
    "/api/work-center/v1/inquiry-support/options",
    { signal },
  );
}

export function fetchInquiryTicket(
  ticketNo: string,
  signal?: AbortSignal,
): Promise<InquiryTicketDetail> {
  return environmentRequest(
    `/api/work-center/v1/inquiry-support/tickets/${encodeURIComponent(ticketNo)}`,
    { signal },
  );
}

export async function createInquiryAssistRun(
  ticketNo: string,
  questionKey: string,
  focusMessageKey?: string | null,
): Promise<InquiryAssistRun> {
  const payload = await environmentRequest<{ run: InquiryAssistRun }>(
    `/api/work-center/v1/inquiry-support/tickets/${encodeURIComponent(
      ticketNo,
    )}/threads/${encodeURIComponent(questionKey)}/assist-runs`,
    {
      method: "POST",
      body: JSON.stringify({ focusMessageKey: focusMessageKey ?? null }),
    },
  );
  return payload.run;
}

export async function fetchInquiryAssistRun(
  id: string,
  signal?: AbortSignal,
): Promise<InquiryAssistRun> {
  const payload = await environmentRequest<{ run: InquiryAssistRun }>(
    `/api/work-center/v1/inquiry-support/assist-runs/${encodeURIComponent(id)}`,
    { signal },
  );
  return payload.run;
}

export function inquiryAttachmentUrl(
  ticketNo: string,
  attachmentId: string,
): string {
  return `/api/work-center/v1/inquiry-support/tickets/${encodeURIComponent(
    ticketNo,
  )}/attachments/${encodeURIComponent(attachmentId)}`;
}

export function fetchInquirySupportSettings(
  signal?: AbortSignal,
): Promise<InquirySupportSettingsPayload> {
  return environmentRequest(
    "/api/work-center/v1/inquiry-support/settings",
    { signal },
  );
}

export async function saveInquirySupportSettings(
  settings: Omit<
    InquirySupportSettings,
    | "id"
    | "productCode"
    | "passwordConfigured"
    | "revision"
    | "updatedAt"
    | "updatedBy"
  > & { password: string },
): Promise<InquirySupportSettings> {
  const payload = await environmentRequest<{
    settings: InquirySupportSettings;
  }>("/api/work-center/v1/inquiry-support/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return payload.settings;
}

export function testInquirySupportSettings(
  settings: Partial<InquirySupportSettings> & { password?: string },
): Promise<{ success: boolean; testedAt: string }> {
  return environmentRequest(
    "/api/work-center/v1/inquiry-support/settings/test",
    {
      method: "POST",
      body: JSON.stringify(settings),
    },
  );
}

export async function createAgentGatewayConversation(
  gatewayId: string,
  projectId: string,
  title?: string,
): Promise<AgentGatewayConversation> {
  return environmentRequest<AgentGatewayConversation>(
    `/api/work-center/v1/agent-gateways/${
      encodeURIComponent(gatewayId)
    }/conversations`,
    {
      method: "POST",
      body: JSON.stringify({ project_id: projectId, title }),
    },
  );
}

export async function createAgentGatewayTask(
  gatewayId: string,
  input: {
    projectId: string;
    prompt: string;
    conversationId?: string;
    runtimeProfile?: string;
  },
): Promise<AgentGatewayTask> {
  const task = await environmentRequest<AgentGatewayTask>(
    `/api/work-center/v1/agent-gateways/${
      encodeURIComponent(gatewayId)
    }/tasks`,
    {
      method: "POST",
      body: JSON.stringify({
        project_id: input.projectId,
        prompt: input.prompt,
        conversation_id: input.conversationId,
        runtime_profile: input.runtimeProfile,
      }),
    },
  );
  return { ...task, id: task.id ?? task.task_id ?? "" };
}

function agentGatewayEventsUrl(
  gatewayId: string,
  resource: "tasks" | "conversations",
  resourceId: string,
  afterSequence = 0,
) {
  const query = new URLSearchParams({
    after_sequence: String(afterSequence),
    follow: "true",
  });
  return `/api/work-center/v1/agent-gateways/${
    encodeURIComponent(gatewayId)
  }/${resource}/${encodeURIComponent(resourceId)}/events?${query}`;
}

const agentGatewayEventTypes = [
  "task.created",
  "task.started",
  "workspace.preparing",
  "workspace.ready",
  "runtime.connected",
  "agent.plan",
  "agent.message",
  "skill.selected",
  "command.started",
  "command.output",
  "command.completed",
  "file.changed",
  "approval.requested",
  "approval.resolved",
  "test.completed",
  "task.completed",
  "task.failed",
];

function registerAgentGatewayEventListeners(
  source: EventSource,
  onEvent: (event: MessageEvent) => void,
) {
  source.onmessage = onEvent;
  for (const eventType of agentGatewayEventTypes) {
    source.addEventListener(
      eventType,
      onEvent as EventListener,
    );
  }
}

export function subscribeAgentGatewayTaskEvents(
  gatewayId: string,
  taskId: string,
  onEvent: (event: MessageEvent) => void,
  afterSequence = 0,
): EventSource {
  const source = new EventSource(
    agentGatewayEventsUrl(
      gatewayId,
      "tasks",
      taskId,
      afterSequence,
    ),
    { withCredentials: true },
  );
  registerAgentGatewayEventListeners(source, onEvent);
  return source;
}

export function subscribeAgentGatewayConversationEvents(
  gatewayId: string,
  conversationId: string,
  onEvent: (event: MessageEvent) => void,
  afterSequence = 0,
): EventSource {
  const source = new EventSource(
    agentGatewayEventsUrl(
      gatewayId,
      "conversations",
      conversationId,
      afterSequence,
    ),
    { withCredentials: true },
  );
  registerAgentGatewayEventListeners(source, onEvent);
  return source;
}

export async function saveModelSettings(
  settings: ModelSettingsInput,
): Promise<ModelSettings> {
  const payload = await environmentRequest<{ settings: ModelSettings }>(
    "/api/work-center/v1/model-settings",
    {
      method: "PUT",
      body: JSON.stringify(settings),
    },
  );
  return payload.settings;
}

export async function testModelConnection(
  settings: ModelSettingsInput,
): Promise<ModelConnectionTestResult> {
  const payload = await environmentRequest<{
    result: ModelConnectionTestResult;
  }>("/api/work-center/v1/model-settings/test", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  return payload.result;
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

export async function updateProduct(
  id: string,
  product: ProductInput,
): Promise<Product> {
  const payload = await environmentRequest<{ product: Product }>(
    `/api/work-center/v1/products/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(product) },
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

export async function updateProductVersion(
  id: string,
  productVersion: ProductVersionInput,
): Promise<ProductVersion> {
  const payload = await environmentRequest<{
    productVersion: ProductVersion;
  }>(
    `/api/work-center/v1/product-versions/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(productVersion),
    },
  );
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

export async function updateProductVersionModule(
  id: string,
  productVersionModule: ProductVersionModuleInput,
): Promise<ProductVersionModule> {
  const payload = await environmentRequest<{
    productVersionModule: ProductVersionModule;
  }>(
    `/api/work-center/v1/product-version-modules/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(productVersionModule),
    },
  );
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

export async function createEnvironmentEndpoint(
  endpoint: EnvironmentEndpointInput,
): Promise<EnvironmentEndpoint> {
  const payload = await environmentRequest<{
    endpoint: EnvironmentEndpoint;
  }>("/api/work-center/v1/environment-endpoints", {
    method: "POST",
    body: JSON.stringify(endpoint),
  });
  return payload.endpoint;
}

export async function updateEnvironmentEndpoint(
  id: string,
  endpoint: EnvironmentEndpointInput,
): Promise<EnvironmentEndpoint> {
  const payload = await environmentRequest<{
    endpoint: EnvironmentEndpoint;
  }>(
    `/api/work-center/v1/environment-endpoints/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: JSON.stringify(endpoint),
    },
  );
  return payload.endpoint;
}

export async function fetchEnvironmentEndpointCredential(
  endpointId: string,
  organizationId: string,
): Promise<EnvironmentEndpointCredential> {
  const payload = await environmentRequest<{
    credential: EnvironmentEndpointCredential;
  }>(
    `/api/work-center/v1/environment-endpoint-credentials/${encodeURIComponent(
      endpointId,
    )}?organizationId=${encodeURIComponent(organizationId)}`,
  );
  return payload.credential;
}

export async function saveEnvironmentEndpointCredential(
  endpointId: string,
  organizationId: string,
  credential: Pick<EnvironmentEndpointCredential, "username" | "password">,
): Promise<EnvironmentEndpointCredentialStatus> {
  const payload = await environmentRequest<{
    credential: EnvironmentEndpointCredentialStatus;
  }>(
    `/api/work-center/v1/environment-endpoint-credentials/${encodeURIComponent(
      endpointId,
    )}`,
    {
      method: "PUT",
      body: JSON.stringify({ organizationId, ...credential }),
    },
  );
  return payload.credential;
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
  filters: {
    actor?: string;
    capability?: string;
    outcome?: string;
    eventType?: string;
    createdFrom?: string;
    createdTo?: string;
    limit?: number;
  } = {},
  signal?: AbortSignal,
): Promise<AuditEvent[]> {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      parameters.set(key, String(value));
    }
  }
  const query = parameters.size ? `?${parameters.toString()}` : "";
  const payload = await authRequest<{ events: AuditEvent[] }>(`/audit${query}`, {
    signal,
  });
  return payload.events;
}
