# 証拠索引

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| UPN 空欄は Metadata 欠損による | `mapExternalIdentity`、`ProfileDialog.tsx` | 高 | 実 DB 件数は Runtime 検証で確認する |
| 欠損 UPN を明示データへ統一する | Migration 048 | 高 | TOKYO 真人账号だけを対象とする |
| プロフィールは広い二列表示になる | `ProfileDialog.tsx`、`styles.css`、UI 試験 | 高 | Browser Screenshot を最終確認する |
| LOCAL 利用者だけがパスワードを変更できる | `ProfileDialog.tsx`、Auth Controller、Repository | 高 | 実パスワード変更は実行しない |
| 現在 Session を維持し他 Session を取り消す | `changeLocalPassword` Transaction、Repository 試験 | 高 | 実 Session 行は変更しない |
