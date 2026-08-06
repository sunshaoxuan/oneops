import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Switch, Typography } from "antd";
import {
  fetchAISettings,
  fetchCustomerKnowledgeSourceSettings,
  saveCustomerKnowledgeSourceSetting,
  type CustomerKnowledgeSourceSettingInput,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Paragraph, Title } = Typography;

const copy = {
  "ja-JP": {
    title: "顧客台帳ナレッジ設定",
    description: "顧客情報スキャンで使用する CAG Project と知識源の物理 ID を管理します。",
    gateway: "Agent Gateway",
    project: "CAG Project 物理 ID",
    source: "CAG 知識源物理 ID",
    priority: "優先順位",
    enabled: "有効",
    save: "保存",
    saved: "設定を保存しました。",
    failed: "設定を保存できませんでした。入力値と接続状態を確認してください。",
  },
  "zh-CN": {
    title: "客户台账知识设置",
    description: "管理客户信息扫描使用的 CAG Project 与知识源物理 ID。",
    gateway: "Agent Gateway",
    project: "CAG Project 物理 ID",
    source: "CAG 知识源物理 ID",
    priority: "优先级",
    enabled: "启用",
    save: "保存",
    saved: "设置已保存。",
    failed: "无法保存设置。请检查输入值和连接状态。",
  },
  "en-US": {
    title: "Customer ledger knowledge settings",
    description: "Manage the physical CAG Project and knowledge source IDs used by customer scans.",
    gateway: "Agent Gateway",
    project: "CAG Project physical ID",
    source: "CAG knowledge source physical ID",
    priority: "Priority",
    enabled: "Enabled",
    save: "Save",
    saved: "The setting was saved.",
    failed: "The setting could not be saved. Check the values and connection state.",
  },
} as const;

const uuidRule = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function CustomerKnowledgeSettingsPage({
  locale,
  canWrite,
}: {
  locale: LocaleKey;
  canWrite: boolean;
}) {
  const text = copy[locale];
  const [form] = Form.useForm<CustomerKnowledgeSourceSettingInput>();
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: ["customer-knowledge-source-settings"],
    queryFn: ({ signal }) => fetchCustomerKnowledgeSourceSettings(signal),
  });
  const gatewaysQuery = useQuery({
    queryKey: ["ai-settings", "customer-knowledge"],
    queryFn: ({ signal }) => fetchAISettings(signal),
  });
  const mutation = useMutation({
    mutationFn: saveCustomerKnowledgeSourceSetting,
    onSuccess: (setting) => {
      form.setFieldsValue(setting);
      void queryClient.invalidateQueries({
        queryKey: ["customer-knowledge-source-settings"],
      });
    },
  });

  useEffect(() => {
    const setting = settingsQuery.data?.[0];
    form.setFieldsValue(setting ?? {
      id: null,
      gatewaySettingId: "",
      cagProjectId: "",
      cagSourceId: "",
      priority: 100,
      enabled: true,
    });
  }, [form, settingsQuery.data]);

  return (
    <Card>
      <Title level={3}>{text.title}</Title>
      <Paragraph type="secondary">{text.description}</Paragraph>
      {mutation.isSuccess && <Alert type="success" showIcon message={text.saved} />}
      {(settingsQuery.isError || gatewaysQuery.isError || mutation.isError) && (
        <Alert type="error" showIcon message={text.failed} />
      )}
      <Form
        form={form}
        layout="vertical"
        disabled={!canWrite}
        onFinish={(value) => mutation.mutate(value)}
      >
        <Form.Item name="id" hidden><Input /></Form.Item>
        <Form.Item
          name="gatewaySettingId"
          label={text.gateway}
          rules={[{ required: true }]}
        >
          <Select
            options={(gatewaysQuery.data?.agentGateways ?? [])
              .filter((item) => item.enabled)
              .map((item) => ({ value: item.id, label: item.name }))}
          />
        </Form.Item>
        <Form.Item
          name="cagProjectId"
          label={text.project}
          rules={[{ required: true }, { pattern: uuidRule }]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="cagSourceId"
          label={text.source}
          rules={[{ required: true }, { pattern: uuidRule }]}
        >
          <Input autoComplete="off" />
        </Form.Item>
        <Space wrap>
          <Form.Item
            name="priority"
            label={text.priority}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} max={10000} precision={0} />
          </Form.Item>
          <Form.Item name="enabled" label={text.enabled} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
        {canWrite && (
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending}>
              {text.save}
            </Button>
          </Form.Item>
        )}
      </Form>
    </Card>
  );
}
