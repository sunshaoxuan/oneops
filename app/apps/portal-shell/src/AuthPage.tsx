import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Segmented,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import {
  fetchAuthConfig,
  loginLocalAccount,
  registerLocalAccount,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Text, Title } = Typography;

const copy = {
  "ja-JP": {
    title: "OneOps にログイン",
    body: "導入、保守、支援業務のユーザー認証",
    login: "ログイン",
    register: "ユーザー登録",
    loginId: "ユーザー名またはメール",
    password: "パスワード",
    username: "ユーザー名",
    email: "メール",
    displayName: "表示名",
    submitLogin: "ログイン",
    submitRegister: "登録する",
    windowsSso: "Windows ドメインでログイン",
    ssoStarting: "Windows ドメイン認証を確認しています。",
    bootstrap:
      "初回セットアップです。最初の登録ユーザーがシステム管理者になります。",
    pending: "登録を受け付けました。システム管理者の承認をお待ちください。",
    loginFailed: "ログインできませんでした。入力内容とアカウント状態を確認してください。",
    registerFailed: "登録できませんでした。入力内容を確認してください。",
    passwordHelp: "12文字以上で英大文字、英小文字、数字、記号を含めてください。",
  },
  "zh-CN": {
    title: "登录 OneOps",
    body: "导入、维护与支援业务的用户认证",
    login: "登录",
    register: "用户注册",
    loginId: "用户名或电子邮件",
    password: "密码",
    username: "用户名",
    email: "电子邮件",
    displayName: "显示名称",
    submitLogin: "登录",
    submitRegister: "提交注册",
    windowsSso: "使用 Windows 域登录",
    ssoStarting: "正在确认 Windows 域登录状态。",
    bootstrap: "当前是首次设置。第一个注册用户将成为系统管理员。",
    pending: "注册已受理，请等待系统管理员审核。",
    loginFailed: "登录失败，请检查输入内容和账号状态。",
    registerFailed: "注册失败，请检查输入内容。",
    passwordHelp: "至少 12 个字符，并包含大写字母、小写字母、数字和符号。",
  },
  "en-US": {
    title: "Sign in to OneOps",
    body: "User authentication for implementation, maintenance and support",
    login: "Sign in",
    register: "Register",
    loginId: "Username or email",
    password: "Password",
    username: "Username",
    email: "Email",
    displayName: "Display name",
    submitLogin: "Sign in",
    submitRegister: "Register",
    windowsSso: "Sign in with Windows domain",
    ssoStarting: "Checking Windows domain authentication.",
    bootstrap:
      "Initial setup is active. The first registered user becomes the system administrator.",
    pending: "Registration received. Wait for system administrator approval.",
    loginFailed: "Sign in failed. Check the credentials and account status.",
    registerFailed: "Registration failed. Check the submitted values.",
    passwordHelp:
      "Use at least 12 characters with uppercase, lowercase, number and symbol.",
  },
} as const;

export function AuthPage({
  onAuthenticated,
}: {
  onAuthenticated: () => Promise<void>;
}) {
  const [locale, setLocale] = useState<LocaleKey>("ja-JP");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [pending, setPending] = useState(false);
  const text = copy[locale];
  const configQuery = useQuery({
    queryKey: ["auth-config"],
    queryFn: ({ signal }) => fetchAuthConfig(signal),
  });
  const loginMutation = useMutation({
    mutationFn: loginLocalAccount,
    onSuccess: onAuthenticated,
  });
  const registerMutation = useMutation({
    mutationFn: registerLocalAccount,
    onSuccess: async (result) => {
      if (result.authenticated) {
        await onAuthenticated();
        return;
      }
      setPending(true);
      setMode("login");
    },
  });
  const windowsSsoUrl = configQuery.data?.windowsSsoUrl;
  const autoWindowsSso = configQuery.data?.windowsSsoAutoLogin;

  useEffect(() => {
    if (!autoWindowsSso || !windowsSsoUrl) return;
    const attemptKey = "oneops.windows-sso.auto-attempted";
    if (window.sessionStorage.getItem(attemptKey)) return;
    window.sessionStorage.setItem(attemptKey, "1");
    window.location.replace(
      `${windowsSsoUrl}?returnTo=${encodeURIComponent("/")}`,
    );
  }, [autoWindowsSso, windowsSsoUrl]);

  if (configQuery.isLoading) {
    return (
      <div className="auth-page auth-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (
    configQuery.data?.windowsSsoAutoLogin &&
    configQuery.data.windowsSsoUrl &&
    !window.sessionStorage.getItem("oneops.windows-sso.auto-attempted")
  ) {
    return (
      <div className="auth-page auth-loading">
        <Space orientation="vertical" align="center">
          <Spin size="large" />
          <Text type="secondary">{text.ssoStarting}</Text>
        </Space>
      </div>
    );
  }

  const startWindowsSso = () => {
    const url = configQuery.data?.windowsSsoUrl;
    if (!url) return;
    window.location.assign(`${url}?returnTo=${encodeURIComponent("/")}`);
  };

  return (
    <div className="auth-page">
      <div className="auth-language">
        <Select
          value={locale}
          onChange={setLocale}
          options={[
            { value: "ja-JP", label: "日本語" },
            { value: "zh-CN", label: "中文" },
            { value: "en-US", label: "English" },
          ]}
        />
      </div>
      <Card className="auth-card">
        <div className="auth-brand">
          <img src="/brand/onehr-logo.svg" alt="OneHR" />
          <span />
          <strong>OneOps</strong>
        </div>
        <div className="auth-heading">
          <SafetyCertificateOutlined />
          <div>
            <Title level={1}>{text.title}</Title>
            <Text type="secondary">{text.body}</Text>
          </div>
        </div>
        {configQuery.data?.bootstrapRequired && (
          <Alert type="info" showIcon message={text.bootstrap} />
        )}
        {pending && <Alert type="success" showIcon message={text.pending} />}
        <Segmented
          block
          value={mode}
          onChange={(value) => {
            setPending(false);
            setMode(value as "login" | "register");
          }}
          options={[
            { value: "login", label: text.login, icon: <UserOutlined /> },
            {
              value: "register",
              label: text.register,
              icon: <UserAddOutlined />,
            },
          ]}
        />
        {mode === "login" ? (
          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => loginMutation.mutate(values)}
          >
            <Form.Item
              name="login"
              label={text.loginId}
              rules={[{ required: true }]}
            >
              <Input prefix={<UserOutlined />} autoComplete="username" />
            </Form.Item>
            <Form.Item
              name="password"
              label={text.password}
              rules={[{ required: true }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="current-password"
              />
            </Form.Item>
            {loginMutation.isError && (
              <Alert type="error" showIcon message={text.loginFailed} />
            )}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loginMutation.isPending}
            >
              {text.submitLogin}
            </Button>
          </Form>
        ) : (
          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={(values) => registerMutation.mutate(values)}
          >
            <Form.Item
              name="username"
              label={text.username}
              rules={[
                { required: true },
                { pattern: /^[A-Za-z0-9][A-Za-z0-9._:@-]{2,127}$/ },
              ]}
            >
              <Input prefix={<UserOutlined />} autoComplete="username" />
            </Form.Item>
            <Form.Item
              name="displayName"
              label={text.displayName}
              rules={[{ required: true, whitespace: true }]}
            >
              <Input autoComplete="name" maxLength={120} />
            </Form.Item>
            <Form.Item name="email" label={text.email} rules={[{ type: "email" }]}>
              <Input autoComplete="email" />
            </Form.Item>
            <Form.Item
              name="password"
              label={text.password}
              extra={text.passwordHelp}
              rules={[{ required: true, min: 12 }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                autoComplete="new-password"
              />
            </Form.Item>
            {registerMutation.isError && (
              <Alert type="error" showIcon message={text.registerFailed} />
            )}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={registerMutation.isPending}
            >
              {text.submitRegister}
            </Button>
          </Form>
        )}
        {configQuery.data?.windowsSsoEnabled && (
          <Space orientation="vertical" className="auth-sso" size={8}>
            <Text type="secondary">SSO</Text>
            <Button
              block
              size="large"
              icon={<SafetyCertificateOutlined />}
              onClick={startWindowsSso}
            >
              {text.windowsSso}
            </Button>
          </Space>
        )}
      </Card>
    </div>
  );
}
