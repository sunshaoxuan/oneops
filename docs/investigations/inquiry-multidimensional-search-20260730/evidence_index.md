# 証跡索引

| 証跡 | 内容 |
| --- | --- |
| `app/gateway/inquiry-support-source.mjs` | 実サイト選択肢解析、全検索パラメーター変換、AND・OR 詳細照合 |
| `app/gateway/inquiry-support-routes.mjs` | 入力検証、ステータス制約、AI 履歴検索への条件引継ぎ |
| `app/packages/api-client/src/index.ts` | `InquirySearchInput` と `InquirySupportOptions` の公開契約 |
| `app/apps/portal-shell/src/InquirySupportPage.tsx` | 基本条件、詳細条件、検索可能な選択肢 |
| `app/apps/portal-shell/src/styles.css` | 12 列、2 列、1 列の応答レイアウト |
| `app/gateway/inquiry-support.test.mjs` | 実フォーム名への変換と選択肢解析の単体テスト |
| `app/apps/portal-shell/src/inquiry-support.test.ts` | 全検索軸、条件制約、応答レイアウトの検証 |
| `docs/INQUIRY_SUPPORT_REQUIREMENTS.md` | 多次元検索の正式要件 |

実サイトの読取確認は資格情報と顧客データを保存せず、件数と一致判定だけを調査報告へ記録した。画面は公開後に通常幅と 700 px 幅で撮影して目視確認し、顧客データを含まない状態で検証した。
