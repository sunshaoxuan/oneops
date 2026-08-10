# Windows アカウント認証表記 調査及び実装記録

## 1. 当初目的

一般利用者向けログイン画面から技術略語 `SSO` を除き、Windows にログイン済みのアカウントを使用する認証だと簡潔かつ明確に伝える。

## 2. 変更前の状態

認証入口の見出しは `SSO`、日本語の操作は「Windows ドメインでログイン」、待機状態は「Windows ドメイン認証を確認しています。」だった。認証基盤の技術概念は示していたが、一般利用者が使用するアカウントを直接説明していなかった。

## 3. 実装

1. 日本語の見出しを「Windows アカウント認証」へ変更した。
2. 日本語の操作を「Windows にログイン中のアカウントで認証」へ変更した。
3. 日本語の待機状態を「Windows にログイン中のアカウントを確認しています。」へ変更した。
4. 中国語及び英語も同じ意味へ統一した。
5. 内部設定名、API Field、Route、監査 Event 及び認証処理の識別子は維持した。
6. 表示契約の回帰試験と認証要件文書を更新した。

## 4. 配信方式

正式な `publish-portal.ps1` を使用する。この Script は予備系 Gateway の起動と Health 確認、Nginx の平滑切替、主系更新及び主系復帰を行う。Portal Asset は内容 Hash 付き File を先に配置し、最後に `index.html` を切り替える。

## 5. 検証状態

認証表示の単一 File 試験、Gateway、Worker、Portal、Spring Backend、運用 Script、Project Language 及び Production Build は合格した。

最初の Rolling 配信は既定候補 Port 8095 の遺留 Process を検出して切替前に停止した。空き Port で再試行した結果、Nginx PID File が終了済み主 Process 29952 を示し、Worker 28364 だけが HTTPS を提供していたため Reload Event が存在しないことを確認した。Nginx 主 Process と Worker を計画 Task から再構成し、連続 HTTPS 100 Request は全件 200 だった。

遺留候補 Process を終了した後、SYSTEM の継続的デリバリー Task から最終受入を先頭から再実行した。`delivery_succeeded`、公開 Health `UP`、Version 0.16.2、HTTPS 200、配信前後 Index SHA256 一致及び主 Bundle の新表示を確認した。

実 Browser では「Windows アカウント認証」と「Windows にログイン中のアカウントで認証」が各 1 件表示され、単独の `SSO` は 0 件だった。自動認証待機状態も「Windows にログイン中のアカウントを確認しています。」を表示した。Console Warning と Error は 0 件であり、脱敏 Screenshot を保存した。
