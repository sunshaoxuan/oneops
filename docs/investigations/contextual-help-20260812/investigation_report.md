# 画面別オンラインヘルプ調査報告

## 調査目的

問合支援、AI アシスタント、製品構築、基本台帳の現行機能と権限を確認し、現在画面から対応文書を直接開く入口を実装する。

## 確認結果

| 画面 | Route | 権限 | 主な現行機能 |
|---|---|---|---|
| 問合支援 | `/inquiry-support` | `inquiries.use` | UPDS 検索、詳細、会話、添付、位置指定 AI 支援 |
| AI アシスタント | `/ai-assistant` | `ai.assistant.use` | Session 履歴、添付、逐次応答、停止、再接続 |
| 製品構築 | `/product-builder` | `builder.use` | 端末状態、構築設定、Task、Log、成果物 |
| 基本台帳 | `/master-data` | `catalog.read` | 組織区分、組織機関、製品・版数 |

ヘッダーの言語選択と通知の間に円形 Help Button を配置し、対象画面だけで対応する静的文書を新しい Tab へ開く方式を採用した。静的文書は Portal 成果物へ同梱されるため、Portal と同じ Origin、Version、配信境界を使用する。

## 制約

主作業 Tree には複数の並行タスクによる未コミット変更が存在する。本タスクは新規 File と `App.tsx` の Help 関連 Hunk だけを Version 管理対象とする。Browser は `127.0.0.1` の Preview を Client Policy で遮断したため、正式 HTTPS 配信後に Browser 検証を行う。

## 詳細操作 Manual への再構成

利用者から、一般的な機能説明では実作業に利用できず、現行実装に基づく詳細な使用過程と onehr.jp の統一 Design Language が必要との指摘を受けた。四文書を次の Task 構成へ全面改訂した。

| 文書 | Task 区画 | 明示操作 Step | Field Table | 主な実装契約 |
|---|---:|---:|---:|---|
| 問合支援 | 7 | 22 | 3 | 初期検索条件、詳細条件、結果 Sort、Drawer、添付、三種類の AI 分析 |
| AI アシスタント | 8 | 24 | 1 | Session、Shortcut 購読、添付制限、送信、Streaming、停止、履歴 |
| 製品構築 | 9 | 28 | 4 | 端末、構造種別、Parameter、Task、成果物、実行 Log、交付 Download |
| 基本台帳 | 7 | 23 | 2 | 権限、三台帳、追加、編集、物理 ID、自然順 |

画面 Label は Source と照合し、製品構築では「新規構造」「構造を開始」「構造履歴」「成果物」「実行ログ」「生成してダウンロード」「再生成してダウンロード」を現行表示文字として使用した。

## onehr.jp Design Evidence

2026-08-12 に `https://onehr.jp/` を Browser で確認した。Body 背景は `rgb(247, 248, 250)`、本文は `rgb(51, 51, 51)`、Font は Lato と Noto Sans JP、Brand Accent は `rgb(253, 109, 38)`、Content Card は白色と 8 px Radius を使用していた。Help 共通 Style は同じ背景、本文色、Font、橙色 Accent、白色 8 px Card を採用し、OneOps の Page Hero と Section Heading の階層へ合わせた。
