# Password Menu 分離と UPN Session 更新調査

## 結論

Production Database の対象ユーザーは物理 ID `143a55ae-8f8d-4d48-a320-4bd1bd5604d1` で、LOCAL と WINDOWS Identity を持つ。WINDOWS Subject は `TOKYO\x02851`、UPN は `x02851@tokyo.scientia.co.jp` として保存済みであり、基本档案自体は補完済みである。

Profile の UPN が空欄となる直接原因は、Profile を開く時に Session を再取得せず、Migration 前に Browser が取得した空 UPN の `auth.user` Cache を継続利用していたことである。

## 実装

Profile Dialog は開くたびに `fetchAuthSession` を実行し、最新 Identity Metadata を表示する。Password Form は Profile から削除し、LOCAL Identity を持つ利用者だけに右上 Dropdown の独立「LOCAL パスワード変更」項目を表示する。Password 操作は独立 `PasswordChangeDialog` で行う。
