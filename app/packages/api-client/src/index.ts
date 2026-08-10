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

export type PersonalTaskType = "DEADLINE" | "LONG_TERM";
export type PersonalTaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "WAITING"
  | "COMPLETED";
export type PersonalTaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type PersonalTaskReviewCycle = "WEEKLY" | "MONTHLY" | "CUSTOM";

export interface TaskSourceLink {
  id: string;
  externalAccountId: string;
  providerCode: "INQUIRY" | "BACKLOG";
  externalObjectId: string;
  externalKey: string;
  externalUrl: string;
  externalStatus: string;
  externalUpdatedAt: string | null;
}

export interface PersonalTask {
  id: string;
  title: string;
  taskType: PersonalTaskType;
  status: PersonalTaskStatus;
  priority: PersonalTaskPriority;
  description: string;
  automationPrompt: string;
  promptScheduleEnabled: boolean;
  dueAt: string | null;
  nextReviewAt: string | null;
  reviewCycle: PersonalTaskReviewCycle | null;
  customReviewDays: number | null;
  revision: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceLink: TaskSourceLink | null;
}

export interface PersonalTaskInput {
  title: string;
  taskType: PersonalTaskType;
  status: PersonalTaskStatus;
  priority: PersonalTaskPriority;
  description: string;
  automationPrompt: string;
  promptScheduleEnabled: boolean;
  dueAt: string | null;
  nextReviewAt: string | null;
  reviewCycle: PersonalTaskReviewCycle | null;
  customReviewDays: number | null;
  revision?: number;
}

export interface TaskCandidate {
  id: string;
  externalAccountId: string;
  providerCode: "INQUIRY" | "BACKLOG";
  accountName: string;
  externalObjectId: string;
  externalKey: string;
  title: string;
  description: string;
  externalStatus: string;
  externalAssignee: string;
  externalUrl: string;
  externalCreatedAt: string | null;
  externalUpdatedAt: string | null;
  disposition: "PENDING" | "ADOPTED" | "DISMISSED" | "STALE";
  seenFilterRevision: number;
  sourceData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskExternalAccount {
  id: string;
  providerCode: "INQUIRY" | "BACKLOG";
  displayName: string;
  baseUrl: string;
  externalUsername: string;
  ownerDisplayName: string;
  credential?: string;
  credentialConfigured: boolean;
  filters: Record<string, unknown>;
  filterRevision: number;
  lastGeneratedFilterRevision: number;
  lastGenerationAt: string | null;
  enabled: boolean;
  syncIntervalMinutes: number;
  lastSyncAt: string | null;
  lastCursor: string | null;
  lastSyncStatus: "RUNNING" | "SUCCESS" | "FAILED" | null;
  lastError: { code: string; message: string } | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskExternalAccountInput {
  id?: string;
  revision?: number;
  providerCode: "INQUIRY" | "BACKLOG";
  displayName: string;
  baseUrl: string;
  externalUsername: string;
  credential: string;
  filters: Record<string, unknown>;
  enabled: boolean;
  syncIntervalMinutes: number;
}

export interface TaskExternalAccountOptions {
  identity?: { id: string; name: string };
  assignees?: Array<{ value: string; label: string }>;
  statuses?: Array<{ value: string; label: string }>;
  customers?: Array<{ value: string; label: string }>;
  subStatuses?: Array<{ value: string; label: string }>;
  categories?: Array<{ value: string; label: string }>;
  classificationResults?: Array<{ value: string; label: string }>;
}

export interface TaskSyncRun {
  id: string;
  externalAccountId: string;
  accountName: string;
  providerCode: string;
  triggerType: "MANUAL" | "SCHEDULED" | "REGENERATE";
  status: "RUNNING" | "SUCCESS" | "FAILED";
  fetchedCount: number;
  createdCount: number;
  updatedCount: number;
  staleCount: number;
  filterRevision: number;
  error: { code: string; message: string } | null;
  startedAt: string;
  completedAt: string | null;
}

export interface TaskPromptRun {
  id: string;
  taskId: string;
  triggerType: "MANUAL" | "SCHEDULED";
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  inputSnapshot: Record<string, unknown>;
  result: {
    assistantSessionId?: string;
    gatewayTaskId?: string;
    message?: string;
  } | null;
  error: { code: string; message: string } | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PersonalTaskSummary {
  overdue: number;
  dueToday: number;
  reviewDue: number;
  candidates: number;
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
  inquiryCustomerCode: string;
  inquiryCustomerName: string;
  inquiryLastSyncedAt: string | null;
}

export type OrganizationInput = Pick<
  Organization,
  | "classificationId"
  | "code"
  | "name"
  | "shortName"
  | "maintenanceStatus"
  | "remarks"
  | "inquiryCustomerCode"
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

export type CustomerContractStatus =
  | "NONE"
  | "PLANNED"
  | "ACTIVE"
  | "EXPIRED"
  | "TERMINATED";

export interface CustomerInformationSettings {
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  organizationShortName: string;
  inquiryCustomerCode: string;
  revision: number;
  updatedAt: string | null;
}

export interface CustomerContract {
  id: string;
  organizationId: string;
  itemType: "PRODUCT" | "SERVICE";
  productId: string | null;
  productCode: string | null;
  productName: string | null;
  serviceName: string | null;
  introductionStatus: CustomerContractStatus;
  introductionStartDate: string | null;
  introductionEndDate: string | null;
  maintenanceStatus: CustomerContractStatus;
  maintenanceStartDate: string | null;
  maintenanceEndDate: string | null;
  notes: string;
  revision: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CustomerContractInput = Omit<
  CustomerContract,
  | "id"
  | "organizationId"
  | "productCode"
  | "productName"
  | "archivedAt"
  | "createdAt"
  | "updatedAt"
>;

export interface CustomerActiveService {
  source: "CONTRACT" | "ENVIRONMENT";
  itemType: "PRODUCT" | "SERVICE";
  productId: string | null;
  code: string | null;
  name: string;
  introductionStatus?: CustomerContractStatus;
  introductionStartDate?: string | null;
  introductionEndDate?: string | null;
  maintenanceStatus?: CustomerContractStatus;
  maintenanceStartDate?: string | null;
  maintenanceEndDate?: string | null;
  environmentCount: number;
  versions: string[];
}

export interface CustomerVpnConnection {
  id: string;
  organizationId: string;
  name: string;
  vpnType: "IPSEC" | "SSL" | "MPLS" | "OTHER";
  providerName: string;
  endpoint: string;
  status: EnvironmentStatus;
  notes: string;
  revision: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CustomerVpnInput = Omit<
  CustomerVpnConnection,
  | "id"
  | "organizationId"
  | "archivedAt"
  | "createdAt"
  | "updatedAt"
>;

export interface CustomerCustomization {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  summary: string;
  businessPurpose: string;
  affectedComponents: string[];
  status: "PLANNED" | "ACTIVE" | "RETIRED" | "UNKNOWN";
  notes: string;
  sourceScanId: string;
  sourceCandidateId: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerBacklogProject {
  id?: string;
  organizationId?: string;
  externalProjectId: string;
  projectKey: string;
  projectName: string;
}

export interface CustomerBacklogIssue {
  id: string;
  issueKey: string;
  summary: string;
  projectId: string;
  status: string;
  assignee: string;
  priority: string;
  dueDate: string | null;
  updatedAt: string | null;
  url: string;
}

export interface CustomerInformation {
  settings: CustomerInformationSettings;
  contracts: CustomerContract[];
  activeServices: CustomerActiveService[];
  vpnConnections: CustomerVpnConnection[];
  customizations: CustomerCustomization[];
  backlogProjects: CustomerBacklogProject[];
}

export interface CustomerInquiryPage {
  page: number;
  pageSize: number;
  total: number;
  sourceTruncated: boolean;
  tickets: InquirySearchTicket[];
}

export interface CustomerKnowledgeEvidenceRef {
  documentId: string;
  documentVersionId: string;
  chunkId: string;
  resourceUri: string;
  path: string;
  sheet: string | null;
  cellRange: string | null;
  page: number | null;
  section: string | null;
  excerpt: string;
}

export interface CustomerKnowledgeScanCandidate {
  id: string;
  scanId: string;
  organizationId: string;
  fieldCode: string;
  value: unknown;
  optionExternalId: string | null;
  confidence: number;
  evidenceRefs: CustomerKnowledgeEvidenceRef[];
  status: "PROPOSED" | "APPLIED" | "DISMISSED" | "CONFLICT" | "REVIEW_REQUIRED";
  appliedRecordRefs: Array<{ recordType: string; recordId: string }>;
  reviewedAt: string | null;
  createdAt: string;
}

export interface CustomerKnowledgeScan {
  id: string;
  organizationId: string;
  subjectExternalId: string;
  sourceSettingId: string;
  cagTaskId: string | null;
  cagScopeId: string | null;
  cagIngestionId: string | null;
  parentScanId: string | null;
  status:
    | "QUEUED"
    | "RESOLVING_SCOPE"
    | "PREPARING_DOCUMENTS"
    | "INGESTING"
    | "EXTRACTING"
    | "AGGREGATING"
    | "REVIEW_REQUIRED"
    | "COMPLETED"
    | "FAILED";
  querySnapshot: Record<string, string>;
  coverage: {
    total_documents?: number;
    ready_documents?: number;
    analyzed_documents?: number;
    failed_documents?: number;
    excluded_documents?: number;
    coverage_rate?: number;
  };
  conflicts: Array<Record<string, unknown>>;
  unresolvedFields: Array<{ field_code: string; reason_code: string }>;
  documentFailures: Array<Record<string, unknown>>;
  versions: Record<string, unknown>;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  candidates: CustomerKnowledgeScanCandidate[];
}

export type CustomerInformationSortOrder = "asc" | "desc";

export interface CustomerBacklogIssuePage {
  page: number;
  pageSize: number;
  total: number;
  projects: CustomerBacklogProject[];
  templates: BacklogSearchTemplate[];
  issues: CustomerBacklogIssue[];
  configurationRequired?: "BACKLOG_SEARCH_TEMPLATE_REQUIRED";
}

export type CustomerInquirySortField =
  | "ticketNo"
  | "title"
  | "status"
  | "assignee"
  | "customer"
  | "updatedAt";

export type CustomerBacklogIssueSortField =
  | "issueKey"
  | "summary"
  | "projectId"
  | "status"
  | "assignee"
  | "priority"
  | "dueDate"
  | "updatedAt";

export type CustomerBacklogIssueSortOrder = CustomerInformationSortOrder;

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
  impersonation: {
    actor: Pick<AuthUser, "id" | "username" | "displayName" | "email">;
  } | null;
}

export interface ModelSettings {
  id: string | null;
  purpose: "GENERAL" | "INQUIRY";
  displayName: string;
  provider: "OPENAI";
  endpoint: string;
  model: string;
  apiKey: string;
  apiKeyConfigured: boolean;
  reasoningEffort: "XHIGH" | "HIGH" | "MEDIUM";
  speedLevel: "FAST" | "MEDIUM" | "SLOW";
  enabled: boolean;
  sortOrder: number;
  isDefault: boolean;
  updatedAt: string | null;
  updatedBy: string;
}

export interface ModelSettingsInput {
  purpose: "GENERAL" | "INQUIRY";
  displayName: string;
  provider: "OPENAI";
  endpoint: string;
  model: string;
  apiKey: string;
  reasoningEffort: "XHIGH" | "HIGH" | "MEDIUM";
  speedLevel: "FAST" | "MEDIUM" | "SLOW";
  enabled: boolean;
  sortOrder: number;
  isDefault: boolean;
}

export interface AgentGatewaySettings {
  id: string;
  name: string;
  endpoint: string;
  fallbackEndpoints: string[];
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
  fallbackEndpoints: string[];
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
  inquiryLevel: string | null;
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
  keywordOperator?: "AND" | "OR";
  includeRelatedRecords?: boolean;
  createdFrom?: string;
  createdTo?: string;
  requestedReplyFrom?: string;
  requestedReplyTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
  customer?: string;
  customerName?: string;
  customerCode?: string;
  assignee?: string;
  unassignedOnly?: boolean;
  assigneeName?: string;
  status: string;
  subStatus?: string;
  category?: string;
  classificationResult?: string;
  questionerName?: string;
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
  customers: Array<{ value: string; label: string }>;
  subStatuses: Array<{ value: string; label: string }>;
  categories: Array<{ value: string; label: string }>;
  classificationResults: Array<{ value: string; label: string }>;
}

export interface InquiryAnalysis {
  mode?: "QUESTION" | "UNANSWERED" | "REPLIED" | "FULL_TICKET";
  reviewStage?:
    | "PRE_RESPONSE"
    | "IN_PROGRESS"
    | "RESPONSE_REVIEW"
    | "CLOSED_REVIEW";
  stageAssessment?: string;
  draftReadiness?:
    | "READY_TO_DRAFT"
    | "NEEDS_INVESTIGATION"
    | "NO_FURTHER_REPLY_NEEDED";
  keyPoints?: unknown[];
  investigationDirections?: unknown[];
  facts?: unknown[];
  disputes?: unknown[];
  replyAssessment?: unknown[];
  focusedReplyAssessment?: unknown[];
  missingInformation?: unknown[];
  missingViewpoints?: unknown[];
  risks?: unknown[];
  recommendedChecks?: unknown[];
  replyStructure?: unknown[];
  draftDecisionReasons?: unknown[];
  roundAssessments?: Array<{
    questionSequence: number;
    matchLevel: "MATCHED" | "PARTIAL" | "UNANSWERED" | "NO_PUBLIC_REPLY";
    summary: string;
  }>;
  processFindings?: Array<{
    questionSequence: number;
    omittedPoints: string[];
    repeatedQuestions: string[];
    firstPublicReplyWaitMinutes: number | null;
    waitAssessment: string;
  }>;
  customerEvaluationAssessment?: string[];
  overallAssessment?: {
    serviceQuality: string | null;
    risks: string[];
    finalConclusion: string | null;
  };
  remediationActions?: string[];
  attachmentCoverage?: {
    total: number;
    parsed: number;
    visualCount: number;
    unsupported: number;
    failed: number;
    skippedVisualCount: number;
  };
  evidence?: Array<{ messageKey: string; reason: string }>;
}

export type InquiryAssistAnchor =
  | "TICKET"
  | "QUESTION"
  | "MESSAGE"
  | "NEXT_REPLY";

export interface InquiryAssistRun {
  id: string;
  ticketNo: string;
  questionKey: string;
  anchor: InquiryAssistAnchor;
  focusMessageKey: string | null;
  provider: "MODEL" | "AGENT_GATEWAY";
  providerLabel: string;
  generatedBy: {
    id: string;
    displayName: string;
    username: string;
  } | null;
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
  deletedAt: string | null;
  deletedBy: {
    id: string;
    displayName: string;
    username: string;
  } | null;
}

export interface InquirySupportSettings {
  id: string | null;
  code: "ONEHR_UPDS";
  baseUrl: string;
  apiUrl: string;
  productCode: "UPDS";
  username: string;
  password?: string;
  passwordConfigured: boolean;
  apiKey?: string;
  apiKeyConfigured: boolean;
  enabled: boolean;
  revision: number;
  updatedAt: string | null;
  updatedBy: string;
}

export interface BacklogSystemSettings {
  id: string | null;
  code: "BACKLOG_SYSTEM";
  baseUrl: string;
  apiUrl: string;
  productCode: "BACKLOG";
  username: string;
  password?: string;
  passwordConfigured: boolean;
  apiKey?: string;
  apiKeyConfigured: boolean;
  enabled: boolean;
  revision: number;
  updatedAt: string | null;
  updatedBy: string;
}

export type BacklogSearchTemplateMatchMode =
  | "CUSTOM_FIELD"
  | "TITLE_CONTAINS";

export type BacklogSearchTemplateValueSource =
  | "AUTO"
  | "CODE"
  | "NAME"
  | "SHORT_NAME";

export interface BacklogSearchTemplate {
  id: string;
  templateName: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  fieldId: string;
  fieldName: string;
  matchMode: BacklogSearchTemplateMatchMode;
  valueSource: BacklogSearchTemplateValueSource;
  enabled: boolean;
  sortOrder: number;
  revision: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BacklogSearchTemplateInput {
  templateName: string;
  projectId: string;
  fieldId: string;
  matchMode: BacklogSearchTemplateMatchMode;
  valueSource: BacklogSearchTemplateValueSource;
  enabled: boolean;
  sortOrder: number;
  revision?: number;
}

export interface BacklogCustomFieldItem {
  id: string;
  name: string;
  displayOrder: number;
}

export interface BacklogCustomField {
  id: string;
  name: string;
  typeId: number;
  items: BacklogCustomFieldItem[];
}

export interface BacklogConnectionTestResult {
  success: boolean;
  mode: "API" | "LOGIN_PAGE";
  authenticated: boolean;
  identityName: string;
  statusCode: number;
  latencyMs: number;
  testedAt: string;
}

export interface InquirySupportSettingsPayload {
  settings: InquirySupportSettings;
  backlogSettings: BacklogSystemSettings;
  backlogTemplates: BacklogSearchTemplate[];
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

export interface AiAssistantSession {
  id: string;
  ownerUserId: string;
  gatewaySettingId: string;
  gatewayName: string;
  projectRef: string;
  projectCode: string;
  runtimeProfile: string;
  title: string;
  status: "ACTIVE" | "ARCHIVED";
  lastTaskId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  shortcut: AiAssistantShortcutSummary | null;
  startingModel: AiAssistantStartingModel | null;
}

export interface AiAssistantStartingModel {
  id: string;
  displayName?: string;
  model: string;
  reasoningEffort: "XHIGH" | "HIGH" | "MEDIUM";
  speedLevel: "FAST" | "MEDIUM" | "SLOW";
  enabled?: boolean;
}

export interface LocalizedAiAssistantText {
  ja: string;
  zh: string;
  en: string;
}

export interface AiAssistantShortcutSummary {
  id: string;
  categoryId?: string;
  name: LocalizedAiAssistantText;
  description: LocalizedAiAssistantText;
  starterPrompt: LocalizedAiAssistantText;
  startingModel: AiAssistantStartingModel | null;
  sortOrder?: number;
  enabled?: boolean;
  updatedAt?: string;
}

export interface AiAssistantShortcut extends AiAssistantShortcutSummary {
  categoryId: string;
  sortOrder: number;
  enabled: boolean;
  updatedAt: string;
  systemPrompt?: string;
}

export interface AiAssistantShortcutCategory {
  id: string;
  name: LocalizedAiAssistantText;
  icon: string;
  sortOrder: number;
  enabled: boolean;
  shortcuts: AiAssistantShortcut[];
}

export interface AiAssistantShortcutInput {
  categoryId: string;
  startingModelSettingId: string;
  startingReasoningEffort: "XHIGH" | "HIGH" | "MEDIUM";
  name: LocalizedAiAssistantText;
  description: LocalizedAiAssistantText;
  starterPrompt: LocalizedAiAssistantText;
  systemPrompt: string;
  sortOrder: number;
  enabled: boolean;
}

export interface AiAssistantTask extends AgentGatewayTask {
  prompt: string;
  inquiryContext?: AiAssistantInquiryContextInput | null;
  attachments?: AiAssistantAttachment[];
  error: string | null;
  final_report?: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export interface AiAssistantAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  sha256: string;
  createdAt?: string;
}

export interface AiAssistantSessionDetail {
  session: AiAssistantSession;
  conversation: AgentGatewayConversation;
  tasks: AiAssistantTask[];
}

export interface AiAssistantInquiryContextInput {
  ticketNo: string;
  ticketTitle: string;
  status: string;
  subStatus?: string;
  assigneeName?: string | null;
  customerName?: string;
  category: string[];
  urgency?: string | null;
  inquiryLevel?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requestedReplyAt?: string | null;
  questionKey: string;
  questionSequence: number;
  questionLabel: string;
  questionCreatedAt: string;
  questionBody: string;
  attachmentNames: string[];
  messages: Array<{
    messageKey: string;
    kind: InquiryMessageKind;
    author: string;
    visibility?: InquiryMessage["visibility"];
    createdAt: string;
    body: string;
    attachmentNames?: string[];
  }>;
  ticketAttachmentNames?: string[];
  questionThreads?: Array<{
    questionKey: string;
    sequence: number;
    questionLabel: string;
    questionCreatedAt: string;
    requestedReplyAt: string | null;
    questionBody: string;
    attachmentNames: string[];
    messages: Array<{
      messageKey: string;
      kind: InquiryMessageKind;
      author: string;
      visibility?: InquiryMessage["visibility"];
      createdAt: string;
      body: string;
      attachmentNames?: string[];
    }>;
  }>;
  customerEvaluation?: {
    satisfaction: string;
    comment: string;
    submittedAt: string | null;
  } | null;
}

export interface AiAssistantEvent {
  id: string;
  type: string;
  taskId: string;
  sequence: number;
  conversationSequence: number;
  timestamp: string;
  data: Record<string, unknown>;
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

export interface ModelDiscoveryResult extends ModelConnectionTestResult {
  models: string[];
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

export interface DepartmentMembership {
  id?: string;
  departmentId: string;
  departmentCode?: string;
  departmentName?: string;
  isPrimary: boolean;
  validFrom?: string | null;
  validTo?: string | null;
}

export interface ResponsibilityAssignment {
  id?: string;
  departmentId: string;
  departmentCode?: string;
  departmentName?: string;
  responsibilityId: string;
  responsibilityCode?: string;
  responsibilityName?: string;
  isPrimary: boolean;
}

export interface ManagedUser extends AuthUser {
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLoginAt: string | null;
  identities: ExternalIdentity[];
  roleAssignments: RoleAssignment[];
  departmentMemberships: DepartmentMembership[];
  responsibilityAssignments: ResponsibilityAssignment[];
}

export interface InternalDepartment {
  id: string;
  code: string;
  name: string;
  parentDepartmentId: string | null;
  parentCode: string;
  parentName: string;
  enabled: boolean;
  sortOrder: number;
}

export interface BusinessResponsibility {
  id: string;
  code: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface InternalWorkforceCatalog {
  departments: InternalDepartment[];
  responsibilities: BusinessResponsibility[];
}

export type InquirySearchTemplateTargetType =
  | "SYSTEM"
  | "DEPARTMENT"
  | "RESPONSIBILITY"
  | "ROLE"
  | "USER";

export interface InquirySearchTemplateBinding {
  id?: string;
  templateId?: string;
  targetType: InquirySearchTemplateTargetType;
  targetId: string | null;
  targetCode?: string;
  targetName?: string;
  priority: number;
  enabled: boolean;
}

export interface InquirySearchTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  filters: Record<string, unknown>;
  autoExecute: boolean;
  enabled: boolean;
  revision: number;
  bindings: InquirySearchTemplateBinding[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InquirySearchTemplateTargets extends InternalWorkforceCatalog {
  roles: Array<{ id: string; code: string; name: string }>;
  users: Array<{ id: string; code: string; name: string }>;
}

export type EffectiveInquirySearchPolicy =
  | { status: "NONE" }
  | {
      status: "CONFIGURATION_ERROR";
      stage: InquirySearchTemplateTargetType;
      priority: number;
      bindingIds: string[];
    }
  | {
      status: "RESOLVED";
      source: {
        type: InquirySearchTemplateTargetType;
        name: string;
        priority: number;
      };
      template: Omit<InquirySearchTemplate, "bindings" | "enabled">;
    };

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

export async function fetchPersonalTasks(
  signal?: AbortSignal,
): Promise<PersonalTask[]> {
  const result = await environmentRequest<{ tasks: PersonalTask[] }>(
    "/api/work-center/v1/personal-tasks",
    { signal },
  );
  return result.tasks;
}

export async function fetchPersonalTaskSummary(
  signal?: AbortSignal,
): Promise<PersonalTaskSummary> {
  const result = await environmentRequest<{
    summary: PersonalTaskSummary;
  }>("/api/work-center/v1/personal-task-summary", { signal });
  return result.summary;
}

export async function createPersonalTask(
  input: PersonalTaskInput,
): Promise<PersonalTask> {
  const result = await environmentRequest<{ task: PersonalTask }>(
    "/api/work-center/v1/personal-tasks",
    { method: "POST", body: JSON.stringify(input) },
  );
  return result.task;
}

export async function updatePersonalTask(
  id: string,
  input: PersonalTaskInput,
): Promise<PersonalTask> {
  const result = await environmentRequest<{ task: PersonalTask }>(
    `/api/work-center/v1/personal-tasks/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  return result.task;
}

export async function archivePersonalTask(
  id: string,
): Promise<PersonalTask> {
  const result = await environmentRequest<{ task: PersonalTask }>(
    `/api/work-center/v1/personal-tasks/${encodeURIComponent(id)}/archive`,
    { method: "POST" },
  );
  return result.task;
}

export async function fetchPersonalTaskEvents(
  id: string,
  signal?: AbortSignal,
): Promise<Array<{
  id: string;
  eventType: string;
  eventData: Record<string, unknown>;
  createdAt: string;
}>> {
  const result = await environmentRequest<{
    events: Array<{
      id: string;
      eventType: string;
      eventData: Record<string, unknown>;
      createdAt: string;
    }>;
  }>(
    `/api/work-center/v1/personal-tasks/${encodeURIComponent(id)}/events`,
    { signal },
  );
  return result.events;
}

export async function fetchTaskCandidates(
  signal?: AbortSignal,
): Promise<TaskCandidate[]> {
  const result = await environmentRequest<{
    candidates: TaskCandidate[];
  }>("/api/work-center/v1/personal-task-candidates", { signal });
  return result.candidates;
}

export async function adoptTaskCandidate(
  id: string,
  input: PersonalTaskInput,
): Promise<PersonalTask> {
  const result = await environmentRequest<{ task: PersonalTask }>(
    `/api/work-center/v1/personal-task-candidates/${encodeURIComponent(id)}/adopt`,
    { method: "POST", body: JSON.stringify(input) },
  );
  return result.task;
}

export async function dismissTaskCandidate(id: string): Promise<void> {
  await environmentRequest(
    `/api/work-center/v1/personal-task-candidates/${encodeURIComponent(id)}/dismiss`,
    { method: "POST" },
  );
}

export async function fetchTaskExternalAccounts(
  signal?: AbortSignal,
): Promise<TaskExternalAccount[]> {
  const result = await environmentRequest<{
    connections: TaskExternalAccount[];
  }>("/api/work-center/v1/personal-task-connections", { signal });
  return result.connections;
}

export async function saveTaskExternalAccount(
  input: TaskExternalAccountInput,
): Promise<TaskExternalAccount> {
  const id = input.id;
  const result = await environmentRequest<{
    connection: TaskExternalAccount;
  }>(
    id
      ? `/api/work-center/v1/personal-task-connections/${encodeURIComponent(id)}`
      : "/api/work-center/v1/personal-task-connections",
    {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(input),
    },
  );
  return result.connection;
}

export async function deleteTaskExternalAccount(id: string): Promise<void> {
  await environmentRequest(
    `/api/work-center/v1/personal-task-connections/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function revealTaskExternalCredential(
  id: string,
): Promise<string> {
  const result = await environmentRequest<{ credential: string }>(
    `/api/work-center/v1/personal-task-connections/${encodeURIComponent(id)}/credential`,
  );
  return result.credential;
}

export async function testTaskExternalAccount(
  id: string,
): Promise<Record<string, unknown>> {
  const result = await environmentRequest<{
    result: Record<string, unknown>;
  }>(
    `/api/work-center/v1/personal-task-connections/${encodeURIComponent(id)}/test`,
    { method: "POST" },
  );
  return result.result;
}

export async function fetchTaskExternalAccountOptions(id: string): Promise<TaskExternalAccountOptions> {
  const result = await environmentRequest<{ result: TaskExternalAccountOptions }>(`/api/work-center/v1/personal-task-connections/${encodeURIComponent(id)}/options`, { method: "POST" });
  return result.result;
}

export async function syncTaskExternalAccount(
  id: string,
): Promise<TaskSyncRun> {
  const result = await environmentRequest<{ run: TaskSyncRun }>(
    `/api/work-center/v1/personal-task-connections/${encodeURIComponent(id)}/sync`,
    { method: "POST" },
  );
  return result.run;
}

export async function regenerateTaskExternalAccount(id: string): Promise<TaskSyncRun> {
  const result = await environmentRequest<{ run: TaskSyncRun }>(`/api/work-center/v1/personal-task-connections/${encodeURIComponent(id)}/regenerate`, { method: "POST" });
  return result.run;
}

export async function executePersonalTaskPrompt(
  id: string,
): Promise<{ run: TaskPromptRun; assistantSessionId: string }> {
  return environmentRequest(
    `/api/work-center/v1/personal-tasks/${encodeURIComponent(id)}/prompt-runs`,
    { method: "POST" },
  );
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

function customerPath(organizationId: string, suffix: string): string {
  return `/api/work-center/v1/customers/${encodeURIComponent(
    organizationId,
  )}/${suffix}`;
}

export function fetchCustomerInformation(
  organizationId: string,
  signal?: AbortSignal,
): Promise<CustomerInformation> {
  return environmentRequest(
    customerPath(organizationId, "information"),
    { signal },
  );
}

export async function createCustomerContract(
  organizationId: string,
  contract: CustomerContractInput,
): Promise<CustomerContract> {
  const payload = await environmentRequest<{ contract: CustomerContract }>(
    customerPath(organizationId, "contracts"),
    { method: "POST", body: JSON.stringify(contract) },
  );
  return payload.contract;
}

export async function updateCustomerContract(
  organizationId: string,
  contractId: string,
  contract: CustomerContractInput,
): Promise<CustomerContract> {
  const payload = await environmentRequest<{ contract: CustomerContract }>(
    customerPath(
      organizationId,
      `contracts/${encodeURIComponent(contractId)}`,
    ),
    { method: "PUT", body: JSON.stringify(contract) },
  );
  return payload.contract;
}

export async function archiveCustomerContract(
  organizationId: string,
  contractId: string,
  revision: number,
): Promise<void> {
  await environmentRequest(
    customerPath(
      organizationId,
      `contracts/${encodeURIComponent(contractId)}`,
    ),
    { method: "DELETE", body: JSON.stringify({ revision }) },
  );
}

export async function createCustomerVpn(
  organizationId: string,
  vpn: CustomerVpnInput,
): Promise<CustomerVpnConnection> {
  const payload = await environmentRequest<{ vpn: CustomerVpnConnection }>(
    customerPath(organizationId, "vpn-connections"),
    { method: "POST", body: JSON.stringify(vpn) },
  );
  return payload.vpn;
}

export async function updateCustomerVpn(
  organizationId: string,
  vpnId: string,
  vpn: CustomerVpnInput,
): Promise<CustomerVpnConnection> {
  const payload = await environmentRequest<{ vpn: CustomerVpnConnection }>(
    customerPath(
      organizationId,
      `vpn-connections/${encodeURIComponent(vpnId)}`,
    ),
    { method: "PUT", body: JSON.stringify(vpn) },
  );
  return payload.vpn;
}

export async function archiveCustomerVpn(
  organizationId: string,
  vpnId: string,
  revision: number,
): Promise<void> {
  await environmentRequest(
    customerPath(
      organizationId,
      `vpn-connections/${encodeURIComponent(vpnId)}`,
    ),
    { method: "DELETE", body: JSON.stringify({ revision }) },
  );
}

export async function fetchCustomerInquiryPage(
  organizationId: string,
  page: number,
  pageSize: number,
  sortField: CustomerInquirySortField = "title",
  sortOrder: CustomerInformationSortOrder = "asc",
  signal?: AbortSignal,
): Promise<CustomerInquiryPage> {
  return environmentRequest(
    `${customerPath(organizationId, "inquiries")}?page=${page}&pageSize=${pageSize}&sortField=${sortField}&sortOrder=${sortOrder}`,
    { signal },
  );
}

export async function startCustomerKnowledgeScan(
  organizationId: string,
): Promise<CustomerKnowledgeScan> {
  const payload = await environmentRequest<{ scan: CustomerKnowledgeScan }>(
    customerPath(organizationId, "knowledge-scans"),
    { method: "POST" },
  );
  return payload.scan;
}

export async function fetchLatestCustomerKnowledgeScan(
  organizationId: string,
  signal?: AbortSignal,
): Promise<CustomerKnowledgeScan | null> {
  const payload = await environmentRequest<{
    scan: CustomerKnowledgeScan | null;
  }>(customerPath(organizationId, "knowledge-scans/latest"), { signal });
  return payload.scan;
}

export async function reviewCustomerKnowledgeScanCandidate(
  organizationId: string,
  scanId: string,
  candidateId: string,
  action: "apply" | "dismiss",
): Promise<CustomerKnowledgeScan> {
  const payload = await environmentRequest<{ scan: CustomerKnowledgeScan }>(
    customerPath(
      organizationId,
      `knowledge-scans/${encodeURIComponent(scanId)}/candidates/${
        encodeURIComponent(candidateId)
      }/${action}`,
    ),
    { method: "POST" },
  );
  return payload.scan;
}

export interface CustomerKnowledgeSourceSetting {
  id: string;
  purposeCode: "CUSTOMER_LEDGER_EXTRACTION";
  gatewaySettingId: string;
  cagProjectId: string;
  cagSourceId: string;
  analysisTemplateCode: "ORGANIZATION_PROFILE_ENRICHMENT";
  analysisTemplateVersion: 2;
  priority: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerKnowledgeSourceSettingInput {
  id: string | null;
  gatewaySettingId: string;
  cagProjectId: string;
  cagSourceId: string;
  priority: number;
  enabled: boolean;
}

export async function reanalyzeCustomerKnowledgeScan(
  organizationId: string,
  scanId: string,
): Promise<CustomerKnowledgeScan> {
  const payload = await environmentRequest<{ scan: CustomerKnowledgeScan }>(
    customerPath(
      organizationId,
      `knowledge-scans/${encodeURIComponent(scanId)}/reanalyze`,
    ),
    { method: "POST" },
  );
  return payload.scan;
}

export async function reingestCustomerKnowledgeScan(
  organizationId: string,
  scanId: string,
): Promise<CustomerKnowledgeScan> {
  const payload = await environmentRequest<{ scan: CustomerKnowledgeScan }>(
    customerPath(
      organizationId,
      `knowledge-scans/${encodeURIComponent(scanId)}/reingest`,
    ),
    { method: "POST" },
  );
  return payload.scan;
}

export async function fetchCustomerBacklogProjectOptions(
  organizationId: string,
  signal?: AbortSignal,
): Promise<CustomerBacklogProject[]> {
  const payload = await environmentRequest<{
    projects: CustomerBacklogProject[];
  }>(customerPath(organizationId, "backlog-project-options"), { signal });
  return payload.projects;
}

export async function saveCustomerBacklogProjects(
  organizationId: string,
  projects: CustomerBacklogProject[],
): Promise<CustomerBacklogProject[]> {
  const payload = await environmentRequest<{
    projects: CustomerBacklogProject[];
  }>(customerPath(organizationId, "backlog-projects"), {
    method: "PUT",
    body: JSON.stringify({ projects }),
  });
  return payload.projects;
}

export function fetchCustomerBacklogIssuePage(
  organizationId: string,
  page: number,
  pageSize: number,
  sortField: CustomerBacklogIssueSortField = "summary",
  sortOrder: CustomerBacklogIssueSortOrder = "asc",
  signal?: AbortSignal,
): Promise<CustomerBacklogIssuePage> {
  return environmentRequest(
    `${customerPath(organizationId, "backlog-issues")}?page=${page}&pageSize=${pageSize}&sortField=${sortField}&sortOrder=${sortOrder}`,
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

export async function fetchAISettings(
  signal?: AbortSignal,
): Promise<AISettings> {
  return environmentRequest<AISettings>(
    "/api/work-center/v1/ai-settings",
    { signal },
  );
}

export async function saveAIModelSettings(
  settingId: string | null,
  settings: ModelSettingsInput,
): Promise<ModelSettings> {
  const path = settingId
    ? `/api/work-center/v1/ai-settings/models/${encodeURIComponent(settingId)}`
    : "/api/work-center/v1/ai-settings/models";
  const payload = await environmentRequest<{ settings: ModelSettings }>(
    path,
    {
      method: settingId ? "PUT" : "POST",
      body: JSON.stringify(settings),
    },
  );
  return payload.settings;
}

export async function testAIModelConnection(
  settingId: string | null,
  settings: ModelSettingsInput,
): Promise<ModelConnectionTestResult> {
  const payload = await environmentRequest<{
    result: ModelConnectionTestResult;
  }>("/api/work-center/v1/ai-settings/models/test", {
    method: "POST",
    body: JSON.stringify({ ...settings, id: settingId }),
  });
  return payload.result;
}

export async function discoverAIModels(
  settingId: string | null,
  settings: Pick<ModelSettingsInput, "endpoint" | "apiKey">,
): Promise<ModelDiscoveryResult> {
  const payload = await environmentRequest<{
    result: ModelDiscoveryResult;
  }>("/api/work-center/v1/ai-settings/models/discover", {
    method: "POST",
    body: JSON.stringify({ ...settings, id: settingId }),
  });
  return payload.result;
}

export async function deleteAIModelSettings(id: string): Promise<void> {
  await environmentRequest<{ removed: boolean }>(
    `/api/work-center/v1/ai-settings/models/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
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

export async function fetchCustomerKnowledgeSourceSettings(
  signal?: AbortSignal,
): Promise<CustomerKnowledgeSourceSetting[]> {
  const payload = await environmentRequest<{
    settings: CustomerKnowledgeSourceSetting[];
  }>("/api/work-center/v1/customer-knowledge-source-settings", { signal });
  return payload.settings;
}

export async function saveCustomerKnowledgeSourceSetting(
  input: CustomerKnowledgeSourceSettingInput,
): Promise<CustomerKnowledgeSourceSetting> {
  const payload = await environmentRequest<{
    setting: CustomerKnowledgeSourceSetting;
  }>("/api/work-center/v1/customer-knowledge-source-settings", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return payload.setting;
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
  anchor: InquiryAssistAnchor,
  focusMessageKey?: string | null,
): Promise<InquiryAssistRun> {
  const payload = await environmentRequest<{ run: InquiryAssistRun }>(
    `/api/work-center/v1/inquiry-support/tickets/${encodeURIComponent(
      ticketNo,
    )}/threads/${encodeURIComponent(questionKey)}/assist-runs`,
    {
      method: "POST",
      body: JSON.stringify({
        anchor,
        focusMessageKey: focusMessageKey ?? null,
      }),
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

export async function fetchInquiryTicketAssistRuns(
  ticketNo: string,
  includeDeleted = false,
  signal?: AbortSignal,
): Promise<InquiryAssistRun[]> {
  const payload = await environmentRequest<{ runs: InquiryAssistRun[] }>(
    `/api/work-center/v1/inquiry-support/tickets/${encodeURIComponent(
      ticketNo,
    )}/assist-runs${includeDeleted ? "?includeDeleted=true" : ""}`,
    { signal },
  );
  return payload.runs;
}

export async function deleteInquiryAssistRun(
  id: string,
): Promise<InquiryAssistRun> {
  const payload = await environmentRequest<{ run: InquiryAssistRun }>(
    `/api/work-center/v1/inquiry-support/assist-runs/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return payload.run;
}

export function inquiryAttachmentUrl(
  ticketNo: string,
  attachmentId: string,
  options: {
    mode?: "download" | "preview";
    name?: string;
  } = {},
): string {
  const path = `/api/work-center/v1/inquiry-support/tickets/${encodeURIComponent(
    ticketNo,
  )}/attachments/${encodeURIComponent(attachmentId)}`;
  const query = new URLSearchParams();
  if (options.mode) query.set("mode", options.mode);
  if (options.name) query.set("name", options.name);
  return query.size ? `${path}?${query.toString()}` : path;
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
    | "code"
    | "apiUrl"
    | "productCode"
    | "passwordConfigured"
    | "apiKey"
    | "apiKeyConfigured"
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

export async function fetchBacklogSearchProjects(
  signal?: AbortSignal,
): Promise<CustomerBacklogProject[]> {
  const payload = await environmentRequest<{
    projects: CustomerBacklogProject[];
  }>("/api/work-center/v1/inquiry-support/settings/backlog/projects", {
    signal,
  });
  return payload.projects;
}

export async function fetchBacklogProjectFields(
  projectId: string,
  signal?: AbortSignal,
): Promise<BacklogCustomField[]> {
  const payload = await environmentRequest<{
    fields: BacklogCustomField[];
  }>(
    `/api/work-center/v1/inquiry-support/settings/backlog/projects/${encodeURIComponent(projectId)}/fields`,
    { signal },
  );
  return payload.fields;
}

export async function createBacklogSearchTemplate(
  input: BacklogSearchTemplateInput,
): Promise<BacklogSearchTemplate> {
  const payload = await environmentRequest<{
    template: BacklogSearchTemplate;
  }>("/api/work-center/v1/inquiry-support/settings/backlog/templates", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return payload.template;
}

export async function updateBacklogSearchTemplate(
  id: string,
  input: BacklogSearchTemplateInput,
): Promise<BacklogSearchTemplate> {
  const payload = await environmentRequest<{
    template: BacklogSearchTemplate;
  }>(
    `/api/work-center/v1/inquiry-support/settings/backlog/templates/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  return payload.template;
}

export async function deleteBacklogSearchTemplate(
  id: string,
  revision: number,
): Promise<void> {
  await environmentRequest(
    `/api/work-center/v1/inquiry-support/settings/backlog/templates/${encodeURIComponent(id)}?revision=${encodeURIComponent(revision)}`,
    { method: "DELETE" },
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
  "task.queued",
  "task.started",
  "workspace.preparing",
  "workspace.ready",
  "runtime.connected",
  "agent.plan",
  "agent.message.started",
  "agent.message.delta",
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
  "task.cancelled",
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

export async function saveBacklogSystemSettings(
  settings: Omit<
    BacklogSystemSettings,
    | "id"
    | "code"
    | "productCode"
    | "passwordConfigured"
    | "apiKeyConfigured"
    | "revision"
    | "updatedAt"
    | "updatedBy"
  > & { password: string; apiKey: string },
): Promise<BacklogSystemSettings> {
  const payload = await environmentRequest<{
    settings: BacklogSystemSettings;
  }>("/api/work-center/v1/inquiry-support/settings/backlog", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return payload.settings;
}

export async function testBacklogSystemSettings(
  settings: Partial<BacklogSystemSettings> & {
    password?: string;
    apiKey?: string;
  },
): Promise<BacklogConnectionTestResult> {
  const payload = await environmentRequest<{
    result: BacklogConnectionTestResult;
  }>("/api/work-center/v1/inquiry-support/settings/backlog/test", {
    method: "POST",
    body: JSON.stringify(settings),
  });
  return payload.result;
}

function aiAssistantSessionPath(sessionId = "") {
  const base = "/api/work-center/v1/ai-assistant/sessions";
  return sessionId ? `${base}/${encodeURIComponent(sessionId)}` : base;
}

export async function listAiAssistantSessions(
  includeArchived = false,
): Promise<AiAssistantSession[]> {
  const query = includeArchived ? "?include_archived=true" : "";
  const payload = await environmentRequest<{
    sessions: AiAssistantSession[];
  }>(`${aiAssistantSessionPath()}${query}`);
  return payload.sessions;
}

export async function createAiAssistantSession(
  title?: string,
  shortcutId?: string,
): Promise<AiAssistantSession> {
  const payload = await environmentRequest<{
    session: AiAssistantSession;
  }>(aiAssistantSessionPath(), {
    method: "POST",
    body: JSON.stringify({ title, shortcutId }),
  });
  return payload.session;
}

export async function listAiAssistantShortcuts(): Promise<
  AiAssistantShortcutCategory[]
> {
  const payload = await environmentRequest<{
    categories: AiAssistantShortcutCategory[];
  }>("/api/work-center/v1/ai-assistant/shortcuts");
  return payload.categories;
}

export async function listAiAssistantShortcutsForAdmin(): Promise<
  AiAssistantShortcutCategory[]
> {
  const payload = await environmentRequest<{
    categories: AiAssistantShortcutCategory[];
  }>("/api/work-center/v1/ai-assistant/shortcuts/admin");
  return payload.categories;
}

export async function saveAiAssistantShortcut(
  shortcutId: string | null,
  input: AiAssistantShortcutInput,
): Promise<string> {
  const path = shortcutId
    ? `/api/work-center/v1/ai-assistant/shortcuts/admin/${encodeURIComponent(shortcutId)}`
    : "/api/work-center/v1/ai-assistant/shortcuts/admin";
  const payload = await environmentRequest<{ shortcutId: string }>(path, {
    method: shortcutId ? "PUT" : "POST",
    body: JSON.stringify(input),
  });
  return payload.shortcutId;
}

export async function fetchAiAssistantSession(
  sessionId: string,
): Promise<AiAssistantSessionDetail> {
  return environmentRequest<AiAssistantSessionDetail>(
    aiAssistantSessionPath(sessionId),
  );
}

export async function renameAiAssistantSession(
  sessionId: string,
  title: string,
): Promise<AiAssistantSession> {
  const payload = await environmentRequest<{
    session: AiAssistantSession;
  }>(aiAssistantSessionPath(sessionId), {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  return payload.session;
}

export async function archiveAiAssistantSession(
  sessionId: string,
): Promise<void> {
  await environmentRequest<{ archived: boolean }>(
    `${aiAssistantSessionPath(sessionId)}/archive`,
    { method: "POST", body: "{}" },
  );
}

export async function deleteAiAssistantSession(
  sessionId: string,
): Promise<void> {
  await environmentRequest<{ deleted: boolean }>(
    aiAssistantSessionPath(sessionId),
    { method: "DELETE" },
  );
}

export async function sendAiAssistantMessage(
  sessionId: string,
  prompt: string,
  inquiryContext?: AiAssistantInquiryContextInput | null,
  attachmentIds: string[] = [],
): Promise<AiAssistantTask> {
  const payload = await environmentRequest<{ task: AiAssistantTask }>(
    `${aiAssistantSessionPath(sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ prompt, inquiryContext, attachmentIds }),
    },
  );
  return payload.task;
}

export async function uploadAiAssistantAttachment(
  sessionId: string,
  file: File,
): Promise<AiAssistantAttachment> {
  const query = new URLSearchParams({ filename: file.name });
  const response = await fetch(
    `${aiAssistantSessionPath(sessionId)}/attachments?${query}`,
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": file.type || "application/octet-stream",
        ...csrfHeaders(),
      },
      body: file,
    },
  );
  const payload = (await response.json().catch(() => null)) as
    | {
        attachment?: AiAssistantAttachment;
        error?: { code?: string; message?: string };
      }
    | null;
  if (!response.ok || !payload?.attachment) {
    throw new Error(
      payload?.error?.message ??
        `Attachment upload failed with ${response.status}`,
    );
  }
  return payload.attachment;
}

export async function deleteAiAssistantAttachment(
  sessionId: string,
  attachmentId: string,
): Promise<void> {
  await environmentRequest<{ deleted: boolean }>(
    `${aiAssistantSessionPath(sessionId)}/attachments/${
      encodeURIComponent(attachmentId)
    }`,
    { method: "DELETE" },
  );
}

export function aiAssistantAttachmentUrl(
  sessionId: string,
  attachmentId: string,
) {
  return `${aiAssistantSessionPath(sessionId)}/attachments/${
    encodeURIComponent(attachmentId)
  }`;
}

export function normalizeAiAssistantEvent(
  value: unknown,
  fallbackId = "",
): AiAssistantEvent | null {
  if (!value || typeof value !== "object") return null;
  const event = value as Record<string, unknown>;
  const data =
    event.data && typeof event.data === "object"
      ? (event.data as Record<string, unknown>)
      : {};
  const type = String(event.type ?? "");
  if (!type) return null;
  return {
    id: String(event.event_id ?? fallbackId),
    type,
    taskId: String(event.task_id ?? ""),
    sequence: Number(event.sequence ?? 0),
    conversationSequence: Number(event.conversation_sequence ?? fallbackId ?? 0),
    timestamp: String(event.timestamp ?? ""),
    data,
  };
}

export function parseAiAssistantSse(text: string): AiAssistantEvent[] {
  const events: AiAssistantEvent[] = [];
  for (const block of text.split(/\r?\n\r?\n/)) {
    const lines = block.split(/\r?\n/);
    const id =
      lines
        .find((line) => line.startsWith("id:"))
        ?.slice(3)
        .trim() ?? "";
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    try {
      const normalized = normalizeAiAssistantEvent(JSON.parse(data), id);
      if (normalized) events.push(normalized);
    } catch {
      continue;
    }
  }
  return events;
}

export async function fetchAiAssistantHistory(
  sessionId: string,
): Promise<AiAssistantEvent[]> {
  const response = await fetch(
    `${aiAssistantSessionPath(sessionId)}/events?after_sequence=0&follow=false`,
    {
      credentials: "same-origin",
      headers: { Accept: "text/event-stream" },
    },
  );
  if (!response.ok) {
    throw new Error(`AI assistant history failed with ${response.status}`);
  }
  return parseAiAssistantSse(await response.text());
}

export function subscribeAiAssistantEvents(
  sessionId: string,
  onEvent: (event: AiAssistantEvent) => void,
  afterSequence = 0,
  onState?: (connected: boolean) => void,
): EventSource {
  const query = new URLSearchParams({
    after_sequence: String(Math.max(0, afterSequence)),
    follow: "true",
  });
  const source = new EventSource(
    `${aiAssistantSessionPath(sessionId)}/events?${query}`,
    { withCredentials: true },
  );
  const receive = (message: MessageEvent) => {
    try {
      const event = normalizeAiAssistantEvent(
        JSON.parse(String(message.data)),
        message.lastEventId,
      );
      if (event) onEvent(event);
      onState?.(true);
    } catch {
      return;
    }
  };
  registerAgentGatewayEventListeners(source, receive);
  source.onopen = () => onState?.(true);
  source.onerror = () => onState?.(false);
  return source;
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

export function startImpersonation(userId: string): Promise<{
  authenticated: true;
}> {
  return authRequest(
    `/impersonation/${encodeURIComponent(userId)}`,
    { method: "POST" },
  );
}

export function stopImpersonation(): Promise<{ authenticated: true }> {
  return authRequest("/impersonation/stop", { method: "POST" });
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
  input: {
    status: ManagedUser["status"];
    roleAssignments: RoleAssignment[];
    departmentMemberships: DepartmentMembership[];
    responsibilityAssignments: ResponsibilityAssignment[];
  },
): Promise<ManagedUser> {
  const payload = await authRequest<{ user: ManagedUser }>(
    `/users/${encodeURIComponent(userId)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  return payload.user;
}

export function fetchInternalWorkforce(
  signal?: AbortSignal,
): Promise<InternalWorkforceCatalog> {
  return environmentRequest("/api/work-center/v1/internal-workforce", { signal });
}

export function fetchMyWorkforceProfile(
  signal?: AbortSignal,
): Promise<{
  departmentMemberships: DepartmentMembership[];
  responsibilityAssignments: ResponsibilityAssignment[];
}> {
  return environmentRequest("/api/work-center/v1/internal-workforce/me", { signal });
}

export async function saveInternalDepartment(
  input: Omit<InternalDepartment, "id" | "parentCode" | "parentName">,
  id?: string,
): Promise<InternalDepartment> {
  const payload = await environmentRequest<{ department: InternalDepartment }>(
    id
      ? `/api/work-center/v1/internal-workforce/departments/${encodeURIComponent(id)}`
      : "/api/work-center/v1/internal-workforce/departments",
    { method: id ? "PUT" : "POST", body: JSON.stringify(input) },
  );
  return payload.department;
}

export async function saveBusinessResponsibility(
  input: Omit<BusinessResponsibility, "id">,
  id?: string,
): Promise<BusinessResponsibility> {
  const payload = await environmentRequest<{
    responsibility: BusinessResponsibility;
  }>(
    id
      ? `/api/work-center/v1/internal-workforce/responsibilities/${encodeURIComponent(id)}`
      : "/api/work-center/v1/internal-workforce/responsibilities",
    { method: id ? "PUT" : "POST", body: JSON.stringify(input) },
  );
  return payload.responsibility;
}

export function fetchInquirySearchTemplates(
  signal?: AbortSignal,
): Promise<{
  templates: InquirySearchTemplate[];
  targets: InquirySearchTemplateTargets;
}> {
  return environmentRequest("/api/work-center/v1/inquiry-search-templates", {
    signal,
  });
}

export async function saveInquirySearchTemplate(
  input: Omit<InquirySearchTemplate, "id" | "createdAt" | "updatedAt">,
  id?: string,
): Promise<InquirySearchTemplate> {
  const payload = await environmentRequest<{
    template: InquirySearchTemplate;
  }>(
    id
      ? `/api/work-center/v1/inquiry-search-templates/${encodeURIComponent(id)}`
      : "/api/work-center/v1/inquiry-search-templates",
    { method: id ? "PUT" : "POST", body: JSON.stringify(input) },
  );
  return payload.template;
}

export function fetchEffectiveInquirySearchPolicy(
  signal?: AbortSignal,
): Promise<EffectiveInquirySearchPolicy> {
  return environmentRequest(
    "/api/work-center/v1/inquiry-search-policy/effective",
    { signal },
  );
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
