# 最終受入一覧

| No. | 原要求又は制約 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|---|
| 1 | 問合支援の現行 Help | `public/help/inquiry-support.html` | 内容 Test、Browser | 検証中 |
| 2 | AI アシスタントの現行 Help | `public/help/ai-assistant.html` | 内容 Test、Browser | 検証中 |
| 3 | 製品構築の現行 Help | `public/help/product-builder.html` | 内容 Test、Browser | 検証中 |
| 4 | 基本台帳の現行 Help | `public/help/basic-master.html` | 内容 Test、Browser | 検証中 |
| 5 | 現在画面から対応文書へ遷移 | `contextual-help.ts`、`App.tsx` | Link Test、Browser | 検証中 |
| 6 | 指示位置へ Help 入口を配置 | Header の言語選択と通知の間 | 統合 Test、Screenshot | 検証中 |
| 7 | 文書へ新しい Tab で遷移 | `target=_blank`、`rel=noreferrer` | 統合 Test、Browser | 検証中 |
| 8 | 関連 Test と Build | 3 Test File、Production Build、Portal 全 Test | 聚焦 12 件合格。基準側 AI Test 3 件及び TypeScript 8 件失敗 | 不合格 |
| 9 | Browser 表示、Console、Screenshot | 正式 HTTPS Runtime | Browser 証拠 | 検証中 |
| 10 | 文書と変更記録 | 要件書、調査成果物 | File Review | 合格 |
| 11 | Version 管理と Remote 一致 | Local 独立 Commit、`origin/master` | Git Evidence | 検証中 |
| 12 | 目次の文字基線と項目間隔を揃える | 共通 `help.css` | Style Test、Production Build | Browser 証拠待ち |
| 13 | 一般説明を排し現行実装の詳細使用過程を示す | 四 Help HTML | 97 Step、Contract Test、HTML 構造検査 | 合格 |
| 14 | onehr.jp の統一 Design Language を使用する | 共通 `help.css` | Live Design Evidence、Style Test | Browser Screenshot 待ち |

## 受入判定

No. 8 が不合格であり、No. 9、No. 12、No. 14 の改訂 Help Browser 証拠が未取得のため正式配信を実行しない。基準側 AI Test 修復後は本一覧の先頭から全項目を再実行する。
