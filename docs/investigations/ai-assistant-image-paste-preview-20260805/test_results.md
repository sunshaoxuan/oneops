# 試験結果

更新日: 2026-08-05

## 実施済み

1. Portal 単体試験 17 ファイル、143 試験が成功した。
2. Portal TypeScript Build と Vite 本番 Build が成功した。
3. 全画面で 1 回目の Ctrl+V 後に縮小画像が 1 件、同じ画像の再貼り付け後も 1 件であることを確認した。
4. 画像の `naturalWidth` が 976、`naturalHeight` が 124 であり、破損画像ではないことを確認した。
5. 画像ファイル名が画面テキストへ表示されず、アクセシビリティ名に `clipboard.png` が残ることを確認した。
6. 全画面と浮動ウィンドウで Modal が 1 件開き、外側選択後に 0 件となることを確認した。
7. 520 × 720 の狭幅で浮動ウィンドウが 520 × 720 の全画面となり、縮小画像が 78 × 72 で収まることを確認した。
8. 最終ブラウザー検証の Console error と warning が 0 件であることを確認した。
9. 全体 `pnpm check` が成功した。Gateway は 175 試験、Builder は 14 試験、Portal は 146 試験が成功した。
10. Spring Backend は 33 試験中 26 試験が成功し、データベース条件を必要とする 7 試験は設計どおり Skip された。Build は成功した。
11. 初回の隔離環境全体試験では Builder VM 名の試験用環境値がなく 1 試験が失敗した。`HV_HYPERV_VM_NAME` へ試験用値を指定し、全体試験の先頭から再実行して成功した。
12. `nginx -t`、本機 Health、公開 Health が成功し、Backend は 0.9.5 を上報した。
13. 正式 Portal は `/assets/index-BofsPBpt.js` と `/assets/index-ClBLtH0y.css` を参照し、双方の実体を確認した。
14. 正式 `https://192.168.20.54/ai-assistant` で 1 回目と再貼り付け後が双方 1 件、画像読込、Modal 開閉、OneOps v0.9.5、Console 0 件を再確認した。

