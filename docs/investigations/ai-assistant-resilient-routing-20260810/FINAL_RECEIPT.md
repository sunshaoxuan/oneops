# 最終受入回执

## 現在状態

実装及び自動試験完了。正式リリース受入は進行中。

## 初衷級受入一覧

| 原要求 | 成果物 | 証拠 | 状態 |
| --- | --- | --- | --- |
| 翻訳等は軽量 Model から開始する | Task Routing v3 | Routing Test、Runtime Task Metadata | 自動試験合格、Runtime 未検証 |
| 工単及び複雑分析は terra から開始する | Heavy Task Class Routing | Routing Test、Runtime Task Metadata | 自動試験合格、Runtime 未検証 |
| 同じ作業の再実行は一段階昇格する | Fingerprint Attempt Routing | Routing Test | 自動試験合格、Runtime 未検証 |
| 後続入力は前の作業を自動継続する | Task Summary Marker | Routing Test、会話履歴 | 自動試験合格、Browser 未検証 |
| 会話題名は本文先頭切出しを使わない | Task Routing 題名要約 | Title Test、Screenshot | 自動試験合格、Browser 未検証 |
| 新規 Session と発言を成功させる | CAG Contract v3 と Conversation 幂等性 | API Test、Runtime API | 自動試験合格、Runtime 未検証 |
| CAG 一時障害時も成功率を確保する | Retry、Backoff、Jitter、Circuit、予備 Endpoint | Unit Test、実障害切替 | 自動試験合格、実障害切替未検証 |
| CAG を履歴と監査の正式データソースとして維持する | CAG Conversation、Task、SSE 契約 | Source、API Test | 自動試験合格、Runtime 未検証 |
| 画面、Console、Screenshot を確認する | 正式 Portal | Browser 証跡 | 未検証 |
| Commit、Push、Version、Release を一致させる | OneOps 0.18.0、CAG 0.28.1 | Git、Health、Tag | 未実施 |

全項目が合格するまで完了又は正式リリースと判定しない。
