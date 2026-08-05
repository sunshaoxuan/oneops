# テスト結果

実施日: 2026-08-05

| 項目 | 結果 | 証跡 |
|---|---|---|
| Portal 単体試験 | 合格 | 17 files、147 tests |
| Portal Production Build | 合格 | TypeScript 及び Vite Build |
| Gateway 単体試験 | 合格 | 177 tests |
| Builder 単体試験 | 合格 | 14 tests |
| Spring Backend 単体試験 | 合格 | 33 tests、7 skipped |
| 運用 Script 検証 | 合格 | ParsedScripts 9、全配信条件 true |
| Nginx 構成検証 | 合格 | syntax is ok、test is successful |
| HTTPS Portal | 合格 | 200、`index-xotaXx98.js` |
| Backend Health | 合格 | 200、status `UP`、version `0.9.5` |
| 展開状態 | 合格 | Sider 248px、Main left 248px、横 Overflow なし |
| 折畳状態 | 合格 | Sider 72px、Main left 72px、横 Overflow なし |
| 折畳操作 | 合格 | `aria-expanded` true から false、Label が展開操作へ変更 |
| 折畳可能性の明示 | 合格 | 展開時 208px × 36px の橙色 Button と操作名を表示 |
| 機能名 Tooltip | 合格 | 折畳時に「ワークベンチ」を表示 |
| 折畳中の画面遷移 | 合格 | 顧客情報を選択し `/customers` へ遷移 |
| 再読込復元 | 合格 | 新規 Tab で初期表示から展開操作を表示し、72px 状態を復元 |
| Browser Console | 合格 | warning 0、error 0 |
| Screenshot | 合格 | 展開時の文字 Button と折畳時の Icon Button を保存 |
| 991px 以下の回帰 | 合格 | 既存 Media Query と Drawer を単体試験で確認 |

## 補足

最初の Spring Test は作業 Directory が Repository Root であったため `pom.xml` を検出できなかった。Backend Directory から再実行し、33 tests が合格した。

最初の全体 Build 再実行時は並行する常時配信が `dist` を使用し、`icon-ai.svg` の Copy が `EBUSY` となった。配信終了後に全体 Check を先頭から再実行し、177 Gateway tests、14 Builder tests、147 Portal tests 及び Production Build が合格した。
