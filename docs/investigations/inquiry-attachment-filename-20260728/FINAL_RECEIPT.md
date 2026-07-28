# 最終回执

## 結果

多言語添付ファイル名を含む PDF プレビューの `ERR_INVALID_CHAR` を修正した。従来形式の `filename` は ASCII 代替名、完全な原名は UTF-8 の `filename*` として返す。

## 検証

- 自動検証: Gateway 119 件、Builder 4 件、Portal 80 件、TypeScript と本番ビルドが成功した。
- 実環境: 問合せ No. 38950 の日文名 PDF がブラウザー内蔵ビューアーで表示された。
- コンソール: エラー 0 件、警告 0 件。
- Gateway: 再起動後のヘルス応答は `UP`。

## 影響

添付のプレビューとダウンロードで生成する `Content-Disposition` だけを変更した。データベース変更はない。
