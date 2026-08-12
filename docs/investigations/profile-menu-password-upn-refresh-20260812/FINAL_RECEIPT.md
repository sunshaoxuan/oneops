# 最終受入記録

| 受入項目 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| Password を Profile から削除する | Profile Dialog | UI 試験 | 合格 |
| LOCAL 利用者へ独立 Dropdown 項目を表示する | App Menu | UI 試験 | 合格 |
| 独立 Password Dialog を使用する | PasswordChangeDialog | UI 試験 | 合格 |
| UPN を基本档案へ保存する | Production Identity Metadata | Read-only SQL | 合格 |
| Profile 開始時に最新 UPN を表示する | Session 再取得 | UI 試験 | 合格 |
| 正式画面で利用できる | 配信成果物 | Delivery、Health | 合格 |
| 認証済み画面の最終表示 | Dropdown、Profile、Password Dialog | Browser、Console、Screenshot | `evidence_missing` |

## 自動試験

Gateway 302 件、Portal 249 件、対象 UI 6 件、対象 Auth 35 件、TypeScript 及び Production Build は全て成功した。正式画面の受入は配信後に実施する。

## Runtime 及び Browser

`profile-menu-password-upn-refresh-c7a8661` の正式配信が成功し、nginx 設定試験及び HTTPS Health `UP`、Version `0.18.20` を確認した。In-app Browser は Windows SSO 確認画面から遷移せず、Console の Error 及び Warning は 0 件だった。接続済み Chrome は利用できなかった。認証済み Dropdown、Profile の UPN、独立 Password Dialog の Screenshot は `evidence_missing` とする。実 Password の入力及び変更は実施していない。
