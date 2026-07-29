# 問合せ AI 補助入口意図の調査記録

## 1. 目的

顧客質問とサポート返信に配置した AI 補助操作について、画面文言と Model API または Agent Gateway へ送信する Prompt の意図を一致させる。

## 2. 調査結果

### 2.1 画面から API まで

1. 顧客質問の操作は `anchor=QUESTION` と `focusMessageKey=null` を設定する。
2. サポート返信の操作は `anchor=MESSAGE` と対象の `focusMessageKey` を設定する。
3. 問題ブロック末尾の操作は `anchor=NEXT_REPLY` と `focusMessageKey=null` を設定する。
4. API は位置と重点発言の組み合わせを検証して実行履歴へ保存する。
5. AI 実行サービスは従来 `focusMessageKey` だけを Prompt 構築へ渡しており、保存済みの `anchor` を使用していなかった。

### 2.2 Provider への伝達

`buildInquiryAnalysisPrompt` が生成した同じ Prompt を次の両経路が使用する。

1. Model API は Chat Completions の user message へ Prompt を設定する。
2. Agent Gateway は CAG Task の `prompt` へ Prompt を設定する。

問合せ画面の現行運用は Model API 固定である。Agent Gateway 経路でも共通実行サービスを使用する場合は同じ位置意図が保持される。

## 3. 実装

1. 顧客質問の日本語操作文言を「お客様の質問を分析する」へ変更した。
2. サポート返信の日本語操作文言を「この返信の品質を分析する」へ変更した。
3. 中国語と英語の表示文言、Tooltip、アクセシブル名称も同じ意味へ統一した。
4. Prompt の証拠コンテキストへ `workflow.anchor` を追加した。
5. `QUESTION` は質問の要点、曖昧点、不足事実、調査方向を優先する。
6. `MESSAGE` は選択返信の関連性、回答範囲、証拠、欠落、リスク、顧客向け表現を優先する。
7. `NEXT_REPLY` は問題ブロック全体から次の調査または顧客向け返信を判断する。
8. 返信が十分な場合は不足や追加返信を作為的に生成しない。

## 4. 検証結果

### 4.1 自動テスト

1. `node --test gateway/inquiry-support.test.mjs`: 26 件成功
2. `vitest run src/inquiry-support.test.ts`: 20 件成功
3. `pnpm check`: Gateway 127 件、Worker 4 件、Portal 91 件、Production build 成功
4. `pnpm test:operations`: 成功
5. `git diff --check`: エラーなし

### 4.2 リリース確認

1. `publish-portal.ps1 -SkipChecks -Reason inquiry-ai-anchor-intent`: 成功
2. `nginx -t`: 成功
3. OneOps Gateway health: `UP`
4. OneOps HTTPS: 200
5. CAG は PID 17348 と開始時刻をリリース前後で維持した。

### 4.3 ブラウザー確認

1. 認証済み OneOps で問合せ No.38950 を表示した。
2. 顧客質問の AI 入口が `お客様の質問を分析する` というアクセシブル名称を持つことを確認した。
3. 7 件のサポート記録の AI 入口が `この返信の品質を分析する` というアクセシブル名称を持つことを確認した。
4. ブラウザーコンソールの error、warning は 0 件だった。
5. 表示確認用スクリーンショットを取得した。
