# パスワード変更表示名修正記録

## 要求

右上の利用者 Menu に表示するパスワード変更機能名から、認証方式の技術名 `LOCAL` を削除します。

## 表示契約

| 言語 | 機能名 |
| --- | --- |
| 日本語 | パスワード変更 |
| 中国語 | 修改密码 |
| 英語 | Change password |

説明、成功 Message 及び失敗 Message にも `LOCAL` を表示しません。LOCAL Identity を持つ利用者だけに機能を表示する内部判定、Password API、Audit Event `LOCAL_PASSWORD_CHANGED` は技術契約として維持します。

## 変更範囲

1. `i18n.ts` の三言語機能名と関連 Message を変更しました。
2. `password-labels.test.ts` で利用者向け文言に `LOCAL` がないことを固定しました。
3. `AUTHENTICATION_AND_RBAC_REQUIREMENTS.md` に表示契約を記録しました。
