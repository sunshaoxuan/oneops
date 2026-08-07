# 第2階層見出しの軽量化 調査報告

## 目的

システム管理の「ユーザー管理」見出しが第1階層の「システム管理」と同じ強い装飾と文字階層になっていたため、第1階層と第2階層の視覚的な役割を分離する。

## 調査結果

`IdentityManagementPage.tsx`、`WorkforcePolicyPages.tsx`、`ModelDesignPage.tsx` 及び関連する管理区画は `portal-section-heading` を使用している。従来の CSS は `portal-page-hero` と `portal-section-heading` に同じ背景、円形装飾、角丸及び強い見出し階層を適用していた。

## 実装

- `portal-page-hero` は従来の第1階層ページ大見出しとして維持した。
- `portal-section-heading` を白色、最小高さ 72px、見出し 22px、字重 700、アイコン 40px 四方の軽量見出しへ変更した。
- 第2階層では装飾円を非表示にし、説明文の文字サイズと行高も縮小した。
- `ONEOPS_UI_SPACING_STANDARD.md` に第1階層と第2階層の見出し差異を追記した。

## 制約

正式 HTTPS は Windows ドメイン認証待ちで認証後の画面へ到達できなかった。実行時 UI はローカルフィクスチャで確認し、正式ページの認証後表示は `evidence_missing` として扱う。
