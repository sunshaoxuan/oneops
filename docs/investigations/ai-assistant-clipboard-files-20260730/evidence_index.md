# 証跡一覧

| 区分 | 証跡 | 確認内容 |
|---|---|---|
| 浮動ウィンドウ | `docs/evidence/ai-assistant-floating-clipboard-image-20260730.png` | 問合支援上で貼り付け画像が送信前添付として表示される |
| 全画面 | `docs/evidence/ai-assistant-page-clipboard-image-20260730.png` | AI助手全画面で貼り付け画像と操作案内が表示される |
| CAG 実回答 | `docs/evidence/ai-assistant-cag-clipboard-image-response-20260730.png` | 貼り付け画像内の `questionKey` を CAG が読み取って回答する |
| 単体試験 | `pnpm check` | Gateway 131 件、Builder 4 件、Portal 111 件が成功 |
| 製品ビルド | `pnpm check` | TypeScript と Vite の製品ビルドが成功 |
| 公開 | `publish-portal.ps1` | `delivery_succeeded` を確認 |
| Nginx | `nginx -t` | 構文と設定の検証が成功 |
| ヘルス | `/api/work-center/v1/health` | `status: UP`、上流接続正常 |
| ブラウザー | 開発者ログ | コンソール 0 件 |
