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

## 直接 Push、正式配信及び最終再試験

2026-08-12 に AI アシスタントの Session 型契約と旧試験を現行実装へ統一した。最新 `origin/master` を取り込んだ後、Portal 全試験 41 File、247 件が合格し、TypeScript Build と Vite Production Build も合格した。既存の主 Chunk Size Warning は継続している。

Help の初回正式 Browser 受入では 390 × 844 Viewport に横方向 Overflow を検出した。原因は Grid Item である `.manual-section` の自動最小幅であった。`min-width: 0` と回帰試験を追加し、最終受入を先頭から再実行した。

最終結果は次のとおりである。

1. 四 Help 文書は Desktop と 390 × 844 の両方で横方向 Overflow 0 件である。
2. 四文書の H1、目次数、Section 数、OneHR 背景 `rgb(247, 248, 250)`、白色 8 px Card を正式 HTTPS 上で確認した。
3. 四文書の Console Error は 0 件である。
4. 目次の先頭 Link は対応 Section へ遷移した。
5. 正式 URL は全て HTTP 200、Build と配信先の `index.html`、四 HTML、`help.css` の SHA-256 は一致した。
6. Health は HTTP 200、Backend Version は `0.18.20`、Nginx Upstream は `127.0.0.1:8092` である。
7. Header の画面別 Mapping、新しい Tab、`noreferrer` は統合試験で合格した。正式業務画面は Windows SSO 確認表示から進まず、ログイン後 Header の実 Click 証拠は `evidence_missing` である。

## OneOps 製品 Header 修正

Help の Brand Header を HOME と同じ OneHR Logo、区切り線、`OneOps`、「導入・保守・支援」へ統一した。文書種別は「オンラインマニュアル」へ変更し、`ONLINE MANUAL` と `ONEHR PRODUCT SERIES` を四文書から削除した。

Portal 全試験 41 File、248 件と Production Build が合格した。正式 HTTPS 上の四文書で OneOps 製品名、日本語副題、日本語文書種別、同一 Origin HOME Link、横方向 Overflow 0、Console Error 0 を確認した。Build と配信先の Help HTML SHA-256 は一致した。

## Refresh 再発防止

1. Watcher SelfTest は `Valid=true` であり、`.codex-work` 内 Source を配信対象から除外した。
2. Operations Script Test は 9 Script 全て合格した。
3. Help 聚焦試験は 3 File、12 件合格し、Production Build も合格した。
4. SYSTEM の `OneOps Continuous Delivery` Task を再起動し、状態 `Running` を確認した。
5. `.codex-work` 内文書の更新前後で配信 Log Size は `2225886` のまま変化せず、Watcher が配信を開始しないことを確認した。
6. 主作業 Tree Source、検証済み Build、正式 Web Root の問合支援 HTML は SHA-256 `C156C893D816FBDA6DF00DCF77F11E2AB0C4B4F10B22AD6186844F4274C133C6` で一致した。
7. 正式 Browser で 4 回連続 Refresh し、全回で `OneOps`、「導入・保守・支援」、「オンラインマニュアル」を確認した。旧英語は 0 件、Console Error は 0 件である。
8. 配信主体は `delivery_succeeded` を記録した。後処理で使用中の Rolling JAR 削除が失敗したが、静的配信、HTTPS、Health 及び Hash 一致に影響はない。
