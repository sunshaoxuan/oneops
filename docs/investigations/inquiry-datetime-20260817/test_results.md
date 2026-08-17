# テスト結果

## Gateway 問合支援テスト

コマンド:

```text
D:\nginx\runtime\node\node.exe --test app/gateway/inquiry-support.test.mjs
```

結果: 43 passed, 0 failed, 0 skipped。

## Portal テストと build

`D:\nginx\runtime\node\pnpm.cmd --dir app --filter @one-ops/portal-shell test -- InquirySupportPage` を実行し、46 ファイル、274 テストが合格した。`D:\nginx\runtime\node\pnpm.cmd --dir app --filter @one-ops/portal-shell build` も合格した。

## parser の直接再現

時刻付き入力 `2026/08/17 14:35` は `2026-08-17T14:35:00+09:00` になり、日付だけの入力 `2026/08/28` は `2026-08-28T00:00:00+09:00` になった。

## 実サイト原文

現在の `ONEHR_UPDS` 設定を使った認証済み Gateway 経路で UPDS 検索 HTML を取得した。最初の 5 行の更新日時セルは `2004/01/04`、`2004/02/03` などの日付だけで、回答希望日セルは `2222/12/31` などの日付だけだった。原文に時刻は含まれていなかった。

## ブラウザー

Portal の HTTPS ページには到達し、ログイン画面の表示と Console の warn/error なしを確認した。認証済みの問合支援ページへは到達できなかったため、修正後の実データ表示、対象画面の Console、対象画面のスクリーンショットは `evidence_missing` として残る。
