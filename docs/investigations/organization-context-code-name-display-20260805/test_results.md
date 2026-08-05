# 試験結果

実行日: 2026-08-05

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| Gateway | 合格 | 166 件合格 |
| Builder | 合格 | 14 件合格 |
| Portal | 合格 | 17 File、137 件合格 |
| Portal Production Build | 合格 | 3405 Module、`index-BLu5c5MN.js`、`index-DGi4JWCF.css` |
| Spring Boot | 合格 | 33 件、Failure 0、Error 0、条件付き Skip 7 |
| Maven Rolling Profile | 合格 | 33 件、Rolling JAR 作成 |
| 運用 Script | 合格 | 9 Script Parse、Rolling Switch、Atomic Publish |
| Nginx 設定 | 合格 | Syntax と設定試験成功 |
| 正式ローリング配信 | 合格 | `delivery_succeeded` |
| 配信中 HTTPS | 合格 | 55 件中 55 件 HTTP 200、失敗 0 |
| 候補表示 | 合格 | DOM に `ONEHR OneHR株式会社`、`ICHIHASHI 一橋大学`、`JIRCAS 国際農林水産業研究センター` |
| Code 検索 | 合格 | `ICHIHASHI` 検索後に対応する候補だけを表示 |
| 選択後表示 | 合格 | `ICHIHASHI 一橋大学` |
| 705 px Layout | 合格 | `clientWidth=690`、`scrollWidth=690` |
| Browser Console | 合格 | warning 0、error 0 |

Production Build には既存の Chunk Size Warning が一件ある。Build の終了 Code は 0 で、本変更に関する Failure はない。
