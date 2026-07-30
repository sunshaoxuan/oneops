# 証跡索引

| 証跡 | 内容 |
| --- | --- |
| `docs/evidence/ai-markdown-floating-20260730.png` | 浮動 AI アシスタントで四列表が 347 px の会話幅内へ収まり、セル内で改行される表示 |
| `docs/evidence/ai-markdown-full-page-20260730.png` | 全画面 AI アシスタントで四列表が会話幅内へ収まり、ページ横スクロールを発生させない表示 |
| `docs/evidence/ai-assistant-open-inquiry-20260730.png` | AI アシスタントの No. 94056・Q5 参照から問合せ詳細を直接開き、Q5 を展開した表示 |
| `app/apps/portal-shell/src/AiMarkdown.test.tsx` | Markdown 構造、安全性、表幅制御の単体テスト |
| `app/apps/portal-shell/src/ai-assistant.test.ts` | 内部項目名の業務表示変換と問合せを開く操作の単体テスト |
| `app/apps/portal-shell/src/inquiry-support.test.ts` | 検索を経由しない詳細取得と質問位置復元の単体テスト |
| `docs/AI_ASSISTANT_REQUIREMENTS.md` | 浮動表示と全画面表示の Markdown 要件、セキュリティ、幅制御 |
| `docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 問合支援 AI 補助の Markdown 要件と参照位置の直接復元要件 |
