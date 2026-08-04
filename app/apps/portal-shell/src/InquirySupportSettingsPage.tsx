import {
  ApiOutlined,
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
  Space,
  Switch,
  Tag,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ChangeEventHandler } from "react";
import {
  fetchInquirySupportSettings,
  saveBacklogSystemSettings,
  saveInquirySupportSettings,
  testBacklogSystemSettings,
  testInquirySupportSettings,
  type BacklogConnectionTestResult,
  type BacklogSystemSettings,
  type InquirySupportSettings,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import { SecretInput } from "./SecretInput";

const { Text, Title } = Typography;

const settingsCopy = {
  "ja-JP": {
    title: "外部タスク設定",
    description: "全利用者が共通で使用する外部業務サイトの接続情報を管理します。",
    common: "システム共通",
    updsTitle: "UPDSサポートサイト",
    updsDescription: "問合支援で使用する UPDS のサイト接続と共通ログイン情報です。",
    backlogTitle: "Backlog",
    backlogDescription: "Backlog API またはログイン画面へ接続する共通設定です。",
    loginUrl: "ログイン URL",
    apiUrl: "API URL（任意）",
    apiUrlHelp: "未入力の場合はログイン URL を基準にします。",
    product: "製品",
    username: "ログインユーザー",
    password: "ログインパスワード",
    apiKey: "API Key（任意）",
    apiKeyHelp:
      "Backlog 公式 API は API Key または OAuth 2.0 を使用します。API Key がない場合はログイン画面接続として保存します。",
    passwordHint: "保存済みの値を完全に再表示します。目のアイコンで確認し、コピーボタンでコピーできます",
    copySecret: "秘密情報をコピー",
    copiedSecret: "コピーしました",
    copySecretFailed: "コピーできませんでした",
    updsEnabled: "UPDS 接続を有効にする",
    backlogEnabled: "Backlog 接続を有効にする",
    apiMode: "API 認証",
    loginMode: "ログイン画面",
    test: "接続テスト",
    save: "保存",
    updsSaved: "UPDSサポートサイト設定を保存しました。",
    backlogSaved: "Backlog 設定を保存しました。",
    updsTested: "UPDS へのログインを確認しました。",
    backlogApiTested: "Backlog API の認証を確認しました。",
    backlogLoginTested:
      "ログイン URL への到達を確認しました。画面ログイン認証は実際の取得処理で確認します。",
    failed: "操作に失敗しました。",
  },
  "zh-CN": {
    title: "外部任务设置",
    description: "管理所有用户共同使用的外部业务网站连接信息。",
    common: "系统共用",
    updsTitle: "UPDS 支持网站",
    updsDescription: "问询支援使用的 UPDS 网站连接及共用登录信息。",
    backlogTitle: "Backlog",
    backlogDescription: "连接 Backlog API 或登录画面的共用设置。",
    loginUrl: "登录 URL",
    apiUrl: "API URL（可选）",
    apiUrlHelp: "未填写时以登录 URL 为基准。",
    product: "产品",
    username: "登录账号",
    password: "登录密码",
    apiKey: "API Key（可选）",
    apiKeyHelp:
      "Backlog 官方 API 使用 API Key 或 OAuth 2.0。没有 API Key 时按登录画面连接保存。",
    passwordHint: "完整回填已保存的值，可使用眼睛图标查看并复制",
    copySecret: "复制秘密信息",
    copiedSecret: "已复制",
    copySecretFailed: "复制失败",
    updsEnabled: "启用 UPDS 连接",
    backlogEnabled: "启用 Backlog 连接",
    apiMode: "API 认证",
    loginMode: "登录画面",
    test: "连接测试",
    save: "保存",
    updsSaved: "UPDS 支持网站设置已保存。",
    backlogSaved: "Backlog 设置已保存。",
    updsTested: "已确认可以登录 UPDS。",
    backlogApiTested: "已确认 Backlog API 认证。",
    backlogLoginTested: "已确认登录 URL 可访问，画面登录认证将在实际读取时确认。",
    failed: "操作失败。",
  },
  "en-US": {
    title: "External task settings",
    description: "Manage shared connections to external business sites.",
    common: "System shared",
    updsTitle: "UPDS support site",
    updsDescription: "Shared UPDS site and login settings used by Inquiry Support.",
    backlogTitle: "Backlog",
    backlogDescription: "Shared connection settings for the Backlog API or login page.",
    loginUrl: "Login URL",
    apiUrl: "API URL (optional)",
    apiUrlHelp: "The login URL is used as the base when this field is empty.",
    product: "Product",
    username: "Login user",
    password: "Login password",
    apiKey: "API Key (optional)",
    apiKeyHelp:
      "The official Backlog API uses an API Key or OAuth 2.0. Without an API Key, the connection is saved in login-page mode.",
    passwordHint: "The complete saved value is refilled and can be revealed or copied",
    copySecret: "Copy secret",
    copiedSecret: "Copied",
    copySecretFailed: "Copy failed",
    updsEnabled: "Enable UPDS connection",
    backlogEnabled: "Enable Backlog connection",
    apiMode: "API authentication",
    loginMode: "Login page",
    test: "Test connection",
    save: "Save",
    updsSaved: "UPDS support site settings saved.",
    backlogSaved: "Backlog settings saved.",
    updsTested: "UPDS login succeeded.",
    backlogApiTested: "Backlog API authentication succeeded.",
    backlogLoginTested:
      "The login URL is reachable. Interactive login will be verified during data retrieval.",
    failed: "Operation failed.",
  },
} as const;

type UpdsForm = Pick<InquirySupportSettings, "baseUrl" | "username" | "enabled"> & {
  password: string;
};

type BacklogForm = Pick<
  BacklogSystemSettings,
  "baseUrl" | "apiUrl" | "username" | "enabled"
> & { password: string; apiKey: string };

function SecretField({
  configured,
  labels,
  value,
  onChange,
}: {
  configured: boolean;
  labels: (typeof settingsCopy)[LocaleKey];
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <SecretInput
      autoComplete="new-password"
      value={value}
      onChange={onChange}
      copyLabel={labels.copySecret}
      copiedLabel={labels.copiedSecret}
      copyFailedLabel={labels.copySecretFailed}
      placeholder={configured ? "••••••••" : undefined}
    />
  );
}

export function InquirySupportSettingsPage({
  locale,
  canWrite,
}: {
  locale: LocaleKey;
  canWrite: boolean;
}) {
  const labels = settingsCopy[locale];
  const queryClient = useQueryClient();
  const [updsForm] = Form.useForm<UpdsForm>();
  const [backlogForm] = Form.useForm<BacklogForm>();
  const settingsQuery = useQuery({
    queryKey: ["external-task-settings"],
    queryFn: ({ signal }) => fetchInquirySupportSettings(signal),
  });
  const backlogApiKey = Form.useWatch("apiKey", backlogForm);

  const refreshSettings = () =>
    queryClient.invalidateQueries({ queryKey: ["external-task-settings"] });
  const updsSave = useMutation({
    mutationFn: saveInquirySupportSettings,
    onSuccess: async (settings) => {
      updsForm.setFieldValue("password", settings.password ?? "");
      await refreshSettings();
    },
  });
  const updsTest = useMutation({ mutationFn: testInquirySupportSettings });
  const backlogSave = useMutation({
    mutationFn: saveBacklogSystemSettings,
    onSuccess: async (settings) => {
      backlogForm.setFieldsValue({
        password: settings.password ?? "",
        apiKey: settings.apiKey ?? "",
      });
      await refreshSettings();
    },
  });
  const backlogTest = useMutation<BacklogConnectionTestResult, Error, BacklogForm>({
    mutationFn: testBacklogSystemSettings,
  });

  useEffect(() => {
    const payload = settingsQuery.data;
    if (!payload) return;
    updsForm.setFieldsValue({
      baseUrl: payload.settings.baseUrl,
      username: payload.settings.username,
      password: payload.settings.password ?? "",
      enabled: payload.settings.enabled,
    });
    backlogForm.setFieldsValue({
      baseUrl: payload.backlogSettings.baseUrl,
      apiUrl: payload.backlogSettings.apiUrl,
      username: payload.backlogSettings.username,
      password: payload.backlogSettings.password ?? "",
      apiKey: payload.backlogSettings.apiKey ?? "",
      enabled: payload.backlogSettings.enabled,
    });
  }, [backlogForm, settingsQuery.data, updsForm]);

  return (
    <div className="inquiry-settings-page external-task-settings-page">
      <div className="basic-master-heading">
        <div>
          <Title level={3}>{labels.title}</Title>
          <p>{labels.description}</p>
        </div>
      </div>

      <div className="external-task-settings-list">
        <Card
          className="external-task-settings-card"
          loading={settingsQuery.isLoading}
          title={
            <div className="external-task-card-title">
              <span className="external-task-card-icon"><SafetyCertificateOutlined /></span>
              <div>
                <Space size={8} wrap>
                  <span>{labels.updsTitle}</span>
                  <Tag color="blue">{labels.common}</Tag>
                </Space>
                <Text type="secondary">{labels.updsDescription}</Text>
              </div>
            </div>
          }
        >
          <Form
            form={updsForm}
            layout="vertical"
            disabled={!canWrite}
            onFinish={(values) => updsSave.mutate(values)}
            className="inquiry-settings-form external-task-settings-form"
          >
            <div className="external-task-form-grid">
              <Form.Item name="baseUrl" label={labels.loginUrl} rules={[{ required: true }, { type: "url" }]}>
                <Input prefix={<GlobalOutlined />} />
              </Form.Item>
              <Form.Item label={labels.product}><Input value="UPDS" disabled /></Form.Item>
              <Form.Item name="username" label={labels.username} rules={[{ required: true }]}>
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="password"
                label={labels.password}
                extra={settingsQuery.data?.settings.passwordConfigured ? labels.passwordHint : undefined}
                rules={[{ required: true }]}
              >
                <SecretField configured={Boolean(settingsQuery.data?.settings.passwordConfigured)} labels={labels} />
              </Form.Item>
            </div>
            <Form.Item name="enabled" valuePropName="checked">
              <Switch checkedChildren={labels.updsEnabled} unCheckedChildren={labels.updsEnabled} />
            </Form.Item>
            {updsSave.isSuccess && <Alert type="success" showIcon message={labels.updsSaved} />}
            {updsTest.isSuccess && <Alert type="success" showIcon message={labels.updsTested} />}
            {(updsSave.error || updsTest.error) && (
              <Alert type="error" showIcon message={labels.failed} description={(updsSave.error || updsTest.error)?.message} />
            )}
            <div className="management-card-footer inquiry-settings-actions">
              <Space wrap className="management-card-actions">
                <Button icon={<CheckCircleOutlined />} loading={updsTest.isPending} onClick={() => void updsForm.validateFields().then((values) => updsTest.mutate(values))}>
                  {labels.test}
                </Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={updsSave.isPending}>
                  {labels.save}
                </Button>
              </Space>
            </div>
          </Form>
        </Card>

        <Card
          className="external-task-settings-card"
          loading={settingsQuery.isLoading}
          title={
            <div className="external-task-card-title">
              <span className="external-task-card-icon backlog"><ApiOutlined /></span>
              <div>
                <Space size={8} wrap>
                  <span>{labels.backlogTitle}</span>
                  <Tag color="blue">{labels.common}</Tag>
                  <Tag color={backlogApiKey ? "green" : "default"}>
                    {backlogApiKey ? labels.apiMode : labels.loginMode}
                  </Tag>
                </Space>
                <Text type="secondary">{labels.backlogDescription}</Text>
              </div>
            </div>
          }
        >
          <Form
            form={backlogForm}
            layout="vertical"
            disabled={!canWrite}
            onFinish={(values) => backlogSave.mutate(values)}
            className="inquiry-settings-form external-task-settings-form"
          >
            <div className="external-task-form-grid">
              <Form.Item name="baseUrl" label={labels.loginUrl} rules={[{ required: true }, { type: "url" }]}>
                <Input prefix={<GlobalOutlined />} placeholder="https://example.backlog.com/" />
              </Form.Item>
              <Form.Item name="apiUrl" label={labels.apiUrl} extra={labels.apiUrlHelp} rules={[{ type: "url", warningOnly: false }]}>
                <Input prefix={<ApiOutlined />} placeholder="https://example.backlog.com/api/v2" />
              </Form.Item>
              <Form.Item name="username" label={labels.username} rules={[{ required: true }]}>
                <Input autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="password"
                label={labels.password}
                extra={settingsQuery.data?.backlogSettings.passwordConfigured ? labels.passwordHint : undefined}
                rules={[{ required: true }]}
              >
                <SecretField configured={Boolean(settingsQuery.data?.backlogSettings.passwordConfigured)} labels={labels} />
              </Form.Item>
              <Form.Item name="apiKey" label={labels.apiKey} extra={labels.apiKeyHelp}>
                <SecretField configured={Boolean(settingsQuery.data?.backlogSettings.apiKeyConfigured)} labels={labels} />
              </Form.Item>
            </div>
            <Form.Item name="enabled" valuePropName="checked">
              <Switch checkedChildren={labels.backlogEnabled} unCheckedChildren={labels.backlogEnabled} />
            </Form.Item>
            {backlogSave.isSuccess && <Alert type="success" showIcon message={labels.backlogSaved} />}
            {backlogTest.data && (
              <Alert
                type="success"
                showIcon
                message={backlogTest.data.mode === "API" ? labels.backlogApiTested : labels.backlogLoginTested}
                description={`${backlogTest.data.latencyMs} ms${backlogTest.data.identityName ? ` · ${backlogTest.data.identityName}` : ""}`}
              />
            )}
            {(backlogSave.error || backlogTest.error) && (
              <Alert type="error" showIcon message={labels.failed} description={(backlogSave.error || backlogTest.error)?.message} />
            )}
            <div className="management-card-footer inquiry-settings-actions">
              <Space wrap className="management-card-actions">
                <Button icon={<CheckCircleOutlined />} loading={backlogTest.isPending} onClick={() => void backlogForm.validateFields().then((values) => backlogTest.mutate(values))}>
                  {labels.test}
                </Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={backlogSave.isPending}>
                  {labels.save}
                </Button>
              </Space>
            </div>
          </Form>
        </Card>
      </div>
      {!canWrite && <Text type="secondary">{labels.description}</Text>}
    </div>
  );
}
