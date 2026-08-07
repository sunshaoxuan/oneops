import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, InputNumber, Select, Space, Switch, Typography } from "antd";
import {
  fetchAISettings,
  fetchCustomerKnowledgeSourceSettings,
  saveCustomerKnowledgeSourceSetting,
  type CustomerKnowledgeSourceSettingInput,
  type Organization,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import { CustomerKnowledgeScanPanel } from "./CustomerKnowledgeScanPanel";

const { Paragraph, Title } = Typography;

const copy = {
  "ja-JP": {
    title: "顧客ナレッジ管理",
    description: "顧客台帳スキャン、候補確認及び CAG 知識源設定を管理者専用画面で実行します。",
    target: "対象組織機関",
    targetHelp: "スキャン、再取込、再分析及び候補確認の対象を選択します。",
    selectTarget: "組織機関を選択",
    sourceSettings: "知識源設定",
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
    title: "客户知识管理",
    description: "在管理员专用画面中执行客户台账扫描、候选确认和 CAG 知识源设置。",
    target: "目标组织机构",
    targetHelp: "选择扫描、重新导入、重新分析和候选确认的目标。",
    selectTarget: "选择组织机构",
    sourceSettings: "知识源设置",
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
    title: "Customer knowledge management",
    description: "Run customer ledger scans, review candidates, and manage CAG knowledge sources in this administrator-only page.",
    target: "Target organization",
    targetHelp: "Select the target for scans, reingestion, reanalysis, and candidate review.",
    selectTarget: "Select an organization",
    sourceSettings: "Knowledge source settings",
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
  organizations,
}: {
  locale: LocaleKey;
  canWrite: boolean;
  organizations: Organization[];
}) {
  const text = copy[locale];
  const [form] = Form.useForm<CustomerKnowledgeSourceSettingInput>();
  const queryClient = useQueryClient();
  const orderedOrganizations = useMemo(
    () => [...organizations].sort((left, right) =>
      left.code.localeCompare(right.code, "ja", { numeric: true })),
    [organizations],
  );
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>();
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

  useEffect(() => {
    if (
      selectedOrganizationId &&
      orderedOrganizations.some((item) => item.id === selectedOrganizationId)
    ) {
      return;
    }
    setSelectedOrganizationId(orderedOrganizations[0]?.id);
  }, [orderedOrganizations, selectedOrganizationId]);

  const selectedOrganization = orderedOrganizations.find(
    (item) => item.id === selectedOrganizationId,
  );

  return (
    <div className="customer-knowledge-management-page">
      <Title level={3}>{text.title}</Title>
      <Paragraph type="secondary">{text.description}</Paragraph>
      <Card
        className="customer-knowledge-target-card"
        title={text.target}
      >
        <Paragraph type="secondary">{text.targetHelp}</Paragraph>
        <Select
          showSearch
          optionFilterProp="label"
          value={selectedOrganizationId}
          placeholder={text.selectTarget}
          onChange={setSelectedOrganizationId}
          options={orderedOrganizations.map((item) => ({
            value: item.id,
            label: `${item.code} ${item.name}`,
          }))}
          style={{ width: "min(100%, 520px)" }}
        />
      </Card>
      <CustomerKnowledgeScanPanel
        locale={locale}
        organization={selectedOrganization}
      />
      <Card title={text.sourceSettings}>
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
    </div>
  );
}
