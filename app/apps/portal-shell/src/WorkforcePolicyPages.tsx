import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EditOutlined, PlusOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  fetchInquirySearchTemplates,
  fetchInternalWorkforce,
  saveBusinessResponsibility,
  saveInquirySearchTemplate,
  saveInternalDepartment,
  type BusinessResponsibility,
  type InquirySearchTemplate,
  type InquirySearchTemplateBinding,
  type InquirySearchTemplateTargetType,
  type InternalDepartment,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Paragraph, Text, Title } = Typography;

const copy = {
  "ja-JP": {
    workforceTitle: "業務部門・職責",
    workforceDescription: "社内の部門階層、業務職責及び利用者割当の基礎台帳を管理します。",
    departments: "社内部門",
    responsibilities: "業務職責",
    addDepartment: "部門を追加",
    addResponsibility: "職責を追加",
    editDepartment: "部門を編集",
    editResponsibility: "職責を編集",
    code: "コード",
    name: "名称",
    parent: "親部門",
    description: "説明",
    enabled: "有効",
    sortOrder: "表示順",
    actions: "操作",
    save: "保存",
    cancel: "キャンセル",
    templateTitle: "問合検索テンプレート",
    templateDescription: "検索条件と、システム、部門、職責、ロール又は個人への既定割当を管理します。",
    addTemplate: "テンプレートを追加",
    editTemplate: "テンプレートを編集",
    filters: "検索条件",
    status: "状態",
    createdFrom: "作成日開始",
    createdTo: "作成日終了",
    assigneeValue: "担当者の実値",
    assigneeDisplay: "担当者の表示名",
    otherFilters: "その他の検索条件 JSON",
    autoExecute: "初回に自動検索",
    bindings: "既定割当",
    addBinding: "割当を追加",
    targetType: "対象種類",
    target: "対象",
    priority: "優先順位",
    system: "システム既定",
    noParent: "親部門なし",
    revision: "Revision",
    invalidJson: "その他の検索条件 JSON は Object 形式で入力してください。",
    saveFailed: "保存できませんでした。入力内容と重複を確認してください。",
  },
  "zh-CN": {
    workforceTitle: "业务部门与职责",
    workforceDescription: "管理内部部门层级、业务职责和用户分配所需的基础数据。",
    departments: "内部部门",
    responsibilities: "业务职责",
    addDepartment: "添加部门",
    addResponsibility: "添加职责",
    editDepartment: "编辑部门",
    editResponsibility: "编辑职责",
    code: "代码",
    name: "名称",
    parent: "上级部门",
    description: "说明",
    enabled: "启用",
    sortOrder: "排序",
    actions: "操作",
    save: "保存",
    cancel: "取消",
    templateTitle: "问合搜索模板",
    templateDescription: "管理搜索条件及其对系统、部门、职责、角色或个人的默认分配。",
    addTemplate: "添加模板",
    editTemplate: "编辑模板",
    filters: "搜索条件",
    status: "状态",
    createdFrom: "创建日开始",
    createdTo: "创建日结束",
    assigneeValue: "负责人真实值",
    assigneeDisplay: "负责人显示名",
    otherFilters: "其他搜索条件 JSON",
    autoExecute: "首次自动查询",
    bindings: "默认绑定",
    addBinding: "添加绑定",
    targetType: "对象类型",
    target: "对象",
    priority: "优先级",
    system: "系统默认",
    noParent: "无上级部门",
    revision: "Revision",
    invalidJson: "其他搜索条件 JSON 必须是 Object。",
    saveFailed: "保存失败，请检查输入和重复配置。",
  },
  "en-US": {
    workforceTitle: "Business departments and responsibilities",
    workforceDescription: "Manage the internal department hierarchy and business responsibility catalog.",
    departments: "Internal departments",
    responsibilities: "Business responsibilities",
    addDepartment: "Add department",
    addResponsibility: "Add responsibility",
    editDepartment: "Edit department",
    editResponsibility: "Edit responsibility",
    code: "Code",
    name: "Name",
    parent: "Parent department",
    description: "Description",
    enabled: "Enabled",
    sortOrder: "Sort order",
    actions: "Actions",
    save: "Save",
    cancel: "Cancel",
    templateTitle: "Inquiry search templates",
    templateDescription: "Manage search conditions and defaults assigned to the system, departments, responsibilities, roles, or users.",
    addTemplate: "Add template",
    editTemplate: "Edit template",
    filters: "Search filters",
    status: "Status",
    createdFrom: "Created from",
    createdTo: "Created to",
    assigneeValue: "Assignee source value",
    assigneeDisplay: "Assignee display name",
    otherFilters: "Other filter JSON",
    autoExecute: "Run initial search automatically",
    bindings: "Default bindings",
    addBinding: "Add binding",
    targetType: "Target type",
    target: "Target",
    priority: "Priority",
    system: "System default",
    noParent: "No parent",
    revision: "Revision",
    invalidJson: "Other filter JSON must be an object.",
    saveFailed: "The record could not be saved. Check the input and duplicate settings.",
  },
} as const;

export function WorkforceManagementPage({
  locale,
  canWrite,
}: {
  locale: LocaleKey;
  canWrite: boolean;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["internal-workforce"],
    queryFn: ({ signal }) => fetchInternalWorkforce(signal),
  });
  const [departmentEditor, setDepartmentEditor] =
    useState<InternalDepartment | null | undefined>(undefined);
  const [responsibilityEditor, setResponsibilityEditor] =
    useState<BusinessResponsibility | null | undefined>(undefined);
  const [departmentForm] = Form.useForm<{
    code: string;
    name: string;
    parentDepartmentId: string | null;
    enabled: boolean;
    sortOrder: number;
  }>();
  const [responsibilityForm] = Form.useForm<{
    code: string;
    name: string;
    description: string;
    enabled: boolean;
  }>();
  const departmentSave = useMutation({
    mutationFn: (values: {
      code: string;
      name: string;
      parentDepartmentId: string | null;
      enabled: boolean;
      sortOrder: number;
    }) =>
      saveInternalDepartment(values, departmentEditor?.id),
    onSuccess: async () => {
      setDepartmentEditor(undefined);
      await queryClient.invalidateQueries({ queryKey: ["internal-workforce"] });
    },
  });
  const responsibilitySave = useMutation({
    mutationFn: (values: {
      code: string;
      name: string;
      description: string;
      enabled: boolean;
    }) => saveBusinessResponsibility(values, responsibilityEditor?.id),
    onSuccess: async () => {
      setResponsibilityEditor(undefined);
      await queryClient.invalidateQueries({ queryKey: ["internal-workforce"] });
    },
  });

  const openDepartment = (department: InternalDepartment | null) => {
    setDepartmentEditor(department);
    departmentSave.reset();
    departmentForm.setFieldsValue(
      department ?? {
        code: "",
        name: "",
        parentDepartmentId: null,
        enabled: true,
        sortOrder: 100,
      },
    );
  };
  const openResponsibility = (responsibility: BusinessResponsibility | null) => {
    setResponsibilityEditor(responsibility);
    responsibilitySave.reset();
    responsibilityForm.setFieldsValue(
      responsibility ?? { code: "", name: "", description: "", enabled: true },
    );
  };

  const departmentColumns: TableColumnsType<InternalDepartment> = [
    { title: text.code, dataIndex: "code", width: 190, render: (value) => <Text code>{value}</Text> },
    { title: text.name, dataIndex: "name" },
    { title: text.parent, dataIndex: "parentName", render: (value) => value || "－" },
    { title: text.sortOrder, dataIndex: "sortOrder", width: 100 },
    { title: text.enabled, dataIndex: "enabled", width: 90, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "ON" : "OFF"}</Tag> },
    ...(canWrite
      ? [{
          title: text.actions,
          key: "actions",
          width: 80,
          render: (_: unknown, department: InternalDepartment) => (
            <Button type="text" icon={<EditOutlined />} onClick={() => openDepartment(department)} />
          ),
        }]
      : []),
  ];
  const responsibilityColumns: TableColumnsType<BusinessResponsibility> = [
    { title: text.code, dataIndex: "code", width: 190, render: (value) => <Text code>{value}</Text> },
    { title: text.name, dataIndex: "name", width: 180 },
    { title: text.description, dataIndex: "description" },
    { title: text.enabled, dataIndex: "enabled", width: 90, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "ON" : "OFF"}</Tag> },
    ...(canWrite
      ? [{
          title: text.actions,
          key: "actions",
          width: 80,
          render: (_: unknown, responsibility: BusinessResponsibility) => (
            <Button type="text" icon={<EditOutlined />} onClick={() => openResponsibility(responsibility)} />
          ),
        }]
      : []),
  ];

  return (
    <div className="identity-management workforce-management-page">
      <section className="portal-section-heading identity-heading">
        <span className="portal-section-heading-icon"><TeamOutlined /></span>
        <div><Title level={2}>{text.workforceTitle}</Title><Paragraph>{text.workforceDescription}</Paragraph></div>
      </section>
      <div className="workforce-catalog-grid">
        <Card
          title={text.departments}
          extra={canWrite && <Button icon={<PlusOutlined />} onClick={() => openDepartment(null)}>{text.addDepartment}</Button>}
        >
          <Table rowKey="id" columns={departmentColumns} dataSource={query.data?.departments ?? []} loading={query.isLoading} pagination={false} scroll={{ x: 760 }} />
        </Card>
        <Card
          title={text.responsibilities}
          extra={canWrite && <Button icon={<PlusOutlined />} onClick={() => openResponsibility(null)}>{text.addResponsibility}</Button>}
        >
          <Table rowKey="id" columns={responsibilityColumns} dataSource={query.data?.responsibilities ?? []} loading={query.isLoading} pagination={false} scroll={{ x: 720 }} />
        </Card>
      </div>
      <Modal
        open={departmentEditor !== undefined}
        title={departmentEditor ? text.editDepartment : text.addDepartment}
        okText={text.save}
        cancelText={text.cancel}
        onCancel={() => setDepartmentEditor(undefined)}
        onOk={() => departmentForm.submit()}
        confirmLoading={departmentSave.isPending}
      >
        <Form form={departmentForm} layout="vertical" onFinish={(values) => departmentSave.mutate(values)}>
          <Form.Item name="code" label={text.code} rules={[{ required: true, pattern: /^[A-Z][A-Z0-9_]{1,63}$/ }]}><Input disabled={Boolean(departmentEditor)} /></Form.Item>
          <Form.Item name="name" label={text.name} rules={[{ required: true, max: 120 }]}><Input /></Form.Item>
          <Form.Item name="parentDepartmentId" label={text.parent}>
            <Select allowClear options={(query.data?.departments ?? []).filter((item) => item.id !== departmentEditor?.id).map((item) => ({ value: item.id, label: `${item.code}  ${item.name}` }))} placeholder={text.noParent} />
          </Form.Item>
          <Form.Item name="sortOrder" label={text.sortOrder}><InputNumber min={0} max={999999} /></Form.Item>
          <Form.Item name="enabled" valuePropName="checked"><Checkbox>{text.enabled}</Checkbox></Form.Item>
          {departmentSave.isError && <Alert type="error" showIcon message={text.saveFailed} />}
        </Form>
      </Modal>
      <Modal
        open={responsibilityEditor !== undefined}
        title={responsibilityEditor ? text.editResponsibility : text.addResponsibility}
        okText={text.save}
        cancelText={text.cancel}
        onCancel={() => setResponsibilityEditor(undefined)}
        onOk={() => responsibilityForm.submit()}
        confirmLoading={responsibilitySave.isPending}
      >
        <Form form={responsibilityForm} layout="vertical" onFinish={(values) => responsibilitySave.mutate(values)}>
          <Form.Item name="code" label={text.code} rules={[{ required: true, pattern: /^[A-Z][A-Z0-9_]{2,63}$/ }]}><Input disabled={Boolean(responsibilityEditor)} /></Form.Item>
          <Form.Item name="name" label={text.name} rules={[{ required: true, max: 120 }]}><Input /></Form.Item>
          <Form.Item name="description" label={text.description}><Input.TextArea rows={3} maxLength={1000} /></Form.Item>
          <Form.Item name="enabled" valuePropName="checked"><Checkbox>{text.enabled}</Checkbox></Form.Item>
          {responsibilitySave.isError && <Alert type="error" showIcon message={text.saveFailed} />}
        </Form>
      </Modal>
    </div>
  );
}

type TemplateForm = {
  code: string;
  name: string;
  description: string;
  status: string;
  createdFrom: string;
  createdTo: string;
  assigneeSourceValue: string;
  assigneeDisplayName: string;
  otherFilters: string;
  autoExecute: boolean;
  enabled: boolean;
};

export function InquirySearchTemplateManagementPage({
  locale,
  canWrite,
}: {
  locale: LocaleKey;
  canWrite: boolean;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["inquiry-search-templates"],
    queryFn: ({ signal }) => fetchInquirySearchTemplates(signal),
  });
  const [editing, setEditing] = useState<InquirySearchTemplate | null | undefined>(undefined);
  const [bindings, setBindings] = useState<InquirySearchTemplateBinding[]>([]);
  const [form] = Form.useForm<TemplateForm>();
  const save = useMutation({
    mutationFn: (values: TemplateForm) => {
      let otherFilters: Record<string, unknown> = {};
      try {
        otherFilters = values.otherFilters.trim()
          ? (JSON.parse(values.otherFilters) as Record<string, unknown>)
          : {};
        if (!otherFilters || Array.isArray(otherFilters) || typeof otherFilters !== "object") throw new Error();
      } catch {
        throw new Error(text.invalidJson);
      }
      const filters: Record<string, unknown> = { ...otherFilters };
      for (const [key, value] of Object.entries({
        status: values.status,
        createdFrom: values.createdFrom,
        createdTo: values.createdTo,
      })) {
        if (value) filters[key] = value;
      }
      if (values.assigneeSourceValue) {
        filters.assignee = {
          sourceValue: values.assigneeSourceValue,
          displayName: values.assigneeDisplayName,
        };
      }
      return saveInquirySearchTemplate(
        {
          code: values.code,
          name: values.name,
          description: values.description,
          filters,
          autoExecute: values.autoExecute,
          enabled: values.enabled,
          revision: editing?.revision ?? 1,
          bindings,
        },
        editing?.id,
      );
    },
    onSuccess: async () => {
      setEditing(undefined);
      await queryClient.invalidateQueries({ queryKey: ["inquiry-search-templates"] });
    },
  });

  const openEditor = (template: InquirySearchTemplate | null) => {
    setEditing(template);
    save.reset();
    setBindings(template?.bindings ?? []);
    const filters = template?.filters ?? {};
    const assignee = filters.assignee && typeof filters.assignee === "object"
      ? (filters.assignee as { sourceValue?: string; displayName?: string })
      : {};
    const otherFilters = Object.fromEntries(
      Object.entries(filters).filter(([key]) => !["status", "createdFrom", "createdTo", "assignee"].includes(key)),
    );
    form.setFieldsValue({
      code: template?.code ?? "",
      name: template?.name ?? "",
      description: template?.description ?? "",
      status: String(filters.status ?? "open"),
      createdFrom: String(filters.createdFrom ?? ""),
      createdTo: String(filters.createdTo ?? "TODAY"),
      assigneeSourceValue: assignee.sourceValue ?? "",
      assigneeDisplayName: assignee.displayName ?? "",
      otherFilters: Object.keys(otherFilters).length ? JSON.stringify(otherFilters, null, 2) : "",
      autoExecute: template?.autoExecute ?? true,
      enabled: template?.enabled ?? true,
    });
  };

  const targetOptions = useMemo(() => ({
    DEPARTMENT: query.data?.targets.departments ?? [],
    RESPONSIBILITY: query.data?.targets.responsibilities ?? [],
    ROLE: query.data?.targets.roles ?? [],
    USER: query.data?.targets.users ?? [],
  }), [query.data]);
  const optionsFor = (type: InquirySearchTemplateTargetType) =>
    type === "SYSTEM"
      ? [{ value: "", label: text.system }]
      : (targetOptions[type] ?? []).map((item) => ({ value: item.id, label: `${item.code}  ${item.name}` }));
  const targetTypeLabels: Record<InquirySearchTemplateTargetType, string> = {
    SYSTEM: text.system,
    DEPARTMENT: text.departments,
    RESPONSIBILITY: text.responsibilities,
    ROLE: locale === "ja-JP" ? "RBAC ロール" : locale === "zh-CN" ? "RBAC 角色" : "RBAC role",
    USER: locale === "ja-JP" ? "個人ユーザー" : locale === "zh-CN" ? "个人用户" : "User",
  };
  const columns: TableColumnsType<InquirySearchTemplate> = [
    { title: text.code, dataIndex: "code", width: 190, render: (value) => <Text code>{value}</Text> },
    { title: text.name, dataIndex: "name", width: 220 },
    { title: text.bindings, key: "bindings", render: (_, template) => <Space wrap>{template.bindings.map((binding) => <Tag key={binding.id ?? `${binding.targetType}:${binding.targetId}:${binding.priority}`}>{targetTypeLabels[binding.targetType]}: {binding.targetName || text.system} ({binding.priority})</Tag>)}</Space> },
    { title: text.autoExecute, dataIndex: "autoExecute", width: 120, render: (value) => <Tag color={value ? "processing" : "default"}>{value ? "ON" : "OFF"}</Tag> },
    { title: text.revision, dataIndex: "revision", width: 90 },
    { title: text.enabled, dataIndex: "enabled", width: 90, render: (value) => <Tag color={value ? "success" : "default"}>{value ? "ON" : "OFF"}</Tag> },
    ...(canWrite ? [{ title: text.actions, key: "actions", width: 80, render: (_: unknown, template: InquirySearchTemplate) => <Button type="text" icon={<EditOutlined />} onClick={() => openEditor(template)} /> }] : []),
  ];

  return (
    <div className="identity-management inquiry-template-management-page">
      <section className="portal-section-heading identity-heading">
        <span className="portal-section-heading-icon"><SearchOutlined /></span>
        <div><Title level={2}>{text.templateTitle}</Title><Paragraph>{text.templateDescription}</Paragraph></div>
        {canWrite && <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor(null)}>{text.addTemplate}</Button>}
      </section>
      <Card className="identity-table-card">
        <Table rowKey="id" columns={columns} dataSource={query.data?.templates ?? []} loading={query.isLoading} scroll={{ x: 1100 }} />
      </Card>
      <Modal
        open={editing !== undefined}
        title={editing ? text.editTemplate : text.addTemplate}
        okText={text.save}
        cancelText={text.cancel}
        onCancel={() => setEditing(undefined)}
        onOk={() => form.submit()}
        confirmLoading={save.isPending}
        width={960}
        styles={{ body: { maxHeight: "72vh", overflowY: "auto" } }}
      >
        <Form form={form} layout="vertical" onFinish={(values) => save.mutate(values)}>
          <div className="template-editor-grid">
            <Form.Item name="code" label={text.code} rules={[{ required: true, pattern: /^[A-Z][A-Z0-9_]{2,63}$/ }]}><Input disabled={Boolean(editing)} /></Form.Item>
            <Form.Item name="name" label={text.name} rules={[{ required: true, max: 120 }]}><Input /></Form.Item>
          </div>
          <Form.Item name="description" label={text.description}><Input.TextArea rows={2} maxLength={1000} /></Form.Item>
          <Text strong>{text.filters}</Text>
          <div className="template-editor-grid">
            <Form.Item name="status" label={text.status}><Select options={[{ value: "open", label: "open" }, { value: "all", label: "all" }, { value: "completed", label: "completed" }]} /></Form.Item>
            <Form.Item name="createdFrom" label={text.createdFrom}><Input placeholder="YYYY-MM-DD" /></Form.Item>
            <Form.Item name="createdTo" label={text.createdTo}><Input placeholder="TODAY / YYYY-MM-DD" /></Form.Item>
            <Form.Item name="assigneeSourceValue" label={text.assigneeValue}><Input /></Form.Item>
            <Form.Item name="assigneeDisplayName" label={text.assigneeDisplay}><Input /></Form.Item>
          </div>
          <Form.Item name="otherFilters" label={text.otherFilters}><Input.TextArea rows={4} className="business-code" /></Form.Item>
          <Space size="large">
            <Form.Item name="autoExecute" valuePropName="checked"><Checkbox>{text.autoExecute}</Checkbox></Form.Item>
            <Form.Item name="enabled" valuePropName="checked"><Checkbox>{text.enabled}</Checkbox></Form.Item>
          </Space>
          <div className="template-binding-heading"><Text strong>{text.bindings}</Text><Button icon={<PlusOutlined />} onClick={() => setBindings((current) => [...current, { targetType: "SYSTEM", targetId: null, priority: 100, enabled: true }])}>{text.addBinding}</Button></div>
          <div className="template-binding-list">
            {bindings.map((binding, index) => (
              <div className="template-binding-row" key={binding.id ?? index}>
                <Select value={binding.targetType} options={(Object.keys(targetTypeLabels) as InquirySearchTemplateTargetType[]).map((value) => ({ value, label: targetTypeLabels[value] }))} onChange={(targetType) => setBindings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, targetType, targetId: targetType === "SYSTEM" ? null : "" } : item))} />
                <Select disabled={binding.targetType === "SYSTEM"} value={binding.targetId ?? ""} placeholder={text.target} options={optionsFor(binding.targetType)} onChange={(targetId) => setBindings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, targetId: targetId || null } : item))} />
                <div className="template-binding-priority">
                  <Text type="secondary">{text.priority}</Text>
                  <InputNumber value={binding.priority} min={-999999} max={999999} onChange={(priority) => setBindings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, priority: priority ?? 100 } : item))} />
                </div>
                <Checkbox checked={binding.enabled} onChange={(event) => setBindings((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item))}>{text.enabled}</Checkbox>
                <Button danger type="text" onClick={() => setBindings((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</Button>
              </div>
            ))}
          </div>
          {save.isError && <Alert type="error" showIcon message={save.error.message || text.saveFailed} />}
        </Form>
      </Modal>
    </div>
  );
}
