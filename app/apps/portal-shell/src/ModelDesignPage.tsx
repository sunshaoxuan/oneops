import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiOutlined,
  CheckCircleFilled,
  CloudServerOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  fetchModelSettings,
  saveModelSettings,
  testModelConnection,
  type ModelConnectionTestResult,
  type ModelSettingsInput,
} from "@one-ops/api-client";
import type { LocaleKey, MessageKey } from "./i18n";

const { Text, Title } = Typography;

function connectionMessage(
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

export function ModelDesignPage({
  t,
  locale,
  canWrite,
}: {
  t: (key: MessageKey) => string;
  locale: LocaleKey;
  canWrite: boolean;
}) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm<ModelSettingsInput>();
  const [connectionResult, setConnectionResult] =
    useState<ModelConnectionTestResult | null>(null);
  const [saveCompleted, setSaveCompleted] = useState(false);
  const settingsQuery = useQuery({
    queryKey: ["model-settings"],
    queryFn: ({ signal }) => fetchModelSettings(signal),
  });
  const saveMutation = useMutation({
    mutationFn: saveModelSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(["model-settings"], settings);
      form.setFieldValue("apiKey", "");
      setSaveCompleted(true);
    },
  });
  const testMutation = useMutation({
    mutationFn: testModelConnection,
    onSuccess: setConnectionResult,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    form.setFieldsValue({
      provider: settingsQuery.data.provider,
      endpoint: settingsQuery.data.endpoint,
      model: settingsQuery.data.model,
      apiKey: "",
    });
  }, [form, settingsQuery.data]);

  const submit = async (action: "save" | "test") => {
    setSaveCompleted(false);
    setConnectionResult(null);
    const values = await form.validateFields();
    if (action === "save") {
      saveMutation.mutate(values);
    } else {
      testMutation.mutate(values);
    }
  };

  const updatedAt = settingsQuery.data?.updatedAt
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(settingsQuery.data.updatedAt))
    : "";

  return (
    <div className="model-design-page">
      <div className="basic-master-heading">
        <div>
          <Title level={3}>{t("modelDesign")}</Title>
          <p>{t("modelDesignDescription")}</p>
        </div>
        <Tag
          color={settingsQuery.data?.apiKeyConfigured ? "success" : "default"}
          icon={
            settingsQuery.data?.apiKeyConfigured
              ? <CheckCircleFilled />
              : <KeyOutlined />
          }
        >
          {settingsQuery.data?.apiKeyConfigured
            ? t("modelApiKeyConfigured")
            : t("modelApiKeyNotConfigured")}
        </Tag>
      </div>

      {settingsQuery.isLoading ? (
        <div className="model-design-loading">
          <Spin />
        </div>
      ) : (
        <Card className="model-settings-card">
          <div className="model-settings-card-heading">
            <span className="model-settings-icon">
              <ApiOutlined />
            </span>
            <div>
              <Title level={4}>{t("modelApiSettings")}</Title>
              <Text type="secondary">{t("modelApiSettingsDescription")}</Text>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            className="model-settings-form"
            initialValues={{
              provider: "OPENAI",
              endpoint: "https://api.openai.com/v1",
              model: "",
              apiKey: "",
            }}
            disabled={!canWrite}
          >
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
              name="model"
              label={t("modelName")}
              extra={t("modelNameHelp")}
              rules={[
                { required: true, whitespace: true, message: t("modelNameRequired") },
              ]}
            >
              <Input
                maxLength={255}
                autoComplete="off"
                placeholder="gpt-5.6"
              />
            </Form.Item>
            <Form.Item
              name="apiKey"
              label={t("modelApiKey")}
              rules={[
                {
                  validator: (_, value) =>
                    settingsQuery.data?.apiKeyConfigured ||
                    String(value ?? "").trim()
                      ? Promise.resolve()
                      : Promise.reject(new Error(t("modelApiKeyRequired"))),
                },
              ]}
              extra={
                settingsQuery.data?.apiKeyConfigured
                  ? t("modelApiKeyKeepHelp")
                  : t("modelApiKeyHelp")
              }
            >
              <Input.Password
                maxLength={8192}
                autoComplete="new-password"
                placeholder={
                  settingsQuery.data?.apiKeyConfigured
                    ? t("modelApiKeyConfiguredPlaceholder")
                    : t("modelApiKeyPlaceholder")
                }
              />
            </Form.Item>

            <Space wrap className="model-settings-actions">
              <Button
                icon={<ApiOutlined />}
                loading={testMutation.isPending}
                onClick={() => void submit("test")}
              >
                {t("testModelConnection")}
              </Button>
              <Button
                type="primary"
                loading={saveMutation.isPending}
                onClick={() => void submit("save")}
              >
                {t("saveModelSettings")}
              </Button>
            </Space>
          </Form>

          {settingsQuery.data?.updatedAt && (
            <Text className="model-settings-updated" type="secondary">
              {t("modelSettingsUpdated")}: {updatedAt}
              {settingsQuery.data.updatedBy
                ? ` · ${settingsQuery.data.updatedBy}`
                : ""}
            </Text>
          )}

          {saveCompleted && (
            <Alert
              showIcon
              type="success"
              message={t("modelSettingsSaved")}
            />
          )}
          {(settingsQuery.error || saveMutation.error || testMutation.error) && (
            <Alert
              showIcon
              type="error"
              message={t("modelSettingsOperationFailed")}
              description={
                (settingsQuery.error || saveMutation.error || testMutation.error)
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
                  ? t("modelConnectionSucceeded")
                  : connectionMessage(connectionResult.code, t)
              }
              description={`${connectionResult.latencyMs} ms · ${
                connectionResult.modelsCount
              } ${t("modelCountUnit")}`}
            />
          )}
        </Card>
      )}
    </div>
  );
}
