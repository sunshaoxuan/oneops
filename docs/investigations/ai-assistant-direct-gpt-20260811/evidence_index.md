# 証拠索引

更新日: 2026-08-12

| 主張又は成果 | 証拠 | 状態 | 制約 |
| --- | --- | --- | --- |
| 切替前 AIアシスタントは CAG Task を使用した | Cutover 前 Source、Task `671b2469-7ee5-4a9d-a922-512f14ff03fe` | 合格 | 2026-08-12 調査時点 |
| 対象 Error は CAG Task から返った | Task `671b2469-7ee5-4a9d-a922-512f14ff03fe`、Task Events | 合格 | Read Only Runtime 調査 |
| `Separator is found, but chunk is longer than limit` は Python StreamReader 層に由来する | `D:\workspace\cag\backend\app\runtimes\codex_app_server.py`、`asyncio` JSONL `readline()` | 合格 | GPT Context Window Error とは異なる |
| Responses API は HTTP SSE を使用する | [OpenAI Streaming](https://developers.openai.com/api/docs/guides/streaming-responses) | 公式資料 | 確認日 2026-08-12 |
| File Input の形式と 50 MB 制限 | [OpenAI File inputs](https://developers.openai.com/api/docs/guides/file-inputs) | 公式資料 | 一 File は 50 MB 未満、Request 合計 50 MB 以内 |
| 正式開始 Model と推論強度 | Model 設定、Session Snapshot、Browser | 合格 | `gpt-5.6-terra`、`MEDIUM` |
| GPT 直接実行 Runner | `app/gateway/ai-assistant-openai.mjs`、`app/gateway/ai-assistant-openai.test.mjs` | 合格 | `store: false`、`stream: true` |
| Local Task と Event Ledger | Migration 042、043、`app/gateway/ai-assistant-database.mjs` | 合格 | Row Lock、単一活動 Task、単一終端 |
| 日中相互翻訳の既定 Prompt を強化した | Migration 038、044、Gateway Test、Session Snapshot | 合格 | 未変更のシステム既定値だけを更新し、管理者変更値を保持 |
| 公開 Route は内部 Provider 情報を返さない | `app/gateway/ai-assistant-routes.mjs`、Gateway Test | 合格 | Provider Response ID、Output、Token、内部 Model 情報を除外 |
| Personal Task も GPT Runner を使用する | `app/gateway/personal-task-ai.mjs`、`app/gateway/personal-task.test.mjs` | 合格 | `assistantTaskId` へ統一 |
| Data Cutover は既存履歴を保持した | PostgreSQL、一回限り Runner | 合格 | 4 Session、28 Task、Completed 24、Failed 3、Cancelled 1、断線 0 |
| 正式 GPT Task は CAG Task を増加させない | GPT Browser 受入後の CAG 再照合 | 合格 | CAG は 28 Task のまま |
| 旧 CAG 専用実装を削除した | `agent-gateway-request.mjs` 削除、Migration 043、Source Scan | 合格 | 顧客ナレッジ用途の Gateway 設定は維持 |
| SYSTEM Continuous Delivery が 0.18.20 を配信した | `app/logs/continuous-delivery.log`、2026-08-12 01:23:07 `delivery_succeeded` | 合格 | Migration 044 を含む最終 Application Tree |
| 生成中も Draft を保持し二件目を送信しない | 正式 Browser、Streaming 中 Draft Screenshot | 合格 | 添付は Task 終端まで Lock |
| Stop は対象 GPT 接続を即時終了した | Browser HTTP 202 507 ms、Database Cancelled 確定 6 ms | 合格 | Stop 修正後の再受入 |
| Stop Task は単一終端である | Local Ledger と Event 集計 | 合格 | Cancelled 1、Completed 0、Failed 0 |
| Stop 後の Draft は一件の後続 Task として完了した | Browser、Local Ledger | 合格 | 後続 Task は Completed |
| Reload と Session 切替で状態を隔離した | 正式 Browser Reload と二 Session 切替 | 合格 | Draft、Stop、Task、Reply の混在 0 |
| Quick Assistant の第二階層を表示した | 正式 Browser、Menu Screenshot | 合格 | 全 Category から選択可能 |
| 日中相互翻訳の固定 Prompt を維持した | 正式 Browser、旧 2 Turn と新 Session Snapshot | 一部合格 | 固定 Prompt は確認済み。強化後の実出力は Endpoint 429 により待検証 |
| GPT Endpoint の Model 接続は正常である | 安全な Model 接続診断 | 合格 | `/models` HTTP 200、23 ms、10 Model、Terra 有り |
| Responses 再検証は Endpoint 全体の Rate Limit で停止した | 六 Model の最小 `/responses`、Local Task 3 件 | 外部状態待ち | `model_cooldown`、初回 Reset 544800 秒。CAG と無関係 |
| 文書添付を GPT Task で処理した | 正式 Browser、添付 Screenshot、Task 終端 | 合格 | 文書 Task は Completed |
| Browser Console は静穏である | 正式 Browser Console | 合格 | Error 0、Warning 0 |
| Gateway 最新全試験 | Gateway Test Runner | 合格 | 281 件 |
| 最終全量試験 | Portal 33 Files 219 件、Worker 14 件、Build 3850 Modules、Spring 32 件合格と環境条件 Skip 8 件、Operations | 合格 | Migration 044 追加後に再実行 |
| 日本語プロジェクト文書検査 | `gateway/project-language.test.mjs` | 合格 | 指定文書更新後 5 件 |
| 履歴 Screenshot | `docs/evidence/ai-assistant-direct-gpt-history-20260812.png` | 合格 | SHA256 `697FF8D7768B409F2D754CBCFBE1D071456485AB12D72AF51F862BD0E9512719` |
| Streaming と Draft Screenshot | `docs/evidence/ai-assistant-direct-gpt-streaming-draft-20260812.png` | 合格 | SHA256 `7E816EC653B084DD2CB26A2390A324D9C595900E84512311F8647C8B22F4B64B` |
| Cancelled Screenshot | `docs/evidence/ai-assistant-direct-gpt-cancelled-20260812.png` | 合格 | SHA256 `D24892C3F8B96A676D4F55646D3C454824DB2B88088BE6905C9C18D8A8986280` |
| Quick Assistant Menu Screenshot | `docs/evidence/ai-assistant-direct-gpt-quick-assistant-menu-20260812.png` | 合格 | SHA256 `361872A1ACDD37E7F3F89D0EBBCC8C484F69DC7B733DD748141731FE96B66ED6` |
| 日中相互翻訳 Screenshot | `docs/evidence/ai-assistant-direct-gpt-quick-assistant-translation-20260812.png` | 返工対象 | 旧 SHA256 `C5A501CEF46DC74E5DA8FF51383AB38B99C749C0DE07A69FD36F66E740C8498C`。原文助詞残留を検出し、最終証拠から置換予定 |
| 文書添付 Screenshot | `docs/evidence/ai-assistant-direct-gpt-attachment-20260812.png` | 合格 | SHA256 `D7659ED8CE8C733733ABB64A9BF120F5B85CF5834B07FBF40B4FD0A2718B61BA` |
| 残る最終受入 | 最終受入一覧 No. 4、23、24、26 | 待検証 | Endpoint 復旧後の翻訳、Screenshot、Git、一覧全量再実行 |
