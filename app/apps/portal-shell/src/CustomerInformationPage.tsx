import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AppstoreOutlined,
  CloudServerOutlined,
  DeleteOutlined,
  EditOutlined,
  FileProtectOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import {
  archiveCustomerContract,
  archiveCustomerVpn,
  createCustomerContract,
  createCustomerVpn,
  fetchCustomerBacklogIssuePage,
  fetchCustomerInformation,
  fetchCustomerInquiryPage,
  fetchProducts,
  updateCustomerContract,
  updateCustomerVpn,
  type CustomerActiveService,
  type CustomerBacklogIssue,
  type CustomerBacklogIssueSortField,
  type CustomerContract,
  type CustomerContractInput,
  type CustomerContractStatus,
  type CustomerVpnConnection,
  type CustomerVpnInput,
  type CustomerInquirySortField,
  type InquirySearchTicket,
  type Organization,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import { EnvironmentPage } from "./EnvironmentPage";
import {
  customerContractLabel,
  safeExternalHttpUrl,
} from "./customer-information-utils";
import { clampColumnWidth } from "./utils";

const { Paragraph, Text, Title } = Typography;

type CustomerInformationSortOrder = "ascend" | "descend";

type InquiryColumnKey = CustomerInquirySortField;
type IssueColumnKey = CustomerBacklogIssueSortField;

type ResizableHeaderCellProps = HTMLAttributes<HTMLTableCellElement> & {
  minWidth?: number;
  onResize?: (width: number) => void;
  resizable?: boolean;
  resizeLabel?: string;
};

const inquiryColumnStorageKey =
  "oneops.customer-information.inquiry-column-widths";
const issueColumnStorageKey =
  "oneops.customer-information.backlog-column-widths";

const inquiryDefaultColumnWidths: Record<InquiryColumnKey, number> = {
  ticketNo: 128,
  title: 320,
  status: 144,
  assignee: 168,
  customer: 220,
  updatedAt: 184,
};

const inquiryMinimumColumnWidths: Record<InquiryColumnKey, number> = {
  ticketNo: 96,
  title: 160,
  status: 96,
  assignee: 120,
  customer: 140,
  updatedAt: 148,
};

const issueDefaultColumnWidths: Record<IssueColumnKey, number> = {
  issueKey: 156,
  summary: 360,
  projectId: 220,
  status: 124,
  assignee: 160,
  priority: 104,
  dueDate: 136,
  updatedAt: 184,
};

const issueMinimumColumnWidths: Record<IssueColumnKey, number> = {
  issueKey: 120,
  summary: 180,
  projectId: 144,
  status: 96,
  assignee: 112,
  priority: 88,
  dueDate: 116,
  updatedAt: 148,
};

function readCustomerColumnWidths<Key extends string>(
  storageKey: string,
  defaults: Record<Key, number>,
): Partial<Record<Key, number>> {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "{}",
    ) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([key, value]) =>
          key in defaults &&
          typeof value === "number" &&
          Number.isFinite(value),
      ),
    ) as Partial<Record<Key, number>>;
  } catch {
    return {};
  }
}

function CustomerResizableHeaderCell({
  minWidth = 80,
  onResize,
  resizable,
  resizeLabel,
  ...headerProps
}: ResizableHeaderCellProps) {
  const resizeState = useRef<{
    startWidth: number;
    startX: number;
    handle: HTMLSpanElement;
    pointerId?: number;
  } | null>(null);
  const currentWidth = (target: HTMLSpanElement) =>
    target.parentElement?.getBoundingClientRect().width ?? minWidth;
  const beginResize = (startX: number, handle: HTMLSpanElement) => {
    resizeState.current = {
      startWidth: currentWidth(handle),
      startX,
      handle,
    };
  };
  const startResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    beginResize(event.clientX, event.currentTarget);
    resizeState.current!.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const startMouseResize = (event: ReactMouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    beginResize(event.clientX, event.currentTarget);
  };
  const continueResize = (event: ReactPointerEvent<HTMLElement>) => {
    if (!resizeState.current) return;
    event.preventDefault();
    event.stopPropagation();
    onResize?.(
      resizeState.current.startWidth +
        event.clientX -
        resizeState.current.startX,
    );
  };
  const continueMouseResize = (event: ReactMouseEvent<HTMLElement>) => {
    if (!resizeState.current) return;
    event.preventDefault();
    event.stopPropagation();
    onResize?.(
      resizeState.current.startWidth +
        event.clientX -
        resizeState.current.startX,
    );
  };
  const finishResize = (event: ReactPointerEvent<HTMLElement>) => {
    if (!resizeState.current) return;
    event.preventDefault();
    event.stopPropagation();
    const handle = resizeState.current.handle;
    const pointerId = resizeState.current.pointerId;
    resizeState.current = null;
    if (pointerId !== undefined && handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }
  };
  const finishMouseResize = (event: ReactMouseEvent<HTMLElement>) => {
    if (!resizeState.current) return;
    event.preventDefault();
    event.stopPropagation();
    resizeState.current = null;
  };
  const resizeWithKeyboard = (
    event: ReactKeyboardEvent<HTMLSpanElement>,
  ) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    onResize?.(currentWidth(event.currentTarget) + (event.key === "ArrowLeft" ? -16 : 16));
  };

  return (
    <th
      {...headerProps}
      onPointerMove={continueResize}
      onPointerUp={finishResize}
      onPointerCancel={finishResize}
      onMouseMove={continueMouseResize}
      onMouseUp={finishMouseResize}
    >
      {headerProps.children}
      {resizable && (
        <span
          className="column-resize-handle"
          role="separator"
          aria-label={resizeLabel}
          aria-orientation="vertical"
          tabIndex={0}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={resizeWithKeyboard}
          onPointerDown={startResize}
          onMouseDown={startMouseResize}
        />
      )}
    </th>
  );
}

const copy = {
  "ja-JP": {
    eyebrow: "顧客運用ビュー",
    title: "顧客情報",
    description: "契約、サービス、ネットワーク、問合せ及びチケットを顧客単位で確認します。",
    noCustomer: "上部で組織機関を選択してください",
    loadFailed: "顧客情報を読み込めませんでした。",
    retry: "再読込",
    basic: "基本情報",
    contracts: "契約情報",
    services: "サービス情報",
    network: "ネットワーク環境",
    inquiries: "問合情報",
    tasks: "関連タスク及びチケット",
    classification: "区分",
    code: "機関 Code",
    name: "機関名",
    shortName: "略称",
    maintenance: "保守有無",
    remarks: "備考",
    save: "保存",
    add: "追加",
    edit: "編集",
    archive: "アーカイブ",
    archiveConfirm: "このレコードをアーカイブしますか。",
    cancel: "キャンセル",
    item: "製品又はサービス",
    itemType: "種別",
    product: "製品",
    service: "サービス",
    serviceName: "サービス名称",
    introduction: "導入契約",
    maintenanceContract: "保守契約",
    startDate: "開始日",
    endDate: "終了日",
    status: "状態",
    notes: "備考",
    none: "なし",
    planned: "予定",
    active: "有効",
    expired: "満了",
    terminated: "終了",
    noContracts: "契約情報が登録されていません",
    source: "根拠",
    environmentSource: "環境台帳",
    contractSource: "契約",
    versions: "版数",
    environments: "環境数",
    noServices: "有効な製品又はサービスがありません",
    vpn: "VPN 情報",
    servers: "サーバー詳細情報",
    vpnName: "VPN 名称",
    vpnType: "方式",
    provider: "提供元",
    endpoint: "接続先",
    noVpn: "VPN 情報が登録されていません",
    preparing: "準備中",
    suspended: "停止",
    retired: "廃止",
    inquiryPermission: "問合情報を参照する権限がありません。",
    inquiryNoData: "該当する問合せがありません",
    ticketNo: "問合番号",
    subject: "件名",
    assignee: "担当者",
    customer: "顧客",
    updatedAt: "更新日時",
    resizeColumn: "列幅を調整",
    sourceTruncated: "外部サイトの表示上限があります。表示済み範囲をページ分割しています。",
    open: "開く",
    backlogProjects: "Backlog 検索テンプレート",
    backlogProjectHelp: "システム管理で有効にした検索テンプレートを同時に実行します。",
    configure: "検索テンプレートを設定",
    project: "プロジェクト",
    issueKey: "チケット Key",
    priority: "優先度",
    dueDate: "期限",
    noIssues: "該当する Backlog チケットがありません",
    backlogMappingRequired: "システム管理で Backlog 検索テンプレートを設定してください。",
    externalUnavailable: "外部サービスから情報を取得できませんでした。",
    saveFailed: "保存できませんでした。最新情報を再読込してください。",
    required: "必須項目です",
    selectProduct: "製品を選択",
    selectProjects: "プロジェクトを選択",
  },
  "zh-CN": {
    eyebrow: "客户运维视图",
    title: "客户信息",
    description: "按客户统一查看合约、服务、网络、问合及关联工单。",
    noCustomer: "请先在上方选择机关",
    loadFailed: "无法读取客户信息。",
    retry: "重新加载",
    basic: "基本信息",
    contracts: "合约信息",
    services: "服务信息",
    network: "网络环境",
    inquiries: "问合信息",
    tasks: "关联任务及工单",
    classification: "区分",
    code: "机关 Code",
    name: "机关名",
    shortName: "简称",
    maintenance: "保守有无",
    remarks: "备注",
    save: "保存",
    add: "添加",
    edit: "编辑",
    archive: "归档",
    archiveConfirm: "确定归档这条记录吗？",
    cancel: "取消",
    item: "制品或服务",
    itemType: "类型",
    product: "制品",
    service: "服务",
    serviceName: "服务名称",
    introduction: "导入合约",
    maintenanceContract: "保守合约",
    startDate: "开始日期",
    endDate: "结束日期",
    status: "状态",
    notes: "备注",
    none: "无",
    planned: "计划中",
    active: "生效中",
    expired: "已到期",
    terminated: "已终止",
    noContracts: "尚未登记合约信息",
    source: "依据",
    environmentSource: "环境台账",
    contractSource: "合约",
    versions: "版本",
    environments: "环境数",
    noServices: "没有生效中的制品或服务",
    vpn: "VPN 信息",
    servers: "服务器详细信息",
    vpnName: "VPN 名称",
    vpnType: "方式",
    provider: "提供方",
    endpoint: "连接地址",
    noVpn: "尚未登记 VPN 信息",
    preparing: "准备中",
    suspended: "已停止",
    retired: "已废止",
    inquiryPermission: "没有查看问合信息的权限。",
    inquiryNoData: "没有符合条件的问合",
    ticketNo: "问合编号",
    subject: "标题",
    assignee: "担当者",
    customer: "客户",
    updatedAt: "更新时间",
    resizeColumn: "调整列宽",
    sourceTruncated: "外部网站存在显示上限，当前按已取得范围进行分页。",
    open: "打开",
    backlogProjects: "Backlog 检索模板",
    backlogProjectHelp: "同时执行系统管理中启用的检索模板。",
    configure: "设置检索模板",
    project: "项目",
    issueKey: "工单 Key",
    priority: "优先级",
    dueDate: "期限",
    noIssues: "没有符合条件的 Backlog 工单",
    backlogMappingRequired: "请在系统管理中设置 Backlog 检索模板。",
    externalUnavailable: "无法从外部服务取得信息。",
    saveFailed: "保存失败，请重新加载最新信息。",
    required: "此项必填",
    selectProduct: "选择制品",
    selectProjects: "选择项目",
  },
  "en-US": {
    eyebrow: "Customer operations view",
    title: "Customer information",
    description: "Review contracts, services, networks, inquiries, and work items by customer.",
    noCustomer: "Select an organization above",
    loadFailed: "Customer information could not be loaded.",
    retry: "Reload",
    basic: "Basic information",
    contracts: "Contracts",
    services: "Services",
    network: "Network environment",
    inquiries: "Inquiries",
    tasks: "Related tasks and work items",
    classification: "Classification",
    code: "Organization code",
    name: "Organization name",
    shortName: "Short name",
    maintenance: "Maintenance",
    remarks: "Notes",
    save: "Save",
    add: "Add",
    edit: "Edit",
    archive: "Archive",
    archiveConfirm: "Archive this record?",
    cancel: "Cancel",
    item: "Product or service",
    itemType: "Type",
    product: "Product",
    service: "Service",
    serviceName: "Service name",
    introduction: "Introduction contract",
    maintenanceContract: "Maintenance contract",
    startDate: "Start date",
    endDate: "End date",
    status: "Status",
    notes: "Notes",
    none: "None",
    planned: "Planned",
    active: "Active",
    expired: "Expired",
    terminated: "Terminated",
    noContracts: "No contract information is registered",
    source: "Source",
    environmentSource: "Environment inventory",
    contractSource: "Contract",
    versions: "Versions",
    environments: "Environments",
    noServices: "No active products or services",
    vpn: "VPN information",
    servers: "Server details",
    vpnName: "VPN name",
    vpnType: "Type",
    provider: "Provider",
    endpoint: "Endpoint",
    noVpn: "No VPN information is registered",
    preparing: "Preparing",
    suspended: "Suspended",
    retired: "Retired",
    inquiryPermission: "You do not have permission to view inquiries.",
    inquiryNoData: "No matching inquiries",
    ticketNo: "Inquiry number",
    subject: "Subject",
    assignee: "Assignee",
    customer: "Customer",
    updatedAt: "Updated",
    resizeColumn: "Resize column",
    sourceTruncated: "The external site limits results. Paging covers the retrieved range.",
    open: "Open",
    backlogProjects: "Backlog search templates",
    backlogProjectHelp: "Enabled templates from system management run together.",
    configure: "Configure templates",
    project: "Project",
    issueKey: "Issue key",
    priority: "Priority",
    dueDate: "Due date",
    noIssues: "No matching Backlog issues",
    backlogMappingRequired: "Configure Backlog search templates in system management.",
    externalUnavailable: "Information could not be loaded from the external service.",
    saveFailed: "Save failed. Reload the latest information.",
    required: "This field is required",
    selectProduct: "Select a product",
    selectProjects: "Select projects",
  },
} as const;

type ContractFormValues = CustomerContractInput;
type VpnFormValues = CustomerVpnInput;

function statusOptions(text: (typeof copy)[LocaleKey]) {
  return [
    { value: "NONE", label: text.none },
    { value: "PLANNED", label: text.planned },
    { value: "ACTIVE", label: text.active },
    { value: "EXPIRED", label: text.expired },
    { value: "TERMINATED", label: text.terminated },
  ];
}

function contractStatusLabel(
  status: CustomerContractStatus,
  text: (typeof copy)[LocaleKey],
) {
  return {
    NONE: text.none,
    PLANNED: text.planned,
    ACTIVE: text.active,
    EXPIRED: text.expired,
    TERMINATED: text.terminated,
  }[status];
}

function contractStatusColor(status: CustomerContractStatus) {
  return status === "ACTIVE"
    ? "green"
    : status === "PLANNED"
      ? "blue"
      : status === "TERMINATED"
        ? "red"
        : "default";
}

function environmentStatusLabel(
  status: CustomerVpnConnection["status"],
  text: (typeof copy)[LocaleKey],
) {
  return {
    ACTIVE: text.active,
    PREPARING: text.preparing,
    SUSPENDED: text.suspended,
    RETIRED: text.retired,
  }[status];
}

function phase(
  status: CustomerContractStatus,
  start: string | null,
  end: string | null,
  text: (typeof copy)[LocaleKey],
) {
  return (
    <Space direction="vertical" size={2}>
      <Tag color={contractStatusColor(status)}>{contractStatusLabel(status, text)}</Tag>
      {(start || end) && <Text type="secondary">{start || ""} {start || end ? "～" : ""} {end || ""}</Text>}
    </Space>
  );
}

export function CustomerInformationPage({
  locale,
  organization,
  permissions,
  onOpenInquiry,
}: {
  locale: LocaleKey;
  organization?: Organization;
  permissions: string[];
  onOpenInquiry?: (ticketNo: string) => void;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const writable = permissions.includes("environments.write");
  const canReadCatalog = permissions.includes("catalog.read");
  const canUseInquiries = permissions.includes("inquiries.use");
  const [contractForm] = Form.useForm<ContractFormValues>();
  const [vpnForm] = Form.useForm<VpnFormValues>();
  const [contractOpen, setContractOpen] = useState(false);
  const [vpnOpen, setVpnOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<CustomerContract>();
  const [editingVpn, setEditingVpn] = useState<CustomerVpnConnection>();
  const [inquiryPage, setInquiryPage] = useState(1);
  const [issuePage, setIssuePage] = useState(1);
  const [inquirySortField, setInquirySortField] =
    useState<CustomerInquirySortField>("title");
  const [inquirySortOrder, setInquirySortOrder] =
    useState<CustomerInformationSortOrder>("ascend");
  const [issueSortField, setIssueSortField] =
    useState<CustomerBacklogIssueSortField>("summary");
  const [issueSortOrder, setIssueSortOrder] =
    useState<CustomerInformationSortOrder>("ascend");
  const [inquiryColumnWidths, setInquiryColumnWidths] = useState(() =>
    readCustomerColumnWidths(inquiryColumnStorageKey, inquiryDefaultColumnWidths),
  );
  const [issueColumnWidths, setIssueColumnWidths] = useState(() =>
    readCustomerColumnWidths(issueColumnStorageKey, issueDefaultColumnWidths),
  );
  const pageSize = 20;
  const itemType = Form.useWatch("itemType", contractForm) ?? "PRODUCT";

  const informationQuery = useQuery({
    queryKey: ["customer-information", organization?.id],
    queryFn: ({ signal }) => fetchCustomerInformation(organization!.id, signal),
    enabled: Boolean(organization?.id),
  });
  const productQuery = useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => fetchProducts(signal),
    enabled: Boolean(organization?.id && writable && canReadCatalog),
  });
  const inquiryQuery = useQuery({
    queryKey: [
      "customer-inquiries",
      organization?.id,
      inquiryPage,
      pageSize,
      inquirySortField,
      inquirySortOrder,
    ],
    queryFn: ({ signal }) =>
      fetchCustomerInquiryPage(
        organization!.id,
        inquiryPage,
        pageSize,
        inquirySortField,
        inquirySortOrder === "descend" ? "desc" : "asc",
        signal,
      ),
    enabled: Boolean(organization?.id && canUseInquiries),
  });
  const issueQuery = useQuery({
    queryKey: [
      "customer-backlog-issues",
      organization?.id,
      issuePage,
      pageSize,
      issueSortField,
      issueSortOrder,
    ],
    queryFn: ({ signal }) =>
      fetchCustomerBacklogIssuePage(
        organization!.id,
        issuePage,
        pageSize,
        issueSortField,
        issueSortOrder === "descend" ? "desc" : "asc",
        signal,
      ),
    enabled: Boolean(organization?.id),
  });
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["customer-information", organization?.id],
    });

  useEffect(() => {
    setInquiryPage(1);
    setIssuePage(1);
    setInquirySortField("title");
    setInquirySortOrder("ascend");
    setIssueSortField("summary");
    setIssueSortOrder("ascend");
    setContractOpen(false);
    setVpnOpen(false);
  }, [organization?.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        inquiryColumnStorageKey,
        JSON.stringify(inquiryColumnWidths),
      );
    } catch {
      // 制限されたセッションではブラウザーストレージを利用できない場合がある。
    }
  }, [inquiryColumnWidths]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        issueColumnStorageKey,
        JSON.stringify(issueColumnWidths),
      );
    } catch {
      // 制限されたセッションではブラウザーストレージを利用できない場合がある。
    }
  }, [issueColumnWidths]);

  const contractMutation = useMutation({
    mutationFn: (values: ContractFormValues) =>
      editingContract
        ? updateCustomerContract(organization!.id, editingContract.id, values)
        : createCustomerContract(organization!.id, values),
    onSuccess: () => {
      setContractOpen(false);
      setEditingContract(undefined);
      contractForm.resetFields();
      void invalidate();
    },
  });
  const archiveContractMutation = useMutation({
    mutationFn: (contract: CustomerContract) =>
      archiveCustomerContract(organization!.id, contract.id, contract.revision),
    onSuccess: () => void invalidate(),
  });
  const vpnMutation = useMutation({
    mutationFn: (values: VpnFormValues) =>
      editingVpn
        ? updateCustomerVpn(organization!.id, editingVpn.id, values)
        : createCustomerVpn(organization!.id, values),
    onSuccess: () => {
      setVpnOpen(false);
      setEditingVpn(undefined);
      vpnForm.resetFields();
      void invalidate();
    },
  });
  const archiveVpnMutation = useMutation({
    mutationFn: (vpn: CustomerVpnConnection) =>
      archiveCustomerVpn(organization!.id, vpn.id, vpn.revision),
    onSuccess: () => void invalidate(),
  });
  const openContract = (contract?: CustomerContract) => {
    setEditingContract(contract);
    contractForm.setFieldsValue(
      contract
        ? {
            itemType: contract.itemType,
            productId: contract.productId,
            serviceName: contract.serviceName,
            introductionStatus: contract.introductionStatus,
            introductionStartDate: contract.introductionStartDate,
            introductionEndDate: contract.introductionEndDate,
            maintenanceStatus: contract.maintenanceStatus,
            maintenanceStartDate: contract.maintenanceStartDate,
            maintenanceEndDate: contract.maintenanceEndDate,
            notes: contract.notes,
            revision: contract.revision,
          }
        : {
            itemType: "PRODUCT",
            introductionStatus: "NONE",
            maintenanceStatus: "NONE",
            revision: 0,
          },
    );
    setContractOpen(true);
  };
  const openVpn = (vpn?: CustomerVpnConnection) => {
    setEditingVpn(vpn);
    vpnForm.setFieldsValue(
      vpn
        ? {
            name: vpn.name,
            vpnType: vpn.vpnType,
            providerName: vpn.providerName,
            endpoint: vpn.endpoint,
            status: vpn.status,
            notes: vpn.notes,
            revision: vpn.revision,
          }
        : { vpnType: "IPSEC", status: "ACTIVE", revision: 0 },
    );
    setVpnOpen(true);
  };

  const contractColumns: TableColumnsType<CustomerContract> = [
    {
      title: text.item,
      key: "item",
      render: (_, contract) => (
        <Space direction="vertical" size={0}>
          <Text strong>{customerContractLabel(contract)}</Text>
          <Text type="secondary">
            {contract.itemType === "PRODUCT" ? text.product : text.service}
            {contract.productCode ? ` · ${contract.productCode}` : ""}
          </Text>
        </Space>
      ),
    },
    {
      title: text.introduction,
      key: "introduction",
      render: (_, contract) => phase(
        contract.introductionStatus,
        contract.introductionStartDate,
        contract.introductionEndDate,
        text,
      ),
    },
    {
      title: text.maintenanceContract,
      key: "maintenance",
      render: (_, contract) => phase(
        contract.maintenanceStatus,
        contract.maintenanceStartDate,
        contract.maintenanceEndDate,
        text,
      ),
    },
    { title: text.notes, dataIndex: "notes", key: "notes", ellipsis: true },
    ...(writable
      ? [{
          title: "",
          key: "actions",
          width: 92,
          render: (_: unknown, contract: CustomerContract) => (
            <Space>
              <Button type="text" icon={<EditOutlined />} aria-label={text.edit} onClick={() => openContract(contract)} />
              <Popconfirm title={text.archiveConfirm} okText={text.archive} cancelText={text.cancel} onConfirm={() => archiveContractMutation.mutate(contract)}>
                <Button type="text" danger icon={<DeleteOutlined />} aria-label={text.archive} />
              </Popconfirm>
            </Space>
          ),
        }]
      : []),
  ];

  const serviceColumns: TableColumnsType<CustomerActiveService> = [
    {
      title: text.item,
      key: "name",
      render: (_, item) => (
        <Space direction="vertical" size={0}>
          <Text strong>{item.name}</Text>
          {item.code && <Text type="secondary">{item.code}</Text>}
        </Space>
      ),
    },
    {
      title: text.itemType,
      dataIndex: "itemType",
      render: (value) => value === "PRODUCT" ? text.product : text.service,
    },
    {
      title: text.source,
      dataIndex: "source",
      render: (value) => (
        <Tag color={value === "CONTRACT" ? "blue" : "cyan"}>
          {value === "CONTRACT" ? text.contractSource : text.environmentSource}
        </Tag>
      ),
    },
    { title: text.versions, dataIndex: "versions", render: (values: string[]) => values?.join(", ") || "" },
    { title: text.environments, dataIndex: "environmentCount", align: "right" },
  ];

  const vpnColumns: TableColumnsType<CustomerVpnConnection> = [
    { title: text.vpnName, dataIndex: "name" },
    { title: text.vpnType, dataIndex: "vpnType", render: (value) => <Tag>{value}</Tag> },
    { title: text.provider, dataIndex: "providerName" },
    { title: text.endpoint, dataIndex: "endpoint", ellipsis: true },
    {
      title: text.status,
      dataIndex: "status",
      render: (value: CustomerVpnConnection["status"]) => (
        <Tag color={value === "ACTIVE" ? "green" : "default"}>
          {environmentStatusLabel(value, text)}
        </Tag>
      ),
    },
    ...(writable
      ? [{
          title: "",
          key: "actions",
          width: 92,
          render: (_: unknown, vpn: CustomerVpnConnection) => (
            <Space>
              <Button type="text" icon={<EditOutlined />} aria-label={text.edit} onClick={() => openVpn(vpn)} />
              <Popconfirm title={text.archiveConfirm} okText={text.archive} cancelText={text.cancel} onConfirm={() => archiveVpnMutation.mutate(vpn)}>
                <Button type="text" danger icon={<DeleteOutlined />} aria-label={text.archive} />
              </Popconfirm>
            </Space>
          ),
        }]
      : []),
  ];

  const inquiryWidthFor = (key: InquiryColumnKey) =>
    inquiryColumnWidths[key] ?? inquiryDefaultColumnWidths[key];
  const issueWidthFor = (key: IssueColumnKey) =>
    issueColumnWidths[key] ?? issueDefaultColumnWidths[key];
  const resizeInquiryColumn = (key: InquiryColumnKey, width: number) => {
    setInquiryColumnWidths((current) => ({
      ...current,
      [key]: clampColumnWidth(width, inquiryMinimumColumnWidths[key]),
    }));
  };
  const resizeIssueColumn = (key: IssueColumnKey, width: number) => {
    setIssueColumnWidths((current) => ({
      ...current,
      [key]: clampColumnWidth(width, issueMinimumColumnWidths[key]),
    }));
  };
  const inquiryHeaderCell = (key: InquiryColumnKey) => () =>
    ({
      minWidth: inquiryMinimumColumnWidths[key],
      onResize: (width: number) => resizeInquiryColumn(key, width),
      resizable: true,
      resizeLabel: text.resizeColumn,
    }) as HTMLAttributes<HTMLTableCellElement>;
  const issueHeaderCell = (key: IssueColumnKey) => () =>
    ({
      minWidth: issueMinimumColumnWidths[key],
      onResize: (width: number) => resizeIssueColumn(key, width),
      resizable: true,
      resizeLabel: text.resizeColumn,
    }) as HTMLAttributes<HTMLTableCellElement>;
  const inquirySortOrderFor = (key: CustomerInquirySortField) =>
    inquirySortField === key ? inquirySortOrder : null;
  const issueSortOrderFor = (key: CustomerBacklogIssueSortField) =>
    issueSortField === key ? issueSortOrder : null;
  const inquiryTableWidth = Object.keys(inquiryDefaultColumnWidths).reduce(
    (total, key) => total + inquiryWidthFor(key as InquiryColumnKey),
    0,
  );
  const issueTableWidth = Object.keys(issueDefaultColumnWidths).reduce(
    (total, key) => total + issueWidthFor(key as IssueColumnKey),
    0,
  );

  const inquiryColumns: TableColumnsType<InquirySearchTicket> = [
    {
      title: text.ticketNo,
      dataIndex: "ticketNo",
      key: "ticketNo",
      width: inquiryWidthFor("ticketNo"),
      onHeaderCell: inquiryHeaderCell("ticketNo"),
      sorter: true,
      sortOrder: inquirySortOrderFor("ticketNo"),
      render: (value: string) => (
        <Button type="link" className="customer-record-link" onClick={() => onOpenInquiry?.(value)}>
          {value}
        </Button>
      ),
    },
    {
      title: text.subject,
      dataIndex: "title",
      key: "title",
      width: inquiryWidthFor("title"),
      onHeaderCell: inquiryHeaderCell("title"),
      ellipsis: true,
      sorter: true,
      sortOrder: inquirySortOrderFor("title"),
    },
    {
      title: text.status,
      dataIndex: "status",
      key: "status",
      width: inquiryWidthFor("status"),
      onHeaderCell: inquiryHeaderCell("status"),
      sorter: true,
      sortOrder: inquirySortOrderFor("status"),
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: text.assignee,
      dataIndex: "assignee",
      key: "assignee",
      width: inquiryWidthFor("assignee"),
      onHeaderCell: inquiryHeaderCell("assignee"),
      sorter: true,
      sortOrder: inquirySortOrderFor("assignee"),
      render: (value) => value || "",
    },
    {
      title: text.customer,
      dataIndex: "customer",
      key: "customer",
      width: inquiryWidthFor("customer"),
      onHeaderCell: inquiryHeaderCell("customer"),
      sorter: true,
      sortOrder: inquirySortOrderFor("customer"),
    },
    {
      title: text.updatedAt,
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: inquiryWidthFor("updatedAt"),
      onHeaderCell: inquiryHeaderCell("updatedAt"),
      sorter: true,
      sortOrder: inquirySortOrderFor("updatedAt"),
    },
  ];

  const projectById = useMemo(
    () => new Map(
      (issueQuery.data?.projects ?? []).map((project) => [
        project.externalProjectId,
        project,
      ]),
    ),
    [issueQuery.data?.projects],
  );
  const issueColumns: TableColumnsType<CustomerBacklogIssue> = [
    {
      title: text.issueKey,
      dataIndex: "issueKey",
      key: "issueKey",
      width: issueWidthFor("issueKey"),
      onHeaderCell: issueHeaderCell("issueKey"),
      sorter: true,
      sortOrder: issueSortOrderFor("issueKey"),
      render: (value: string, issue) => {
        const href = safeExternalHttpUrl(issue.url);
        return href
          ? <a href={href} target="_blank" rel="noreferrer">{value} <LinkOutlined /></a>
          : value;
      },
    },
    {
      title: text.subject,
      dataIndex: "summary",
      key: "summary",
      width: issueWidthFor("summary"),
      onHeaderCell: issueHeaderCell("summary"),
      ellipsis: true,
      sorter: true,
      sortOrder: issueSortOrderFor("summary"),
    },
    {
      title: text.project,
      dataIndex: "projectId",
      key: "projectId",
      width: issueWidthFor("projectId"),
      onHeaderCell: issueHeaderCell("projectId"),
      sorter: true,
      sortOrder: issueSortOrderFor("projectId"),
      render: (value) => projectById.get(value)?.projectName || value,
    },
    {
      title: text.status,
      dataIndex: "status",
      key: "status",
      width: issueWidthFor("status"),
      onHeaderCell: issueHeaderCell("status"),
      sorter: true,
      sortOrder: issueSortOrderFor("status"),
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: text.assignee,
      dataIndex: "assignee",
      key: "assignee",
      width: issueWidthFor("assignee"),
      onHeaderCell: issueHeaderCell("assignee"),
      sorter: true,
      sortOrder: issueSortOrderFor("assignee"),
      render: (value) => value || "",
    },
    {
      title: text.priority,
      dataIndex: "priority",
      key: "priority",
      width: issueWidthFor("priority"),
      onHeaderCell: issueHeaderCell("priority"),
      sorter: true,
      sortOrder: issueSortOrderFor("priority"),
    },
    {
      title: text.dueDate,
      dataIndex: "dueDate",
      key: "dueDate",
      width: issueWidthFor("dueDate"),
      onHeaderCell: issueHeaderCell("dueDate"),
      sorter: true,
      sortOrder: issueSortOrderFor("dueDate"),
      render: (value) => value || "",
    },
    {
      title: text.updatedAt,
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: issueWidthFor("updatedAt"),
      onHeaderCell: issueHeaderCell("updatedAt"),
      sorter: true,
      sortOrder: issueSortOrderFor("updatedAt"),
      render: (value) => value || "",
    },
  ];

  const handleInquiryTableChange = (
    _pagination: unknown,
    _filters: unknown,
    sorter: SorterResult<InquirySearchTicket> | SorterResult<InquirySearchTicket>[],
    extra: { action?: string },
  ) => {
    if (extra.action !== "sort") return;
    const selectedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const selectedField = selectedSorter?.field;
    setInquiryPage(1);
    if (typeof selectedField !== "string") {
      setInquirySortField("title");
      setInquirySortOrder("ascend");
      return;
    }
    setInquirySortField(selectedField as CustomerInquirySortField);
    setInquirySortOrder(selectedSorter.order === "descend" ? "descend" : "ascend");
  };

  const handleIssueTableChange = (
    _pagination: unknown,
    _filters: unknown,
    sorter: SorterResult<CustomerBacklogIssue> | SorterResult<CustomerBacklogIssue>[],
    extra: { action?: string },
  ) => {
    if (extra.action !== "sort") return;
    const selectedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    setIssuePage(1);
    if (typeof selectedSorter?.field !== "string") {
      setIssueSortField("summary");
      setIssueSortOrder("ascend");
      return;
    }
    setIssueSortField(selectedSorter.field as CustomerBacklogIssueSortField);
    setIssueSortOrder(selectedSorter.order === "descend" ? "descend" : "ascend");
  };

  if (!organization) {
    return <Empty className="customer-information-empty" description={text.noCustomer} />;
  }

  const operationError =
    contractMutation.error || archiveContractMutation.error ||
    vpnMutation.error || archiveVpnMutation.error;

  return (
    <div className="customer-information-page">
      <section className="portal-page-hero customer-information-hero">
        <span className="portal-page-hero-icon"><SolutionOutlined /></span>
        <div>
          <span className="eyebrow">{text.eyebrow}</span>
          <Title level={1}>{text.title}</Title>
          <Paragraph>{text.description}</Paragraph>
        </div>
        <div className="customer-information-customer">
          <TeamOutlined />
          <span><strong>{organization.name}</strong><Text>{organization.code}</Text></span>
        </div>
      </section>

      {informationQuery.isError && (
        <Alert type="error" showIcon message={text.loadFailed} action={<Button icon={<ReloadOutlined />} onClick={() => void informationQuery.refetch()}>{text.retry}</Button>} />
      )}
      {operationError && <Alert type="error" showIcon closable message={text.saveFailed} />}

      <Tabs
        className="customer-information-tabs"
        destroyOnHidden
        items={[
          {
            key: "basic",
            label: <span><SolutionOutlined />{text.basic}</span>,
            children: (
              <Card className="customer-section-card" loading={informationQuery.isLoading}>
                <Descriptions column={{ xs: 1, md: 2 }} items={[
                  { key: "classification", label: text.classification, children: organization.classificationName || "" },
                  { key: "code", label: text.code, children: organization.code },
                  { key: "name", label: text.name, children: organization.name },
                  { key: "shortName", label: text.shortName, children: organization.shortName || "" },
                  { key: "maintenance", label: text.maintenance, children: organization.maintenanceStatus || "" },
                  { key: "remarks", label: text.remarks, children: organization.remarks || "" },
                ]} />
              </Card>
            ),
          },
          {
            key: "contracts",
            label: <span><FileProtectOutlined />{text.contracts}</span>,
            children: (
              <Card className="customer-section-card" title={text.contracts} extra={writable && <Button type="primary" icon={<PlusOutlined />} onClick={() => openContract()}>{text.add}</Button>}>
                <Table rowKey="id" columns={contractColumns} dataSource={informationQuery.data?.contracts ?? []} loading={informationQuery.isLoading} pagination={false} locale={{ emptyText: text.noContracts }} scroll={{ x: 820 }} />
              </Card>
            ),
          },
          {
            key: "services",
            label: <span><AppstoreOutlined />{text.services}</span>,
            children: (
              <Card className="customer-section-card" title={text.services}>
                <Table rowKey={(item) => `${item.source}:${item.productId || item.name}`} columns={serviceColumns} dataSource={informationQuery.data?.activeServices ?? []} loading={informationQuery.isLoading} pagination={false} locale={{ emptyText: text.noServices }} scroll={{ x: 720 }} />
              </Card>
            ),
          },
          {
            key: "network",
            label: <span><CloudServerOutlined />{text.network}</span>,
            children: (
              <Tabs className="customer-network-tabs" items={[
                {
                  key: "vpn",
                  label: <span><SafetyCertificateOutlined />{text.vpn}</span>,
                  children: (
                    <Card className="customer-section-card" title={text.vpn} extra={writable && <Button type="primary" icon={<PlusOutlined />} onClick={() => openVpn()}>{text.add}</Button>}>
                      <Table rowKey="id" columns={vpnColumns} dataSource={informationQuery.data?.vpnConnections ?? []} loading={informationQuery.isLoading} pagination={false} locale={{ emptyText: text.noVpn }} scroll={{ x: 720 }} />
                    </Card>
                  ),
                },
                {
                  key: "servers",
                  label: <span><CloudServerOutlined />{text.servers}</span>,
                  children: <EnvironmentPage locale={locale} organization={organization} title={text.servers} permissions={permissions} embedded />,
                },
              ]} />
            ),
          },
          {
            key: "inquiries",
            label: <span><SolutionOutlined />{text.inquiries}</span>,
            children: !canUseInquiries
              ? <Alert type="warning" showIcon message={text.inquiryPermission} />
              : (
                <Card className="customer-section-card" title={text.inquiries} extra={<Button icon={<ReloadOutlined />} onClick={() => void inquiryQuery.refetch()}>{text.retry}</Button>}>
                  {inquiryQuery.data?.sourceTruncated && <Alert className="customer-source-alert" type="warning" showIcon message={text.sourceTruncated} />}
                  {inquiryQuery.isError && <Alert className="customer-source-alert" type="error" showIcon message={text.externalUnavailable} />}
                  <Table rowKey="ticketNo" columns={inquiryColumns} components={{ header: { cell: CustomerResizableHeaderCell } }} dataSource={inquiryQuery.data?.tickets ?? []} loading={inquiryQuery.isLoading} locale={{ emptyText: text.inquiryNoData }} pagination={{ current: inquiryPage, pageSize, total: inquiryQuery.data?.total ?? 0, showSizeChanger: false, onChange: setInquiryPage }} sortDirections={["ascend", "descend"]} onChange={handleInquiryTableChange} scroll={{ x: inquiryTableWidth }} />
                </Card>
              ),
          },
          {
            key: "tasks",
            label: <span><LinkOutlined />{text.tasks}</span>,
            children: (
              <Card className="customer-section-card" title={text.tasks}>
                <div className="customer-project-summary">
                  <div><Text strong>{text.backlogProjects}</Text><Paragraph type="secondary">{text.backlogProjectHelp}</Paragraph></div>
                  <Space wrap>{(issueQuery.data?.templates ?? []).filter((template) => template.enabled).map((template) => <Tag key={template.id}>{template.projectKey} · {template.fieldName}</Tag>)}</Space>
                </div>
                {issueQuery.data?.configurationRequired && <Alert className="customer-source-alert" type="info" showIcon message={text.backlogMappingRequired} />}
                {issueQuery.isError && <Alert className="customer-source-alert" type="error" showIcon message={text.externalUnavailable} />}
                <Table rowKey="id" columns={issueColumns} components={{ header: { cell: CustomerResizableHeaderCell } }} dataSource={issueQuery.data?.issues ?? []} loading={issueQuery.isLoading} locale={{ emptyText: text.noIssues }} pagination={{ current: issuePage, pageSize, total: issueQuery.data?.total ?? 0, showSizeChanger: false, onChange: setIssuePage }} sortDirections={["ascend", "descend"]} onChange={handleIssueTableChange} scroll={{ x: issueTableWidth }} />
              </Card>
            ),
          },
        ]}
      />

      <Modal open={contractOpen} title={`${text.contracts} · ${editingContract ? text.edit : text.add}`} okText={text.save} cancelText={text.cancel} confirmLoading={contractMutation.isPending} onCancel={() => setContractOpen(false)} onOk={() => void contractForm.validateFields().then((values) => contractMutation.mutate(values))} destroyOnHidden>
        <Form form={contractForm} layout="vertical">
          <Form.Item name="itemType" label={text.itemType} rules={[{ required: true, message: text.required }]}><Select options={[{ value: "PRODUCT", label: text.product }, { value: "SERVICE", label: text.service }]} /></Form.Item>
          {itemType === "PRODUCT" ? (
            <Form.Item name="productId" label={text.product} rules={[{ required: true, message: text.required }]}><Select showSearch optionFilterProp="label" placeholder={text.selectProduct} options={(productQuery.data ?? []).map((product) => ({ value: product.id, label: `${product.name} · ${product.code}` }))} /></Form.Item>
          ) : (
            <Form.Item name="serviceName" label={text.serviceName} rules={[{ required: true, message: text.required }]}><Input maxLength={255} /></Form.Item>
          )}
          <div className="customer-contract-phase-grid">
            <Card size="small" title={text.introduction}>
              <Form.Item name="introductionStatus" label={text.status} rules={[{ required: true }]}><Select options={statusOptions(text)} /></Form.Item>
              <Form.Item name="introductionStartDate" label={text.startDate}><Input type="date" /></Form.Item>
              <Form.Item name="introductionEndDate" label={text.endDate}><Input type="date" /></Form.Item>
            </Card>
            <Card size="small" title={text.maintenanceContract}>
              <Form.Item name="maintenanceStatus" label={text.status} rules={[{ required: true }]}><Select options={statusOptions(text)} /></Form.Item>
              <Form.Item name="maintenanceStartDate" label={text.startDate}><Input type="date" /></Form.Item>
              <Form.Item name="maintenanceEndDate" label={text.endDate}><Input type="date" /></Form.Item>
            </Card>
          </div>
          <Form.Item name="notes" label={text.notes}><Input.TextArea rows={3} maxLength={2000} showCount /></Form.Item>
          <Form.Item name="revision" hidden><Input /></Form.Item>
        </Form>
      </Modal>

      <Modal open={vpnOpen} title={`${text.vpn} · ${editingVpn ? text.edit : text.add}`} okText={text.save} cancelText={text.cancel} confirmLoading={vpnMutation.isPending} onCancel={() => setVpnOpen(false)} onOk={() => void vpnForm.validateFields().then((values) => vpnMutation.mutate(values))} destroyOnHidden>
        <Form form={vpnForm} layout="vertical">
          <Form.Item name="name" label={text.vpnName} rules={[{ required: true, message: text.required }]}><Input maxLength={255} /></Form.Item>
          <Form.Item name="vpnType" label={text.vpnType} rules={[{ required: true }]}><Select options={["IPSEC", "SSL", "MPLS", "OTHER"].map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="providerName" label={text.provider}><Input maxLength={255} /></Form.Item>
          <Form.Item name="endpoint" label={text.endpoint}><Input maxLength={500} /></Form.Item>
          <Form.Item name="status" label={text.status} rules={[{ required: true }]}><Select options={[{ value: "ACTIVE", label: text.active }, { value: "PREPARING", label: text.preparing }, { value: "SUSPENDED", label: text.suspended }, { value: "RETIRED", label: text.retired }]} /></Form.Item>
          <Form.Item name="notes" label={text.notes}><Input.TextArea rows={3} maxLength={2000} showCount /></Form.Item>
          <Form.Item name="revision" hidden><Input /></Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
