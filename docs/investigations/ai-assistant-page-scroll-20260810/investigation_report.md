# AI助手完全画面スクロール境界調査

## 調査対象

`/ai-assistant` の文書全体に、実際の会話量と関係しない縦スクロールが発生する事象を調査した。

## 結論

AI助手専用の `portal-content-ai-assistant` は自身へ `calc(100dvh - 70px)` を指定していた。一方、祖先の `portal-main` は通常ページと同じ文書フロー及び伸縮規則を使用していた。このため、子 Content の高さだけでは文書全体の増加を遮断できず、会話 Card の外側へ不要なページ領域が残る構造だった。

AI助手選択時だけ `portal-main-ai-assistant` を付与し、祖先 Layout を `100dvh` へ固定して外側 overflow を閉じた。Content は固定計算高を廃止して残余領域を `flex: 1 1 0` で使用する。会話超過時の縦スクロールは既存の `.ai-assistant-conversation` だけが担当する。

## 変更境界

1. AI助手以外の `portal-main` と `portal-content` は変更しない。
2. AI助手の外側 Layout は画面高に固定する。
3. 短い会話では文書全体をスクロールさせない。
4. 長い会話では会話領域だけをスクロールさせる。

## 実測結果

1622 x 1245 の Browser viewport で短い会話を表示した結果、文書 `clientHeight` と `scrollHeight` は共に 1245 だった。AI助手 Layout の高さも 1245 で、外側縦 overflow は `hidden` だった。

同じ viewport で長い会話を表示した結果、文書 `scrollHeight` は 1245 のまま維持された。会話領域は `clientHeight=1004`、`scrollHeight=2482`、`overflow-y=auto` となり、内部スクロールへ限定された。

## 制約

正式 HTTPS 画面は Windows ドメイン認証確認で停止したため、変更前の正式画面 DOM 寸法は提供画像と配信ソースから判定した。並行作業の継続配信が 2026-08-10 10:19:59 に成功し、正式配信 CSS と JavaScript に本変更が含まれること、Health 0.16.2 を確認した。認証後 DOM、Console 及び Screenshot は `evidence_missing` である。

`origin/master` の隔離 checkout では、本変更と無関係な既存 Portal 旧断言が 7 件失敗した。通常作業区では並行作業中の未コミット試験修正を含むため Portal 176 件が合格する。並行変更を本変更へ取り込まない原則に従い、本変更単独の公開操作と Tag は実行しなかった。

配信済み資産は並行作業区から生成され、本変更の隔離 commit だけを入力とした成果物ではない。このため配信済み事実と本変更単体の正式 Release 判定を分離する。
