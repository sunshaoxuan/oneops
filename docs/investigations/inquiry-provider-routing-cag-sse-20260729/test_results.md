# テスト結果

## データ初期化

| 項目 | 削除前 | 削除後 |
| --- | ---: | ---: |
| 問合せ AI 実行 | 12 | 0 |
| 問合せ AI 実行イベント | 23 | 0 |
| AI 操作監査 | 313 | 313 |

## CAG ライブ確認

| 確認 | 結果 |
| --- | --- |
| `/api/v1/projects` | 200、Project 1 件 |
| `read-only-analysis` | 許可 Profile に存在 |
| 主実行サービス OpenAPI | 0.12.0 |
| リポジトリ `VERSION` | 0.15.0 |
| Task SSE Content-Type | `text/event-stream; charset=utf-8` |
| 既存 Task SSE | 27 イベント |
| 終端 | `task.completed` |
| 逐次本文 | `agent.message.delta.data.delta` |
| 最終本文 | `agent.message.data.text` |
| `after_sequence=25` | 2 イベント |
| `Last-Event-ID: 25` と `after_sequence=0` | 27 イベント、Header 未反映 |
| Conversation 詳細 API | ライブ OpenAPI に存在 |
| Conversation Task 一覧 API | ライブ OpenAPI に存在 |

## OneOps 検証

| 検証 | 結果 |
| --- | --- |
| Agent Gateway と問合せ対象テスト | 32 件成功 |
| Gateway およびバックエンド Node テスト | 121 件成功 |
| Portal Shell Vitest | 84 件成功 |
| Worker Python テスト | 4 件成功 |
| Portal Shell 本番ビルド | 成功 |
| `pnpm check` | 成功 |
| プロジェクト文書言語テスト | 2 件成功 |

全体チェック後も問合せ AI 実行 0 件、実行イベント 0 件、AI 操作監査 313 件を確認した。
