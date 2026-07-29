# 問合せ AI と全体 AI アシスタントの CAG SSE 調査

## 目的

問合せ AI 補助の履歴を再試験可能な状態へ戻し、問合せ AI と全体 AI アシスタントの機能境界、OneCAG の現在の接続状態、SSE 互換性を確認した。

## AI 履歴の初期化

削除前は `inquiry_assist_runs` が 12 件、`inquiry_assist_run_events` が 23 件だった。12 件の内訳は Model API の完了 11 件と、2026 年 7 月 27 日から残っていた実行中 1 件だった。

`inquiry_assist_runs` を 1 トランザクションで削除した。`inquiry_assist_run_events` は外部キーの `ON DELETE CASCADE` により削除された。削除後は両テーブルとも 0 件である。

`auth_audit_events` の `INQUIRY_AI_ASSIST` 313 件は削除していない。操作監査は AI 出力履歴ではなく、利用者、機能、操作、結果を追跡する正式な監査証跡である。

## 現在の OneOps 設定

問合せ AI 補助の既定 Provider は `MODEL` である。設定済み Model は `gpt-5.6-terra`、用途は `GENERAL` である。

Agent Gateway 設定には有効な `OneCAG` Endpoint が存在する。問合せ設定には Agent Gateway ID と Project 参照が保存されていないため、現状の問合せ補助は CAG を選択できる設定状態ではない。

## CAG 実行状態

`GET /api/v1/projects` は 200 を返し、Project `cag` と `read-only-analysis` を含む許可 Profile を確認した。CAG の主実行サービスが公開する OpenAPI バージョンは 0.12.0 だった。`D:\workspace\cag` の現在の `VERSION` は 0.15.0 であり、主実行サービスとリポジトリに版差がある。

既存の完了 Task に対する `GET /api/v1/tasks/{id}/events?after_sequence=0&follow=false` は 200 と `text/event-stream` を返した。27 イベントには `agent.message` と `task.completed` が含まれていた。`agent.message.data` の実際のキーは `item_id`、`turn_id`、`text` だった。

## OneOps と CAG の互換性

OneOps の `GatewayInquiryAnalysisProvider` は `agent.message` の本文として `data.content`、`data.message`、`event.content` を参照し、CAG の `data.text` を参照していない。このため `/projects` の接続テストは成功しても、現在の問合せ分析は CAG の最終本文を取得できない。

問合せ分析 Provider は SSE 全体を最大 1 MiB、60 秒以内で読み終えた後に解析する。逐次イベント処理と途中進捗保存を行わない。短い完了 Task は上流が終端で接続を閉じるため受信できるが、長時間調査、1 MiB を超えるイベント、60 秒を超える Task は失敗する。

OneOps の同一生成元 SSE Proxy は `after_sequence`、`follow`、`Last-Event-ID` を上流へ転送し、命名イベントをそのままストリームする。CAG の Task SSE は `after_sequence` を処理する。確認した 27 イベントの Task では `after_sequence=25` が `agent.message` と `task.completed` の 2 件を返した。

CAG の Task SSE は `Last-Event-ID` を処理しない。`Last-Event-ID: 25` と `after_sequence=0` の組合せは 27 件を再送した。Conversation SSE はソース上で `Last-Event-ID` を処理する。Task SSE のブラウザー自動再接続では、クライアントが `after_sequence` を更新しなければ重複が発生する。

## 判定

| 項目 | 判定 | 根拠 |
| --- | --- | --- |
| OneCAG 接続 | 成功 | `/projects` が 200 |
| CAG Task SSE | 成功 | `text/event-stream`、27 イベント、終端あり |
| `after_sequence` 再開 | 成功 | 25 以降の 2 イベントを取得 |
| Task `Last-Event-ID` 再開 | 未対応 | Header だけでは 27 イベントを再送 |
| OneOps 問合せから CAG の本文取得 | 失敗条件あり | CAG は `data.text`、OneOps は未対応 |
| 長時間 Gateway 調査 | 未対応 | 全量読込、1 MiB、60 秒制限 |
| 問合せでの CAG 選択 | 未設定 | Gateway ID と Project 参照が空 |

現時点では CAG を問合せ分析の Provider として使用しない。問合せ AI 補助は Model API を固定利用する。CAG は OneOps 全体の AI アシスタントへ使用し、本文マッピング、逐次 SSE、終端処理、再開、完全接続テスト、AI アシスタント用 Project 設定を完了した後に利用可能へ変更する。

## 機能分離方針

問合せ支援内の問題整理、調査方向、既存回答評価、顧客向け返信案は Model API だけを使用する。問合せ画面へ Provider 選択を追加しない。

CAG は全画面から利用できる独立した AI アシスタントへ使用する。利用者ごとに複数の AI Session を所有し、各 Session は OneOps の安定物理 ID、CAG Conversation ID、会話履歴、SSE cursor を個別に保持する。AI Session はログイン認証 Session と区別する。

全体 AI アシスタントは右下の常設アイコンから開き、前面チャットウィンドウで CAG の delta を逐次表示する。新規話題、Session 履歴、Session 切替、停止、再接続を提供する。詳細要件は `docs/AI_ASSISTANT_REQUIREMENTS.md` に記録した。
