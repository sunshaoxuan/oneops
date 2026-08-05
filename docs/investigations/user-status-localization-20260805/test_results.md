# 試験結果

実行日: 2026-08-05

| 対象 | 結果 | 件数又は成果物 |
| --- | --- | --- |
| Gateway | 合格 | 166 件合格 |
| Builder | 合格 | 14 件合格 |
| Portal | 合格 | 17 File、137 件合格 |
| Portal Production Build | 合格 | 3405 Module、`index-Bgc_Vlqg.js`、`index-DGi4JWCF.css` |
| Spring Boot | 合格 | 33 件、Failure 0、Error 0、条件付き Skip 7 |
| 正式 Health | 合格 | Status `UP`、Version `0.9.2`、Online `true` |
| 正式 HTTPS | 合格 | HTTP 200 |
| 正式 Asset 同一性 | 合格 | HTML、JavaScript、CSS の SHA-256 が Build と配信先で一致 |
| 編集対象識別文言 | 合格 | 正式 JavaScript に三言語文言を確認 |
| 正式 Browser | 合格 | 三状態、編集対象識別、Console 0、Screenshot |

Portal Build には既存の Chunk Size Warning が一件ある。Build の終了コードは 0 であり、本変更に関する試験 Failure はない。

正式 Browser で「承認待ち」「有効」「停止」を確認した。編集 Modal は表示名、ユーザー名、メール及びロールを表示し、Console warning と error は 0 件であった。受入用の偽名利用者と Session は確認後に削除した。

13時21分に全自動試験を先頭から再実行し、Gateway 166 件、Builder 14 件、Portal 137 件、Spring Boot 33 件及び Production Build 3405 Module が合格した。
