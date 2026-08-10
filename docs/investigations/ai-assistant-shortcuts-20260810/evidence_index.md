# 証拠索引

| Claim | Evidence | Confidence | Limitation |
| --- | --- | --- | --- |
| 公式製品の専門助手構成を調査した | `AI_ASSISTANT_SHORTCUTS_REQUIREMENTS.md` 第 2 章、公式参照 URL | high | 製品機能は将来変更される可能性がある |
| 4 カテゴリ 12 件を初期登録する | `app/db/migrations/038_create_ai_assistant_shortcuts.sql` | high | 運用後の文言評価は含まない |
| Session が物理 ID と指示スナップショットを保持する | Migration、`ai-assistant-database.mjs` | high | なし |
| 各 Task へ継続指示を挿入する | `ai-assistant-routes.mjs`、`ai-assistant.test.mjs` | high | 実 CAG 送信は未実施 |
| 利用者応答から継続指示を除外する | `publicSession` と漏えい防止試験 | high | なし |
| 設定権限と利用権限を分離する | `auth.mjs`、`auth.test.mjs` | high | 実ユーザー権限変更は未実施 |
| 通常時に完全な円形輪郭を静止表示する | `browser-static-complete-ring-0.18.5.jpg`、Computed Style は全周 `rgb(255, 176, 135)`、Animation は `none` | high | なし |
| 「新しい話題」の Hover 中だけ分割軌道と Icon を動かす | `browser-hover-orbit-0.18.5.jpg`、軌道 `ai-assistant-shortcut-orbit`、Icon `ai-assistant-shortcut-pulse` | high | Keyboard Focus は自動試験で確認 |
| ポインター離脱後に完全な静止円へ戻る | 正式 HTTPS Browser の Computed Style 再取得 | high | なし |
| 動的入口と第 2 階層メニューを提供する | `AiAssistantChat.tsx`、Browser DOM | high | なし |
| 管理画面で 12 件と編集フォームを確認した | `docs/evidence/ai-assistant-shortcut-settings-20260810.png`、`docs/evidence/ai-assistant-shortcut-settings-editor-20260810.png` | high | Browser fixture |
| 専門 Session の目的と開始例を表示する | `docs/evidence/ai-assistant-shortcut-topic-20260810.png` | high | Browser fixture |
| OneOps 由来の Console warning と error がない | 正式 HTTPS Browser Console | high | Immersive Translate 拡張機能由来の Error 1 件は OneOps の URL ではない |
| Migration を連続 2 回実行できる | PostgreSQL 結果 `4, 12, 2, 1` | high | ローカル PostgreSQL |
| 正式配信が version 0.18.5 で稼働する | HTTPS 200、Health `UP`、`legacyGatewayReady: true`、Asset `assets/index-B4GazyAS.css` | high | なし |
