# テスト結果

## 自動テスト

| 対象 | 結果 |
|---|---:|
| Gateway Node test | 131 成功 |
| Builder Python unittest | 4 成功 |
| Portal Vitest | 111 成功 |
| TypeScript build | 成功 |
| Vite production build | 成功 |

既知の Vite chunk size 警告は継続している。今回の変更に起因するエラーはない。

## 公開と稼働

| 確認 | 結果 |
|---|---|
| `publish-portal.ps1` | `delivery_succeeded` |
| `nginx -t` | 成功 |
| OneOps Gateway | `status: UP` |
| CAG Task | 受付、実行、SSE 反映成功 |
| ブラウザーコンソール | 0 件 |

## ブラウザー操作

| 操作 | 全画面 | 浮動 |
|---|---:|---:|
| PNG 貼り付け | 成功 | 成功 |
| 待機添付表示 | 成功 | 成功 |
| 添付削除 | 成功 | 成功 |
| 操作案内表示 | 成功 | 成功 |
| CAG への送信 | 成功 | 共通 Session のため同一経路 |

CAG は 58 KiB の貼り付け画像にある赤枠内の識別子を読み取り、`questionKey` と回答した。
