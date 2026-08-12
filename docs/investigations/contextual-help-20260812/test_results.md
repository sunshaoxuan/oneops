# 試験結果

## 本タスク聚焦試験

| 試験 | 結果 |
|---|---|
| 画面別 Link 解決 | 合格 |
| Header 統合契約 | 合格 |
| 四 Help 文書の基本内容 | 合格 |
| 合計 | 12 件合格、0 件失敗 |

## Build

TypeScript Build と Vite Production Build は合格した。`dist/help` に `inquiry-support.html`、`ai-assistant.html`、`product-builder.html`、`basic-master.html`、`help.css` が生成された。既存の主 Chunk Size Warning が 1 件ある。

## 主作業 Tree の全 Portal Test

236 件合格、5 件失敗。本タスクの 12 件は合格した。失敗は並行タスクの未コミット AI アシスタント実装と旧静的契約 Test の不一致であり、本タスクの File 又は Help Header Hunkを参照していない。隔離作業 Tree の結果を正式判定に使用する。

## 最新 origin/master 隔離試験

`ffd4b41` へ本タスクだけを適用した隔離作業 Tree では、本タスク聚焦試験 12 件と Production Build が合格した。Portal 全 Test は 239 件中 236 件合格、3 件失敗となった。

失敗は `ai-assistant-gateway-errors.test.ts` 1 件、`ai-assistant.test.ts` 2 件であり、`ffd4b41` 単体の AI アシスタント実装と Test の不一致である。本タスクの Help File、Mapping 又は Header Hunk は失敗対象に含まれない。プロジェクト規約に従い、全 Test が合格するまで正式 Push、配信及び Browser 受入を保留する。

## 目次整列修正

利用者提供 Screenshot で確認された既定 List Marker、左 Padding 及び文字基線の不揃いを共通 `help.css` で修正した。Marker と左 Padding を解除し、List Item と Link を中央揃えにした。狭幅では一列 Grid へ切り替える。

修正後の画面別 Help 聚焦試験は 12 件合格、Production Build も合格した。Browser Client は Loopback URL と Inline Preview URL を Security Policy で遮断したため、DOM、Console 及び Screenshot は `evidence_missing` とする。全 Portal Test は基準側 AI Test 3 件失敗の状態を維持している。

## 詳細操作 Manual と OneHR Design 改訂

1. 画面別 Link、Header 統合、詳細文書 Contract の 12 Test は合格した。
2. HTML 構造検査で各目次 Link の対象 Section、H1 数及び Section 数を検証し、四文書が合格した。
3. 文書別 Step 数は問合支援 22、AI アシスタント 24、製品構築 28、基本台帳 23 である。
4. Production Build は合格し、四 HTML と共通 CSS が `dist/help` へ同梱された。
5. `git diff --check` は合格した。
6. onehr.jp は Browser で DOM、Computed Style、Console Error 0 を確認した。
7. 改訂 Help の Browser 表示と Screenshot は未配信のため `evidence_missing` である。
8. `origin/master` `2c97c2f` 上の Portal 全 Test は 239 件中 236 件合格、基準側 AI Test 3 件失敗である。
9. 同基準の Production Build は `AiAssistantChat.tsx` と AI Test Fixture の TypeScript Error 8 件で失敗した。本タスクの HTML、CSS、Mapping 及び Validator に起因する Type Error は 0 件である。
10. 正式配信 Gate は不合格を維持する。
