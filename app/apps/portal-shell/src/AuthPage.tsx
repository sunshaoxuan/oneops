import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
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
  Typography,
} from "antd";
import {
  fetchAuthConfig,
  loginLocalAccount,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Text, Title } = Typography;

export const WINDOWS_SSO_AUTO_ATTEMPTED_KEY =
  "oneops.windows-sso.auto-attempted";
export const WINDOWS_SSO_TIMEOUT_MS = 5_000;
const WINDOWS_SSO_SESSION_POLL_MS = 300;
const WINDOWS_SSO_SILENT_URL = "/sso/windows/silent?returnTo=%2F";

const copy = {
  "ja-JP": {
    title: "OneOps にログイン",
    body: "導入、保守、支援業務のユーザー認証",
    login: "ログイン",
    loginId: "ユーザー名またはメール",
    password: "パスワード",
    submitLogin: "ログイン",
    windowsAccountAuth: "Windows アカウント認証",
    windowsSso: "Windows にログイン中のアカウントで認証",
    ssoStarting: "Windows にログイン中のアカウントを確認しています。",
    ssoFallback: "Windows アカウントを確認できませんでした。ユーザー名とパスワードでログインしてください。",
    loginFailed: "ログインできませんでした。入力内容とアカウント状態を確認してください。",
  },
  "zh-CN": {
    title: "登录 OneOps",
    body: "导入、维护与支援业务的用户认证",
    login: "登录",
    loginId: "用户名或电子邮件",
    password: "密码",
    submitLogin: "登录",
    windowsAccountAuth: "Windows 账号认证",
    windowsSso: "使用当前已登录的 Windows 账号认证",
    ssoStarting: "正在确认当前已登录的 Windows 账号。",
    ssoFallback: "无法确认 Windows 账号，请使用用户名和密码登录。",
    loginFailed: "登录失败，请检查输入内容和账号状态。",
  },
  "en-US": {
    title: "Sign in to OneOps",
    body: "User authentication for implementation, maintenance and support",
    login: "Sign in",
    loginId: "Username or email",
    password: "Password",
    submitLogin: "Sign in",
    windowsAccountAuth: "Windows account authentication",
    windowsSso: "Authenticate with your signed-in Windows account",
    ssoStarting: "Checking your signed-in Windows account.",
    ssoFallback: "The Windows account could not be verified. Sign in with your username and password.",
    loginFailed: "Sign in failed. Check the credentials and account status.",
  },
} as const;

export function AuthPage({
  onAuthenticated,
}: {
  onAuthenticated: () => Promise<void>;
}) {
  const [locale, setLocale] = useState<LocaleKey>("ja-JP");
  const [ssoChecking, setSsoChecking] = useState(false);
  const [ssoFallback, setSsoFallback] = useState(false);
  const [ssoFrameUrl, setSsoFrameUrl] = useState("");
  const ssoTimerRef = useRef<number | null>(null);
  const ssoPollRef = useRef<number | null>(null);
  const text = copy[locale];
  const configQuery = useQuery({
    queryKey: ["auth-config"],
    queryFn: ({ signal }) => fetchAuthConfig(signal),
  });
  const loginMutation = useMutation({
    mutationFn: loginLocalAccount,
    onSuccess: onAuthenticated,
  });
  const windowsSsoUrl = configQuery.data?.windowsSsoUrl;
  const autoWindowsSso = configQuery.data?.windowsSsoAutoLogin;

  const stopWindowsSso = useCallback((showFallback: boolean) => {
    if (ssoTimerRef.current !== null) window.clearTimeout(ssoTimerRef.current);
    if (ssoPollRef.current !== null) window.clearInterval(ssoPollRef.current);
    ssoTimerRef.current = null;
    ssoPollRef.current = null;
    setSsoFrameUrl("");
    setSsoChecking(false);
    setSsoFallback(showFallback);
  }, []);

  const startWindowsSso = useCallback(() => {
    if (!windowsSsoUrl || ssoChecking) return;
    window.sessionStorage.setItem(WINDOWS_SSO_AUTO_ATTEMPTED_KEY, "1");
    setSsoFallback(false);
    setSsoFrameUrl(WINDOWS_SSO_SILENT_URL);
    setSsoChecking(true);
    ssoPollRef.current = window.setInterval(() => {
      void onAuthenticated().catch(() => undefined);
    }, WINDOWS_SSO_SESSION_POLL_MS);
    ssoTimerRef.current = window.setTimeout(
      () => stopWindowsSso(true),
      WINDOWS_SSO_TIMEOUT_MS,
    );
  }, [onAuthenticated, ssoChecking, stopWindowsSso, windowsSsoUrl]);

  useEffect(() => {
    if (!autoWindowsSso || !windowsSsoUrl) return;
    if (window.sessionStorage.getItem(WINDOWS_SSO_AUTO_ATTEMPTED_KEY)) return;
    startWindowsSso();
  }, [autoWindowsSso, startWindowsSso, windowsSsoUrl]);

  useEffect(() => () => stopWindowsSso(false), [stopWindowsSso]);

  if (configQuery.isLoading) {
    return (
      <div className="auth-page auth-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="auth-page">
      {ssoFrameUrl && (
        <iframe
          className="auth-sso-silent-frame"
          src={ssoFrameUrl}
          title="Windows SSO"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
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
        <Form
          layout="vertical"
          requiredMark={false}
          onFinish={(values) => loginMutation.mutate(values)}
        >
          {ssoChecking && (
            <Alert type="info" showIcon message={text.ssoStarting} />
          )}
          {ssoFallback && (
            <Alert type="warning" showIcon message={text.ssoFallback} />
          )}
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
        {configQuery.data?.windowsSsoEnabled && (
          <Space orientation="vertical" className="auth-sso" size={8}>
            <Text type="secondary">{text.windowsAccountAuth}</Text>
            <Button
              block
              size="large"
              icon={<SafetyCertificateOutlined />}
              onClick={startWindowsSso}
              loading={ssoChecking}
            >
              {text.windowsSso}
            </Button>
          </Space>
        )}
      </Card>
    </div>
  );
}
