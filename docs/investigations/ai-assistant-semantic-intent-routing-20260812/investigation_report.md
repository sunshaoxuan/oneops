# AIアシスタント Semantic Intent Routing 調査報告

## 調査対象

日中相互翻訳の第 3 入力に「解析」が含まれた時、翻訳 Session で複雑分析の三段階 Process が表示された事象を調査した。

## 原因

Gateway は入力本文を多言語の正規表現へ照合し、「解析」を `COMPLEX_ANALYSIS` と判定していた。直前の `TRANSLATION` Task Summary より本文 Keyword が優先され、Portal は公開 Routing の Task Class に従って三段階 Process を表示した。

回答生成前には既に構造化 Intent Analysis が実行されていたが、会話参照範囲だけを返し、Task Routing の確定には使用されていなかった。

## 修正

1. 入力本文の Keyword 列挙を Task 分類から削除した。
2. 既存 Intent Analysis の構造化 Schema に Task Class、目的、対象言語、制約及び直前 Task の継続有無を追加した。
3. 直前 Task 状態とクイックアシスタント固定指示を Semantic Intent Analysis へ渡した。
4. Semantic Intent と確定 Routing を同じ Task Ledger Transaction で保存した。
5. `task.routing` SSE Event で待機中の Portal へ確定 Task Class を反映した。

## 結論

Task Class の有限状態は表示と監査の契約として維持する。状態の選択は日本語、中国語又は英語の単語列挙ではなく、会話、現在入力及び利用者が選択したクイックアシスタントの意味に基づく構造化 Semantic Intent Analysis が行う。
