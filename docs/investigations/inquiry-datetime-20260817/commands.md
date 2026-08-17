# 実行コマンド

```text
git status --short --branch
git fetch origin master
rg -n -S "更新日時|回答希望日|updatedAt|requestedReplyAt" app/gateway app/apps/portal-shell/src
Get-Content app/gateway/inquiry-support-source.mjs
Get-Content app/apps/portal-shell/src/InquirySupportPage.tsx
D:\nginx\runtime\node\node.exe --test app/gateway/inquiry-support.test.mjs
D:\nginx\runtime\node\pnpm.cmd --dir app --filter @one-ops/portal-shell test -- InquirySupportPage
D:\nginx\runtime\node\pnpm.cmd --dir app --filter @one-ops/portal-shell build
```

実行結果は `test_results.md` に記録した。

認証済み `ONEHR_UPDS` 設定を使用した Gateway 経路で、UPDS 検索 HTML の先頭 5 行の更新日時セルと回答希望日セルを読み取った。資格情報そのものは出力していない。
