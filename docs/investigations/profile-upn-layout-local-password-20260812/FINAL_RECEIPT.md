# 最終受入記録

| 受入項目 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| ドメイン UPN を完全表示する | Migration、Session API、Profile UI | 対象試験、Migration 配信成功 | 合格 |
| 画面幅を拡大し完全情報を表示する | 880px 二列 Layout | UI 試験 | 合格 |
| LOCAL 利用者がパスワードを変更できる | API、Repository、Profile UI | Gateway、UI 試験 | 合格 |
| Windows 専用利用者に LOCAL 操作を表示しない | Identity 条件 | UI 試験 | 合格 |
| セキュリティ境界を維持する | CSRF、現在 Password、scrypt、Session、Audit | Gateway 試験 | 合格 |
| 正式画面及び実行時で利用できる | 配信成果物 | Health、API、Browser、Console、Screenshot | 未合格 |

## 現在の完了判定

Commit `19fc86fdf107e6fd77a82618c55fdde9f027d1a8` は `origin/master` へ Push 済みである。Gateway 全量 302 件、Portal 全量 247 件、TypeScript 及び Production Build は共有 Working Tree で成功した。Migration 048 と Gateway は継続配信成功後に稼働し、未認証 Password API は `401 AUTHENTICATION_REQUIRED` を返した。

正式 Profile UI は継続配信キュー内の並行 Frontend 変更により配信完了を確認できない。Browser は Windows SSO 確認待機から進まず、Console Error と Warning は 0 件である。UPN の実表示、880px Layout、LOCAL Password 区画の Screenshot 及び実 DB UPN 件数は `evidence_missing` とする。実 Password 変更は実施していない。
