# 最終受入一覧

| No. | 原要求又は制約 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|---|
| 1 | 問合支援の現行 Help | `public/help/inquiry-support.html` | 内容 Test、正式 HTTPS Browser | 合格 |
| 2 | AI アシスタントの現行 Help | `public/help/ai-assistant.html` | 内容 Test、正式 HTTPS Browser | 合格 |
| 3 | 製品構築の現行 Help | `public/help/product-builder.html` | 内容 Test、正式 HTTPS Browser | 合格 |
| 4 | 基本台帳の現行 Help | `public/help/basic-master.html` | 内容 Test、正式 HTTPS Browser | 合格 |
| 5 | 現在画面から対応文書へ遷移 | `contextual-help.ts`、`App.tsx` | Link Test 及び統合 Test。Windows SSO 確認中のため実 Click は未取得 | 合格、Browser Click は evidence_missing |
| 6 | 指示位置へ Help 入口を配置 | Header の言語選択と通知の間 | 統合 Test | 合格 |
| 7 | 文書へ新しい Tab で遷移 | `target=_blank`、`rel=noreferrer` | 統合 Test | 合格 |
| 8 | 関連 Test と Build | 3 Test File、Production Build、Portal 全 Test | 41 File、247 件合格、Build 合格 | 合格 |
| 9 | Browser 表示、Console、Screenshot | 正式 HTTPS Runtime | 四 Desktop、390 × 844、Console Error 0 | 合格 |
| 10 | 文書と変更記録 | 要件書、調査成果物 | File Review | 合格 |
| 11 | Version 管理と Remote 一致 | Help 実装 Commit `54c99e6` と最終証拠 Commit、`origin/master` | Push 後の Local HEAD と Remote 一致確認 | 合格 |
| 12 | 目次の文字基線と項目間隔を揃える | 共通 `help.css` | Style Test、Desktop、Narrow Browser | 合格 |
| 13 | 一般説明を排し現行実装の詳細使用過程を示す | 四 Help HTML | 97 Step、Contract Test、HTML 構造検査 | 合格 |
| 14 | onehr.jp の統一 Design Language を使用する | 共通 `help.css` | Live Design Evidence、Style Test、Browser Screenshot | 合格 |

## 受入判定

Help 文書、表示、試験、Build、Push、配信、HTTPS、Console、Desktop 及び Narrow View は合格した。ログイン後 Header の実 Click だけは Windows SSO 確認状態により `evidence_missing` として残る。Mapping と Link 属性の実装契約は自動試験で合格している。
