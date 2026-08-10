import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckOutlined,
  CloseOutlined,
  FileSearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  fetchLatestCustomerKnowledgeScan,
  reanalyzeCustomerKnowledgeScan,
  reingestCustomerKnowledgeScan,
  reviewCustomerKnowledgeScanCandidate,
  startCustomerKnowledgeScan,
  type CustomerKnowledgeScanCandidate,
  type Organization,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Paragraph, Text } = Typography;

const copy = {
  "ja-JP": {
    title: "顧客台帳 CAG 分析",
    help: "学習済み資料から契約、サービス、カスタマイズ、VPN 及び環境情報の候補を抽出し、根拠資料と一緒に管理者が確認します。",
    noOrganization: "対象の組織機関を選択してください。",
    coverage: "資料網羅率",
    analyzed: "分析済み",
    failedDocuments: "資料処理明細",
    unresolved: "未解決項目",
    conflicts: "競合",
    reingest: "資料を再取込",
    reanalyze: "顧客情報を再分析",
    start: "スキャン開始",
    queued: "待機中",
    running: "ナレッジを検索中",
    completed: "スキャン完了",
    failed: "スキャン失敗",
    apply: "台帳へ反映",
    dismiss: "対象外",
    reviewRequired: "確認が必要",
    evidence: "根拠資料",
    noCandidates: "根拠を確認できる候補はありません。",
    failureHelp: "CAG が学習済み資料を返せませんでした。知識源、索引状態及び検索サービスを確認してください。",
    classification: "区分",
    organizationCode: "機関 Code",
    organizationName: "機関名",
    shortName: "略称",
    maintenance: "保守有無",
    notes: "備考",
    contract: "契約",
    services: "サービス",
    vpn: "VPN",
    environment: "サーバー・環境",
    confidence: "確度",
  },
  "zh-CN": {
    title: "客户档案 CAG 分析",
    help: "从已学习资料中提取合约、服务、客户化、VPN 和环境信息候选，由管理员连同依据资料一起确认。",
    noOrganization: "请选择目标组织机构。",
    coverage: "资料覆盖率",
    analyzed: "已分析",
    failedDocuments: "资料处理明细",
    unresolved: "未解决项目",
    conflicts: "冲突",
    reingest: "重新导入资料",
    reanalyze: "重新分析客户信息",
    start: "开始扫描",
    queued: "等待中",
    running: "正在检索知识",
    completed: "扫描完成",
    failed: "扫描失败",
    apply: "写入台账",
    dismiss: "排除",
    reviewRequired: "需要确认",
    evidence: "依据资料",
    noCandidates: "没有取得可核对依据的候选信息。",
    failureHelp: "CAG 未能返回已学习资料。请检查知识源、索引状态和检索服务。",
    classification: "区分",
    organizationCode: "机关 Code",
    organizationName: "机关名",
    shortName: "简称",
    maintenance: "保守有无",
    notes: "备注",
    contract: "合约",
    services: "服务",
    vpn: "VPN",
    environment: "服务器与环境",
    confidence: "可信度",
  },
  "en-US": {
    title: "Customer ledger CAG analysis",
    help: "Extract contract, service, customization, VPN, and environment candidates from learned documents for administrator review with source evidence.",
    noOrganization: "Select the target organization.",
    coverage: "Document coverage",
    analyzed: "Analyzed",
    failedDocuments: "Document processing details",
    unresolved: "Unresolved fields",
    conflicts: "Conflicts",
    reingest: "Reingest documents",
    reanalyze: "Reanalyze customer information",
    start: "Start scan",
    queued: "Queued",
    running: "Searching knowledge",
    completed: "Scan completed",
    failed: "Scan failed",
    apply: "Apply to ledger",
    dismiss: "Dismiss",
    reviewRequired: "Review required",
    evidence: "Source evidence",
    noCandidates: "No candidates with verifiable evidence were found.",
    failureHelp: "CAG did not return learned documents. Check the knowledge source, index state, and retrieval service.",
    classification: "Classification",
    organizationCode: "Organization code",
    organizationName: "Organization name",
    shortName: "Short name",
    maintenance: "Maintenance",
    notes: "Notes",
    contract: "Contract",
    services: "Services",
    vpn: "VPN",
    environment: "Server and environment",
    confidence: "Confidence",
  },
} as const;

const activeStatuses = [
  "QUEUED",
  "RESOLVING_SCOPE",
  "PREPARING_DOCUMENTS",
  "INGESTING",
  "EXTRACTING",
  "AGGREGATING",
];

export function CustomerKnowledgeScanPanel({
  locale,
  organization,
}: {
  locale: LocaleKey;
  organization?: Organization;
}) {
  const text = copy[locale];
  const queryClient = useQueryClient();
  const scanQuery = useQuery({
    queryKey: ["customer-knowledge-scan", organization?.id],
    queryFn: ({ signal }) =>
      fetchLatestCustomerKnowledgeScan(organization!.id, signal),
    enabled: Boolean(organization?.id),
    refetchInterval: (query) =>
      activeStatuses.includes(query.state.data?.status ?? "") ? 5000 : false,
  });
  const scanMutation = useMutation({
    mutationFn: () => startCustomerKnowledgeScan(organization!.id),
    onSuccess: (scan) => {
      queryClient.setQueryData(["customer-knowledge-scan", organization?.id], scan);
    },
  });
  const candidateMutation = useMutation({
    mutationFn: ({
      candidate,
      action,
    }: {
      candidate: CustomerKnowledgeScanCandidate;
      action: "apply" | "dismiss";
    }) => reviewCustomerKnowledgeScanCandidate(
      organization!.id,
      candidate.scanId,
      candidate.id,
      action,
    ),
    onSuccess: (scan) => {
      queryClient.setQueryData(["customer-knowledge-scan", organization?.id], scan);
      void queryClient.invalidateQueries({
        queryKey: ["customer-information", organization?.id],
      });
    },
  });
  const reanalyzeMutation = useMutation({
    mutationFn: () => reanalyzeCustomerKnowledgeScan(
      organization!.id,
      scanQuery.data!.id,
    ),
    onSuccess: (scan) => {
      queryClient.setQueryData(["customer-knowledge-scan", organization?.id], scan);
    },
  });
  const reingestMutation = useMutation({
    mutationFn: () => reingestCustomerKnowledgeScan(
      organization!.id,
      scanQuery.data!.id,
    ),
    onSuccess: (scan) => {
      queryClient.setQueryData(["customer-knowledge-scan", organization?.id], scan);
    },
  });

  if (!organization) {
    return (
      <Card className="customer-knowledge-scan-card" title={text.title}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text.noOrganization} />
      </Card>
    );
  }

  const scan = scanQuery.data;
  const scanActive = activeStatuses.includes(scan?.status ?? "");
  const statusLabel = scan?.status === "QUEUED"
    ? text.queued
    : scanActive
      ? text.running
      : scan?.status === "REVIEW_REQUIRED"
        ? text.reviewRequired
        : scan?.status === "COMPLETED"
          ? text.completed
          : text.failed;
  const candidateTypeLabel = (candidate: CustomerKnowledgeScanCandidate) => {
    const labels: Record<string, string> = {
      organization_category: text.classification,
      organization_code: text.organizationCode,
      organization_name: text.organizationName,
      short_name: text.shortName,
      maintenance_status: text.maintenance,
      remarks: text.notes,
      contracts: text.contract,
      services: text.services,
      vpns: text.vpn,
      environments: text.environment,
    };
    return labels[candidate.fieldCode] ?? candidate.fieldCode;
  };
  const candidateTitle = (candidate: CustomerKnowledgeScanCandidate) =>
    typeof candidate.value === "string" || typeof candidate.value === "number"
      ? String(candidate.value)
      : candidateTypeLabel(candidate);

  return (
    <Card
      className="customer-knowledge-scan-card"
      title={<Space><FileSearchOutlined />{text.title}</Space>}
      extra={(
        <Space wrap>
          {scan?.cagScopeId && (
            <Button
              icon={<ReloadOutlined />}
              loading={reingestMutation.isPending}
              disabled={scanActive}
              onClick={() => reingestMutation.mutate()}
            >{text.reingest}</Button>
          )}
          {scan && (
            <Button
              icon={<FileSearchOutlined />}
              loading={reanalyzeMutation.isPending}
              disabled={scanActive}
              onClick={() => reanalyzeMutation.mutate()}
            >{text.reanalyze}</Button>
          )}
          {!scan && (
            <Button
              type="primary"
              icon={<FileSearchOutlined />}
              loading={scanMutation.isPending || scanActive}
              disabled={scanActive}
              onClick={() => scanMutation.mutate()}
            >{text.start}</Button>
          )}
        </Space>
      )}
    >
      <Paragraph type="secondary">{text.help}</Paragraph>
      {scan && (
        <Space wrap className="customer-knowledge-scan-status">
          <Tag color={
            scan.status === "COMPLETED"
              ? "success"
              : scan.status === "FAILED"
                ? "error"
                : "processing"
          }>{statusLabel}</Tag>
          {typeof scan.coverage.coverage_rate === "number" && (
            <Tag color="blue">
              {text.coverage} {Math.round(scan.coverage.coverage_rate * 100)}%
            </Tag>
          )}
          {typeof scan.coverage.analyzed_documents === "number" && (
            <Text type="secondary">
              {text.analyzed} {scan.coverage.analyzed_documents}/
              {scan.coverage.total_documents ?? 0}
            </Text>
          )}
          <Text type="secondary">{scan.updatedAt}</Text>
        </Space>
      )}
      {(scanQuery.isError || scanMutation.isError || candidateMutation.isError ||
        reanalyzeMutation.isError || reingestMutation.isError) && (
        <Alert type="error" showIcon message={text.failureHelp} />
      )}
      {scan?.errorCode && (
        <Alert
          className="customer-source-alert"
          type={scan.status === "FAILED" ? "error" : "warning"}
          showIcon
          message={scan.errorCode}
          description={text.failureHelp}
        />
      )}
      {scan?.status === "COMPLETED" && scan.candidates.length === 0 && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text.noCandidates} />
      )}
      <div className="customer-knowledge-candidate-grid">
        {(scan?.candidates ?? []).map((candidate) => (
          <Card
            key={candidate.id}
            size="small"
            className="customer-knowledge-candidate"
            title={<Space wrap>
              <Tag>{candidateTypeLabel(candidate)}</Tag>
              <Text strong>{candidateTitle(candidate)}</Text>
            </Space>}
            extra={<Space>
              <Tag color={candidate.confidence >= 0.8 ? "success" : "warning"}>
                {text.confidence} {Math.round(candidate.confidence * 100)}%
              </Tag>
              {candidate.status === "REVIEW_REQUIRED" && (
                <Tag color="warning">{text.reviewRequired}</Tag>
              )}
              {candidate.status === "APPLIED" && <Tag color="success">{text.apply}</Tag>}
            </Space>}
          >
            <Descriptions
              size="small"
              column={{ xs: 1, md: 2 }}
              items={[{
                key: "value",
                label: candidateTypeLabel(candidate),
                children: typeof candidate.value === "object"
                  ? <pre className="customer-knowledge-json">{JSON.stringify(candidate.value, null, 2)}</pre>
                  : String(candidate.value ?? ""),
              }]}
            />
            <div className="customer-knowledge-evidence">
              <Text strong>{text.evidence}</Text>
              {candidate.evidenceRefs.map((evidence) => (
                <div key={`${evidence.documentVersionId}:${evidence.chunkId}`}>
                  <FileSearchOutlined /> <Text>{evidence.path}</Text>
                  <Text type="secondary">
                    {evidence.sheet ? ` · ${evidence.sheet}` : ""}
                    {evidence.cellRange ? ` · ${evidence.cellRange}` : ""}
                    {evidence.page !== null ? ` · p.${evidence.page}` : ""}
                    {evidence.section ? ` · ${evidence.section}` : ""}
                  </Text>
                  {evidence.excerpt && <Paragraph type="secondary">{evidence.excerpt}</Paragraph>}
                </div>
              ))}
            </div>
            {["PROPOSED", "REVIEW_REQUIRED", "CONFLICT"].includes(candidate.status) && (
              <Space className="customer-knowledge-candidate-actions">
                {candidate.status === "PROPOSED" && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    loading={candidateMutation.isPending}
                    onClick={() => candidateMutation.mutate({ candidate, action: "apply" })}
                  >{text.apply}</Button>
                )}
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => candidateMutation.mutate({ candidate, action: "dismiss" })}
                >{text.dismiss}</Button>
              </Space>
            )}
          </Card>
        ))}
      </div>
      {(scan?.unresolvedFields.length ?? 0) > 0 && (
        <Alert
          className="customer-knowledge-gap"
          type="warning"
          showIcon
          message={text.unresolved}
          description={<ul>{scan!.unresolvedFields.map((item) => (
            <li key={item.field_code}>{item.field_code}: {item.reason_code}</li>
          ))}</ul>}
        />
      )}
      {(scan?.conflicts.length ?? 0) > 0 && (
        <Alert
          className="customer-knowledge-gap"
          type="warning"
          showIcon
          message={text.conflicts}
          description={<pre className="customer-knowledge-json">{JSON.stringify(scan!.conflicts, null, 2)}</pre>}
        />
      )}
      {(scan?.documentFailures.length ?? 0) > 0 && (
        <Alert
          className="customer-knowledge-gap"
          type="warning"
          showIcon
          message={text.failedDocuments}
          description={<pre className="customer-knowledge-json">{JSON.stringify(scan!.documentFailures, null, 2)}</pre>}
        />
      )}
    </Card>
  );
}
