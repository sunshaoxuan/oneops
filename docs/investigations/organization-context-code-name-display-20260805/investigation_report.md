# 組織機関 Code 及び名称表示 調査記録

調査日: 2026-08-05

## 1. 当初目的

業務画面上部の組織機関検索で、候補と選択後の値に機関 Code と正式な機関名を同時に表示する。

## 2. 原因

検索条件は機関 Code、正式な機関名及び略称を対象としていた。`ContextBar` の Select Option は `value.name` だけを Label に設定していたため、候補と選択後の表示から機関 Code を確認できなかった。

## 3. 対応

Select Option の Label を `Code Name` 形式へ変更した。検索値は既存の Code を維持し、機関 Code、正式な機関名及び略称による NFKC 正規化検索を維持した。

版数を 0.9.3 へ更新し、ルート版数、Portal、Backend、Health 及び画面表示版数を同期した。

## 4. 検証

自動試験、Production Build、Spring Boot、Rolling Package、運用 Script、Nginx 設定及び正式ローリング配信に合格した。

Browser の隔離 Fixture は正式 Production Build を配信し、候補の DOM 表示、Code 検索、選択後の値、通常幅、705 px 幅、Console 及び Screenshot を確認した。候補の Popup は Browser Screenshot に含まれないため、候補文字列は DOM Snapshot、選択後の表示は Screenshot を証拠とする。

機能 Commit を `origin/master` へ Push した後に最終ローリング配信を実行した。配信中の正式 HTTPS 220 件は全件 HTTP 200 で、配信後は Health `UP`、版数 0.9.3、主系 8092、内部互換 Gateway 8093、予備系停止、Portal Asset Hash 一致を確認した。
