# 試験結果

* Portal全量試験: 42 Files、250 Tests合格。
* TypeScript及びProduction Build: 合格。
* Vite Production Build: 3853 Modules合格。
* 初回Buildは前タスクのTest Fixture型断言で停止した。Fixtureが部分Objectであることを明示する二段階断言へ修正後、全量試験とBuildを先頭から再実行して合格した。
* Runtime Readiness: HTTP 200、`status=UP`、`databaseReady=true`。
* Continuous Delivery: `2026-08-12T12:09:29.1696640+09:00 delivery_succeeded reason=identity-editor-spacing-20260812`。
* 配信CSS: `/assets/index-_HqibXMu.css` に `.windows-identity-editor{margin-bottom:var(--oneops-space-xl,24px)}` を確認した。
* Browser: In-app BrowserはWindows SSO確認表示から遷移せず、Chrome接続も利用できなかった。管理者ユーザー編集画面、Console及びScreenshotは `evidence_missing`。
