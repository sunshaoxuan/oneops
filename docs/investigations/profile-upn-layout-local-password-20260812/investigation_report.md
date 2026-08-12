# プロフィール UPN、画面幅及び LOCAL パスワード調査

## 結論

ドメイン UPN の空欄は、プロフィールが Windows Identity の `metadata.upn` だけを表示し、過去の Identity に当該 Metadata が保存されていないことが原因である。ドメイン UPN は `name@domain` 形式の Windows UPN であり、企業メールとは別の属性である。

プロフィール Modal は 560px 幅の縦一列で、長い識別情報と所属情報の確認に不足していた。LOCAL Identity の自己パスワード変更 API と UI は存在しなかった。

## 実装

TOKYO の真人 Windows Identity だけを対象に、欠損 UPN を `name@tokyo.scientia.co.jp` として Metadata へ保存する Migration 048 を追加した。プロフィールを 880px、二列 Layout とし、720px 以下では一列にする。LOCAL Identity を持つ利用者には現在パスワード確認付きの変更フォームを表示する。

パスワード変更は CSRF、現在 Hash 照合、共通強度規則、scrypt 再 Hash、他 Session 取消及び監査を一つの契約として実装した。
