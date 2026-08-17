# テスト結果

## Gateway 問合支援テスト

コマンド:

```text
D:\nginx\runtime\node\node.exe --test app/gateway/inquiry-support.test.mjs
```

結果: 43 passed, 0 failed, 0 skipped。

## parser の直接再現

時刻付き入力 `2026/08/17 14:35` は `2026-08-17T14:35:00+09:00` になり、日付だけの入力 `2026/08/28` は `2026-08-28T00:00:00+09:00` になった。

## ブラウザーと実サイト

今回の依頼は原因調査であり、コード変更はないため、UI 受入のためのブラウザー変更確認は行っていない。認証済み UPDS の原文 HTML も取得していない。これらは `evidence_missing` として残る。
