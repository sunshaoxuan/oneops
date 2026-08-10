# 最終受入一覧

| 原要求 | 成果物 | 検証証拠 | 状態 |
| --- | --- | --- | --- |
| 主 Menu Icon を全体整理する | 11 Node Mapping | 調査記録、回帰試験 | 合格 |
| 顧客情報を Page 内部と統一する | `SolutionOutlined` | Source 合格、Browser 未確認 | `evidence_missing` |
| 問合支援を Page 内部と統一する | `MessageOutlined` | Source 合格、Browser 未確認 | `evidence_missing` |
| 別 Node 間の重複を解消する | 11 種類の一意 Icon | 回帰試験 | 合格 |
| 折畳み状態で識別可能にする | Icon 一覧、Tooltip | Browser Screenshot | `evidence_missing` |
| Navigation 契約を維持する | Key、URL、Permission、順序 | Portal 全体試験 | 合格 |
| 関連文書を更新する | UI Standard、調査文書 | Language Test | 合格 |
| 利用中断を避けて配信する | Rolling 配信 | `delivery_succeeded`、Health 0.16.3 | 合格 |
| 正式 Git を完了する | origin/master、Tag | Git 検証 | 実行中 |

Browser 関連 3 項が未合格のため、正式完了と Version Tag は保留する。Login 済み Browser Session の準備後、最終受入の先頭から全項目を再実行する。
