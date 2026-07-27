import {
  CheckCircleOutlined,
  GlobalOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  fetchInquirySupportSettings,
  saveInquirySupportSettings,
  testInquirySupportSettings,
  type InquirySupportSettings,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Text, Title } = Typography;

const settingsCopy = {
  "ja-JP": {
    title: "問合支援設定",
    description: "UPDSの接続情報と、手動AI補助で使用するProviderを設定します。",
    source: "実サイト接続",
    url: "サイトURL",
    product: "製品",
    username: "ログインユーザー",
    password: "ログインパスワード",
    passwordHint: "空欄の場合は保存済みパスワードを維持します",
    enabled: "問合支援を有効にする",
    provider: "分析Provider",
    model: "Model",
    gateway: "Agent Gateway",
    project: "Gateway Project",
    test: "接続テスト",
    save: "保存",
    saved: "問合支援設定を保存しました。",
    tested: "UPDSへのログインを確認しました。",
    failed: "操作に失敗しました。",
  },
  "zh-CN": {
    title: "问询支援设置",
    description: "设置 UPDS 登录信息，以及人工调用 AI 辅助时使用的 Provider。",
    source: "真实网站连接",
    url: "网站地址",
    product: "产品",
    username: "登录账号",
    password: "登录密码",
    passwordHint: "留空时保留已经保存的密码",
    enabled: "启用问询支援",
    provider: "分析 Provider",
    model: "Model",
    gateway: "Agent Gateway",
    project: "Gateway Project",
    test: "连接测试",
    save: "保存",
    saved: "问询支援设置已保存。",
    tested: "已确认可以登录 UPDS。",
    failed: "操作失败。",
  },
  "en-US": {
    title: "Inquiry Support Settings",
    description: "Configure UPDS access and the provider used for manual AI assistance.",
    source: "Live site connection",
    url: "Site URL",
    product: "Product",
    username: "Login user",
    password: "Login password",
    passwordHint: "Leave blank to preserve the saved password",
    enabled: "Enable inquiry support",
    provider: "Analysis provider",
    model: "Model",
    gateway: "Agent Gateway",
    project: "Gateway project",
    test: "Test connection",
    save: "Save",
    saved: "Inquiry support settings were saved.",
    tested: "UPDS login succeeded.",
    failed: "Operation failed.",
  },
} as const;

type SettingsForm = Pick<
  InquirySupportSettings,
  | "baseUrl"
  | "username"
  | "enabled"
  | "analysisProvider"
  | "modelSettingId"
  | "agentGatewaySettingId"
  | "agentGatewayProjectRef"
> & { password: string };

export function InquirySupportSettingsPage({
  locale,
  canWrite,
}: {
  locale: LocaleKey;
  canWrite: boolean;
}) {
  const labels = settingsCopy[locale];
  const queryClient = useQueryClient();
  const [form] = Form.useForm<SettingsForm>();
  const settingsQuery = useQuery({
    queryKey: ["inquiry-support-settings"],
    queryFn: ({ signal }) => fetchInquirySupportSettings(signal),
  });
  const provider = Form.useWatch("analysisProvider", form);
  const saveMutation = useMutation({
    mutationFn: saveInquirySupportSettings,
    onSuccess: async (settings) => {
      form.setFieldValue("password", "");
      await queryClient.invalidateQueries({
        queryKey: ["inquiry-support-settings"],
      });
      return settings;
    },
  });
  const testMutation = useMutation({
    mutationFn: testInquirySupportSettings,
  });

  useEffect(() => {
    const settings = settingsQuery.data?.settings;
    if (!settings) return;
    form.setFieldsValue({
      baseUrl: settings.baseUrl,
      username: settings.username,
      password: "",
      enabled: settings.enabled,
      analysisProvider: settings.analysisProvider,
      modelSettingId: settings.modelSettingId,
      agentGatewaySettingId: settings.agentGatewaySettingId,
      agentGatewayProjectRef: settings.agentGatewayProjectRef,
    });
  }, [form, settingsQuery.data]);

  return (
    <div className="inquiry-settings-page">
      <div className="basic-master-heading">
        <div>
          <Title level={3}>{labels.title}</Title>
          <p>{labels.description}</p>
        </div>
      </div>
      <Card
        title={
          <Space>
            <SafetyCertificateOutlined />
            {labels.source}
          </Space>
        }
        loading={settingsQuery.isLoading}
      >
        <Form
          form={form}
          layout="vertical"
          disabled={!canWrite}
          onFinish={(values) => saveMutation.mutate(values)}
          className="inquiry-settings-form"
        >
          <Form.Item
            name="baseUrl"
            label={labels.url}
            rules={[{ required: true }, { type: "url" }]}
          >
            <Input prefix={<GlobalOutlined />} />
          </Form.Item>
          <Form.Item label={labels.product}>
            <Input value="UPDS" disabled />
          </Form.Item>
          <Form.Item
            name="username"
            label={labels.username}
            rules={[{ required: true }]}
          >
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label={labels.password}
            extra={
              settingsQuery.data?.settings.passwordConfigured
                ? labels.passwordHint
                : undefined
            }
            rules={[
              {
                validator: (_, value) =>
                  value ||
                  settingsQuery.data?.settings.passwordConfigured
                    ? Promise.resolve()
                    : Promise.reject(new Error(labels.password)),
              },
            ]}
          >
            <Input.Password
              autoComplete="new-password"
              visibilityToggle={false}
            />
          </Form.Item>
          <Form.Item
            name="analysisProvider"
            label={labels.provider}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "MODEL", label: "Model" },
                { value: "AGENT_GATEWAY", label: "Agent Gateway" },
              ]}
            />
          </Form.Item>
          {provider === "MODEL" ? (
            <Form.Item
              name="modelSettingId"
              label={labels.model}
              rules={[{ required: true }]}
            >
              <Select
                options={(settingsQuery.data?.models ?? []).map((model) => ({
                  value: model.id,
                  label: `${model.model} · ${model.purpose}`,
                }))}
              />
            </Form.Item>
          ) : (
            <>
              <Form.Item
                name="agentGatewaySettingId"
                label={labels.gateway}
                rules={[{ required: true }]}
              >
                <Select
                  options={(settingsQuery.data?.agentGateways ?? [])
                    .filter((gateway) => gateway.enabled)
                    .map((gateway) => ({
                      value: gateway.id,
                      label: gateway.name,
                    }))}
                />
              </Form.Item>
              <Form.Item
                name="agentGatewayProjectRef"
                label={labels.project}
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </>
          )}
          <Form.Item name="enabled" valuePropName="checked">
            <Switch checkedChildren={labels.enabled} unCheckedChildren={labels.enabled} />
          </Form.Item>
          {saveMutation.isSuccess && (
            <Alert type="success" showIcon message={labels.saved} />
          )}
          {testMutation.isSuccess && (
            <Alert type="success" showIcon message={labels.tested} />
          )}
          {(saveMutation.error || testMutation.error) && (
            <Alert
              type="error"
              showIcon
              message={labels.failed}
              description={
                saveMutation.error?.message ?? testMutation.error?.message
              }
            />
          )}
          <Space className="inquiry-settings-actions">
            <Button
              icon={<CheckCircleOutlined />}
              loading={testMutation.isPending}
              onClick={() => {
                form
                  .validateFields()
                  .then((values) => testMutation.mutate(values));
              }}
            >
              {labels.test}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saveMutation.isPending}
            >
              {labels.save}
            </Button>
          </Space>
        </Form>
      </Card>
      {!canWrite && <Text type="secondary">{labels.description}</Text>}
    </div>
  );
}
