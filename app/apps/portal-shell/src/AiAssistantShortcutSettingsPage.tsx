import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BulbOutlined,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  listAiAssistantShortcutsForAdmin,
  saveAiAssistantShortcut,
  type AiAssistantShortcut,
  type AiAssistantShortcutCategory,
  type AiAssistantShortcutInput,
  type LocalizedAiAssistantText,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";
import "./ai-assistant-shortcut-settings.css";

const { Paragraph, Text, Title } = Typography;

const copy = {
  "ja-JP": {
    title: "クイックアシスタント",
    description:
      "専門目的、開始例、全発言へ適用する継続指示を管理します。",
    add: "アシスタントを追加",
    edit: "アシスタントを編集",
    category: "カテゴリ",
    status: "有効",
    order: "表示順",
    name: "名称",
    purpose: "利用目的",
    starter: "入力開始例",
    prompt: "継続指示",
    promptHelp:
      "この指示は新規話題の作成時に保存され、同じ話題の全発言へ適用されます。",
    enabled: "有効",
    disabled: "無効",
    save: "保存",
    cancel: "キャンセル",
    saved: "クイックアシスタントを保存しました",
    failed: "クイックアシスタントを処理できませんでした",
    empty: "クイックアシスタントは登録されていません",
    required: "必須項目を入力してください",
    languageJa: "日本語",
    languageZh: "中文",
    languageEn: "English",
  },
  "zh-CN": {
    title: "快捷助手",
    description: "管理专题目标、输入示例和每轮对话持续应用的指示。",
    add: "新增助手",
    edit: "编辑助手",
    category: "类别",
    status: "启用",
    order: "显示顺序",
    name: "名称",
    purpose: "使用目的",
    starter: "输入示例",
    prompt: "持续指示",
    promptHelp: "该指示在新建话题时保存，并应用于该话题的每轮对话。",
    enabled: "已启用",
    disabled: "已停用",
    save: "保存",
    cancel: "取消",
    saved: "快捷助手已保存",
    failed: "快捷助手处理失败",
    empty: "尚未登记快捷助手",
    required: "请填写必填项目",
    languageJa: "日本語",
    languageZh: "中文",
    languageEn: "English",
  },
  "en-US": {
    title: "Quick assistants",
    description:
      "Manage specialist purposes, starters, and instructions applied to every turn.",
    add: "Add assistant",
    edit: "Edit assistant",
    category: "Category",
    status: "Enabled",
    order: "Display order",
    name: "Name",
    purpose: "Purpose",
    starter: "Conversation starter",
    prompt: "Persistent instructions",
    promptHelp:
      "These instructions are saved when a topic is created and applied to every turn in that topic.",
    enabled: "Enabled",
    disabled: "Disabled",
    save: "Save",
    cancel: "Cancel",
    saved: "Quick assistant saved",
    failed: "The quick assistant could not be processed",
    empty: "No quick assistants are registered",
    required: "Complete all required fields",
    languageJa: "日本語",
    languageZh: "中文",
    languageEn: "English",
  },
} as const;

type FormValues = AiAssistantShortcutInput;

const emptyLocalized = (): LocalizedAiAssistantText => ({
  ja: "",
  zh: "",
  en: "",
});

function localeField(locale: LocaleKey): keyof LocalizedAiAssistantText {
  if (locale === "zh-CN") return "zh";
  if (locale === "en-US") return "en";
  return "ja";
}
function defaultValues(categoryId = ""): FormValues {
  return {
    categoryId,
    name: emptyLocalized(),
    description: emptyLocalized(),
    starterPrompt: emptyLocalized(),
    systemPrompt: "",
    sortOrder: 100,
    enabled: true,
  };
}

function valuesFromShortcut(shortcut: AiAssistantShortcut): FormValues {
  return {
    categoryId: shortcut.categoryId,
    name: shortcut.name,
    description: shortcut.description,
    starterPrompt: shortcut.starterPrompt,
    systemPrompt: shortcut.systemPrompt ?? "",
    sortOrder: shortcut.sortOrder,
    enabled: shortcut.enabled,
  };
}

export function AiAssistantShortcutSettingsPage({
  locale,
  canWrite,
}: {
  locale: LocaleKey;
  canWrite: boolean;
}) {
  const text = copy[locale];
  const field = localeField(locale);
  const queryClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();
  const [editing, setEditing] = useState<AiAssistantShortcut | "new" | null>(
    null,
  );
  const query = useQuery({
    queryKey: ["ai-assistant-shortcuts", "admin"],
    queryFn: listAiAssistantShortcutsForAdmin,
  });
  const categories = query.data ?? [];
  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) =>
      saveAiAssistantShortcut(
        editing && editing !== "new" ? editing.id : null,
        values,
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["ai-assistant-shortcuts", "admin"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["ai-assistant-shortcuts", "public"],
        }),
      ]);
      setEditing(null);
      void message.success(text.saved);
    },
    onError: () => void message.error(text.failed),
  });
  const categoryOptions = useMemo(
    () => categories.map((category) => ({
      value: category.id,
      label: category.name[field],
    })),
    [categories, field],
  );

  useEffect(() => {
    if (!editing) return;
    form.setFieldsValue(
      editing === "new"
        ? defaultValues(categories[0]?.id)
        : valuesFromShortcut(editing),
    );
  }, [categories, editing, form]);

  const languageFields = [
    ["ja", text.languageJa],
    ["zh", text.languageZh],
    ["en", text.languageEn],
  ] as const;

  return (
    <div className="quick-assistant-settings-page">
      <div className="portal-section-heading basic-master-heading">
        <span className="portal-section-heading-icon"><BulbOutlined /></span>
        <div>
          <Title level={3}>{text.title}</Title>
          <p>{text.description}</p>
        </div>
        {canWrite && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setEditing("new")}
          >
            {text.add}
          </Button>
        )}
      </div>

      {query.isLoading ? (
        <div className="quick-assistant-settings-loading"><Spin /></div>
      ) : query.error ? (
        <Alert
          showIcon
          type="error"
          message={text.failed}
          description={query.error.message}
        />
      ) : categories.length === 0 ? (
        <Card><Empty description={text.empty} /></Card>
      ) : (
        <div className="quick-assistant-category-list">
          {categories.map((category: AiAssistantShortcutCategory) => (
            <Card
              key={category.id}
              className="quick-assistant-category-card"
              title={(
                <Space>
                  <RobotOutlined />
                  <span>{category.name[field]}</span>
                  <Tag>{category.shortcuts.length}</Tag>
                </Space>
              )}
            >
              <div className="quick-assistant-admin-list">
                {category.shortcuts.map((shortcut) => (
                  <div className="quick-assistant-admin-item" key={shortcut.id}>
                    <div>
                      <Space wrap>
                        <Text strong>{shortcut.name[field]}</Text>
                        <Tag color={shortcut.enabled ? "green" : "default"}>
                          {shortcut.enabled ? text.enabled : text.disabled}
                        </Tag>
                      </Space>
                      <Paragraph>{shortcut.description[field]}</Paragraph>
                      <Text type="secondary">{shortcut.starterPrompt[field]}</Text>
                    </div>
                    {canWrite && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => setEditing(shortcut)}
                      >
                        {text.edit}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        className="quick-assistant-editor"
        width={980}
        open={Boolean(editing)}
        title={editing === "new" ? text.add : text.edit}
        okText={text.save}
        cancelText={text.cancel}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        destroyOnHidden
      >
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
        >
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                name="categoryId"
                label={text.category}
                rules={[{ required: true, message: text.required }]}
              >
                <Select options={categoryOptions} />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item name="sortOrder" label={text.order}>
                <InputNumber min={0} max={9999} precision={0} />
              </Form.Item>
            </Col>
            <Col xs={12} md={5}>
              <Form.Item
                name="enabled"
                label={text.status}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          {languageFields.map(([language, label]) => (
            <Card key={language} size="small" title={label}>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["name", language]}
                    label={text.name}
                    rules={[{ required: true, message: text.required }]}
                  >
                    <Input maxLength={100} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["description", language]}
                    label={text.purpose}
                    rules={[{ required: true, message: text.required }]}
                  >
                    <Input maxLength={500} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={["starterPrompt", language]}
                    label={text.starter}
                    rules={[{ required: true, message: text.required }]}
                  >
                    <Input maxLength={500} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
          <Form.Item
            name="systemPrompt"
            label={text.prompt}
            extra={text.promptHelp}
            rules={[{ required: true, message: text.required }]}
          >
            <Input.TextArea rows={8} maxLength={20_000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
