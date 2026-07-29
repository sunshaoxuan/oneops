# テスト結果

| 検証 | 結果 |
| --- | --- |
| AI アシスタントと問合せ表示の定向テスト | 27 件成功 |
| Gateway およびバックエンド Node テスト | 127 件成功 |
| Portal Shell Vitest | 91 件成功 |
| Worker Python テスト | 4 件成功 |
| Portal Shell 本番ビルド | 成功 |
| PowerShell 運用スクリプト | 成功 |
| `nginx -t` | 成功 |
| OneOps Gateway Health | `UP` |
| Migration テーブル | `ai_assistant_sessions` 存在 |
| `ai.assistant.use` | 3 既定ロールへ付与 |
| 公開直後の AI Session | 0 件 |
| CAG OpenAPI | 0.12.0 のまま |
| CAG ポート 8000 | PID 17348 のまま |

ブラウザーのログイン後画面、送信済み参照の灰色表示、別の活動中質問の追加、ドロワー終了時のエラー非表示、コンソール、スクリーンショットは最終確認へ記録する。
