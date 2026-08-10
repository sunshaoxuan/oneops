# AIアシスタント名称統一 最終受入一覧

更新日: 2026-08-10

## 1. 原要求

日本語の製品名を「AIアシスタント」へ統一し、第 1 階層の主画面、AI 会話機能及びロール権限設定で同じ名称を使用する。「AAIアシスタント」は使用しない。中国語、英語及び安定した技術契約は維持する。

## 2. 最終受入項目

| No. | 受入項目 | 成果物 | 検証証拠 | 状態 |
|---|---|---|---|---|
| 1 | 日本語の主ナビゲーションとワークベンチ入口が「AIアシスタント」を表示する | Portal i18n と主画面 | Portal Test、Browser Screenshot | 未実施 |
| 2 | 完全画面、浮動入口、Tooltip、アクセシブル名が「AIアシスタント」を使用する | AI 会話コンポーネント | Portal Test、Browser Screenshot | 未実施 |
| 3 | 権限マトリクスの資源名が「AIアシスタント」、権限名が「AIアシスタント利用」となる | 権限画面、権限データ | Portal Test、Gateway Test、Browser Screenshot、Database Query | 未実施 |
| 4 | 個人タスクの通知と保存済み実行結果が新名称を使用する | Personal Tasks、Gateway | Portal Test、Gateway Test | 未実施 |
| 5 | 中国語「AI 助手」と英語「AI Assistant」を維持する | Portal i18n、権限画面 | Portal Test、Browser locale check | 未実施 |
| 6 | `ai.assistant.use`、`ai.assistant`、`/ai-assistant` を維持する | 権限、Route | Source Audit、Portal Test、Gateway Test | 未実施 |
| 7 | 現行要件と設計文書が新名称を使用し、履歴文書を変更しない | 要件文書、設計文書 | Source Audit、Git Diff | 未実施 |
| 8 | Portal、Gateway、Spring、運用 Script の関連試験と本番 Build が成功する | Test と Build | test_results.md | 未実施 |
| 9 | 0.18.3 を稼働環境へ公開し、Health、Readiness、Windows SSO 契約が正常である | 稼働環境 | Health API、Auth Config | 未実施 |
| 10 | 実 Browser の主画面、AI 会話画面、権限マトリクスで表示を確認し、Console の Warning と Error が 0 件である | 稼働画面 | Browser Console、Screenshot | 未実施 |
| 11 | Commit と Push 後に `HEAD` と `origin/master` が一致し、全項目合格後に `v0.18.3` を作成する | Git Repository | Git Hash、Remote Tag | 未実施 |

## 3. 再実行規則

一項目でも不合格となった場合は修正後に No. 1 から全項目を再実行する。
