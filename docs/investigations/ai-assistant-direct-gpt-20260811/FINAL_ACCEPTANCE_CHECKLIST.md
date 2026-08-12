# 最終受入一覧

更新日: 2026-08-12

一項でも不合格の場合は修正後に第 1 項から全項目を再実行する。

現在の中間判定は合格 22 項、待検証 4 項である。GPT Endpoint 復旧後の翻訳品質、翻訳 Screenshot、Git 及び自己改善成果更新が完了した時点で、第 1 項から全 26 項を再実行する。

| No. | 当初目的又は制約 | 成果物と証拠 | 状態 |
| --- | --- | --- | --- |
| 1 | AIアシスタントが CAG Task を作成せず GPT を直接呼ぶ | Source、Local Ledger、GPT Task 後も CAG 28 Task | 合格 |
| 2 | Model は Session の開始 Model 設定を使用する | Runtime と DB の `gpt-5.6-terra` Snapshot | 合格 |
| 3 | 推論強度を Responses API へ送る | Request Test と DB の `MEDIUM` Snapshot | 合格 |
| 4 | Quick Assistant の System Prompt を毎回維持する | Migration 044、Request Test、新 Session Snapshot | 待検証。強化後の実出力は Endpoint の 151 時間超 `model_cooldown` で未確定 |
| 5 | Streaming を既存 UI Event 契約へ変換する | Local SSE、Streaming Screenshot、自然完了 | 合格 |
| 6 | 同一 Session の Task を一件へ限定する | DB Lock、競合 Test、生成中 Enter 抑止 | 合格 |
| 7 | 生成中の Draft 入力と送信 Lock を維持する | Browser、保持 Draft Screenshot | 合格 |
| 8 | Stop が対象 GPT 接続を終了する | HTTP 202 507 ms、Cancelled 確定 6 ms | 合格 |
| 9 | Complete、Failed、Cancelled の終端を一件へ限定する | Cancelled 1、Completed 0、Failed 0 | 合格 |
| 10 | Reload 後に終端と完全回答を復元する | Browser Reload、後続 Completed Task | 合格 |
| 11 | Cancelled 部分回答を完全回答として復元しない | Browser Reload、Database 終端 | 合格 |
| 12 | 画像と文書添付を Responses API 形式で送る | Request Mock、正式文書添付 GPT Task | 合格 |
| 13 | File 制限を送信前に検証する | 50,000,000 Bytes 境界 Test | 合格 |
| 14 | CAG の Separator Error 経路を通過しない | Python StreamReader 原因、GPT Task 後も CAG 28 Task | 合格 |
| 15 | 既存 4 Session と 28 Task を保持する | Completed 24、Failed 3、Cancelled 1、断線 0 | 合格 |
| 16 | AIアシスタントから CAG Runtime Fallback を削除する | Source Scan、Migration 043 | 合格 |
| 17 | Personal Task の AI Session も同じ GPT 経路を使用する | Gateway Test、共通 Runner | 合格 |
| 18 | API Key を Client、Log、Audit へ露出しない | Security Test、公開 API 許可項目検査 | 合格 |
| 19 | Gateway、Portal、Worker、Spring、Operations を全て合格させる | Gateway 281、Portal 219、Worker 14、Build 3850、Spring 32 合格と 8 Skip、Operations | 合格 |
| 20 | Version、Changelog、正式文書を同期する | `VERSION` 0.18.20、変更履歴、要件及び調査文書 | 合格 |
| 21 | SYSTEM Continuous Delivery と正式 Health を合格させる | 01:23:07 `delivery_succeeded`、Runtime 0.18.20、Health、Listener、Asset SHA | 合格 |
| 22 | Browser Console Error と Warning を 0 件にする | 正式 Browser Console | 合格 |
| 23 | 正式 Screenshot を保存する | 五件の合格 PNG、旧翻訳 PNG | 待検証。強化後翻訳で旧 PNG を置換する |
| 24 | 限定 Stage、Commit、Push、Tag、Remote Equality を確認する | Git Evidence | 待検証 |
| 25 | 一時 Cutover Runner と試験成果物を削除する | Task Directory 不在、他 Task 5 Directory 保持 | 合格 |
| 26 | 自己改善 Candidate と学習受領記録を保存し、本一覧を第 1 項から再実行する | `D:\workspace\codex-selfimp`、Final Receipt | 待検証 |
