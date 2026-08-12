# 試験結果

## 自動試験

- 聚焦 Portal 39件合格
- 聚焦 AI Session Database 11件合格
- 全量 Gateway 291件合格
- 全量 Portal 242件合格
- Builder 14件合格
- TypeScript及びVite Build合格

初回全量試験は旧静的断言2件で停止した。新しい Object 引数と利用者付き Cache Key に断言を同期し、全量試験を先頭から再実行して合格した。後から追加した別票拒否試験も合格した。

## 正式実行

- Migration 047の列、OwnerとTicketのIndex及び旧Taskからの回填を正式PostgreSQLで確認した。
- 正式Asset `/assets/index-D2RmVQBc.js` に票番号復元契約が含まれ、質問位置付き関連表示が含まれないことを確認した。
- Health `UP`、Version `0.18.20`、Upstream Online、Nginx 8092及び配信元とWebRoot Hash一致を確認した。
- BrowserはWindows SSO自動確認画面で停止した。Console Error 0件、Warning 0件である。認証後の問合せ詳細、同票会話復元及びScreenshotは `evidence_missing` とする。
