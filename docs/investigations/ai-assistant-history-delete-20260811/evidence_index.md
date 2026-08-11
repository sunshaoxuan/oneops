# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| 対象旧会話は現在利用者が所有する | PostgreSQL `ai_assistant_sessions` 読取結果 | 高 | 物理 ID と会話本文は文書へ記録しない |
| Database は対象旧会話を削除できる | Transaction 内 DELETE 1 行、Rollback 後 1 行保持 | 高 | 正式削除は Browser 受入で実施する |
| 対象旧会話の DELETE 要求が届いていない | `auth_audit_events` の過去 24 時間読取 | 高 | Runtime Data は Git 管理外 |
| Gateway DELETE Route は所有者条件付きで削除する | `ai-assistant-routes.mjs`、`ai-assistant-database.mjs`、Gateway Test | 高 | なし |
| UI は中央 Modal から確定削除する | `AiAssistantChat.tsx`、Portal Test、`browser-delete-confirmation-0.18.8.png` | 高 | なし |
| 対象旧会話は正式 Browser から削除された | Browser 約 410 ms、操作監査 HTTP 200 及び 23 ms | 高 | なし |
| Refresh 後も対象旧会話は復元されない | Browser の削除 Button 0 件、PostgreSQL 対象 Session 0 件 | 高 | なし |
| 削除後の空状態を個人情報なしで確認した | `browser-delete-completed-0.18.8.png` | 高 | なし |
| Application Console は正常である | Browser Console Warning 0、Error 0 | 高 | なし |
| 正式 Runtime は 0.18.8 である | HTTPS 200、Health `UP`、`legacyGatewayReady=true` | 高 | なし |
| 変更を要件と変更履歴へ記録した | `AI_ASSISTANT_REQUIREMENTS.md`、`CHANGELOG.md` | 高 | なし |
