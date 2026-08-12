import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Col, Empty, Row, Select, Space, Statistic, Table, Tag, Typography } from "antd";
import type { TableColumnsType } from "antd";
import {
  fetchAiTokenUsageReport,
  type AiTokenUsageReportRow,
} from "@one-ops/api-client";
import type { LocaleKey } from "./i18n";

const { Text, Title } = Typography;
type Period = 7 | 30 | 90 | null;

const copy = {
  "ja-JP": {
    eyebrow: "管理者レポート",
    title: "AI Token 使用量",
    description: "AI Provider の呼出ごとに返された Token 使用量をユーザー別に集計し、合計 Token の多い順に表示します。",
    period: "集計期間",
    periods: { 7: "直近7日", 30: "直近30日", 90: "直近90日", all: "全期間" },
    users: "利用ユーザー",
    calls: "AI 呼出回数",
    tokens: "合計 Token",
    rank: "順位",
    user: "ユーザー",
    reported: "Usage 取得",
    input: "入力 Token",
    output: "出力 Token",
    cached: "Cached Token",
    reasoning: "推論 Token",
    total: "合計 Token",
    lastUsed: "最終呼出",
    empty: "対象期間の AI 利用記録はありません。",
    error: "AI Token 使用量を取得できませんでした。",
  },
  "zh-CN": {
    eyebrow: "管理员报表", title: "AI Token 用量", description: "按用户汇总每次 AI Provider 调用返回的 Token 用量，并按总 Token 从高到低排列。",
    period: "统计期间", periods: { 7: "最近7天", 30: "最近30天", 90: "最近90天", all: "全部" }, users: "使用用户", calls: "AI 调用次数", tokens: "Token 总量", rank: "排名", user: "用户", reported: "Usage 获取", input: "输入 Token", output: "输出 Token", cached: "Cached Token", reasoning: "推理 Token", total: "Token 总量", lastUsed: "最后调用", empty: "所选期间没有 AI 使用记录。", error: "无法获取 AI Token 用量。",
  },
  "en-US": {
    eyebrow: "Administrator report", title: "AI Token usage", description: "Aggregates Token usage returned by every AI Provider call per user and ranks users by total Token usage.",
    period: "Period", periods: { 7: "Last 7 days", 30: "Last 30 days", 90: "Last 90 days", all: "All time" }, users: "Users", calls: "AI calls", tokens: "Total Tokens", rank: "Rank", user: "User", reported: "Usage received", input: "Input Tokens", output: "Output Tokens", cached: "Cached Tokens", reasoning: "Reasoning Tokens", total: "Total Tokens", lastUsed: "Last call", empty: "No AI usage was recorded during this period.", error: "AI Token usage could not be loaded.",
  },
} as const;

const numberFormat = new Intl.NumberFormat("ja-JP");

export function AiTokenUsageReportPage({ locale }: { locale: LocaleKey }) {
  const [period, setPeriod] = useState<Period>(30);
  const text = copy[locale];
  const reportQuery = useQuery({
    queryKey: ["ai-token-usage-report", period],
    queryFn: ({ signal }) => fetchAiTokenUsageReport(period, signal),
  });
  const rows = reportQuery.data?.rows ?? [];
  const totals = useMemo(() => rows.reduce((result, row) => ({
    calls: result.calls + row.callCount,
    tokens: result.tokens + row.totalTokens,
  }), { calls: 0, tokens: 0 }), [rows]);
  const periodOptions: Array<{ value: number | "all"; label: string }> = [
    { value: 7, label: text.periods[7] },
    { value: 30, label: text.periods[30] },
    { value: 90, label: text.periods[90] },
    { value: "all", label: text.periods.all },
  ];
  const columns: TableColumnsType<AiTokenUsageReportRow> = [
    { title: text.rank, dataIndex: "rank", width: 72, fixed: "left", render: (rank: number) => rank <= 3 ? <Tag color="orange">{rank}</Tag> : rank },
    { title: text.user, key: "user", width: 220, fixed: "left", render: (_, row) => <Space direction="vertical" size={0}><Text strong>{row.displayName}</Text><Text type="secondary">{row.username}</Text></Space> },
    { title: text.calls, dataIndex: "callCount", width: 128, align: "right", render: numberFormat.format },
    { title: text.reported, key: "reported", width: 132, align: "right", render: (_, row) => `${numberFormat.format(row.usageReportedCount)} / ${numberFormat.format(row.callCount)}` },
    { title: text.input, dataIndex: "inputTokens", width: 136, align: "right", render: numberFormat.format },
    { title: text.output, dataIndex: "outputTokens", width: 136, align: "right", render: numberFormat.format },
    { title: text.cached, dataIndex: "cachedInputTokens", width: 144, align: "right", render: numberFormat.format },
    { title: text.reasoning, dataIndex: "reasoningTokens", width: 144, align: "right", render: numberFormat.format },
    { title: text.total, dataIndex: "totalTokens", width: 148, align: "right", sorter: (a, b) => a.totalTokens - b.totalTokens, defaultSortOrder: "descend", render: (value: number) => <Text strong>{numberFormat.format(value)}</Text> },
    { title: text.lastUsed, dataIndex: "lastUsedAt", width: 190, render: (value: string | null) => value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "" },
  ];
  return (
    <section className="ai-token-usage-report-page">
      <div className="ai-token-usage-report-heading">
        <div><Text className="page-eyebrow">{text.eyebrow}</Text><Title level={2}>{text.title}</Title><Text type="secondary">{text.description}</Text></div>
        <Space><Text strong>{text.period}</Text><Select aria-label={text.period} value={period ?? "all"} onChange={(value) => setPeriod(value === "all" ? null : value as Period)} options={periodOptions} /></Space>
      </div>
      <Row gutter={[16, 16]} className="ai-token-usage-summary">
        <Col xs={24} md={8}><Card><Statistic title={text.users} value={rows.length} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title={text.calls} value={totals.calls} /></Card></Col>
        <Col xs={24} md={8}><Card><Statistic title={text.tokens} value={totals.tokens} /></Card></Col>
      </Row>
      {reportQuery.isError && <Alert type="error" showIcon message={text.error} />}
      <Card className="ai-token-usage-table-card" styles={{ body: { padding: 0 } }}>
        <Table rowKey="userId" columns={columns} dataSource={rows} loading={reportQuery.isLoading} pagination={false} scroll={{ x: 1450, y: "calc(100vh - 430px)" }} locale={{ emptyText: <Empty description={text.empty} /> }} />
      </Card>
    </section>
  );
}
