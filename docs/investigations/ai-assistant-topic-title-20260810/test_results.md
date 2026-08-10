# 試験結果

| 対象 | 結果 |
|---|---|
| 会話テーマ定向 Test | 1 file、4 tests、5 scenarios 合格 |
| 現作業ツリー Portal 回帰 | 26 files、182 tests 合格 |
| 現作業ツリー Build | 合格、3442 modules transformed |
| `origin/master` クリーン複製の会話テーマ定向 Test | 合格 |
| `origin/master` クリーン複製の Build | 合格、3442 modules transformed |
| `origin/master` クリーン複製の Portal 回帰 | 6 files、7 tests 失敗。Navigation 権限整理及び Secondary Heading 書式に関する既存の Source と Test の差異 |
| Browser | `http://127.0.0.1:4174/` を表示。Windows Account 確認画面から遷移せず、実 Session の履歴名確認は `evidence_missing` |
| Console | Browser 確認中の記録は 0 件 |
| Screenshot | `browser-preview.png` を保存 |

## 配信判定

クリーンな正式配信候補で Portal 回帰が合格していないため、静的配信は実行していない。実 Session の Browser 確認も Windows Account 確認で阻止された。コードの定向試験及び Build は合格しているが、正式配信及び最終完了の条件は未達である。
