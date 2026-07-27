import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MenuProps, TableColumnsType } from "antd";
import enUS from "antd/locale/en_US";
import jaJP from "antd/locale/ja_JP";
import zhCN from "antd/locale/zh_CN";
import {
  AppstoreOutlined,
  ApiOutlined,
  ArrowRightOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  BuildOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EditOutlined,
  GlobalOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  RobotOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  UnorderedListOutlined,
  WarningFilled,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfigProvider,
  Drawer,
  Empty,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Progress,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  createProduct,
  createProductVersion,
  createProductVersionModule,
  createOrganizationClassification,
  createOrganization,
  fetchAuthSession,
  fetchDashboard,
  fetchOrganizationClassifications,
  fetchOrganizations,
  fetchProducts,
  logoutAccount,
  subscribeDashboard,
  updateOrganizationClassification,
  updateOrganization,
  updateProduct,
  updateProductVersion,
  updateProductVersionModule,
  type Organization,
  type OrganizationClassification,
  type OrganizationClassificationInput,
  type OrganizationInput,
  type AuthSession,
  type Product,
  type ProductInput,
  type ProductVersionInput,
  type ProductVersionModuleInput,
  type WorkCenterSnapshot,
  type WorkTask,
} from "@one-ops/api-client";
import { AuthPage } from "./AuthPage";
import { messages, type LocaleKey, type MessageKey } from "./i18n";
import { IdentityManagementPage } from "./IdentityManagementPage";
import { EnvironmentPage } from "./EnvironmentPage";
import { ProfileDialog } from "./ProfileDialog";
import { ModelDesignPage } from "./ModelDesignPage";
import { InquirySupportPage } from "./InquirySupportPage";
import {
  InquirySupportSettingsPage,
} from "./InquirySupportSettingsPage";
import {
  clampColumnWidth,
  compareLocalizedText,
  formatBytes,
  formatTimestamp,
  matchesSearchFields,
  statusMeta,
} from "./utils";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

type NavigationKey =
  | "workbench"
  | "masterData"
  | "environments"
  | "builder"
  | "codeInsight"
  | "consulting"
  | "tools"
  | "tasks"
  | "knowledge"
  | "reports"
  | "admin";

interface NavigationItem {
  key: NavigationKey;
  icon: React.ReactNode;
  message: MessageKey;
  description: MessageKey;
}

const antdLocales = {
  "ja-JP": jaJP,
  "zh-CN": zhCN,
  "en-US": enUS,
};

const navigation: NavigationItem[] = [
  {
    key: "workbench",
    icon: <HomeOutlined />,
    message: "workbench",
    description: "workbenchDescription",
  },
  {
    key: "environments",
    icon: <CloudServerOutlined />,
    message: "environments",
    description: "environmentsDescription",
  },
  {
    key: "builder",
    icon: <BuildOutlined />,
    message: "builder",
    description: "builderDescription",
  },
  {
    key: "codeInsight",
    icon: <CodeOutlined />,
    message: "codeInsight",
    description: "codeInsightDescription",
  },
  {
    key: "consulting",
    icon: <RobotOutlined />,
    message: "consulting",
    description: "consultingDescription",
  },
  {
    key: "tools",
    icon: <AppstoreOutlined />,
    message: "tools",
    description: "toolsDescription",
  },
  {
    key: "tasks",
    icon: <UnorderedListOutlined />,
    message: "tasks",
    description: "tasksDescription",
  },
  {
    key: "knowledge",
    icon: <BookOutlined />,
    message: "knowledge",
    description: "knowledgeDescription",
  },
  {
    key: "reports",
    icon: <BarChartOutlined />,
    message: "reports",
    description: "reportsDescription",
  },
  {
    key: "masterData",
    icon: <DatabaseOutlined />,
    message: "basicMasterManagement",
    description: "basicMasterManagementDescription",
  },
  {
    key: "admin",
    icon: <SettingOutlined />,
    message: "admin",
    description: "adminDescription",
  },
];

const emptySnapshot: WorkCenterSnapshot = {
  generatedAt: new Date(0).toISOString(),
  correlationId: "",
  upstream: {
    online: false,
    latencyMs: null,
    message: "Connecting",
  },
  summary: {
    total: 0,
    running: 0,
    failed: 0,
    completed: 0,
    organizations: 0,
  },
  resources: {
    cpuCount: null,
    memoryAvailableBytes: null,
    diskFreeBytes: null,
  },
  tasks: [],
  organizations: [],
};

function App() {
  const queryClient = useQueryClient();
  const sessionQuery = useQuery({
    queryKey: ["auth-session"],
    queryFn: ({ signal }) => fetchAuthSession(signal),
    retry: false,
  });
  const refreshSession = async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth-session"] });
  };
  const logoutMutation = useMutation({
    mutationFn: logoutAccount,
    onSuccess: async () => {
      queryClient.setQueryData<AuthSession>(["auth-session"], {
        authenticated: false,
        user: null,
        permissions: [],
      });
      queryClient.removeQueries({ queryKey: ["work-center-dashboard"] });
    },
  });

  if (sessionQuery.isLoading) {
    return <div className="auth-page auth-loading"><Skeleton active /></div>;
  }
  if (!sessionQuery.data?.authenticated || !sessionQuery.data.user) {
    return <AuthPage onAuthenticated={refreshSession} />;
  }
  return (
    <AuthenticatedPortal
      auth={sessionQuery.data}
      onLogout={() => logoutMutation.mutate()}
    />
  );
}

function AuthenticatedPortal({
  auth,
  onLogout,
}: {
  auth: AuthSession;
  onLogout: () => void;
}) {
  const queryClient = useQueryClient();
  const [locale, setLocale] = useState<LocaleKey>(
    auth.user?.locale ?? "ja-JP",
  );
  const [activeNavigation, setActiveNavigation] =
    useState<NavigationKey>("workbench");
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [liveSnapshot, setLiveSnapshot] =
    useState<WorkCenterSnapshot | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [currentOrganization, setCurrentOrganization] = useState<string>();
  const [profileOpen, setProfileOpen] = useState(false);

  const t = (key: MessageKey) => messages[locale][key];
  const dashboardQuery = useQuery({
    queryKey: ["work-center-dashboard"],
    queryFn: ({ signal }) => fetchDashboard(signal),
    refetchInterval: 10_000,
  });

  useEffect(
    () =>
      subscribeDashboard(
        (snapshot) => setLiveSnapshot(snapshot),
        setLiveConnected,
      ),
    [],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `OneOps | ${messages[locale].productName}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", messages[locale].heroBody);
  }, [locale]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      for (const target of [
        document.scrollingElement,
        document.querySelector(".portal-main"),
        document.querySelector(".portal-content"),
      ]) {
        if (target instanceof HTMLElement) {
          target.scrollTop = 0;
          target.scrollLeft = 0;
        }
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeNavigation]);

  const snapshot = liveSnapshot ?? dashboardQuery.data ?? emptySnapshot;

  useEffect(() => {
    if (!currentOrganization && snapshot.organizations.length) {
      setCurrentOrganization(snapshot.organizations[0].code);
    }
  }, [currentOrganization, snapshot.organizations]);

  const can = (permission: string) => auth.permissions.includes(permission);
  const visibleNavigation = navigation.filter((item) => {
    if (item.key === "masterData") {
      return can("organizations.read") || can("catalog.write");
    }
    if (item.key === "environments") return can("environments.read");
    if (item.key === "consulting") return can("inquiries.use");
    if (item.key === "admin") {
      return (
        can("models.settings.read") ||
        can("identity.users.read") ||
        can("identity.roles.read") ||
        can("audit.read")
      );
    }
    return can("dashboard.read");
  });
  const menuItems: MenuProps["items"] = visibleNavigation.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: t(item.message),
  }));

  const filteredTasks = useMemo(() => {
    const term = searchValue.trim().toLocaleLowerCase(locale);
    if (!term) {
      return snapshot.tasks;
    }
    return snapshot.tasks.filter((task) =>
      [task.id, task.organization, task.materialNumber, task.status]
        .join(" ")
        .toLocaleLowerCase(locale)
        .includes(term),
    );
  }, [locale, searchValue, snapshot.tasks]);
  const organizationContextVisible = !(
    activeNavigation === "masterData" ||
    activeNavigation === "admin"
  );

  const selectNavigation: MenuProps["onClick"] = ({ key }) => {
    setActiveNavigation(key as NavigationKey);
    setMobileNavigationOpen(false);
  };

  return (
    <ConfigProvider locale={antdLocales[locale]}>
      <Layout className="portal-layout">
      <Sider width={248} className="portal-sider" breakpoint="lg" collapsedWidth={0}>
        <Brand t={t} />
        <Menu
          mode="inline"
          selectedKeys={[activeNavigation]}
          items={menuItems}
          onClick={selectNavigation}
          className="portal-menu"
        />
        <div className="sider-foot">
          <div className="connection-card">
            <span className={`connection-dot ${liveConnected ? "online" : ""}`} />
            <div>
              <strong>{liveConnected ? t("realtime") : t("reconnecting")}</strong>
              <span>
                {snapshot.upstream.latencyMs === null
                  ? t("connected8091")
                  : `${snapshot.upstream.latencyMs} ms`}
              </span>
            </div>
          </div>
          <span className="portal-version">OneOps v0.2.0</span>
        </div>
      </Sider>

      <Layout className="portal-main">
        <Header className="portal-header">
          <Button
            className="mobile-menu-button"
            type="text"
            icon={<MenuOutlined />}
            aria-label={t("menuOpen")}
            onClick={() => setMobileNavigationOpen(true)}
          />
          <div className="global-search">
            <Input
              allowClear
              prefix={<SearchOutlined />}
              placeholder={t("search")}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
          <div className="header-actions">
            <Select
              className="locale-select"
              value={locale}
              onChange={setLocale}
              options={[
                { value: "ja-JP", label: "日本語" },
                { value: "zh-CN", label: "中文" },
                { value: "en-US", label: "English" },
              ]}
            />
            <Tooltip title={t("notifications")}>
              <Badge dot color="#fd6c26">
                <Button type="text" shape="circle" icon={<BellOutlined />} />
              </Badge>
            </Tooltip>
            <Tooltip title={t("logout")}>
              <Button
                type="text"
                shape="circle"
                icon={<LogoutOutlined />}
                aria-label={t("logout")}
                onClick={onLogout}
              />
            </Tooltip>
            <Tooltip title={t("profile")}>
              <button
                className="user-button"
                type="button"
                onClick={() => setProfileOpen(true)}
                aria-label={t("profile")}
              >
                <Avatar size={34}>
                  {auth.user?.displayName?.slice(0, 1) || t("roleInitial")}
                </Avatar>
                <span>
                  <strong>{auth.user?.displayName}</strong>
                  <small>{auth.user?.username}</small>
                </span>
              </button>
            </Tooltip>
          </div>
        </Header>

        <Content
          className={`portal-content ${
            activeNavigation === "builder" ? "portal-content-builder" : ""
          }`}
        >
          {organizationContextVisible && (
            <ContextBar
              locale={locale}
              t={t}
              organization={currentOrganization}
              organizations={snapshot.organizations}
              onOrganizationChange={setCurrentOrganization}
              generatedAt={snapshot.generatedAt}
            />
          )}
          {activeNavigation === "workbench" ? (
            <Workbench
              t={t}
              locale={locale}
              snapshot={snapshot}
              tasks={filteredTasks}
              loading={dashboardQuery.isLoading && !liveSnapshot}
              searchValue={searchValue}
              onNavigate={setActiveNavigation}
            />
          ) : activeNavigation === "masterData" ? (
            <MasterDataManagementPage
              t={t}
              locale={locale}
              permissions={auth.permissions}
              searchValue={searchValue}
            />
          ) : activeNavigation === "environments" ? (
            <EnvironmentPage
              locale={locale}
              title={t("environments")}
              organization={snapshot.organizations.find(
                (organization) => organization.code === currentOrganization,
              )}
            />
          ) : activeNavigation === "builder" ? (
            <BuilderPage
              locale={locale}
              organization={snapshot.organizations.find(
                (organization) => organization.code === currentOrganization,
              )}
            />
          ) : activeNavigation === "consulting" ? (
            <InquirySupportPage locale={locale} />
          ) : activeNavigation === "admin" ? (
            <SystemManagementPage
              t={t}
              locale={locale}
              permissions={auth.permissions}
              organizations={snapshot.organizations}
            />
          ) : (
            <ModulePage
              item={navigation.find((item) => item.key === activeNavigation)!}
              title={t(
                navigation.find((item) => item.key === activeNavigation)!.message,
              )}
              snapshot={snapshot}
              t={t}
            />
          )}
        </Content>
      </Layout>

      <Drawer
        placement="left"
        open={mobileNavigationOpen}
        onClose={() => setMobileNavigationOpen(false)}
        width={286}
        styles={{ body: { padding: 0 } }}
      >
        <Brand t={t} />
        <Menu
          mode="inline"
          selectedKeys={[activeNavigation]}
          items={menuItems}
          onClick={selectNavigation}
          className="portal-menu"
        />
      </Drawer>
      </Layout>
      <ProfileDialog
        open={profileOpen}
        user={auth.user!}
        t={t}
        onClose={() => setProfileOpen(false)}
        onSaved={(user) => {
          queryClient.setQueryData<AuthSession>(
            ["auth-session"],
            (current) => current
              ? { ...current, user }
              : current,
          );
          setProfileOpen(false);
        }}
      />
    </ConfigProvider>
  );
}

function Brand({ t }: { t: (key: MessageKey) => string }) {
  return (
    <div className="brand">
      <img src="/brand/onehr-logo.svg" alt="OneHR" />
      <span className="brand-divider" />
      <div>
        <strong>OneOps</strong>
        <small>{t("brandSubtitle")}</small>
      </div>
    </div>
  );
}

function ContextBar({
  locale,
  t,
  organization,
  organizations,
  onOrganizationChange,
  generatedAt,
}: {
  locale: LocaleKey;
  t: (key: MessageKey) => string;
  organization?: string;
  organizations: Organization[];
  onOrganizationChange: (value: string) => void;
  generatedAt: string;
}) {
  return (
    <div className="context-bar">
      <div className="context-fields">
        <span className="context-label">{t("globalContext")}</span>
        <Select
          showSearch
          value={organization}
          placeholder={t("selectOrganization")}
          onChange={onOrganizationChange}
          filterOption={(input, option) =>
            matchesSearchFields(input, option?.value, option?.label)
          }
          options={organizations.map((value) => ({
            value: value.code,
            label: value.name,
          }))}
          popupMatchSelectWidth={300}
        />
      </div>
      <span className="updated-time">
        <span className="pulse-dot" />
        {formatTimestamp(generatedAt, locale)}
      </span>
    </div>
  );
}

function Workbench({
  t,
  locale,
  snapshot,
  tasks,
  loading,
  searchValue,
  onNavigate,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  snapshot: WorkCenterSnapshot;
  tasks: WorkTask[];
  loading: boolean;
  searchValue: string;
  onNavigate: (key: NavigationKey) => void;
}) {
  const columns: TableColumnsType<WorkTask> = [
    {
      title: t("taskId"),
      dataIndex: "id",
      width: 150,
      render: (value: string) => (
        <span className="business-code">{value}</span>
      ),
    },
    {
      title: t("organization"),
      dataIndex: "organization",
      ellipsis: true,
    },
    {
      title: t("material"),
      dataIndex: "materialNumber",
      width: 120,
      render: (value: string) => value || "—",
    },
    {
      title: t("status"),
      dataIndex: "status",
      width: 100,
      render: (value: WorkTask["status"]) => {
        const meta = statusMeta(value);
        return <Tag color={meta.color}>{t(meta.labelKey)}</Tag>;
      },
    },
    {
      title: t("updated"),
      dataIndex: "updatedAt",
      width: 132,
      render: (value: string | null) => formatTimestamp(value, locale),
    },
  ];

  return (
    <div className="workbench">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">{t("dataFlowLabel")}</span>
          <Title level={1}>{t("greeting")}</Title>
          <p>{t("heroBody")}</p>
          <Space wrap>
            <Button
              type="primary"
              size="large"
              icon={<BuildOutlined />}
              onClick={() => onNavigate("builder")}
            >
              {t("startBuild")}
            </Button>
            <Button size="large" icon={<UnorderedListOutlined />}>
              {t("tasks")}
            </Button>
          </Space>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-core">
            <img src="/brand/icon-enterprise.svg" alt="" />
            <strong>OneOps</strong>
            <span>{t("live")}</span>
          </div>
          <span className="hero-node node-a">{t("heroNodeOrganization")}</span>
          <span className="hero-node node-b">{t("heroNodeDirectory")}</span>
          <span className="hero-node node-c">{t("heroNodeBuild")}</span>
        </div>
      </section>

      <section className="metric-grid">
        <MetricCard
          icon={<ThunderboltOutlined />}
          title={t("running")}
          value={snapshot.summary.running}
          tone="orange"
          suffix={t("taskUnit")}
        />
        <MetricCard
          icon={<WarningFilled />}
          title={t("failed")}
          value={snapshot.summary.failed}
          tone="red"
          suffix={t("taskUnit")}
        />
        <MetricCard
          icon={<CheckCircleFilled />}
          title={t("completed")}
          value={snapshot.summary.completed}
          tone="green"
          suffix={t("taskUnit")}
        />
        <MetricCard
          icon={<TeamOutlined />}
          title={t("organizationsCount")}
          value={snapshot.summary.organizations}
          tone="teal"
          suffix={t("contextUnit")}
        />
      </section>

      <section className="dashboard-grid">
        <Card
          className="task-card"
          title={
            <div className="card-title">
              <span>
                <UnorderedListOutlined />
                {t("recentTasks")}
              </span>
              <Badge
                status={snapshot.upstream.online ? "success" : "warning"}
                text={t("liveUpdated")}
              />
            </div>
          }
          extra={
            searchValue ? (
              <Tag color="orange">
                {tasks.length} {t("resultUnit")}
              </Tag>
            ) : null
          }
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : tasks.length ? (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={tasks}
              pagination={false}
              size="middle"
              scroll={{ x: 720 }}
            />
          ) : (
            <Empty description={t("noTasks")} />
          )}
        </Card>

        <div className="side-stack">
          <Card
            className="health-card"
            title={
              <div className="card-title">
                <span>
                  <CloudServerOutlined />
                  {t("systemHealth")}
                </span>
                <Tag color={snapshot.upstream.online ? "success" : "warning"}>
                  {snapshot.upstream.online ? t("online") : t("degraded")}
                </Tag>
              </div>
            }
          >
            <HealthRow
              icon={<DatabaseOutlined />}
              label={t("availableMemory")}
              value={formatBytes(snapshot.resources.memoryAvailableBytes)}
              percent={memoryPercent(snapshot.resources.memoryAvailableBytes)}
              color="#00c4cc"
            />
            <HealthRow
              icon={<CloudServerOutlined />}
              label={t("freeDisk")}
              value={formatBytes(snapshot.resources.diskFreeBytes)}
              percent={diskPercent(snapshot.resources.diskFreeBytes)}
              color="#fd6c26"
            />
            <div className="cpu-row">
              <span>
                <ToolOutlined />
                {t("cpu")}
              </span>
              <strong>
                {snapshot.resources.cpuCount ?? "—"} {t("coreUnit")}
              </strong>
            </div>
          </Card>

          <Card
            className="focus-card"
            title={
              <div className="card-title">
                <span>
                  <ThunderboltOutlined />
                  {t("operationalFocus")}
                </span>
              </div>
            }
          >
            <FocusItem
              tone={snapshot.summary.failed ? "danger" : "success"}
              title={
                snapshot.summary.failed
                  ? `${snapshot.summary.failed} ${t("failedTasksAction")}`
                  : t("noFailedTasks")
              }
              body={t("taskSourceDescription")}
            />
            <FocusItem
              tone="info"
              title={`${snapshot.summary.organizations} ${t("organizationHistory")}`}
              body={t("organizationContextDescription")}
            />
          </Card>
        </div>
      </section>

      <section className="quick-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("capabilitiesLabel")}</span>
            <Title level={3}>{t("quickTools")}</Title>
          </div>
          <Button type="link">
            {t("tools")} <ArrowRightOutlined />
          </Button>
        </div>
        <div className="tool-grid">
          <ToolCard
            icon="/brand/icon-support.svg"
            title={t("oneBuildTitle")}
            description={t("oneBuildDescription")}
            status="live"
            t={t}
            action={() => onNavigate("builder")}
          />
          <ToolCard
            icon="/brand/icon-db.svg"
            title={t("environmentInventory")}
            description={t("environmentInventoryDescription")}
            status="planned"
            t={t}
          />
          <ToolCard
            icon="/brand/icon-ai.svg"
            title={t("consultingAssistant")}
            description={t("consultingAssistantDescription")}
            status="planned"
            t={t}
          />
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  tone,
  suffix,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  tone: "orange" | "red" | "green" | "teal";
  suffix: string;
}) {
  return (
    <Card className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <Statistic title={title} value={value} suffix={<small>{suffix}</small>} />
    </Card>
  );
}

function HealthRow({
  icon,
  label,
  value,
  percent,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  percent: number;
  color: string;
}) {
  return (
    <div className="health-row">
      <div>
        <span>
          {icon}
          {label}
        </span>
        <strong>{value}</strong>
      </div>
      <Progress percent={percent} showInfo={false} strokeColor={color} />
    </div>
  );
}

function FocusItem({
  tone,
  title,
  body,
}: {
  tone: "danger" | "success" | "info";
  title: string;
  body: string;
}) {
  return (
    <div className={`focus-item ${tone}`}>
      <span className="focus-mark" />
      <div>
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </div>
  );
}

function ToolCard({
  icon,
  title,
  description,
  status,
  action,
  t,
}: {
  icon: string;
  title: string;
  description: string;
  status: "live" | "planned";
  action?: () => void;
  t: (key: MessageKey) => string;
}) {
  return (
    <button className="tool-card" type="button" onClick={action}>
      <span className="tool-card-icon">
        <img src={icon} alt="" />
      </span>
      <span className="tool-card-copy">
        <span>
          <strong>{title}</strong>
          <Tag color={status === "live" ? "success" : "default"}>
            {status === "live" ? t("live") : t("roadmap")}
          </Tag>
        </span>
        <small>{description}</small>
      </span>
      <ArrowRightOutlined />
    </button>
  );
}

type OrganizationColumnKey =
  | "classification"
  | "code"
  | "name"
  | "shortName"
  | "maintenanceStatus"
  | "remarks";

type OrganizationSortState = {
  columnKey: OrganizationColumnKey;
  order: "ascend" | "descend";
};

type ResizableHeaderCellProps = HTMLAttributes<HTMLTableCellElement> & {
  minWidth?: number;
  onResize?: (width: number) => void;
  resizable?: boolean;
  resizeLabel?: string;
};

const organizationDefaultColumnWidths: Record<OrganizationColumnKey, number> = {
  classification: 120,
  code: 220,
  name: 320,
  shortName: 220,
  maintenanceStatus: 140,
  remarks: 260,
};

const organizationMinimumColumnWidths: Record<OrganizationColumnKey, number> = {
  classification: 88,
  code: 140,
  name: 160,
  shortName: 100,
  maintenanceStatus: 104,
  remarks: 140,
};

const organizationColumnStorageKey =
  "oneops.organization-directory.column-widths";
const organizationPageSizeStorageKey =
  "oneops.organization-directory.page-size";
const organizationSortStorageKey =
  "oneops.organization-directory.sort";
const organizationPageSizeOptions = [20, 50, 100];
const organizationActionIconWidth = 40;
const organizationActionHorizontalPadding = 16;

function readOrganizationColumnWidths(): Partial<
  Record<OrganizationColumnKey, number>
> {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(organizationColumnStorageKey) ?? "{}",
    ) as Partial<Record<OrganizationColumnKey, number>>;
    return Object.fromEntries(
      Object.entries(stored).filter(
        ([key, value]) =>
          key in organizationDefaultColumnWidths &&
          typeof value === "number" &&
          Number.isFinite(value),
      ),
    );
  } catch {
    return {};
  }
}

function readOrganizationPageSize(): number {
  const stored = Number(
    window.localStorage.getItem(organizationPageSizeStorageKey),
  );
  return organizationPageSizeOptions.includes(stored) ? stored : 20;
}

function readOrganizationSortState(): OrganizationSortState {
  const defaultSort: OrganizationSortState = {
    columnKey: "code",
    order: "ascend",
  };
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(organizationSortStorageKey) ?? "{}",
    ) as Partial<OrganizationSortState>;
    if (
      stored.columnKey &&
      stored.columnKey in organizationDefaultColumnWidths &&
      (stored.order === "ascend" || stored.order === "descend")
    ) {
      return stored as OrganizationSortState;
    }
  } catch {
    // Browser storage can be unavailable or contain invalid data.
  }
  return defaultSort;
}

function ResizableHeaderCell({
  minWidth = 80,
  onResize,
  resizable,
  resizeLabel,
  ...headerProps
}: ResizableHeaderCellProps) {
  const resizeState = useRef<{ startWidth: number; startX: number } | null>(
    null,
  );
  const currentWidth = (
    target: HTMLSpanElement,
  ): number =>
    target.parentElement?.getBoundingClientRect().width ?? minWidth;
  const startResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    resizeState.current = {
      startWidth: currentWidth(event.currentTarget),
      startX: event.clientX,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const continueResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!resizeState.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    onResize?.(
      resizeState.current.startWidth +
        event.clientX -
        resizeState.current.startX,
    );
  };
  const finishResize = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!resizeState.current) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    resizeState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const resizeWithKeyboard = (
    event: ReactKeyboardEvent<HTMLSpanElement>,
  ) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const delta = event.key === "ArrowLeft" ? -16 : 16;
    onResize?.(currentWidth(event.currentTarget) + delta);
  };

  return (
    <th {...headerProps}>
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
          onPointerMove={continueResize}
          onPointerUp={finishResize}
          onPointerCancel={finishResize}
        />
      )}
    </th>
  );
}

function OrganizationPage({
  t,
  locale,
  searchValue,
  canWrite,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  searchValue: string;
  canWrite: boolean;
}) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<OrganizationInput>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [columnWidths, setColumnWidths] = useState(
    readOrganizationColumnWidths,
  );
  const [pagination, setPagination] = useState(() => ({
    current: 1,
    pageSize: readOrganizationPageSize(),
  }));
  const [sortState, setSortState] = useState(
    readOrganizationSortState,
  );
  useEffect(() => {
    try {
      window.localStorage.setItem(
        organizationColumnStorageKey,
        JSON.stringify(columnWidths),
      );
    } catch {
      // Browser storage can be unavailable in restricted sessions.
    }
  }, [columnWidths]);
  useEffect(() => {
    try {
      window.localStorage.setItem(
        organizationPageSizeStorageKey,
        String(pagination.pageSize),
      );
    } catch {
      // Browser storage can be unavailable in restricted sessions.
    }
  }, [pagination.pageSize]);
  useEffect(() => {
    try {
      window.localStorage.setItem(
        organizationSortStorageKey,
        JSON.stringify(sortState),
      );
    } catch {
      // Browser storage can be unavailable in restricted sessions.
    }
  }, [sortState]);
  const organizationQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: ({ signal }) => fetchOrganizations(signal),
    refetchInterval: 10_000,
  });
  const classificationQuery = useQuery({
    queryKey: ["organization-classifications"],
    queryFn: ({ signal }) => fetchOrganizationClassifications(signal),
  });
  const saveMutation = useMutation({
    mutationFn: (organization: OrganizationInput) =>
      editingId
        ? updateOrganization(editingId, organization)
        : createOrganization(organization),
    onSuccess: async () => {
      setEditorOpen(false);
      setEditingId(null);
      form.resetFields();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["organizations"] }),
        queryClient.invalidateQueries({ queryKey: ["work-center-dashboard"] }),
      ]);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    saveMutation.reset();
    setEditorOpen(true);
  };
  const openEdit = (organization: Organization) => {
    if (!organization.id) {
      return;
    }
    setEditingId(organization.id);
    form.setFieldsValue(organization);
    saveMutation.reset();
    setEditorOpen(true);
  };
  const term = searchValue.trim().toLocaleLowerCase(locale);
  const organizations = (organizationQuery.data ?? []).filter(
    (organization) =>
      !term ||
      `${organization.classificationName} ${organization.code} ${organization.name} ${organization.remarks}`
        .toLocaleLowerCase(locale)
        .includes(term),
  );
  useEffect(() => {
    setPagination((current) =>
      current.current === 1 ? current : { ...current, current: 1 },
    );
  }, [term]);
  useEffect(() => {
    const lastPage = Math.max(
      1,
      Math.ceil(organizations.length / pagination.pageSize),
    );
    setPagination((current) =>
      current.current <= lastPage
        ? current
        : { ...current, current: lastPage },
    );
  }, [organizations.length, pagination.pageSize]);
  const widthFor = (key: OrganizationColumnKey) =>
    columnWidths[key] ?? organizationDefaultColumnWidths[key];
  const resizeColumn = (key: OrganizationColumnKey, width: number) => {
    setColumnWidths((current) => ({
      ...current,
      [key]: clampColumnWidth(
        width,
        organizationMinimumColumnWidths[key],
      ),
    }));
  };
  const resizableHeader = (key: OrganizationColumnKey) => () =>
    ({
      minWidth: organizationMinimumColumnWidths[key],
      onResize: (width: number) => resizeColumn(key, width),
      resizable: true,
      resizeLabel: t("resizeColumn"),
    }) as HTMLAttributes<HTMLTableCellElement>;
  const sortOrderFor = (key: OrganizationColumnKey) =>
    sortState.columnKey === key ? sortState.order : null;
  const actionIconCount = canWrite ? 1 : 0;
  const actionColumnWidth =
    organizationActionHorizontalPadding +
    actionIconCount * organizationActionIconWidth;
  const tableMinimumWidth =
    Object.keys(organizationDefaultColumnWidths).reduce(
      (total, key) => total + widthFor(key as OrganizationColumnKey),
      0,
    ) + actionColumnWidth;
  const columns: TableColumnsType<Organization> = [
    {
      key: "classification",
      title: t("organizationClassification"),
      dataIndex: "classificationName",
      width: widthFor("classification"),
      onHeaderCell: resizableHeader("classification"),
      sorter: (left, right) =>
        compareLocalizedText(
          left.classificationName,
          right.classificationName,
          locale,
        ),
      sortOrder: sortOrderFor("classification"),
    },
    {
      key: "code",
      title: t("organizationCode"),
      dataIndex: "code",
      width: widthFor("code"),
      onHeaderCell: resizableHeader("code"),
      sorter: (left, right) =>
        compareLocalizedText(left.code, right.code, locale),
      sortOrder: sortOrderFor("code"),
      render: (value: string) => (
        <span className="business-code">{value}</span>
      ),
    },
    {
      key: "name",
      title: t("organizationName"),
      dataIndex: "name",
      width: widthFor("name"),
      onHeaderCell: resizableHeader("name"),
      sorter: (left, right) =>
        compareLocalizedText(left.name, right.name, locale),
      sortOrder: sortOrderFor("name"),
    },
    {
      key: "shortName",
      title: t("organizationShortName"),
      dataIndex: "shortName",
      width: widthFor("shortName"),
      onHeaderCell: resizableHeader("shortName"),
      sorter: (left, right) =>
        compareLocalizedText(left.shortName, right.shortName, locale),
      sortOrder: sortOrderFor("shortName"),
    },
    {
      key: "maintenanceStatus",
      title: t("organizationMaintenanceStatus"),
      dataIndex: "maintenanceStatus",
      width: widthFor("maintenanceStatus"),
      onHeaderCell: resizableHeader("maintenanceStatus"),
      sorter: (left, right) =>
        compareLocalizedText(
          left.maintenanceStatus,
          right.maintenanceStatus,
          locale,
        ),
      sortOrder: sortOrderFor("maintenanceStatus"),
    },
    {
      key: "remarks",
      title: t("organizationRemarks"),
      dataIndex: "remarks",
      width: widthFor("remarks"),
      onHeaderCell: resizableHeader("remarks"),
      sorter: (left, right) =>
        compareLocalizedText(left.remarks, right.remarks, locale),
      sortOrder: sortOrderFor("remarks"),
    },
    ...(canWrite
      ? [{
          title: t("actions"),
          key: "actions",
          width: actionColumnWidth,
          align: "center" as const,
          fixed: "right" as const,
          render: (_: unknown, organization: Organization) => (
            <Tooltip title={t("editOrganization")}>
              <Button
                type="text"
                aria-label={t("editOrganization")}
                icon={<EditOutlined />}
                onClick={() => openEdit(organization)}
              />
            </Tooltip>
          ),
        }]
      : []),
  ];

  return (
    <div className="organization-page">
      <div className="basic-master-heading">
        <div>
          <Title level={3}>{t("organizations")}</Title>
          <p>{t("organizationDirectoryDescription")}</p>
        </div>
        {canWrite && (
          <Button type="primary" icon={<TeamOutlined />} onClick={openCreate}>
            {t("addOrganization")}
          </Button>
        )}
      </div>
      <Card
        className="organization-directory-card"
        title={
          <div className="card-title">
            <span>
              <DatabaseOutlined />
              {t("organizationDatabaseTitle")}
            </span>
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          components={{ header: { cell: ResizableHeaderCell } }}
          dataSource={organizations}
          loading={organizationQuery.isLoading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            pageSizeOptions: organizationPageSizeOptions.map(String),
            showSizeChanger: true,
            showTotal: (total) =>
              t("organizationTotal").replace("{count}", String(total)),
          }}
          sortDirections={["ascend", "descend"]}
          onChange={(nextPagination, _filters, nextSorter) => {
            const nextPageSize =
              nextPagination.pageSize ?? pagination.pageSize;
            setPagination((current) => ({
              current:
                nextPageSize === current.pageSize
                  ? (nextPagination.current ?? 1)
                  : 1,
              pageSize: nextPageSize,
            }));
            const activeSorter = Array.isArray(nextSorter)
              ? nextSorter[0]
              : nextSorter;
            const columnKey = String(
              activeSorter?.columnKey ?? "",
            ) as OrganizationColumnKey;
            if (
              activeSorter?.order &&
              columnKey in organizationDefaultColumnWidths
            ) {
              setSortState({
                columnKey,
                order: activeSorter.order,
              });
            }
          }}
          locale={{ emptyText: <Empty description={t("organizationEmpty")} /> }}
          scroll={{ x: tableMinimumWidth }}
        />
      </Card>
      <Modal
        title={editingId ? t("editOrganization") : t("addOrganization")}
        open={editorOpen}
        okText={t("save")}
        cancelText={t("close")}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setEditorOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
          requiredMark={false}
        >
          <Form.Item
            name="classificationId"
            label={t("organizationClassification")}
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              loading={classificationQuery.isLoading}
              options={(classificationQuery.data ?? []).map(
                (classification) => ({
                  value: classification.id,
                  label: classification.name,
                }),
              )}
            />
          </Form.Item>
          <Form.Item
            name="code"
            label={t("organizationCode")}
            rules={[
              { required: true, message: t("codeRequired") },
              {
                pattern: /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/,
                message: t("codePattern"),
              },
            ]}
          >
            <Input maxLength={64} autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="name"
            label={t("organizationName")}
            rules={[
              { required: true, whitespace: true, message: t("nameRequired") },
            ]}
          >
            <Input maxLength={255} autoComplete="off" />
          </Form.Item>
          <Form.Item name="shortName" label={t("organizationShortName")}>
            <Input maxLength={255} autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="maintenanceStatus"
            label={t("organizationMaintenanceStatus")}
          >
            <Select
              allowClear
              options={[
                { value: "〇", label: "〇" },
                { value: "✕", label: "✕" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="remarks"
            label={t("organizationRemarks")}
          >
            <Input.TextArea
              rows={3}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          {saveMutation.error && (
            <Text type="danger">{t("organizationSaveFailed")}</Text>
          )}
        </Form>
      </Modal>
    </div>
  );
}

type MasterDataManagementSection =
  | "organizations"
  | "organization-classifications"
  | "product-versions";

function MasterDataManagementPage({
  t,
  locale,
  permissions,
  searchValue,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  permissions: string[];
  searchValue: string;
}) {
  const organizationReadable = permissions.includes("organizations.read");
  const organizationWritable = permissions.includes("organizations.write");
  const catalogWritable = permissions.includes("catalog.write");
  const initialSection: MasterDataManagementSection = organizationReadable
    ? "organizations"
    : "organization-classifications";
  const [selectedSection, setSelectedSection] =
    useState<MasterDataManagementSection>(initialSection);
  const masterDataItems: MenuProps["items"] = [];

  if (organizationReadable) {
    masterDataItems.push({
      key: "organizations",
      icon: <TeamOutlined />,
      label: t("organizations"),
    });
  }
  if (catalogWritable) {
    masterDataItems.push(
      {
        key: "organization-classifications",
        icon: <AppstoreOutlined />,
        label: t("organizationClassificationMaster"),
      },
      {
        key: "product-versions",
        icon: <DatabaseOutlined />,
        label: t("productVersionMaster"),
      },
    );
  }

  return (
    <div className="module-page master-data-management-page">
      <section className="module-hero">
        <span className="module-icon">
          <DatabaseOutlined />
        </span>
        <div>
          <span className="eyebrow">{t("basicMasterCatalog")}</span>
          <Title level={1}>{t("basicMasterManagement")}</Title>
          <p>{t("basicMasterManagementDescription")}</p>
        </div>
      </section>
      <Card className="management-shell">
        <div className="management-layout">
          <nav
            className="management-navigation"
            aria-label={t("basicMasterManagement")}
          >
            <Menu
              mode="horizontal"
              selectedKeys={[selectedSection]}
              items={masterDataItems}
              onClick={({ key }) =>
                setSelectedSection(key as MasterDataManagementSection)
              }
            />
          </nav>
          <section className="management-content">
            {selectedSection === "organizations" && organizationReadable && (
              <OrganizationPage
                t={t}
                locale={locale}
                searchValue={searchValue}
                canWrite={organizationWritable}
              />
            )}
            {selectedSection === "organization-classifications" &&
              catalogWritable && (
                <OrganizationClassificationMaster
                  t={t}
                  locale={locale}
                />
              )}
            {selectedSection === "product-versions" && catalogWritable && (
              <ProductVersionMaster t={t} locale={locale} />
            )}
          </section>
        </div>
      </Card>
    </div>
  );
}

type SystemManagementSection =
  | "model-api"
  | "agent-gateways"
  | "inquiry-settings"
  | "users"
  | "roles"
  | "audit";

function SystemManagementPage({
  t,
  locale,
  permissions,
  organizations,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  permissions: string[];
  organizations: Organization[];
}) {
  const identityReadable =
    permissions.includes("identity.users.read") ||
    permissions.includes("identity.roles.read");
  const auditReadable = permissions.includes("audit.read");
  const modelSettingsReadable = permissions.includes("models.settings.read");
  const initialSection: SystemManagementSection = modelSettingsReadable
      ? "model-api"
    : permissions.includes("identity.users.read")
      ? "users"
      : permissions.includes("identity.roles.read")
        ? "roles"
        : "audit";
  const [selectedSection, setSelectedSection] =
    useState<SystemManagementSection>(initialSection);
  const managementItems: MenuProps["items"] = [];
  if (modelSettingsReadable) {
    managementItems.push({
      key: "model-settings-group",
      icon: <RobotOutlined />,
      label: t("modelDesign"),
      children: [
        {
          key: "model-api",
          icon: <ApiOutlined />,
          label: t("modelApiSettings"),
        },
        {
          key: "agent-gateways",
          icon: <CloudServerOutlined />,
          label: t("agentGatewaySettings"),
        },
      ],
    });
    managementItems.push({
      key: "inquiry-settings-group",
      icon: <MessageOutlined />,
      label: t("consulting"),
      children: [
        {
          key: "inquiry-settings",
          icon: <GlobalOutlined />,
          label: t("consulting"),
        },
      ],
    });
  }
  if (identityReadable) {
    managementItems.push({
      key: "identity-group",
      icon: <TeamOutlined />,
      label: t("userManagement"),
      children: [
        ...(permissions.includes("identity.users.read")
          ? [{
              key: "users",
              icon: <TeamOutlined />,
              label: t("userManagement"),
            }]
          : []),
        ...(permissions.includes("identity.roles.read")
          ? [{
              key: "roles",
              icon: <SettingOutlined />,
              label: t("rolePermissionManagement"),
            }]
          : []),
      ],
    });
  }
  if (auditReadable) {
    managementItems.push({
      key: "audit-group",
      icon: <UnorderedListOutlined />,
      label: t("authenticationAudit"),
      children: [
        {
          key: "audit",
          icon: <UnorderedListOutlined />,
          label: t("authenticationAudit"),
        },
      ],
    });
  }

  return (
    <div className="module-page system-management-page">
      <section className="module-hero">
        <span className="module-icon">
          <SettingOutlined />
        </span>
        <div>
          <span className="eyebrow">{t("admin")}</span>
          <Title level={1}>{t("systemManagement")}</Title>
          <p>{t("systemManagementDescription")}</p>
        </div>
      </section>
      <Card className="management-shell">
        <div className="management-layout">
          <nav
            className="management-navigation"
            aria-label={t("systemManagement")}
          >
            <Menu
              mode="horizontal"
              selectedKeys={[selectedSection]}
              items={managementItems}
              onClick={({ key }) =>
                setSelectedSection(key as SystemManagementSection)
              }
            />
          </nav>
          <section className="management-content">
            {selectedSection === "model-api" && (
              <ModelDesignPage
                key="model-api"
                t={t}
                locale={locale}
                canWrite={permissions.includes("models.settings.write")}
                section="model-api"
              />
            )}
            {selectedSection === "agent-gateways" && (
              <ModelDesignPage
                key="agent-gateways"
                t={t}
                locale={locale}
                canWrite={permissions.includes("models.settings.write")}
                section="agent-gateways"
              />
            )}
            {selectedSection === "inquiry-settings" && (
              <InquirySupportSettingsPage
                locale={locale}
                canWrite={permissions.includes("models.settings.write")}
              />
            )}
            {["users", "roles", "audit"].includes(selectedSection) && (
              <IdentityManagementPage
                locale={locale}
                permissions={permissions}
                organizations={organizations}
                section={selectedSection as "users" | "roles" | "audit"}
              />
            )}
          </section>
        </div>
      </Card>
    </div>
  );
}

function OrganizationClassificationMaster({
  t,
  locale,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
}) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<OrganizationClassificationInput>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const classificationQuery = useQuery({
    queryKey: ["organization-classifications"],
    queryFn: ({ signal }) => fetchOrganizationClassifications(signal),
  });
  const saveMutation = useMutation({
    mutationFn: (
      classification: OrganizationClassificationInput,
    ) =>
      editingId
        ? updateOrganizationClassification(editingId, classification)
        : createOrganizationClassification(classification),
    onSuccess: async () => {
      setEditorOpen(false);
      setEditingId(null);
      form.resetFields();
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["organization-classifications"],
        }),
        queryClient.invalidateQueries({ queryKey: ["organizations"] }),
        queryClient.invalidateQueries({
          queryKey: ["work-center-dashboard"],
        }),
      ]);
    },
  });
  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    saveMutation.reset();
    setEditorOpen(true);
  };
  const openEdit = (
    classification: OrganizationClassification,
  ) => {
    setEditingId(classification.id);
    form.setFieldsValue({
      code: classification.code,
      name: classification.name,
    });
    saveMutation.reset();
    setEditorOpen(true);
  };
  const classifications = classificationQuery.data ?? [];
  const columns: TableColumnsType<OrganizationClassification> = [
    {
      title: t("masterCode"),
      dataIndex: "code",
      sorter: (left, right) =>
        compareLocalizedText(left.code, right.code, locale),
      render: (value: string) => (
        <span className="business-code">{value}</span>
      ),
    },
    {
      title: t("masterName"),
      dataIndex: "name",
      sorter: (left, right) =>
        compareLocalizedText(left.name, right.name, locale),
    },
    {
      title: t("actions"),
      key: "actions",
      width:
        organizationActionHorizontalPadding +
        organizationActionIconWidth,
      align: "center",
      fixed: "right",
      render: (_, classification) => (
        <Tooltip title={t("editClassification")}>
          <Button
            type="text"
            aria-label={t("editClassification")}
            icon={<EditOutlined />}
            onClick={() => openEdit(classification)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <div className="basic-master-heading">
        <div>
          <Title level={3}>
            {t("organizationClassificationMaster")}
          </Title>
          <p>{t("organizationClassificationMasterDescription")}</p>
        </div>
        <Button type="primary" onClick={openCreate}>
          {t("addClassification")}
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={classifications}
        loading={classificationQuery.isLoading}
        pagination={false}
        sortDirections={["ascend", "descend"]}
        locale={{
          emptyText: (
            <Empty description={t("classificationMasterEmpty")} />
          ),
        }}
        scroll={{ x: 560 }}
      />
      <Modal
        title={
          editingId
            ? t("editClassification")
            : t("addClassification")
        }
        open={editorOpen}
        okText={t("save")}
        cancelText={t("close")}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setEditorOpen(false)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
          requiredMark={false}
        >
          <Form.Item
            name="code"
            label={t("masterCode")}
            rules={[
              {
                required: true,
                message: t("classificationCodeRequired"),
              },
              {
                pattern: /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/,
                message: t("codePattern"),
              },
            ]}
          >
            <Input maxLength={64} autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="name"
            label={t("masterName")}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("classificationNameRequired"),
              },
            ]}
          >
            <Input maxLength={100} autoComplete="off" />
          </Form.Item>
          {saveMutation.error && (
            <Text type="danger">
              {t("classificationSaveFailed")}
            </Text>
          )}
        </Form>
      </Modal>
    </>
  );
}

function ProductVersionMaster({
  t,
  locale,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
}) {
  const queryClient = useQueryClient();
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [productEditorOpen, setProductEditorOpen] = useState(false);
  const [versionEditorOpen, setVersionEditorOpen] = useState(false);
  const [moduleEditorOpen, setModuleEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product>();
  const [editingVersion, setEditingVersion] =
    useState<Product["versions"][number]>();
  const [editingModule, setEditingModule] =
    useState<Product["versions"][number]["modules"][number]>();
  const [productForm] =
    Form.useForm<Omit<ProductInput, "sortOrder">>();
  const [versionForm] =
    Form.useForm<Omit<ProductVersionInput, "productId">>();
  const [moduleForm] =
    Form.useForm<
      Omit<ProductVersionModuleInput, "productVersionId" | "sortOrder">
    >();
  const productQuery = useQuery({
    queryKey: ["products"],
    queryFn: ({ signal }) => fetchProducts(signal),
  });
  const products = productQuery.data ?? [];
  const selectedProduct =
    products.find((product) => product.id === selectedProductId) ??
    products[0];
  const selectedVersion =
    selectedProduct?.versions.find(
      (version) => version.id === selectedVersionId,
    ) ?? selectedProduct?.versions[0];

  useEffect(() => {
    if (!products.length) {
      setSelectedProductId(undefined);
      return;
    }
    if (!products.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    const versions = selectedProduct?.versions ?? [];
    if (!versions.length) {
      setSelectedVersionId(undefined);
      return;
    }
    if (!versions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId(versions[0].id);
    }
  }, [selectedProduct, selectedVersionId]);

  const saveProductMutation = useMutation({
    mutationFn: (values: Omit<ProductInput, "sortOrder">) =>
      editingProduct
        ? updateProduct(editingProduct.id, {
            ...values,
            shortName: values.shortName ?? "",
            sortOrder: editingProduct.sortOrder,
          })
        : createProduct({
            ...values,
            shortName: values.shortName ?? "",
            sortOrder: products.length,
          }),
    onSuccess: async (product) => {
      setProductEditorOpen(false);
      setEditingProduct(undefined);
      productForm.resetFields();
      setSelectedProductId(product.id);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
  const saveVersionMutation = useMutation({
    mutationFn: (
      values: Omit<ProductVersionInput, "productId">,
    ) =>
      editingVersion
        ? updateProductVersion(editingVersion.id, {
            ...values,
            productId: selectedProduct!.id,
            displayVersion: values.displayVersion ?? "",
          })
        : createProductVersion({
            ...values,
            productId: selectedProduct!.id,
            displayVersion: values.displayVersion ?? "",
          }),
    onSuccess: async (version) => {
      setVersionEditorOpen(false);
      setEditingVersion(undefined);
      versionForm.resetFields();
      setSelectedVersionId(version.id);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
  const saveModuleMutation = useMutation({
    mutationFn: (
      values: Omit<
        ProductVersionModuleInput,
        "productVersionId" | "sortOrder"
      >,
    ) =>
      editingModule
        ? updateProductVersionModule(editingModule.id, {
            ...values,
            productVersionId: selectedVersion!.id,
            shortName: values.shortName ?? "",
            sortOrder: editingModule.sortOrder,
          })
        : createProductVersionModule({
            ...values,
            productVersionId: selectedVersion!.id,
            shortName: values.shortName ?? "",
            sortOrder: selectedVersion!.modules.length,
          }),
    onSuccess: async () => {
      setModuleEditorOpen(false);
      setEditingModule(undefined);
      moduleForm.resetFields();
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const moduleColumns: TableColumnsType<
    Product["versions"][number]["modules"][number]
  > = [
    {
      title: t("moduleCode"),
      dataIndex: "code",
      sorter: (left, right) =>
        compareLocalizedText(left.code, right.code, locale),
      render: (value: string) => (
        <span className="business-code">{value}</span>
      ),
    },
    {
      title: t("moduleName"),
      dataIndex: "name",
      sorter: (left, right) =>
        compareLocalizedText(left.name, right.name, locale),
    },
    {
      title: t("moduleShortName"),
      dataIndex: "shortName",
      render: (value: string) => value || t("notRegistered"),
    },
    {
      title: t("actions"),
      key: "actions",
      width: 72,
      align: "center",
      render: (_, module) => (
        <Tooltip title={t("editModule")}>
          <Button
            type="text"
            icon={<EditOutlined />}
            aria-label={t("editModule")}
            onClick={() => {
              setEditingModule(module);
              moduleForm.setFieldsValue({
                code: module.code,
                name: module.name,
                shortName: module.shortName,
              });
              saveModuleMutation.reset();
              setModuleEditorOpen(true);
            }}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <div className="basic-master-heading">
        <div>
          <Title level={3}>{t("productVersionMaster")}</Title>
          <p>{t("productVersionMasterDescription")}</p>
        </div>
        <Button
          type="primary"
          onClick={() => {
            setEditingProduct(undefined);
            productForm.resetFields();
            saveProductMutation.reset();
            setProductEditorOpen(true);
          }}
        >
          {t("addProduct")}
        </Button>
      </div>

      <div className="product-version-master-layout">
        <section className="product-master-list">
          <div className="product-master-list-heading">
            <Text strong>{t("products")}</Text>
            <Tag color="cyan">{products.length}</Tag>
          </div>
          {productQuery.isLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : products.length ? (
            <div className="product-master-rows">
              {products.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  className={`product-master-row ${
                    selectedProduct?.id === product.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedProductId(product.id)}
                >
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.shortName || product.code}</small>
                  </span>
                  <span>
                    <span className="business-code">{product.code}</span>
                    <small>
                      {product.versions.length} {t("versions")}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t("productMasterEmpty")}
            />
          )}
        </section>

        <section className="product-version-children">
          {selectedProduct ? (
            <>
              <div className="product-version-heading">
                <div>
                  <span className="eyebrow">{selectedProduct.code}</span>
                  <Title level={4}>{selectedProduct.name}</Title>
                  {selectedProduct.shortName && (
                    <Text>{selectedProduct.shortName}</Text>
                  )}
                </div>
                <Space>
                  <Tooltip title={t("editProduct")}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={t("editProduct")}
                      onClick={() => {
                        setEditingProduct(selectedProduct);
                        productForm.setFieldsValue({
                          code: selectedProduct.code,
                          name: selectedProduct.name,
                          shortName: selectedProduct.shortName,
                        });
                        saveProductMutation.reset();
                        setProductEditorOpen(true);
                      }}
                    />
                  </Tooltip>
                  <Button
                    type="primary"
                    onClick={() => {
                      setEditingVersion(undefined);
                      versionForm.resetFields();
                      saveVersionMutation.reset();
                      setVersionEditorOpen(true);
                    }}
                  >
                    {t("addVersion")}
                  </Button>
                </Space>
              </div>
              <div className="product-version-grandchildren-layout">
                <section className="version-master-list">
                  <div className="product-master-list-heading">
                    <Text strong>{t("versions")}</Text>
                    <Tag color="blue">
                      {selectedProduct.versions.length}
                    </Tag>
                  </div>
                  {selectedProduct.versions.length ? (
                    <div className="version-master-rows">
                      {selectedProduct.versions.map((version) => (
                        <button
                          type="button"
                          key={version.id}
                          className={`version-master-row ${
                            selectedVersion?.id === version.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedVersionId(version.id)
                          }
                        >
                          <span>
                            <strong>{version.version}</strong>
                            <small>
                              {version.displayVersion ||
                                t("notRegistered")}
                            </small>
                          </span>
                          <small>
                            {version.modules.length} {t("modules")}
                          </small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t("versionMasterEmpty")}
                    />
                  )}
                </section>

                <section className="product-module-grandchildren">
                  {selectedVersion ? (
                    <>
                      <div className="product-module-heading">
                        <div>
                          <span className="eyebrow">
                            {selectedVersion.version}
                          </span>
                          <Title level={5}>
                            {selectedVersion.displayVersion ||
                              selectedVersion.version}
                          </Title>
                        </div>
                        <Space>
                          <Tooltip title={t("editVersion")}>
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              aria-label={t("editVersion")}
                              onClick={() => {
                                setEditingVersion(selectedVersion);
                                versionForm.setFieldsValue({
                                  version: selectedVersion.version,
                                  displayVersion:
                                    selectedVersion.displayVersion,
                                });
                                saveVersionMutation.reset();
                                setVersionEditorOpen(true);
                              }}
                            />
                          </Tooltip>
                          <Button
                            type="primary"
                            onClick={() => {
                              setEditingModule(undefined);
                              moduleForm.resetFields();
                              saveModuleMutation.reset();
                              setModuleEditorOpen(true);
                            }}
                          >
                            {t("addModule")}
                          </Button>
                        </Space>
                      </div>
                      <Table
                        rowKey="id"
                        columns={moduleColumns}
                        dataSource={selectedVersion.modules}
                        pagination={false}
                        sortDirections={["ascend", "descend"]}
                        locale={{
                          emptyText: (
                            <Empty
                              description={t("moduleMasterEmpty")}
                            />
                          ),
                        }}
                        scroll={{ x: 520 }}
                      />
                    </>
                  ) : (
                    <Empty description={t("selectVersion")} />
                  )}
                </section>
              </div>
            </>
          ) : (
            <Empty description={t("selectProduct")} />
          )}
        </section>
      </div>

      <Modal
        title={editingProduct ? t("editProduct") : t("addProduct")}
        open={productEditorOpen}
        okText={t("save")}
        cancelText={t("close")}
        confirmLoading={saveProductMutation.isPending}
        onCancel={() => {
          setProductEditorOpen(false);
          setEditingProduct(undefined);
        }}
        onOk={() => productForm.submit()}
        destroyOnHidden
      >
        <Form
          form={productForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => saveProductMutation.mutate(values)}
        >
          <Form.Item
            name="code"
            label={t("productCode")}
            rules={[
              { required: true, message: t("productCodeRequired") },
              {
                pattern: /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/,
                message: t("codePattern"),
              },
            ]}
          >
            <Input maxLength={64} autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="name"
            label={t("masterProductName")}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("productNameRequired"),
              },
            ]}
          >
            <Input maxLength={255} autoComplete="off" />
          </Form.Item>
          <Form.Item name="shortName" label={t("productShortName")}>
            <Input maxLength={120} autoComplete="off" />
          </Form.Item>
          {saveProductMutation.error && (
            <Text type="danger">{t("productSaveFailed")}</Text>
          )}
        </Form>
      </Modal>

      <Modal
        title={`${selectedProduct?.name ?? ""} ${
          editingVersion ? t("editVersion") : t("addVersion")
        }`}
        open={versionEditorOpen}
        okText={t("save")}
        cancelText={t("close")}
        confirmLoading={saveVersionMutation.isPending}
        onCancel={() => {
          setVersionEditorOpen(false);
          setEditingVersion(undefined);
        }}
        onOk={() => versionForm.submit()}
        destroyOnHidden
      >
        <Form
          form={versionForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => saveVersionMutation.mutate(values)}
        >
          <Form.Item
            name="version"
            label={t("canonicalVersion")}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("versionRequired"),
              },
            ]}
          >
            <Input maxLength={100} autoComplete="off" />
          </Form.Item>
          <Form.Item name="displayVersion" label={t("displayVersion")}>
            <Input maxLength={120} autoComplete="off" />
          </Form.Item>
          {saveVersionMutation.error && (
            <Text type="danger">{t("versionSaveFailed")}</Text>
          )}
        </Form>
      </Modal>

      <Modal
        title={`${selectedVersion?.version ?? ""} ${
          editingModule ? t("editModule") : t("addModule")
        }`}
        open={moduleEditorOpen}
        okText={t("save")}
        cancelText={t("close")}
        confirmLoading={saveModuleMutation.isPending}
        onCancel={() => {
          setModuleEditorOpen(false);
          setEditingModule(undefined);
        }}
        onOk={() => moduleForm.submit()}
        destroyOnHidden
      >
        <Form
          form={moduleForm}
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => saveModuleMutation.mutate(values)}
        >
          <Form.Item
            name="code"
            label={t("moduleCode")}
            rules={[
              { required: true, message: t("moduleCodeRequired") },
              {
                pattern: /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/,
                message: t("codePattern"),
              },
            ]}
          >
            <Input maxLength={64} autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="name"
            label={t("moduleName")}
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("moduleNameRequired"),
              },
            ]}
          >
            <Input maxLength={255} autoComplete="off" />
          </Form.Item>
          <Form.Item name="shortName" label={t("moduleShortName")}>
            <Input maxLength={120} autoComplete="off" />
          </Form.Item>
          {saveModuleMutation.error && (
            <Text type="danger">{t("moduleSaveFailed")}</Text>
          )}
        </Form>
      </Modal>
    </>
  );
}

function ModulePage({
  item,
  title,
  snapshot,
  t,
}: {
  item: NavigationItem;
  title: string;
  snapshot: WorkCenterSnapshot;
  t: (key: MessageKey) => string;
}) {
  return (
    <div className="module-page placeholder-module-page">
      <section className="module-hero">
        <span className="module-icon">{item.icon}</span>
        <div>
          <span className="eyebrow">{t("domainLabel")}</span>
          <Title level={1}>{title}</Title>
          <p>{t(item.description)}</p>
        </div>
      </section>
      <div className="module-cards">
        <Card>
          <Statistic
            title={t("organizationsCount")}
            value={snapshot.summary.organizations}
          />
        </Card>
        <Card>
          <Statistic title={t("running")} value={snapshot.summary.running} />
        </Card>
        <Card>
          <Statistic title={t("completed")} value={snapshot.summary.completed} />
        </Card>
      </div>
      <Card className="roadmap-card">
        <img src="/brand/icon-enterprise.svg" alt="" />
        <div>
          <Title level={3}>{t("integratingTitle")}</Title>
          <p>{t("integratingBody")}</p>
        </div>
      </Card>
    </div>
  );
}

function BuilderPage({
  locale,
  organization,
}: {
  locale: LocaleKey;
  organization?: Organization;
}) {
  const query = new URLSearchParams({
    organisation_name: organization?.name ?? "",
    locale,
    embedded: "oneops",
  });
  const source = `/api/work-center/v1/builder/page?${query.toString()}`;

  return (
    <section className="builder-module" aria-label={messages[locale].builder}>
      <iframe
        key={`${organization?.id ?? "none"}:${locale}`}
        className="builder-frame"
        src={source}
        title={messages[locale].builder}
      />
    </section>
  );
}

function memoryPercent(value: number | null) {
  if (value === null) return 0;
  return Math.min(100, Math.max(8, Math.round((value / (32 * 1024 ** 3)) * 100)));
}

function diskPercent(value: number | null) {
  if (value === null) return 0;
  return Math.min(
    100,
    Math.max(8, Math.round((value / (100 * 1024 ** 3)) * 100)),
  );
}

export default App;
