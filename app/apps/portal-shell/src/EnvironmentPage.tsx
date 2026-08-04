import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloudServerOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  FolderAddOutlined,
  GlobalOutlined,
  LockOutlined,
  KeyOutlined,
  PlusOutlined,
  ProductOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  archiveEnvironmentGroup,
  createEnvironmentEndpoint,
  createEnvironment,
  createEnvironmentGroup,
  fetchEnvironmentInventory,
  fetchEnvironmentEndpointCredential,
  fetchProducts,
  setEnvironmentArchived,
  saveEnvironmentEndpointCredential,
  updateEnvironment,
  updateEnvironmentEndpoint,
  updateEnvironmentGroup,
  type EnvironmentGroup,
  type EnvironmentEndpoint,
  type EnvironmentEndpointInput,
  type EnvironmentInput,
  type EnvironmentPurpose,
  type EnvironmentRecord,
  type EnvironmentScope,
  type EnvironmentStatus,
  type Organization,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import { findModuleScopedVersionsWithoutSelection } from "./environment-product-validation";

const { Text, Title } = Typography;

type ViewFilter =
  | "all"
  | "production"
  | "verification"
  | "internal"
  | "retired";

interface EnvironmentFormValues {
  groupId: string;
  name: string;
  scope: EnvironmentScope;
  purpose: EnvironmentPurpose;
  status: EnvironmentStatus;
  url?: string;
  ownerName?: string;
  notes?: string;
  lastVerifiedAt?: string;
  productVersionIds?: string[];
  productVersionModuleIds?: string[];
}

interface GroupFormValues {
  name: string;
}

interface EndpointFormValues {
  name: string;
  role: EnvironmentEndpoint["role"];
  hostname?: string;
  ipAddress?: string;
  port?: number;
  protocol?: string;
  databaseType?: string;
  databaseVersion?: string;
  databaseName?: string;
  notes?: string;
}

interface CredentialFormValues {
  username?: string;
  password?: string;
}

const copy = {
  "ja-JP": {
    eyebrow: "環境インベントリ",
    description:
      "お客様ごとの本番・検証・社内環境と製品版数を、ひとつの台帳で管理します。",
    addEnvironment: "環境を追加",
    manageProducts: "製品・版数",
    documentAnalysis: "資料分析",
    documentAnalysisHint: "VPN 資料分析は安全基盤の整備後に接続します。",
    total: "有効環境",
    production: "本番",
    verification: "検証",
    internal: "社内",
    retired: "アーカイブ",
    groups: "環境グループ",
    addGroup: "グループを追加",
    allGroups: "すべてのグループ",
    searchPlaceholder: "環境名、製品、担当者を検索",
    noOrganization: "上部で組織機関を選択してください",
    noEnvironment: "表示できる環境がありません",
    noEnvironmentBody:
      "グループを選択して最初の環境を登録してください。",
    detailEmpty: "環境を選択すると詳細が表示されます",
    products: "製品と版数",
    basics: "基本情報",
    connections: "サーバー・接続",
    noConnections: "接続先が登録されていません",
    addConnection: "接続先を追加",
    editConnection: "接続先を編集",
    connectionName: "接続先名",
    hostname: "ホスト名",
    ipAddress: "IP アドレス",
    port: "ポート",
    protocol: "プロトコル",
    credential: "認証情報",
    credentialConfigured: "認証情報あり",
    credentialMissing: "認証情報なし",
    revealCredential: "認証情報を表示",
    username: "ユーザー名",
    password: "パスワード",
    copyValue: "コピー",
    credentialHelp:
      "表示操作は監査記録に残ります。保存時は暗号化されます。",
    endpointRoleAp: "AP",
    endpointRoleDb: "DB",
    endpointRoleBastion: "踏み台",
    endpointRoleLoadBalancer: "ロードバランサー",
    endpointRoleFileServer: "ファイルサーバー",
    endpointRoleOther: "その他",
    confirmationPending: "確認待ち",
    databaseVersion: "DB 版数",
    vpn: "VPN",
    evidence: "資料・根拠",
    history: "変更履歴",
    nextPhase: "次の実装段階で接続",
    nextPhaseBody:
      "認証、秘密情報保護、資料根拠と監査を整備した後に利用できます。",
    edit: "編集",
    duplicate: "複製",
    archive: "アーカイブ",
    restore: "復元",
    archiveConfirm: "この環境をアーカイブしますか。",
    archiveGroupConfirm: "空のグループをアーカイブしますか。",
    save: "保存",
    cancel: "キャンセル",
    createTitle: "環境を追加",
    editTitle: "環境を編集",
    copyTitle: "環境を複製",
    group: "グループ",
    name: "環境名",
    scope: "環境範囲",
    purpose: "用途",
    status: "状態",
    url: "URL",
    owner: "担当者",
    notes: "備考",
    lastVerifiedAt: "最終確認日",
    selectedProducts: "製品・版数",
    selectedModules: "購入機能モジュール",
    moduleRequired:
      "選択した製品・版数ごとに、購入機能モジュールを1つ以上選択してください。",
    customerScope: "お客様環境",
    internalScope: "社内環境",
    purposeProduction: "本番",
    purposeVerification: "検証・受入",
    purposeDevelopment: "開発・保守",
    purposeTraining: "研修・デモ",
    purposeOther: "その他",
    statusActive: "稼働中",
    statusPreparing: "準備中",
    statusSuspended: "停止中",
    statusRetired: "退役",
    groupCreateTitle: "環境グループを追加",
    groupEditTitle: "環境グループを編集",
    groupName: "グループ名",
    groupNotEmpty: "環境が残っているグループはアーカイブできません。",
    productMasterTitle: "製品・版数マスター",
    addProduct: "製品を追加",
    addVersion: "版数を追加",
    productCode: "製品 Code",
    productName: "製品名",
    productShortName: "略称",
    product: "製品",
    version: "標準版数",
    displayVersion: "表示版数",
    noProducts: "製品マスターが登録されていません",
    noModules: "選択した版数に機能モジュールが登録されていません",
    productHelp:
      "製品を登録し、その製品に正式な版数を追加してから環境へ関連付けます。",
    saveFailed: "保存できませんでした。",
    loadFailed: "環境情報を読み込めませんでした。再読込してください。",
    revisionConflict:
      "他の操作で更新されています。再読込してから編集してください。",
    reload: "再読込",
    environmentCount: "環境",
    productCount: "製品",
    notRegistered: "未登録",
    archivedLabel: "アーカイブ済み",
  },
  "zh-CN": {
    eyebrow: "环境台账",
    description: "按客户统一管理生产、检证、社内环境及产品版本。",
    addEnvironment: "新增环境",
    manageProducts: "产品与版本",
    documentAnalysis: "资料分析",
    documentAnalysisHint: "VPN 资料分析将在安全基础完成后接入。",
    total: "有效环境",
    production: "生产",
    verification: "检证",
    internal: "社内",
    retired: "已归档",
    groups: "环境分组",
    addGroup: "新增分组",
    allGroups: "全部分组",
    searchPlaceholder: "搜索环境、产品或负责人",
    noOrganization: "请先在顶部选择客户",
    noEnvironment: "没有可显示的环境",
    noEnvironmentBody: "选择分组并登记第一个环境。",
    detailEmpty: "选择环境后显示详细信息",
    products: "产品与版本",
    basics: "基本信息",
    connections: "服务器与连接",
    noConnections: "尚未登记连接端点",
    addConnection: "新增连接",
    editConnection: "编辑连接",
    connectionName: "连接名称",
    hostname: "主机名",
    ipAddress: "IP 地址",
    port: "端口",
    protocol: "协议",
    credential: "登录凭据",
    credentialConfigured: "已登记凭据",
    credentialMissing: "未登记凭据",
    revealCredential: "查看登录凭据",
    username: "用户名",
    password: "密码",
    copyValue: "复制",
    credentialHelp: "查看操作会写入审计记录，保存内容使用加密存储。",
    endpointRoleAp: "应用",
    endpointRoleDb: "数据库",
    endpointRoleBastion: "跳板机",
    endpointRoleLoadBalancer: "负载均衡",
    endpointRoleFileServer: "文件服务器",
    endpointRoleOther: "其他",
    confirmationPending: "待确认",
    databaseVersion: "数据库版本",
    vpn: "VPN",
    evidence: "资料与依据",
    history: "变更履历",
    nextPhase: "后续阶段接入",
    nextPhaseBody: "身份、秘密保护、资料依据和审计完成后开放。",
    edit: "编辑",
    duplicate: "复制",
    archive: "归档",
    restore: "恢复",
    archiveConfirm: "确认归档这个环境吗？",
    archiveGroupConfirm: "确认归档这个空分组吗？",
    save: "保存",
    cancel: "取消",
    createTitle: "新增环境",
    editTitle: "编辑环境",
    copyTitle: "复制环境",
    group: "分组",
    name: "环境名称",
    scope: "环境范围",
    purpose: "用途",
    status: "状态",
    url: "URL",
    owner: "负责人",
    notes: "备注",
    lastVerifiedAt: "最后确认日期",
    selectedProducts: "产品与版本",
    selectedModules: "已购功能模块",
    moduleRequired: "请为每个已选产品版本至少选择一个已购功能模块。",
    customerScope: "客户环境",
    internalScope: "社内环境",
    purposeProduction: "生产",
    purposeVerification: "检证与受入",
    purposeDevelopment: "开发与维护",
    purposeTraining: "培训与演示",
    purposeOther: "其他",
    statusActive: "运行中",
    statusPreparing: "准备中",
    statusSuspended: "已停止",
    statusRetired: "已退役",
    groupCreateTitle: "新增环境分组",
    groupEditTitle: "编辑环境分组",
    groupName: "分组名称",
    groupNotEmpty: "仍有环境的分组不能归档。",
    productMasterTitle: "产品与版本主档",
    addProduct: "新增产品",
    addVersion: "新增版本",
    productCode: "产品 Code",
    productName: "产品名称",
    productShortName: "简称",
    product: "产品",
    version: "标准版本",
    displayVersion: "显示版本",
    noProducts: "尚未登记产品主档",
    noModules: "所选版本尚未登记功能模块",
    productHelp: "先登记产品和正式版本，再关联到具体环境。",
    saveFailed: "保存失败。",
    loadFailed: "环境信息加载失败，请重新加载。",
    revisionConflict: "数据已经被其他操作更新，请重新加载后编辑。",
    reload: "重新加载",
    environmentCount: "个环境",
    productCount: "个产品",
    notRegistered: "未登记",
    archivedLabel: "已归档",
  },
  "en-US": {
    eyebrow: "Environment inventory",
    description:
      "Manage production, verification, and internal environments with exact product versions per customer.",
    addEnvironment: "Add environment",
    manageProducts: "Products and versions",
    documentAnalysis: "Document analysis",
    documentAnalysisHint:
      "VPN document analysis will be connected after the security foundation.",
    total: "Active",
    production: "Production",
    verification: "Verification",
    internal: "Internal",
    retired: "Archived",
    groups: "Environment groups",
    addGroup: "Add group",
    allGroups: "All groups",
    searchPlaceholder: "Search environments, products, or owners",
    noOrganization: "Select an organization from the top bar",
    noEnvironment: "No environments to display",
    noEnvironmentBody: "Select a group and register the first environment.",
    detailEmpty: "Select an environment to review details",
    products: "Products and versions",
    basics: "Basics",
    connections: "Servers and connections",
    noConnections: "No connection endpoints are registered",
    addConnection: "Add connection",
    editConnection: "Edit connection",
    connectionName: "Connection name",
    hostname: "Hostname",
    ipAddress: "IP address",
    port: "Port",
    protocol: "Protocol",
    credential: "Credential",
    credentialConfigured: "Credential registered",
    credentialMissing: "No credential",
    revealCredential: "Reveal credential",
    username: "Username",
    password: "Password",
    copyValue: "Copy",
    credentialHelp:
      "Reveal actions are audited and saved values are encrypted.",
    endpointRoleAp: "Application",
    endpointRoleDb: "Database",
    endpointRoleBastion: "Bastion",
    endpointRoleLoadBalancer: "Load balancer",
    endpointRoleFileServer: "File server",
    endpointRoleOther: "Other",
    confirmationPending: "Pending confirmation",
    databaseVersion: "Database version",
    vpn: "VPN",
    evidence: "Sources and evidence",
    history: "Change history",
    nextPhase: "Available in the next phase",
    nextPhaseBody:
      "Authentication, secret protection, evidence, and audit must be ready first.",
    edit: "Edit",
    duplicate: "Duplicate",
    archive: "Archive",
    restore: "Restore",
    archiveConfirm: "Archive this environment?",
    archiveGroupConfirm: "Archive this empty group?",
    save: "Save",
    cancel: "Cancel",
    createTitle: "Add environment",
    editTitle: "Edit environment",
    copyTitle: "Duplicate environment",
    group: "Group",
    name: "Environment name",
    scope: "Scope",
    purpose: "Purpose",
    status: "Status",
    url: "URL",
    owner: "Owner",
    notes: "Notes",
    lastVerifiedAt: "Last verified",
    selectedProducts: "Products and versions",
    selectedModules: "Purchased feature modules",
    moduleRequired:
      "Select at least one purchased feature module for each selected product version.",
    customerScope: "Customer",
    internalScope: "Internal",
    purposeProduction: "Production",
    purposeVerification: "Verification",
    purposeDevelopment: "Development",
    purposeTraining: "Training",
    purposeOther: "Other",
    statusActive: "Active",
    statusPreparing: "Preparing",
    statusSuspended: "Suspended",
    statusRetired: "Retired",
    groupCreateTitle: "Add environment group",
    groupEditTitle: "Edit environment group",
    groupName: "Group name",
    groupNotEmpty: "A group containing environments cannot be archived.",
    productMasterTitle: "Product and version master",
    addProduct: "Add product",
    addVersion: "Add version",
    productCode: "Product Code",
    productName: "Product name",
    productShortName: "Short name",
    product: "Product",
    version: "Canonical version",
    displayVersion: "Display version",
    noProducts: "No product master records",
    noModules: "No feature modules are registered for the selected versions",
    productHelp:
      "Register a product and canonical version before linking it to an environment.",
    saveFailed: "The record could not be saved.",
    loadFailed: "Environment information could not be loaded. Reload and try again.",
    revisionConflict: "The record changed. Reload before editing again.",
    reload: "Reload",
    environmentCount: "environments",
    productCount: "products",
    notRegistered: "Not registered",
    archivedLabel: "Archived",
  },
} as const;

function purposeColor(purpose: EnvironmentPurpose) {
  if (purpose === "PRODUCTION") return "volcano";
  if (purpose === "VERIFICATION") return "cyan";
  if (purpose === "DEVELOPMENT") return "blue";
  if (purpose === "TRAINING") return "purple";
  return "default";
}

function statusColor(status: EnvironmentStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "PREPARING") return "processing";
  if (status === "SUSPENDED") return "warning";
  return "default";
}

function endpointRoleLabel(
  role: EnvironmentRecord["endpoints"][number]["role"],
  text: (typeof copy)[LocaleKey],
) {
  if (role === "AP") return text.endpointRoleAp;
  if (role === "DB") return text.endpointRoleDb;
  if (role === "BASTION") return text.endpointRoleBastion;
  if (role === "LOAD_BALANCER") return text.endpointRoleLoadBalancer;
  if (role === "FILE_SERVER") return text.endpointRoleFileServer;
  return text.endpointRoleOther;
}

function endpointAddress(
  endpoint: EnvironmentRecord["endpoints"][number],
) {
  const host = endpoint.ipAddress || endpoint.hostname;
  return endpoint.port ? `${host}:${endpoint.port}` : host;
}

export function EnvironmentPage({
  locale,
  organization,
  title,
  permissions,
}: {
  locale: LocaleKey;
  organization?: Organization;
  title: string;
  permissions: string[];
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const environmentWritable = permissions.includes("environments.write");
  const catalogReadable = permissions.includes("catalog.read");
  const credentialReadable = permissions.includes(
    "environments.credentials.read",
  );
  const credentialWritable = permissions.includes(
    "environments.credentials.write",
  );
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string>();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] =
    useState<EnvironmentRecord>();
  const [copyingEnvironment, setCopyingEnvironment] =
    useState<EnvironmentRecord>();
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EnvironmentGroup>();
  const [endpointModalOpen, setEndpointModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] =
    useState<EnvironmentEndpoint>();
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [credentialEndpoint, setCredentialEndpoint] =
    useState<EnvironmentEndpoint>();
  const [operationError, setOperationError] = useState<Error & { code?: string }>();
  const [environmentForm] = Form.useForm<EnvironmentFormValues>();
  const [groupForm] = Form.useForm<GroupFormValues>();
  const [endpointForm] = Form.useForm<EndpointFormValues>();
  const [credentialForm] = Form.useForm<CredentialFormValues>();
  const selectedProductVersionIds =
    Form.useWatch("productVersionIds", environmentForm) ?? [];

  const includeArchived = viewFilter === "retired";
  const inventoryQuery = useQuery({
    queryKey: [
      "environment-inventory",
      organization?.id,
      includeArchived,
    ],
    queryFn: ({ signal }) =>
      fetchEnvironmentInventory(
        organization!.id,
        includeArchived,
        signal,
      ),
    enabled: Boolean(organization?.id),
  });
  const productQuery = useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => fetchProducts(signal),
    enabled: environmentWritable && catalogReadable,
  });

  const inventoryEnvironments = useMemo(
    () =>
      (Array.isArray(inventoryQuery.data?.environments)
        ? inventoryQuery.data.environments
        : []
      ).map((environment) => ({
        ...environment,
        products: Array.isArray(environment.products)
          ? environment.products
          : [],
        endpoints: Array.isArray(environment.endpoints)
          ? environment.endpoints
          : [],
      })),
    [inventoryQuery.data?.environments],
  );

  const invalidateInventory = () =>
    queryClient.invalidateQueries({
      queryKey: ["environment-inventory", organization?.id],
    });

  useEffect(() => {
    setSelectedGroupId("all");
    setSelectedEnvironmentId(undefined);
    setViewFilter("all");
    setSearch("");
    setOperationError(undefined);
  }, [organization?.id]);

  useEffect(() => {
    if (!environmentWritable) {
      setEditorOpen(false);
      setEditingEnvironment(undefined);
      setCopyingEnvironment(undefined);
      setGroupModalOpen(false);
      setEditingGroup(undefined);
      setEndpointModalOpen(false);
      setEditingEndpoint(undefined);
    }
    if (!catalogReadable) {
      queryClient.removeQueries({ queryKey: ["products"] });
    }
  }, [catalogReadable, environmentWritable, queryClient]);

  useEffect(() => {
    setCredentialModalOpen(false);
    setCredentialEndpoint(undefined);
    credentialForm.resetFields();
  }, [credentialReadable, credentialWritable, credentialForm]);

  const visibleEnvironments = useMemo(() => {
    const term = search.trim().toLocaleLowerCase(locale);
    return inventoryEnvironments.filter((environment) => {
      if (
        selectedGroupId !== "all" &&
        environment.groupId !== selectedGroupId
      ) {
        return false;
      }
      if (viewFilter === "production" && environment.purpose !== "PRODUCTION") {
        return false;
      }
      if (
        viewFilter === "verification" &&
        environment.purpose !== "VERIFICATION"
      ) {
        return false;
      }
      if (viewFilter === "internal" && environment.scope !== "INTERNAL") {
        return false;
      }
      if (viewFilter === "retired" && !environment.archivedAt) {
        return false;
      }
      if (viewFilter !== "retired" && environment.archivedAt) {
        return false;
      }
      if (!term) return true;
      return [
        environment.name,
        environment.ownerName,
        environment.groupName,
        ...environment.products.flatMap((product) => [
          product.productName,
          product.version,
          product.displayVersion,
        ]),
      ]
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(term);
    });
  }, [
    inventoryEnvironments,
    locale,
    search,
    selectedGroupId,
    viewFilter,
  ]);

  useEffect(() => {
    if (
      selectedEnvironmentId &&
      visibleEnvironments.some(
        (environment) => environment.id === selectedEnvironmentId,
      )
    ) {
      return;
    }
    setSelectedEnvironmentId(visibleEnvironments[0]?.id);
  }, [selectedEnvironmentId, visibleEnvironments]);

  const selectedEnvironment = visibleEnvironments.find(
    (environment) => environment.id === selectedEnvironmentId,
  );

  const saveGroupMutation = useMutation({
    mutationFn: async (values: GroupFormValues) => {
      const sortOrder =
        editingGroup?.sortOrder ??
        (inventoryQuery.data?.groups.length ?? 0);
      const input = {
        organizationId: organization!.id,
        name: values.name,
        sortOrder,
      };
      return editingGroup
        ? updateEnvironmentGroup(editingGroup.id, input)
        : createEnvironmentGroup(input);
    },
    onSuccess: async () => {
      setGroupModalOpen(false);
      setEditingGroup(undefined);
      groupForm.resetFields();
      setOperationError(undefined);
      await invalidateInventory();
    },
    onError: (error) => setOperationError(error as Error),
  });

  const archiveGroupMutation = useMutation({
    mutationFn: (group: EnvironmentGroup) =>
      archiveEnvironmentGroup(group.id, organization!.id),
    onSuccess: async () => {
      setSelectedGroupId("all");
      setOperationError(undefined);
      await invalidateInventory();
    },
    onError: (error) => setOperationError(error as Error),
  });

  const reorderGroupMutation = useMutation({
    mutationFn: async ({
      group,
      direction,
    }: {
      group: EnvironmentGroup;
      direction: -1 | 1;
    }) => {
      const groups = inventoryQuery.data?.groups ?? [];
      const index = groups.findIndex((value) => value.id === group.id);
      const swap = groups[index + direction];
      if (!swap) return;
      await Promise.all([
        updateEnvironmentGroup(group.id, {
          organizationId: organization!.id,
          name: group.name,
          sortOrder: swap.sortOrder,
        }),
        updateEnvironmentGroup(swap.id, {
          organizationId: organization!.id,
          name: swap.name,
          sortOrder: group.sortOrder,
        }),
      ]);
    },
    onSuccess: () => invalidateInventory(),
    onError: (error) => setOperationError(error as Error),
  });

  const saveEnvironmentMutation = useMutation({
    mutationFn: async (values: EnvironmentFormValues) => {
      const source = editingEnvironment ?? copyingEnvironment;
      const input: EnvironmentInput = {
        organizationId: organization!.id,
        groupId: values.groupId,
        name: values.name,
        scope: values.scope,
        purpose: values.purpose,
        status: values.status,
        url: values.url ?? "",
        ownerName: values.ownerName ?? "",
        notes: values.notes ?? "",
        sortOrder: source?.sortOrder ?? 0,
        revision: editingEnvironment?.revision ?? 0,
        lastVerifiedAt: values.lastVerifiedAt ?? "",
      products: (values.productVersionIds ?? []).map(
          (productVersionId) => ({
            productVersionId,
            usageStatus: "ACTIVE",
            notes: "",
            moduleIds: (values.productVersionModuleIds ?? []).filter(
              (moduleId) =>
                products
                  .flatMap((product) => product.versions)
                  .find((version) => version.id === productVersionId)
                  ?.modules.some((module) => module.id === moduleId),
            ),
          }),
        ),
      };
      return editingEnvironment
        ? updateEnvironment(editingEnvironment.id, input)
        : createEnvironment(input);
    },
    onSuccess: async (saved) => {
      setEditorOpen(false);
      setEditingEnvironment(undefined);
      setCopyingEnvironment(undefined);
      environmentForm.resetFields();
      setOperationError(undefined);
      await invalidateInventory();
      setSelectedEnvironmentId(saved.id);
    },
    onError: (error) => {
      const environmentError = error as Error & { code?: string };
      if (environmentError.code === "PRODUCT_MODULE_REQUIRED") {
        environmentForm.setFields([
          {
            name: "productVersionModuleIds",
            errors: [text.moduleRequired],
          },
        ]);
        setOperationError(undefined);
        return;
      }
      setOperationError(environmentError);
    },
  });

  const archiveEnvironmentMutation = useMutation({
    mutationFn: ({
      environment,
      archived,
    }: {
      environment: EnvironmentRecord;
      archived: boolean;
    }) =>
      setEnvironmentArchived(
        environment.id,
        organization!.id,
        archived,
      ),
    onSuccess: async () => {
      setSelectedEnvironmentId(undefined);
      setOperationError(undefined);
      await invalidateInventory();
    },
    onError: (error) => setOperationError(error as Error),
  });

  const saveEndpointMutation = useMutation({
    mutationFn: async (values: EndpointFormValues) => {
      const input: EnvironmentEndpointInput = {
        organizationId: organization!.id,
        environmentId: selectedEnvironment!.id,
        name: values.name,
        role: values.role,
        hostname: values.hostname ?? "",
        ipAddress: values.ipAddress ?? "",
        port: values.port ?? null,
        protocol: values.protocol ?? "",
        databaseType: values.databaseType ?? "",
        databaseVersion: values.databaseVersion ?? "",
        databaseName: values.databaseName ?? "",
        notes: values.notes ?? "",
        status: editingEndpoint?.status ?? "ACTIVE",
        sortOrder:
          editingEndpoint?.sortOrder ??
          selectedEnvironment!.endpoints.length,
      };
      return editingEndpoint
        ? updateEnvironmentEndpoint(editingEndpoint.id, input)
        : createEnvironmentEndpoint(input);
    },
    onSuccess: async () => {
      setEndpointModalOpen(false);
      setEditingEndpoint(undefined);
      endpointForm.resetFields();
      setOperationError(undefined);
      await invalidateInventory();
    },
    onError: (error) => setOperationError(error as Error),
  });

  const revealCredentialMutation = useMutation({
    mutationFn: (endpoint: EnvironmentEndpoint) =>
      fetchEnvironmentEndpointCredential(endpoint.id, organization!.id),
    onSuccess: (credential) => {
      credentialForm.setFieldsValue({
        username: credential.username,
        password: credential.password,
      });
    },
    onError: (error) => setOperationError(error as Error),
  });

  const saveCredentialMutation = useMutation({
    mutationFn: (values: CredentialFormValues) =>
      saveEnvironmentEndpointCredential(
        credentialEndpoint!.id,
        organization!.id,
        {
          username: values.username ?? "",
          password: values.password ?? "",
        },
      ),
    onSuccess: async () => {
      setCredentialModalOpen(false);
      setCredentialEndpoint(undefined);
      credentialForm.resetFields();
      setOperationError(undefined);
      await invalidateInventory();
    },
    onError: (error) => setOperationError(error as Error),
  });

  function openEnvironmentEditor(
    environment?: EnvironmentRecord,
    duplicate = false,
  ) {
    setEditingEnvironment(duplicate ? undefined : environment);
    setCopyingEnvironment(duplicate ? environment : undefined);
    const firstGroup = inventoryQuery.data?.groups[0]?.id;
    environmentForm.setFieldsValue({
      groupId:
        environment?.groupId ??
        (selectedGroupId !== "all" ? selectedGroupId : firstGroup),
      name: environment
        ? duplicate
          ? `${environment.name} コピー`
          : environment.name
        : "",
      scope: environment?.scope ?? "CUSTOMER",
      purpose: environment?.purpose ?? "PRODUCTION",
      status: duplicate ? "PREPARING" : environment?.status ?? "ACTIVE",
      url: environment?.url ?? "",
      ownerName: environment?.ownerName ?? "",
      notes: environment?.notes ?? "",
      lastVerifiedAt: environment?.lastVerifiedAt ?? undefined,
      productVersionIds:
        environment?.products.map((product) => product.productVersionId) ?? [],
      productVersionModuleIds:
        environment?.products.flatMap((product) =>
          product.modules.map((module) => module.id),
        ) ?? [],
    });
    setOperationError(undefined);
    setEditorOpen(true);
  }

  function openGroupEditor(group?: EnvironmentGroup) {
    setEditingGroup(group);
    groupForm.setFieldsValue({ name: group?.name ?? "" });
    setOperationError(undefined);
    setGroupModalOpen(true);
  }

  function openEndpointEditor(endpoint?: EnvironmentEndpoint) {
    setEditingEndpoint(endpoint);
    endpointForm.setFieldsValue({
      name: endpoint?.name ?? "",
      role: endpoint?.role ?? "AP",
      hostname: endpoint?.hostname ?? "",
      ipAddress: endpoint?.ipAddress ?? "",
      port: endpoint?.port ?? undefined,
      protocol: endpoint?.protocol ?? "",
      databaseType: endpoint?.databaseType ?? "",
      databaseVersion: endpoint?.databaseVersion ?? "",
      databaseName: endpoint?.databaseName ?? "",
      notes: endpoint?.notes ?? "",
    });
    setOperationError(undefined);
    setEndpointModalOpen(true);
  }

  function openCredentialEditor(endpoint: EnvironmentEndpoint) {
    setCredentialEndpoint(endpoint);
    credentialForm.resetFields();
    setOperationError(undefined);
    setCredentialModalOpen(true);
    if (endpoint.credentialConfigured && credentialReadable) {
      revealCredentialMutation.mutate(endpoint);
    }
  }

  if (!organization) {
    return (
      <Card className="environment-empty-organization">
        <Empty description={text.noOrganization} />
      </Card>
    );
  }

  const groups = Array.isArray(inventoryQuery.data?.groups)
    ? inventoryQuery.data.groups
    : [];
  const summary = inventoryQuery.data?.summary ?? {
    total: 0,
    production: 0,
    verification: 0,
    internal: 0,
    retired: 0,
  };
  const products = productQuery.data ?? [];
  const productVersionOptions = products.flatMap((product) =>
    product.versions.map((version) => ({
      value: version.id,
      label: `${product.name} ${version.displayVersion || version.version}`,
    })),
  );
  const selectedVersions = products
    .flatMap((product) =>
      product.versions.map((version) => ({ product, version })),
    )
    .filter(({ version }) =>
      selectedProductVersionIds.includes(version.id),
    );
  const productVersionModuleOptions = selectedVersions.flatMap(
    ({ product, version }) =>
      version.modules.map((module) => ({
        value: module.id,
        label: `${product.name} ${
          version.displayVersion || version.version
        } / ${module.name}`,
      })),
  );

  return (
    <div className="environment-page">
      <section className="environment-workspace-hero">
        <div className="environment-hero-copy">
          <span className="eyebrow">{text.eyebrow}</span>
          <Title level={1}>{title}</Title>
          <p>{text.description}</p>
          <div className="environment-customer-pill">
            <GlobalOutlined />
            <span>{organization.name}</span>
            <Text>{organization.code}</Text>
          </div>
        </div>
        <div className="environment-hero-actions">
          <Button
            icon={<FileSearchOutlined />}
            title={text.documentAnalysisHint}
            disabled
          >
            {text.documentAnalysis}
          </Button>
          {environmentWritable && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              disabled={!groups.length}
              onClick={() => openEnvironmentEditor()}
            >
              {text.addEnvironment}
            </Button>
          )}
        </div>
      </section>

      {inventoryQuery.isError && (
        <Alert
          type="error"
          showIcon
          message={text.loadFailed}
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => void inventoryQuery.refetch()}
            >
              {text.reload}
            </Button>
          }
        />
      )}

      <section className="environment-metrics">
        {[
          ["total", text.total, summary.total],
          [
            "production",
            text.production,
            summary.production,
          ],
          [
            "verification",
            text.verification,
            summary.verification,
          ],
          [
            "internal",
            text.internal,
            summary.internal,
          ],
          [
            "retired",
            text.retired,
            summary.retired,
          ],
        ].map(([key, label, value]) => (
          <button
            key={String(key)}
            type="button"
            className={`environment-metric ${
              viewFilter === key || (key === "total" && viewFilter === "all")
                ? "active"
                : ""
            }`}
            onClick={() =>
              setViewFilter(key === "total" ? "all" : (key as ViewFilter))
            }
          >
            <Statistic title={label} value={value} />
          </button>
        ))}
      </section>

      {operationError && (
        <Alert
          type="error"
          showIcon
          closable
          message={
            operationError.code === "ENVIRONMENT_REVISION_CONFLICT"
              ? text.revisionConflict
              : operationError.code === "ENVIRONMENT_GROUP_NOT_EMPTY"
                ? text.groupNotEmpty
                : operationError.message || text.saveFailed
          }
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                setOperationError(undefined);
                void invalidateInventory();
              }}
            >
              {text.reload}
            </Button>
          }
          onClose={() => setOperationError(undefined)}
        />
      )}

      <div className="environment-workspace">
        <Card className="environment-group-panel">
          <div className="environment-panel-heading">
            <div>
              <Text>{text.groups}</Text>
              <strong>{groups.length}</strong>
            </div>
            {environmentWritable && (
              <Button
                type="text"
                shape="circle"
                icon={<FolderAddOutlined />}
                aria-label={text.addGroup}
                onClick={() => openGroupEditor()}
              />
            )}
          </div>
          <button
            type="button"
            className={`environment-group-item ${
              selectedGroupId === "all" ? "active" : ""
            }`}
            onClick={() => setSelectedGroupId("all")}
          >
            <span>{text.allGroups}</span>
            <strong>
              {inventoryEnvironments.filter(
                (environment) => !environment.archivedAt,
              ).length}
            </strong>
          </button>
          <div className="environment-group-list">
            {groups.map((group, index) => {
              const count = inventoryEnvironments.filter(
                (environment) =>
                  environment.groupId === group.id &&
                  !environment.archivedAt,
              ).length;
              return (
                <div
                  key={group.id}
                  className={`environment-group-row ${
                    selectedGroupId === group.id ? "active" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="environment-group-main"
                    onClick={() => setSelectedGroupId(group.id)}
                  >
                    <span>{group.name}</span>
                    <strong>{count}</strong>
                  </button>
                  {environmentWritable && <div className="environment-group-actions">
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowUpOutlined />}
                      disabled={index === 0}
                      aria-label={`${group.name} up`}
                      onClick={() =>
                        reorderGroupMutation.mutate({
                          group,
                          direction: -1,
                        })
                      }
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      disabled={index === groups.length - 1}
                      aria-label={`${group.name} down`}
                      onClick={() =>
                        reorderGroupMutation.mutate({
                          group,
                          direction: 1,
                        })
                      }
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      aria-label={`${group.name} ${text.edit}`}
                      onClick={() => openGroupEditor(group)}
                    />
                    <Popconfirm
                      title={text.archiveGroupConfirm}
                      okText={text.archive}
                      cancelText={text.cancel}
                      onConfirm={() => archiveGroupMutation.mutate(group)}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        disabled={count > 0}
                        icon={<DeleteOutlined />}
                        aria-label={`${group.name} ${text.archive}`}
                      />
                    </Popconfirm>
                  </div>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="environment-list-panel">
          <div className="environment-list-toolbar">
            <Input.Search
              allowClear
              placeholder={text.searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Text>
              {visibleEnvironments.length} {text.environmentCount}
            </Text>
          </div>
          {inventoryQuery.isLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : visibleEnvironments.length ? (
            <div className="environment-record-list">
              {visibleEnvironments.map((environment) => (
                <button
                  type="button"
                  key={environment.id}
                  className={`environment-record ${
                    selectedEnvironmentId === environment.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedEnvironmentId(environment.id)}
                >
                  <div className="environment-record-icon">
                    <CloudServerOutlined />
                  </div>
                  <div className="environment-record-copy">
                    <div className="environment-record-title">
                      <strong>{environment.name}</strong>
                      {environment.archivedAt && (
                        <Tag>{text.archivedLabel}</Tag>
                      )}
                    </div>
                    <div className="environment-record-tags">
                      <Tag color={purposeColor(environment.purpose)}>
                        {purposeLabel(environment.purpose, text)}
                      </Tag>
                      <Tag color={statusColor(environment.status)}>
                        {statusLabel(environment.status, text)}
                      </Tag>
                      <Tag>
                        {environment.scope === "CUSTOMER"
                          ? text.customerScope
                          : text.internalScope}
                      </Tag>
                    </div>
                    <div className="environment-record-products">
                      {environment.products.length
                        ? environment.products
                            .slice(0, 3)
                            .map(
                              (product) =>
                                `${product.productName} ${
                                  product.displayVersion || product.version
                                }`,
                            )
                            .join(" · ")
                        : text.notRegistered}
                    </div>
                  </div>
                  <div className="environment-record-meta">
                    <Text>{environment.groupName}</Text>
                    <strong>{environment.ownerName || "　"}</strong>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <strong>{text.noEnvironment}</strong>
                  <p>{text.noEnvironmentBody}</p>
                </div>
              }
            />
          )}
        </Card>

        <Card className="environment-detail-panel">
          {selectedEnvironment ? (
            <>
              <div className="environment-detail-heading">
                <div>
                  <span className="eyebrow">{selectedEnvironment.groupName}</span>
                  <Title level={3}>{selectedEnvironment.name}</Title>
                  <Space size={6} wrap>
                    <Tag color={purposeColor(selectedEnvironment.purpose)}>
                      {purposeLabel(selectedEnvironment.purpose, text)}
                    </Tag>
                    <Tag color={statusColor(selectedEnvironment.status)}>
                      {statusLabel(selectedEnvironment.status, text)}
                    </Tag>
                  </Space>
                </div>
                <div className="environment-detail-actions">
                  {environmentWritable && !selectedEnvironment.archivedAt && (
                    <>
                      <Button
                        type="text"
                        shape="circle"
                        icon={<EditOutlined />}
                        aria-label={text.edit}
                        onClick={() =>
                          openEnvironmentEditor(selectedEnvironment)
                        }
                      />
                      <Button
                        type="text"
                        shape="circle"
                        icon={<CopyOutlined />}
                        aria-label={text.duplicate}
                        onClick={() =>
                          openEnvironmentEditor(selectedEnvironment, true)
                        }
                      />
                    </>
                  )}
                  {environmentWritable && <Popconfirm
                    title={
                      selectedEnvironment.archivedAt
                        ? text.restore
                        : text.archiveConfirm
                    }
                    okText={
                      selectedEnvironment.archivedAt
                        ? text.restore
                        : text.archive
                    }
                    cancelText={text.cancel}
                    onConfirm={() =>
                      archiveEnvironmentMutation.mutate({
                        environment: selectedEnvironment,
                        archived: !selectedEnvironment.archivedAt,
                      })
                    }
                  >
                    <Button
                      type="text"
                      shape="circle"
                      danger={!selectedEnvironment.archivedAt}
                      icon={
                        selectedEnvironment.archivedAt ? (
                          <ReloadOutlined />
                        ) : (
                          <DeleteOutlined />
                        )
                      }
                      aria-label={
                        selectedEnvironment.archivedAt
                          ? text.restore
                          : text.archive
                      }
                    />
                  </Popconfirm>}
                </div>
              </div>
              <Tabs
                className="environment-detail-tabs"
                items={[
                  {
                    key: "basic",
                    label: text.basics,
                    children: (
                      <Descriptions
                        column={1}
                        size="small"
                        colon={false}
                        items={[
                          {
                            key: "scope",
                            label: text.scope,
                            children:
                              selectedEnvironment.scope === "CUSTOMER"
                                ? text.customerScope
                                : text.internalScope,
                          },
                          {
                            key: "purpose",
                            label: text.purpose,
                            children: purposeLabel(
                              selectedEnvironment.purpose,
                              text,
                            ),
                          },
                          {
                            key: "status",
                            label: text.status,
                            children: statusLabel(
                              selectedEnvironment.status,
                              text,
                            ),
                          },
                          {
                            key: "url",
                            label: text.url,
                            children: selectedEnvironment.url ? (
                              <a
                                href={selectedEnvironment.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {selectedEnvironment.url}
                              </a>
                            ) : (
                              text.notRegistered
                            ),
                          },
                          {
                            key: "owner",
                            label: text.owner,
                            children:
                              selectedEnvironment.ownerName ||
                              text.notRegistered,
                          },
                          {
                            key: "verified",
                            label: text.lastVerifiedAt,
                            children:
                              selectedEnvironment.lastVerifiedAt ||
                              text.notRegistered,
                          },
                          {
                            key: "notes",
                            label: text.notes,
                            children:
                              selectedEnvironment.notes || text.notRegistered,
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: "products",
                    label: `${text.products} (${selectedEnvironment.products.length})`,
                    children: selectedEnvironment.products.length ? (
                      <List
                        dataSource={selectedEnvironment.products}
                        renderItem={(product) => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <span className="environment-product-icon">
                                  <ProductOutlined />
                                </span>
                              }
                              title={product.productName}
                              description={
                                <div className="environment-product-description">
                                  <Space size={6} wrap>
                                    <span>
                                      {product.displayVersion ||
                                        product.version}
                                    </span>
                                    {product.confirmationStatus ===
                                      "PENDING" && (
                                      <Tag color="gold">
                                        {text.confirmationPending}
                                      </Tag>
                                    )}
                                  </Space>
                                  {product.modules.length > 0 && (
                                    <Space size={[4, 4]} wrap>
                                      {product.modules.map((module) => (
                                        <Tag key={module.id}>
                                          {module.name}
                                        </Tag>
                                      ))}
                                    </Space>
                                  )}
                                  {product.notes && (
                                    <Text type="secondary">
                                      {product.notes}
                                    </Text>
                                  )}
                                </div>
                              }
                            />
                            <Tag color="cyan">{product.usageStatus}</Tag>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={text.notRegistered}
                      />
                    ),
                  },
                  {
                    key: "connections",
                    label: `${text.connections} (${selectedEnvironment.endpoints.length})`,
                    children: (
                      <div className="environment-connections">
                        {environmentWritable && (
                          <div className="environment-connections-toolbar">
                            <Button
                              icon={<PlusOutlined />}
                              onClick={() => openEndpointEditor()}
                            >
                              {text.addConnection}
                            </Button>
                          </div>
                        )}
                        {selectedEnvironment.endpoints.length ? (
                          <List
                            dataSource={selectedEnvironment.endpoints}
                            renderItem={(endpoint) => (
                              <List.Item
                                actions={[
                                  ...(credentialReadable || credentialWritable
                                    ? [
                                        <Button
                                          key="credential"
                                          type="text"
                                          icon={<KeyOutlined />}
                                          onClick={() =>
                                            openCredentialEditor(endpoint)
                                          }
                                        >
                                          {text.credential}
                                        </Button>,
                                      ]
                                    : []),
                                  ...(environmentWritable
                                    ? [
                                        <Button
                                          key="edit"
                                          type="text"
                                          icon={<EditOutlined />}
                                          onClick={() =>
                                            openEndpointEditor(endpoint)
                                          }
                                        >
                                          {text.edit}
                                        </Button>,
                                      ]
                                    : []),
                                ]}
                              >
                                <List.Item.Meta
                                  avatar={
                                    <span className="environment-product-icon">
                                      <CloudServerOutlined />
                                    </span>
                                  }
                                  title={
                                    <Space size={6} wrap>
                                      <span>{endpoint.name}</span>
                                      <Tag>
                                        {endpointRoleLabel(endpoint.role, text)}
                                      </Tag>
                                      {endpoint.protocol && (
                                        <Tag color="blue">
                                          {endpoint.protocol}
                                        </Tag>
                                      )}
                                      <Tag
                                        color={
                                          endpoint.credentialConfigured
                                            ? "green"
                                            : "default"
                                        }
                                      >
                                        {endpoint.credentialConfigured
                                          ? text.credentialConfigured
                                          : text.credentialMissing}
                                      </Tag>
                                    </Space>
                                  }
                                  description={
                                    <div className="environment-product-description">
                                      <Space size={6}>
                                        <span>{endpointAddress(endpoint)}</span>
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<CopyOutlined />}
                                          aria-label={text.copyValue}
                                          onClick={() =>
                                            navigator.clipboard.writeText(
                                              endpointAddress(endpoint),
                                            )
                                          }
                                        />
                                      </Space>
                                      {endpoint.databaseType && (
                                        <span>
                                          {endpoint.databaseType}
                                          {endpoint.databaseVersion
                                            ? ` · ${text.databaseVersion} ${endpoint.databaseVersion}`
                                            : ""}
                                          {endpoint.databaseName
                                            ? ` · ${endpoint.databaseName}`
                                            : ""}
                                        </span>
                                      )}
                                    </div>
                                  }
                                />
                              </List.Item>
                            )}
                          />
                        ) : (
                          <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={text.noConnections}
                          />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "vpn",
                    label: text.vpn,
                    children: (
                      <FuturePanel
                        icon={<SafetyCertificateOutlined />}
                        text={text}
                      />
                    ),
                  },
                  {
                    key: "evidence",
                    label: text.evidence,
                    children: (
                      <FuturePanel icon={<FileSearchOutlined />} text={text} />
                    ),
                  },
                  {
                    key: "history",
                    label: text.history,
                    children: (
                      <FuturePanel icon={<LockOutlined />} text={text} />
                    ),
                  },
                ]}
              />
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={text.detailEmpty}
            />
          )}
        </Card>
      </div>

      <Drawer
        size={560}
        open={editorOpen}
        destroyOnHidden
        title={
          editingEnvironment
            ? text.editTitle
            : copyingEnvironment
              ? text.copyTitle
              : text.createTitle
        }
        onClose={() => {
          setEditorOpen(false);
          setEditingEnvironment(undefined);
          setCopyingEnvironment(undefined);
          setOperationError(undefined);
        }}
        extra={
          <Space>
            <Button onClick={() => setEditorOpen(false)}>{text.cancel}</Button>
            <Button
              type="primary"
              loading={saveEnvironmentMutation.isPending}
              onClick={() => environmentForm.submit()}
            >
              {text.save}
            </Button>
          </Space>
        }
      >
        {operationError && (
          <Alert
            type="error"
            showIcon
            message={
              operationError.code === "ENVIRONMENT_REVISION_CONFLICT"
                ? text.revisionConflict
                : operationError.message || text.saveFailed
            }
          />
        )}
        <Form
          form={environmentForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => saveEnvironmentMutation.mutate(values)}
        >
          <div className="environment-form-grid">
            <Form.Item
              name="groupId"
              label={text.group}
              rules={[{ required: true }]}
            >
              <Select
                options={groups.map((group) => ({
                  value: group.id,
                  label: group.name,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label={text.name}
              rules={[{ required: true, whitespace: true }]}
            >
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item
              name="scope"
              label={text.scope}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "CUSTOMER", label: text.customerScope },
                  { value: "INTERNAL", label: text.internalScope },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="purpose"
              label={text.purpose}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  {
                    value: "PRODUCTION",
                    label: text.purposeProduction,
                  },
                  {
                    value: "VERIFICATION",
                    label: text.purposeVerification,
                  },
                  {
                    value: "DEVELOPMENT",
                    label: text.purposeDevelopment,
                  },
                  { value: "TRAINING", label: text.purposeTraining },
                  { value: "OTHER", label: text.purposeOther },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="status"
              label={text.status}
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { value: "ACTIVE", label: text.statusActive },
                  { value: "PREPARING", label: text.statusPreparing },
                  { value: "SUSPENDED", label: text.statusSuspended },
                  { value: "RETIRED", label: text.statusRetired },
                ]}
              />
            </Form.Item>
            <Form.Item name="lastVerifiedAt" label={text.lastVerifiedAt}>
              <Input type="date" />
            </Form.Item>
          </div>
          <Form.Item name="url" label={text.url}>
            <Input type="url" maxLength={2000} />
          </Form.Item>
          <Form.Item name="ownerName" label={text.owner}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="productVersionIds" label={text.selectedProducts}>
            <Select
              mode="multiple"
              allowClear
              showSearch
              optionFilterProp="label"
              options={productVersionOptions}
              onChange={(versionIds: string[]) => {
                const availableModuleIds = new Set(
                  products
                    .flatMap((product) => product.versions)
                    .filter((version) => versionIds.includes(version.id))
                    .flatMap((version) =>
                      version.modules.map((module) => module.id),
                    ),
                );
                environmentForm.setFieldValue(
                  "productVersionModuleIds",
                  (
                    environmentForm.getFieldValue(
                      "productVersionModuleIds",
                    ) ?? []
                  ).filter((moduleId: string) =>
                    availableModuleIds.has(moduleId),
                  ),
                );
              }}
              placeholder={
                products.length ? text.selectedProducts : text.noProducts
              }
            />
          </Form.Item>
          <Form.Item
            name="productVersionModuleIds"
            label={text.selectedModules}
            dependencies={["productVersionIds"]}
            rules={[
              {
                validator: (_, moduleIds: string[] = []) =>
                  findModuleScopedVersionsWithoutSelection(
                    products,
                    selectedProductVersionIds,
                    moduleIds,
                  ).length
                    ? Promise.reject(new Error(text.moduleRequired))
                    : Promise.resolve(),
              },
            ]}
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              disabled={!selectedProductVersionIds.length}
              optionFilterProp="label"
              options={productVersionModuleOptions}
              placeholder={
                productVersionModuleOptions.length
                  ? text.selectedModules
                  : text.noModules
              }
            />
          </Form.Item>
          <Form.Item name="notes" label={text.notes}>
            <Input.TextArea rows={5} maxLength={4000} showCount />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        open={groupModalOpen}
        title={
          editingGroup ? text.groupEditTitle : text.groupCreateTitle
        }
        okText={text.save}
        cancelText={text.cancel}
        confirmLoading={saveGroupMutation.isPending}
        onOk={() => groupForm.submit()}
        onCancel={() => {
          setGroupModalOpen(false);
          setEditingGroup(undefined);
          setOperationError(undefined);
        }}
      >
        <Form
          form={groupForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => saveGroupMutation.mutate(values)}
        >
          <Form.Item
            name="name"
            label={text.groupName}
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={120} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={endpointModalOpen}
        title={
          editingEndpoint ? text.editConnection : text.addConnection
        }
        okText={text.save}
        cancelText={text.cancel}
        confirmLoading={saveEndpointMutation.isPending}
        onOk={() => endpointForm.submit()}
        onCancel={() => {
          setEndpointModalOpen(false);
          setEditingEndpoint(undefined);
          setOperationError(undefined);
        }}
      >
        {operationError && (
          <Alert
            type="error"
            showIcon
            message={operationError.message || text.saveFailed}
          />
        )}
        <Form
          form={endpointForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => saveEndpointMutation.mutate(values)}
        >
          <Form.Item
            name="name"
            label={text.connectionName}
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item
            name="role"
            label={text.scope}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "AP", label: text.endpointRoleAp },
                { value: "DB", label: text.endpointRoleDb },
                { value: "BASTION", label: text.endpointRoleBastion },
                {
                  value: "LOAD_BALANCER",
                  label: text.endpointRoleLoadBalancer,
                },
                {
                  value: "FILE_SERVER",
                  label: text.endpointRoleFileServer,
                },
                { value: "OTHER", label: text.endpointRoleOther },
              ]}
            />
          </Form.Item>
          <div className="environment-form-grid">
            <Form.Item name="hostname" label={text.hostname}>
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item name="ipAddress" label={text.ipAddress}>
              <Input maxLength={64} />
            </Form.Item>
            <Form.Item name="port" label={text.port}>
              <Input type="number" min={1} max={65535} />
            </Form.Item>
            <Form.Item name="protocol" label={text.protocol}>
              <Input maxLength={30} />
            </Form.Item>
          </div>
          <div className="environment-form-grid">
            <Form.Item name="databaseType" label={text.endpointRoleDb}>
              <Input maxLength={60} />
            </Form.Item>
            <Form.Item name="databaseVersion" label={text.databaseVersion}>
              <Input maxLength={60} />
            </Form.Item>
          </div>
          <Form.Item name="databaseName" label={text.name}>
            <Input maxLength={255} />
          </Form.Item>
          <Form.Item name="notes" label={text.notes}>
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={credentialModalOpen}
        title={`${credentialEndpoint?.name ?? ""} · ${text.credential}`}
        okText={text.save}
        cancelText={text.cancel}
        footer={credentialWritable ? undefined : null}
        confirmLoading={saveCredentialMutation.isPending}
        onOk={() => credentialForm.submit()}
        onCancel={() => {
          setCredentialModalOpen(false);
          setCredentialEndpoint(undefined);
          credentialForm.resetFields();
          setOperationError(undefined);
        }}
      >
        <Alert
          type="info"
          showIcon
          icon={<EyeOutlined />}
          message={text.credentialHelp}
        />
        {operationError && (
          <Alert
            type="error"
            showIcon
            message={operationError.message || text.saveFailed}
          />
        )}
        <Skeleton
          active
          loading={revealCredentialMutation.isPending}
          paragraph={{ rows: 2 }}
        >
          <Form
            form={credentialForm}
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => {
              if (credentialWritable) {
                saveCredentialMutation.mutate(values);
              }
            }}
          >
            <Form.Item name="username" label={text.username}>
              <Input
                maxLength={512}
                disabled={!credentialWritable}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    aria-label={text.copyValue}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        credentialForm.getFieldValue("username") ?? "",
                      )
                    }
                  />
                }
              />
            </Form.Item>
            <Form.Item name="password" label={text.password}>
              <Input.Password
                maxLength={4096}
                disabled={!credentialWritable}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    aria-label={text.copyValue}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        credentialForm.getFieldValue("password") ?? "",
                      )
                    }
                  />
                }
              />
            </Form.Item>
          </Form>
        </Skeleton>
      </Modal>

    </div>
  );
}

function purposeLabel(
  purpose: EnvironmentPurpose,
  text: (typeof copy)[LocaleKey],
) {
  const labels = {
    PRODUCTION: text.purposeProduction,
    VERIFICATION: text.purposeVerification,
    DEVELOPMENT: text.purposeDevelopment,
    TRAINING: text.purposeTraining,
    OTHER: text.purposeOther,
  };
  return labels[purpose];
}

function statusLabel(
  status: EnvironmentStatus,
  text: (typeof copy)[LocaleKey],
) {
  const labels = {
    ACTIVE: text.statusActive,
    PREPARING: text.statusPreparing,
    SUSPENDED: text.statusSuspended,
    RETIRED: text.statusRetired,
  };
  return labels[status];
}

function FuturePanel({
  icon,
  text,
}: {
  icon: ReactNode;
  text: (typeof copy)[LocaleKey];
}) {
  return (
    <div className="environment-future-panel">
      <span>{icon}</span>
      <strong>{text.nextPhase}</strong>
      <p>{text.nextPhaseBody}</p>
    </div>
  );
}
