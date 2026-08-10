# AIアシスタント名称統一 調査・実装記録

更新日: 2026-08-10

## 調査対象

第 1 階層ナビゲーション、ワークベンチ入口、完全画面と浮動 AI 会話、個人タスク実行結果、ロール権限マトリクス、権限データ、現行要件及び三言語表示を対象とする。

## 確認済みの契約

1. 日本語の唯一の製品名は「AIアシスタント」とする。
2. 中国語は「AI 助手」、英語は「AI Assistant」を維持する。
3. 権限 Code `ai.assistant.use`、資源 Code `ai.assistant`、URL `/ai-assistant` を維持する。
4. 問合支援内の「AI 補助」と「クイックアシスタント」は別の機能名として維持する。

## 実装範囲

1. 主画面と AI 会話の日本語 Copy を「AIアシスタント」へ統一した。
2. 権限マトリクスの資源名を「AIアシスタント」、権限名を「AIアシスタント利用」へ統一した。
3. 個人タスクの通知及び保存済み実行結果を新名称へ統一した。
4. 再実行型 Migration の権限名称と説明を更新した。
5. 現行要件、設計、試験名及び Release 記録を更新した。
6. 中国語、英語、問合支援の AI 補助、クイックアシスタント及び安定技術契約を維持した。

## 公開結果

実装 Commit `4f36cb06cc3d4e14f6c3b7916384eda32085eb50` を `origin/master` へ Push した。最初の Rolling Publish は Windows の Nginx Global Event への Access Denied で中止され、流量と 0.18.2 Primary は維持された。その後、同じ Publish Script の固定 8092 置換手順で 0.18.3 JAR を配置し、`SkipGatewayRestart` で静的資源を公開した。公開 Log は `delivery_succeeded` を記録した。

公開後に Spring `0.18.3`、Node Readiness、Database Ready、Windows SSO Enabled、Windows SSO Auto Login、HTTPS 200 を確認した。Database の `ai.assistant.use` は `AIアシスタント利用` 及び新しい説明を返した。公開 Bundle は日本語、中国語、英語の各名称を含み、「AAIアシスタント」を含まない。

## Browser 制約

Edge は内部 HTTP SSO URL を `ERR_BLOCKED_BY_CLIENT` で遮断した。Codex In-app Browser は OneOps の「Windows にログイン中のアカウントを確認しています。」から遷移せず、SSO Endpoint への直接遷移も Timeout した。主画面、AI 会話画面、権限マトリクス及び OneOps Console は `evidence_missing` とする。認証済み Browser Session の提供後に最終受入を先頭から再実行する。
