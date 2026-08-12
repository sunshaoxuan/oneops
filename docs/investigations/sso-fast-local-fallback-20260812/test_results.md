# 試験結果

* Portal全量試験: 44 Files、255 Tests合格。
* Component試験: 認証中のローカルフォーム維持、非表示Frame、300ms Session確認及び5秒Timeoutの復帰を確認した。
* TypeScript及びProduction Build: 合格。
* Vite Production Build: 3853 Modules合格。既存の大容量Chunk警告のみ。
* Continuous Delivery: `delivery_succeeded reason=sso-fast-local-fallback-20260812`。
* 正式Browser: 初回アクセスから6.7秒後に同一OneOps画面でローカルログイン案内、ユーザー名、パスワード及び手動Windows認証ボタンを確認した。
* Browser Console: Error及びWarning 0件。
* Screenshot: `docs/evidence/sso-fast-local-fallback-20260812.png`。
* 追加画面確認: BrowserのTab数は試行前後で不変、可視Frame 0件。
* Nginx設定試験: 合格。同一Origin静的SSO Endpointは非ドメイン端末で約0.3秒以内に認証結果を返した。
* 運用Script全量試験: Passed、ParsedScripts 9、全10判定 true。
