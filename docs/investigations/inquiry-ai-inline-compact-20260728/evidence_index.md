# 証跡索引

| 証跡 | 対象 | 確認内容 |
| --- | --- | --- |
| `docs/evidence/inquiry-ai-inline-compact-20260728.png` | 実画面の脱敏スクリーンショット | 回答位置に表示された AI 補助、Model、Token、追加返信不要の表示 |
| `app/apps/portal-shell/src/inquiry-support.test.ts` | フロントエンド単体テスト | 三種類の表示位置、位置別キャッシュ、空分類の非表示、追加返信不要表示 |
| `app/gateway/inquiry-support.test.mjs` | Gateway 単体テスト | 簡潔な出力契約、回答充足度、重点回答評価、追加返信不要判定 |
| `docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 要件記録 | 表示位置、復元条件、簡潔な分析構造、受入条件 |
| `docs/investigations/inquiry-ai-inline-compact-20260728/test_results.md` | テスト結果 | 自動テスト、ビルド、公開、ブラウザ確認の結果 |

## 証跡の取扱い

スクリーンショットは AI 補助パネルだけを切り出し、チケット番号、件名、顧客名、担当者名、質問本文、回答本文を含めていない。
