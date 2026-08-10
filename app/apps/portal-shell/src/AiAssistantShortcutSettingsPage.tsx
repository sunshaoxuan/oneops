import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BulbOutlined,
  CheckOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
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
  type MenuProps,
} from "antd";
import {
  listAiAssistantShortcutsForAdmin,
  fetchAISettings,
  saveAiAssistantShortcut,
  type AiAssistantShortcut,
  type AiAssistantShortcutCategory,
  type AiAssistantShortcutInput,
  type LocalizedAiAssistantText,
  type ModelSettings,
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
    startingModel: "開始モデル",
    model: "モデル",
    startingModelHelp: "話題の作成時に固定し、後続の全発言で継続して使用します。",
    reasoning: "推理強度",
    speed: "速度",
    modelMissing: "利用可能な汎用モデルがありません。先にモデル接続を設定してください。",
    levelXhigh: "極高",
    levelHigh: "高",
    levelMedium: "中",
    speedFast: "速い",
    speedMedium: "標準",
    speedSlow: "低速",
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
    startingModel: "起始模型",
    model: "模型",
    startingModelHelp: "新建话题时固定，并在后续每轮对话中持续使用。",
    reasoning: "推理强度",
    speed: "速度",
    modelMissing: "没有可用的通用模型，请先配置模型接入。",
    levelXhigh: "极高",
    levelHigh: "高",
    levelMedium: "中",
    speedFast: "快",
    speedMedium: "标准",
    speedSlow: "较慢",
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
    startingModel: "Starting model",
    model: "Model",
    startingModelHelp: "Fixed when the topic is created and used for every later turn.",
    reasoning: "Reasoning effort",
    speed: "Speed",
    modelMissing: "No general model is available. Configure a model connection first.",
    levelXhigh: "Extra high",
    levelHigh: "High",
    levelMedium: "Medium",
    speedFast: "Fast",
    speedMedium: "Standard",
    speedSlow: "Slow",
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
function defaultValues(
  categoryId = "",
  model?: ModelSettings,
): FormValues {
  return {
    categoryId,
    startingModelSettingId: String(model?.id ?? ""),
    startingReasoningEffort: model?.reasoningEffort ?? "MEDIUM",
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
    startingModelSettingId: shortcut.startingModel?.id ?? "",
    startingReasoningEffort:
      shortcut.startingModel?.reasoningEffort ?? "MEDIUM",
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
  const modelQuery = useQuery({
    queryKey: ["ai-settings"],
    queryFn: ({ signal }) => fetchAISettings(signal),
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
  const generalModels = useMemo(
    () => (modelQuery.data?.models ?? []).filter(
      (model) => model.purpose === "GENERAL" && model.enabled,
    ),
    [modelQuery.data?.models],
  );
  const selectedModelId = Form.useWatch("startingModelSettingId", form);
  const selectedReasoning = Form.useWatch("startingReasoningEffort", form);
  const selectedModel = generalModels.find(
    (model) => String(model.id) === selectedModelId,
  );
  const reasoningLabel = (value?: string) =>
    value === "XHIGH"
      ? text.levelXhigh
      : value === "HIGH"
        ? text.levelHigh
        : text.levelMedium;
  const speedLabel = (value?: string) =>
    value === "FAST"
      ? text.speedFast
      : value === "SLOW"
        ? text.speedSlow
        : text.speedMedium;
  const menuOption = (label: string, selected: boolean) => (
    <span className="quick-assistant-model-picker-option">
      <span>{label}</span>
      {selected ? <CheckOutlined /> : null}
    </span>
  );
  const startingModelMenu = useMemo<MenuProps>(() => ({
    items: [
      {
        key: "model",
        label: (
          <span className="quick-assistant-model-picker-row">
            <span>{text.model}</span>
            <span className="quick-assistant-model-picker-current">
              {selectedModel?.displayName ?? text.modelMissing}
            </span>
          </span>
        ),
        children: generalModels.map((model) => ({
          key: `model:${String(model.id)}`,
          label: menuOption(
            model.displayName,
            String(model.id) === selectedModelId,
          ),
        })),
      },
      {
        key: "reasoning",
        label: (
          <span className="quick-assistant-model-picker-row">
            <span>{text.reasoning}</span>
            <span className="quick-assistant-model-picker-current">
              {reasoningLabel(selectedReasoning)}
            </span>
          </span>
        ),
        children: (["MEDIUM", "HIGH", "XHIGH"] as const).map((value) => ({
          key: `reasoning:${value}`,
          label: menuOption(reasoningLabel(value), selectedReasoning === value),
        })),
      },
      { type: "divider" },
      {
        key: "summary",
        disabled: true,
        label: (
          <span className="quick-assistant-model-picker-summary">
            {selectedModel?.displayName ?? text.modelMissing} · {reasoningLabel(selectedReasoning)}
          </span>
        ),
      },
    ],
    onClick: ({ key }) => {
      if (key.startsWith("model:")) {
        const model = generalModels.find(
          (candidate) => String(candidate.id) === key.slice("model:".length),
        );
        if (model) {
          form.setFieldsValue({
            startingModelSettingId: String(model.id),
            startingReasoningEffort: model.reasoningEffort,
          });
        }
        return;
      }
      if (key.startsWith("reasoning:")) {
        form.setFieldValue(
          "startingReasoningEffort",
          key.slice("reasoning:".length),
        );
        return;
      }
    },
  }), [
    form,
    generalModels,
    selectedModel,
    selectedModelId,
    selectedReasoning,
    text,
  ]);

  useEffect(() => {
    if (!editing) return;
    form.setFieldsValue(
      editing === "new"
        ? defaultValues(categories[0]?.id, generalModels[0])
        : valuesFromShortcut(editing),
    );
  }, [categories, editing, form, generalModels]);

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
                        {shortcut.startingModel && (
                          <Tag color="blue">
                            {shortcut.startingModel.displayName} · {
                              shortcut.startingModel.reasoningEffort === "XHIGH"
                                ? text.levelXhigh
                                : shortcut.startingModel.reasoningEffort === "HIGH"
                                  ? text.levelHigh
                                  : text.levelMedium
                            } · {
                              shortcut.startingModel.speedLevel === "FAST"
                                ? text.speedFast
                                : shortcut.startingModel.speedLevel === "SLOW"
                                  ? text.speedSlow
                                  : text.speedMedium
                            }
                          </Tag>
                        )}
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
          <Form.Item
            name="startingModelSettingId"
            hidden
            rules={[{ required: true, message: text.required }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="startingReasoningEffort" hidden><Input /></Form.Item>
          <Form.Item label={text.startingModel} extra={text.startingModelHelp}>
            <Dropdown
              menu={startingModelMenu}
              trigger={["click"]}
              placement="bottomLeft"
              classNames={{ root: "quick-assistant-model-picker-popup" }}
              disabled={!generalModels.length}
            >
              <Button
                block
                className="quick-assistant-model-picker-trigger"
                aria-label={text.startingModel}
              >
                <span>
                  <strong>{selectedModel?.displayName ?? text.modelMissing}</strong>
                  {selectedModel ? (
                    <small>
                      {reasoningLabel(selectedReasoning)}
                    </small>
                  ) : null}
                </span>
                <DownOutlined />
              </Button>
            </Dropdown>
          </Form.Item>
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
