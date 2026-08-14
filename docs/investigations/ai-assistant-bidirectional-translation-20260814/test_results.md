# 試験結果

| 試験 | 結果 | 証拠 |
|---|---|---|
| Database Context 集中試験 | 合格 | 13 件、Failure 0 |
| Gateway 全量試験 | 合格 | 320 件、Failure 0 |
| Python Worker | 合格 | 18 件、Failure 0 |
| Portal Unit Test | 合格 | 46 Files、273 件、Failure 0 |
| TypeScript と Production Build | 合格 | 3854 Modules、Hash 付き Asset 生成 |
| Spring Backend | 合格 | 49 件、Failure 0、Error 0、環境条件 Skip 10 |
| Nginx 構文 | 合格 | `syntax is ok`、`test is successful` |
| SYSTEM 正式配信 | 合格 | 2026-08-14 16:48:57 `delivery_succeeded reason=.continuous-delivery.trigger` |
| Runtime Health | 合格 | `status=UP`、`version=0.18.23`、`legacyGatewayReady=true`、上流 8092 |
| Browser 日本語から中国語 | 合格 | 「本日の会議は午後三時に始まります。」から「今天的会议于下午三点开始。」 |
| Browser 中国語から日本語 | 合格 | 「明天上午九点提交测试报告。」から「明日の午前9時にテストレポートを提出してください。」 |
| Browser 日本語へ再切替 | 合格 | 「資料は金曜日までに確認してください。」から「请在星期五之前确认资料。」 |
| Task Ledger | 合格 | `Chinese`、`Japanese`、`Chinese`。全件 `TRANSLATION`、`INHERITED`、`references_previous_context=false`、`context_scope=none` |
| Browser Console | 合格 | OneOps Application Error 0、Warning 0。Browser 翻訳拡張自身の Version 不一致 Error 1 件は `chrome-extension://` Source として分離 |
| Browser Screenshot | 合格 | `docs/evidence/ai-assistant-bidirectional-translation-0.18.23-20260814.png`。個人識別表示を Crop 済み |
