# 問合支援 添付ファイル名応答ヘッダー不具合 調査報告

## 事象

日文など Latin-1 の範囲外の文字を含む PDF 添付をプレビューすると、Gateway が `ERR_INVALID_CHAR` を返し、PDF 本体を表示できなかった。

## 原因

Portal は添付の原名を `name` クエリへ設定する。Gateway はその名前を `Content-Disposition` の `filename` と `filename*` の双方へ設定していた。Node.js の HTTP 応答は、従来形式の `filename` に含まれる日文文字を有効なヘッダー値として受け付けず、`writeHead` で応答を中断した。

## 修正

`filename` には拡張子を維持した ASCII 代替名を設定する。完全な多言語ファイル名は RFC 5987 形式の `filename*` に UTF-8 パーセント符号化して設定する。日文 PDF 名を使用し、Node.js の `validateHeaderValue` を通過する回帰テストを追加する。

## 影響範囲

プレビューとダウンロードの `Content-Disposition` 生成だけが対象である。添付本体、Content-Type、Range 応答、認証、S3 リダイレクト制御は変更しない。

## ロールバック

本修正コミットを取り消し、Portal と Gateway を再公開する。データベース変更はない。
