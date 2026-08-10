import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  DeleteOutlined,
  KeyOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from "antd";
import {
  deleteAgentGatewaySettings,
  deleteAIModelSettings,
  discoverAIModels,
  fetchAISettings,
  saveAgentGatewaySettings,
  saveAIModelSettings,
  testAgentGatewaySettings,
  testAIModelConnection,
  type AgentGatewayConnectionTestResult,
  type AgentGatewaySettings,
  type AgentGatewaySettingsInput,
  type ModelConnectionTestResult,
  type ModelSettings,
  type ModelSettingsInput,
} from "@one-ops/api-client";
import type { LocaleKey, MessageKey } from "./i18n";
import { SecretInput } from "./SecretInput";

const { Text, Title } = Typography;

function modelConnectionMessage(
  code: string,
  t: (key: MessageKey) => string,
) {
  const messages: Record<string, MessageKey> = {
    MODEL_AUTHENTICATION_FAILED: "modelConnectionAuthFailed",
    MODEL_ACCESS_DENIED: "modelConnectionAccessDenied",
    MODEL_ENDPOINT_NOT_FOUND: "modelConnectionEndpointNotFound",
    MODEL_RATE_LIMITED: "modelConnectionRateLimited",
    MODEL_CONNECTION_TIMEOUT: "modelConnectionTimeout",
    MODEL_NOT_AVAILABLE: "modelConnectionModelMissing",
    MODEL_RESPONSE_INVALID: "modelConnectionResponseInvalid",
    MODEL_RESPONSE_TOO_LARGE: "modelConnectionResponseInvalid",
  };
  return t(messages[code] ?? "modelConnectionFailed");
}

function gatewayConnectionMessage(
  code: string,
  t: (key: MessageKey) => string,
) {
  const messages: Record<string, MessageKey> = {
    AGENT_GATEWAY_AUTHENTICATION_FAILED: "agentGatewayConnectionAuthFailed",
    AGENT_GATEWAY_ACCESS_DENIED: "agentGatewayConnectionAccessDenied",
    AGENT_GATEWAY_ENDPOINT_NOT_FOUND: "agentGatewayConnectionEndpointNotFound",
    AGENT_GATEWAY_RATE_LIMITED: "agentGatewayConnectionRateLimited",
    AGENT_GATEWAY_CONNECTION_TIMEOUT: "agentGatewayConnectionTimeout",
    AGENT_GATEWAY_RESPONSE_INVALID: "agentGatewayConnectionResponseInvalid",
    AGENT_GATEWAY_RESPONSE_TOO_LARGE: "agentGatewayConnectionResponseInvalid",
  };
  return t(messages[code] ?? "agentGatewayConnectionFailed");
}

function formatUpdatedAt(
  value: string | null,
  locale: LocaleKey,
) {
  return value
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "";
}

function emptyModelSettings(purpose: "GENERAL" | "INQUIRY"): ModelSettings {
  return {
    id: null,
    purpose,
    displayName: "",
    provider: "OPENAI",
    endpoint: "https://api.openai.com/v1",
    model: "",
    apiKey: "",
    apiKeyConfigured: false,
    reasoningEffort: "MEDIUM",
    speedLevel: "MEDIUM",
    enabled: true,
    sortOrder: 100,
    isDefault: purpose === "INQUIRY",
    updatedAt: null,
    updatedBy: "",
  };
}

function ModelSettingsCard({
  settings,
  t,
  locale,
  canWrite,
  onCancel,
}: {
  settings: ModelSettings;
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  canWrite: boolean;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ModelSettingsInput>();
  const [connectionResult, setConnectionResult] =
    useState<ModelConnectionTestResult | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>(
    settings.model ? [settings.model] : [],
  );
  const [saveCompleted, setSaveCompleted] = useState(false);
  const saveMutation = useMutation({
    mutationFn: (values: ModelSettingsInput) =>
      saveAIModelSettings(settings.id, values),
    onSuccess: (saved) => {
      form.setFieldValue("apiKey", saved.apiKey);
      setSaveCompleted(true);
      onCancel?.();
      void queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
    },
  });
  const testMutation = useMutation({
    mutationFn: (values: ModelSettingsInput) =>
      testAIModelConnection(settings.id, values),
    onSuccess: setConnectionResult,
  });
  const discoverMutation = useMutation({
    mutationFn: (values: Pick<ModelSettingsInput, "endpoint" | "apiKey">) =>
      discoverAIModels(settings.id, values),
    onSuccess: (result) => {
      if (!result.success) {
        setConnectionResult(result);
        return;
      }
      setConnectionResult(null);
      setAvailableModels(result.models);
      const selected = form.getFieldValue("model");
      if (!result.models.includes(selected)) {
        form.setFieldValue("model", undefined);
      }
    },
  });

  useEffect(() => {
    form.setFieldsValue({
      provider: settings.provider,
      purpose: settings.purpose,
      displayName: settings.displayName,
      endpoint: settings.endpoint,
      model: settings.model,
      apiKey: settings.apiKey,
      reasoningEffort: settings.reasoningEffort,
      speedLevel: settings.speedLevel,
      enabled: settings.enabled,
      sortOrder: settings.sortOrder,
      isDefault: settings.isDefault,
    });
    setAvailableModels(settings.model ? [settings.model] : []);
  }, [form, settings]);

  const submit = async (action: "save" | "test") => {
    setSaveCompleted(false);
    setConnectionResult(null);
    const values = await form.validateFields();
    if (action === "save") saveMutation.mutate(values);
    else testMutation.mutate(values);
  };
  const loadModels = async () => {
    setConnectionResult(null);
    const values = await form.validateFields(["endpoint", "apiKey"]);
    discoverMutation.mutate({
      endpoint: values.endpoint,
      apiKey: values.apiKey,
    });
  };

  const title = settings.purpose === "GENERAL"
    ? settings.displayName || t("aiModelGeneralNew")
    : t("aiModelInquiry");
  const description = settings.purpose === "GENERAL"
    ? t("aiModelGeneralDescription")
    : t("aiModelInquiryDescription");
  const deleteMutation = useMutation({
    mutationFn: () => deleteAIModelSettings(String(settings.id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-settings"] }),
  });

  return (
    <Card className="model-settings-card">
      <div className="model-settings-card-heading">
        <span className="model-settings-icon">
          <ApiOutlined />
        </span>
        <div>
          <Space size={10}>
            <Title level={4}>{title}</Title>
            <Tag
              color={settings.apiKeyConfigured ? "success" : "default"}
              icon={
                settings.apiKeyConfigured
                  ? <CheckCircleFilled />
                  : <KeyOutlined />
              }
            >
              {settings.apiKeyConfigured
                ? t("modelApiKeyConfigured")
                : t("modelApiKeyNotConfigured")}
            </Tag>
          </Space>
          <Text type="secondary">{description}</Text>
          <Space wrap size={6}>
            <Tag color="purple">{t(`modelReasoning${settings.reasoningEffort}` as MessageKey)}</Tag>
            <Tag color="blue">{t(`modelSpeed${settings.speedLevel}` as MessageKey)}</Tag>
            {settings.isDefault && <Tag color="gold">{t("modelDefault")}</Tag>}
          </Space>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        className="model-settings-form"
        disabled={!canWrite}
      >
        <Form.Item name="purpose" hidden><Input /></Form.Item>
        <Form.Item
          name="displayName"
          label={t("modelDisplayName")}
          rules={[{ required: true, whitespace: true }]}
        >
          <Input maxLength={100} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="provider"
          label={t("modelProvider")}
          rules={[{ required: true }]}
        >
          <Select
            options={[{ value: "OPENAI", label: "OpenAI" }]}
            suffixIcon={<CloudServerOutlined />}
          />
        </Form.Item>
        <Form.Item
          name="reasoningEffort"
          label={t("modelReasoningEffort")}
          extra={t("modelReasoningEffortHelp")}
        >
          <Select options={[
            { value: "XHIGH", label: t("modelReasoningXHIGH") },
            { value: "HIGH", label: t("modelReasoningHIGH") },
            { value: "MEDIUM", label: t("modelReasoningMEDIUM") },
          ]} />
        </Form.Item>
        <Form.Item
          name="speedLevel"
          label={t("modelSpeedLevel")}
          extra={t("modelSpeedLevelHelp")}
        >
          <Select options={[
            { value: "FAST", label: t("modelSpeedFAST") },
            { value: "MEDIUM", label: t("modelSpeedMEDIUM") },
            { value: "SLOW", label: t("modelSpeedSLOW") },
          ]} />
        </Form.Item>
        <Form.Item name="sortOrder" label={t("modelSortOrder")}>
          <InputNumber min={0} max={9999} precision={0} />
        </Form.Item>
        <Form.Item name="enabled" label={t("modelEnabled")} valuePropName="checked">
          <Switch />
        </Form.Item>
        {settings.purpose === "GENERAL" && (
          <Form.Item name="isDefault" label={t("modelDefault")} valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
        <Form.Item
          name="endpoint"
          label={t("modelEndpoint")}
          extra={t("modelEndpointHelp")}
          rules={[
            { required: true, message: t("modelEndpointRequired") },
            { type: "url", message: t("modelEndpointInvalid") },
          ]}
        >
          <Input
            maxLength={2048}
            autoComplete="url"
            placeholder="https://api.openai.com/v1"
          />
        </Form.Item>
        <Form.Item
          name="apiKey"
          label={t("modelApiKey")}
          rules={[
            {
              validator: (_, value) =>
                settings.apiKeyConfigured || String(value ?? "").trim()
                  ? Promise.resolve()
                  : Promise.reject(new Error(t("modelApiKeyRequired"))),
            },
          ]}
          extra={
            settings.apiKeyConfigured
              ? t("modelApiKeyKeepHelp")
              : t("modelApiKeyHelp")
          }
        >
          <SecretInput
            maxLength={8192}
            autoComplete="new-password"
            placeholder={t("modelApiKeyPlaceholder")}
            copyLabel={t("copySecret")}
            copiedLabel={t("copiedSecret")}
            copyFailedLabel={t("copySecretFailed")}
          />
        </Form.Item>
        <Form.Item
          name="model"
          label={t("modelName")}
          extra={t("modelNameHelp")}
          rules={[{ required: true, message: t("modelNameRequired") }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t("modelNamePlaceholder")}
            options={availableModels.map((model) => ({
              value: model,
              label: model,
            }))}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Button
                  block
                  type="text"
                  icon={<ReloadOutlined />}
                  loading={discoverMutation.isPending}
                  onClick={() => void loadModels()}
                >
                  {t("loadModelList")}
                </Button>
              </>
            )}
          />
        </Form.Item>

      </Form>

      <div className="management-card-footer">
        {settings.updatedAt && (
          <Text className="model-settings-updated" type="secondary">
            {t("modelSettingsUpdated")}:{" "}
            {formatUpdatedAt(settings.updatedAt, locale)}
            {settings.updatedBy ? ` · ${settings.updatedBy}` : ""}
          </Text>
        )}
        <Space wrap className="management-card-actions">
          <Button
            icon={<ApiOutlined />}
            loading={testMutation.isPending}
            onClick={() => void submit("test")}
          >
            {t("testModelConnection")}
          </Button>
          {onCancel && (
            <Button onClick={onCancel}>{t("modelCancel")}</Button>
          )}
          {settings.id && settings.purpose === "GENERAL" && (
            <Popconfirm
              title={t("modelDeleteConfirm")}
              onConfirm={() => deleteMutation.mutate()}
            >
              <Button danger icon={<DeleteOutlined />}>{t("modelDelete")}</Button>
            </Popconfirm>
          )}
          <Button
            type="primary"
            loading={saveMutation.isPending}
            onClick={() => void submit("save")}
          >
            {t("saveModelSettings")}
          </Button>
        </Space>
      </div>

      {saveCompleted && (
        <Alert showIcon type="success" message={t("modelSettingsSaved")} />
      )}
      {(saveMutation.error || testMutation.error || discoverMutation.error) && (
        <Alert
          showIcon
          type="error"
          message={t("modelSettingsOperationFailed")}
          description={(
            saveMutation.error || testMutation.error || discoverMutation.error
          )?.message}
        />
      )}
      {connectionResult && (
        <Alert
          showIcon
          type={connectionResult.success ? "success" : "error"}
          message={
            connectionResult.success
              ? t("modelConnectionSucceeded")
              : modelConnectionMessage(connectionResult.code, t)
          }
          description={`${connectionResult.latencyMs} ms · ${
            connectionResult.modelsCount
          } ${t("modelCountUnit")}`}
        />
      )}
    </Card>
  );
}

function AgentGatewayCard({
  settings,
  t,
  locale,
  canWrite,
  onCreated,
}: {
  settings: AgentGatewaySettings | null;
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  canWrite: boolean;
  onCreated?: () => void;
}) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<AgentGatewaySettingsInput>();
  const [connectionResult, setConnectionResult] =
    useState<AgentGatewayConnectionTestResult | null>(null);
  const [saveCompleted, setSaveCompleted] = useState(false);
  const saveMutation = useMutation({
    mutationFn: saveAgentGatewaySettings,
    onSuccess: (saved) => {
      form.setFieldsValue({
        id: saved.id,
        name: saved.name,
        endpoint: saved.endpoint,
        fallbackEndpoints: saved.fallbackEndpoints,
        accessToken: saved.accessToken,
        enabled: saved.enabled,
      });
      setSaveCompleted(true);
      onCreated?.();
      void queryClient.invalidateQueries({ queryKey: ["ai-settings"] });
    },
  });
  const testMutation = useMutation({
    mutationFn: testAgentGatewaySettings,
    onSuccess: setConnectionResult,
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAgentGatewaySettings,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["ai-settings"] }),
  });

  useEffect(() => {
    form.setFieldsValue({
      id: settings?.id ?? null,
      name: settings?.name ?? "",
      endpoint: settings?.endpoint ?? "",
      fallbackEndpoints: settings?.fallbackEndpoints ?? [],
      accessToken: settings?.accessToken ?? "",
      enabled: settings?.enabled ?? true,
    });
  }, [form, settings]);

  const submit = async (action: "save" | "test") => {
    setSaveCompleted(false);
    setConnectionResult(null);
    const values = await form.validateFields();
    if (action === "save") saveMutation.mutate(values);
    else testMutation.mutate(values);
  };

  return (
    <Card className="model-settings-card agent-gateway-card">
      <div className="model-settings-card-heading">
        <span className="model-settings-icon agent-gateway-icon">
          <RobotOutlined />
        </span>
        <div>
          <Title level={4}>
            {settings?.name || t("agentGatewayNew")}
          </Title>
          <Text type="secondary">{t("agentGatewayCardDescription")}</Text>
        </div>
        <Tag
          className="agent-gateway-status"
          color={(settings?.enabled ?? true) ? "success" : "default"}
        >
          {(settings?.enabled ?? true)
            ? t("agentGatewayEnabled")
            : t("agentGatewayDisabled")}
        </Tag>
      </div>

      <Form
        form={form}
        layout="vertical"
        className="model-settings-form agent-gateway-form"
        disabled={!canWrite}
      >
        <Form.Item name="id" hidden><Input /></Form.Item>
        <Form.Item
          className="agent-gateway-name"
          name="name"
          label={t("agentGatewayName")}
          rules={[
            {
              required: true,
              whitespace: true,
              message: t("agentGatewayNameRequired"),
            },
          ]}
        >
          <Input maxLength={255} autoComplete="off" />
        </Form.Item>
        <Form.Item
          className="agent-gateway-endpoint"
          name="endpoint"
          label={t("agentGatewayEndpoint")}
          extra={t("agentGatewayEndpointHelp")}
          rules={[
            { required: true, message: t("agentGatewayEndpointRequired") },
            { type: "url", message: t("modelEndpointInvalid") },
          ]}
        >
          <Input
            maxLength={2048}
            autoComplete="url"
            placeholder="http://127.0.0.1:8000/api/v1"
          />
        </Form.Item>
        <Form.Item
          className="agent-gateway-fallback-endpoints"
          name="fallbackEndpoints"
          label={t("agentGatewayFallbackEndpoints")}
          extra={t("agentGatewayFallbackEndpointsHelp")}
        >
          <Select
            mode="tags"
            tokenSeparators={[",", "\n"]}
            placeholder="http://127.0.0.1:8001/api/v1"
            options={[]}
          />
        </Form.Item>
        <Form.Item
          className="agent-gateway-enabled"
          name="enabled"
          label={t("agentGatewayStatus")}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          className="agent-gateway-token"
          name="accessToken"
          label={t("agentGatewayAccessToken")}
          extra={t("agentGatewayAccessTokenHelp")}
        >
          <SecretInput
            maxLength={8192}
            autoComplete="new-password"
            placeholder={t("agentGatewayAccessTokenPlaceholder")}
            copyLabel={t("copySecret")}
            copiedLabel={t("copiedSecret")}
            copyFailedLabel={t("copySecretFailed")}
          />
        </Form.Item>

      </Form>

      <div className="management-card-footer">
        {settings?.updatedAt && (
          <Text className="model-settings-updated" type="secondary">
            {t("modelSettingsUpdated")}:{" "}
            {formatUpdatedAt(settings.updatedAt, locale)}
            {settings.updatedBy ? ` · ${settings.updatedBy}` : ""}
          </Text>
        )}
        <Space wrap className="management-card-actions">
          <Button
            icon={<ApiOutlined />}
            loading={testMutation.isPending}
            onClick={() => void submit("test")}
          >
            {t("testModelConnection")}
          </Button>
          {settings?.id && (
            <Popconfirm
              title={t("agentGatewayDeleteConfirm")}
              onConfirm={() => deleteMutation.mutate(settings.id)}
            >
              <Button danger icon={<DeleteOutlined />}>
                {t("agentGatewayDelete")}
              </Button>
            </Popconfirm>
          )}
          <Button
            type="primary"
            loading={saveMutation.isPending}
            onClick={() => void submit("save")}
          >
            {t("saveModelSettings")}
          </Button>
        </Space>
      </div>

      {saveCompleted && (
        <Alert showIcon type="success" message={t("agentGatewaySaved")} />
      )}
      {(saveMutation.error || testMutation.error || deleteMutation.error) && (
        <Alert
          showIcon
          type="error"
          message={t("agentGatewayOperationFailed")}
          description={
            (saveMutation.error || testMutation.error || deleteMutation.error)
              ?.message
          }
        />
      )}
      {connectionResult && (
        <Alert
          showIcon
          type={connectionResult.success ? "success" : "error"}
          message={
            connectionResult.success
              ? t("agentGatewayConnectionSucceeded")
              : gatewayConnectionMessage(connectionResult.code, t)
          }
          description={`${connectionResult.latencyMs} ms · ${
            connectionResult.projectsCount
          } ${t("agentGatewayProjectCountUnit")}`}
        />
      )}
    </Card>
  );
}

export function ModelDesignPage({
  t,
  locale,
  canWrite,
  section,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  canWrite: boolean;
  section: "model-api" | "agent-gateways";
}) {
  const [addingGateway, setAddingGateway] = useState(false);
  const [addingModel, setAddingModel] = useState(false);
  const settingsQuery = useQuery({
    queryKey: ["ai-settings"],
    queryFn: ({ signal }) => fetchAISettings(signal),
  });

  return (
    <div className="model-design-page">
      <div className="portal-section-heading basic-master-heading">
        <span className="portal-section-heading-icon">
          {section === "model-api" ? <ApiOutlined /> : <CloudServerOutlined />}
        </span>
        <div>
          <Title level={3}>
            {t(
              section === "model-api"
                ? "modelApiSettings"
                : "agentGatewaySettings",
            )}
          </Title>
          <p>
            {t(
              section === "model-api"
                ? "modelApiSettingsDescription"
                : "agentGatewaySettingsDescription",
            )}
          </p>
        </div>
        {canWrite && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={section === "model-api" ? addingModel : addingGateway}
            onClick={() => section === "model-api"
              ? setAddingModel(true)
              : setAddingGateway(true)}
          >
            {t(section === "model-api" ? "modelAdd" : "agentGatewayAdd")}
          </Button>
        )}
      </div>

      {settingsQuery.isLoading ? (
        <div className="model-design-loading"><Spin /></div>
      ) : settingsQuery.error ? (
        <Alert
          showIcon
          type="error"
          message={t("modelSettingsOperationFailed")}
          description={settingsQuery.error.message}
        />
      ) : section === "model-api" ? (
        <div className="ai-settings-card-list">
          {addingModel && (
            <ModelSettingsCard
              settings={emptyModelSettings("GENERAL")}
              t={t}
              locale={locale}
              canWrite={canWrite}
              onCancel={() => setAddingModel(false)}
            />
          )}
          {(settingsQuery.data?.models ?? [])
            .filter((settings) => settings.purpose === "GENERAL")
            .map((settings) => (
            <ModelSettingsCard
              key={settings.id}
              settings={settings}
              t={t}
              locale={locale}
              canWrite={canWrite}
            />
          ))}
          <ModelSettingsCard
            key={(settingsQuery.data?.models ?? []).find(
              (settings) => settings.purpose === "INQUIRY",
            )?.id ?? "inquiry-new"}
            settings={(settingsQuery.data?.models ?? []).find(
              (settings) => settings.purpose === "INQUIRY",
            ) ?? emptyModelSettings("INQUIRY")}
            t={t}
            locale={locale}
            canWrite={canWrite}
          />
        </div>
      ) : (
        <div className="ai-settings-card-list">
          {(settingsQuery.data?.agentGateways.length ?? 0) === 0 &&
            !addingGateway && (
              <Card className="agent-gateway-empty">
                <Empty description={t("agentGatewayEmpty")} />
              </Card>
            )}
          {addingGateway && (
            <AgentGatewayCard
              settings={null}
              t={t}
              locale={locale}
              canWrite={canWrite}
              onCreated={() => setAddingGateway(false)}
            />
          )}
          {(settingsQuery.data?.agentGateways ?? []).map((settings) => (
            <AgentGatewayCard
              key={settings.id}
              settings={settings}
              t={t}
              locale={locale}
              canWrite={canWrite}
            />
          ))}
          <Alert
            showIcon
            type="info"
            message={t("agentGatewaySseTitle")}
            description={t("agentGatewaySseDescription")}
          />
        </div>
      )}
    </div>
  );
}
