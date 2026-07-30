# 試験結果

## 自動試験

- 問合せ Gateway 集中試験: 27 件成功
- 完全な `pnpm check`: 成功
  - Gateway: 131 件成功
  - Portal Shell: 103 件成功
  - Builder: 4 件成功
  - 本番ビルド: 成功
- Model API Prompt 回帰試験:
  - 分析対象の `targetQuestionKey` と `focusedMessageKey` を確認
  - 対象外の過去質問と公開回答が Prompt に含まれることを確認
  - 最終顧客評価「やや悪い」と評価コメントが Prompt に含まれることを確認
  - 顧客組織名を保持し、顧客担当者名、電話番号、メールアドレス、Secret を除外することを確認
  - 顧客評価と充足度の矛盾を確認する指示文を確認
- UI 文言試験:
  - 日本語、中国語、英語の対象範囲が問合せ全体を示すことを確認

## 公開確認

- `app\scripts\publish-portal.ps1 -Reason inquiry-ai-assist-full-context-v0.6.4`: 成功
- nginx 設定検査: 成功
- Gateway 状態: `UP`
- HTTPS 応答: `200`
- Upstream 状態: `online`

## 実 Model API 確認

- 対象 URL: `https://192.168.20.54/inquiry-support`
- 対象問合せ: `94056`
- 対象: Q5 の顧客公開返信
- Model: `gpt-5.6-terra`
- 完了日時: 2026-07-30 18:07:18
- Token: 入力 4,635、出力 895、合計 5,530
- 結果:
  - 顧客評価の「質問への未回答・繰り返し確認」を問題の要点として認識した。
  - 選択返信は方向性が一致する一方、具体的な確認方法と代替手段がなく、十分な案内ではないと判定した。
  - 回答できていない要点として、所属部局の確認方法または正式な代替手順を提示した。
- 再読込後、保存済み AI 補助履歴から同じ結果を確認した。
- ブラウザコンソールの warning と error: 0 件
- スクリーンショット: `docs/evidence/inquiry-ai-assist-full-context-94056-20260730.png`
