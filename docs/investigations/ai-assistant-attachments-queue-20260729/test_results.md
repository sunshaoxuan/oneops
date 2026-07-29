# 検証結果

更新日: 2026-07-29

## 単体検証

| 項目 | 結果 |
| --- | --- |
| 添付ファイル所有者と Conversation 境界 | Node 単体テスト合格 |
| HMAC 署名 URL と SHA-256 | Node 単体テスト合格 |
| CAG Prompt の添付境界と表示用復元 | Node 単体テスト合格 |
| 複数選択、ドラッグアンドドロップ、大容量貼り付け | Vitest 合格 |
| `queued`、開始、逐次応答の状態分離 | Vitest 合格 |

## 統合検証

| 項目 | 結果 |
| --- | --- |
| `pnpm check` | Gateway 130 件、Worker 4 件、Portal 98 件、全件合格 |
| 本番ビルド | Vite production build 合格 |
| 本番発行 | `delivery_succeeded` |
| Nginx | `nginx -t` 合格 |
| OneOps Gateway | `UP`、上流接続 `online` |
| CAG | OpenAPI 0.12.0、Project 1 件、PID 17348 を維持 |
| ブラウザー | OneOps v0.5.0、複数選択 2 件、両方 `ready` |
| 大容量貼り付け | 32,769 バイトを 33 KiB の `.txt` 添付へ変換し、入力欄は空を維持 |
| アクセシビリティ | 表示される添付選択ボタンは 1 件 |
| コンソール | error、warning とも 0 件 |

CAG Task の送信は、稼働中の旧 CAG と知識学習作業へ影響させないため実施していない。署名 URL の取得と内容一致は OneOps の単体テストで検証した。
