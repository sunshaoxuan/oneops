# 利用者状態表示ローカライズ調査記録

調査日: 2026-08-05

## 調査対象

ユーザー管理の一覧及び編集画面で、利用者状態が `PENDING`、`ACTIVE`、`SUSPENDED` の内部列挙値として表示される事象と、編集 Modal で対象利用者を識別できない事象を調査した。

## 原因

`IdentityManagementPage.tsx` の一覧用 `Tag` と編集用 `Select` が、API から受け取った状態値を表示文言として直接使用していた。API とデータベースの状態契約は正常であり、表示層の翻訳対応が不足していた。

編集 Modal は固定タイトルだけを表示し、編集対象の表示名、ユーザー名、メール及びドメインアカウントを Modal 内に表示していなかった。利用者一覧で選択した行の文脈が Modal を開いた時点で失われていた。

## 対応

画面言語ごとの `userStatuses` 表示辞書を追加し、一覧と編集選択肢から共通参照するようにした。API Request、API Response 及びデータベースでは既存の内部列挙値を維持する。

編集 Modal のタイトルへ表示名を追加し、本文先頭へ編集対象の固定識別領域を追加した。表示名、ユーザー名、登録済みメール及び Windows Identity のドメインアカウントを表示する。識別情報は参照表示だけに使用し、保存 Payload は変更しない。

## 検証済み事項

| 項目 | 結果 | 証拠 |
| --- | --- | --- |
| 三言語表示辞書 | 合格 | `IdentityManagementPage.tsx`、Portal 試験 |
| 編集対象の識別表示 | 合格 | 動的タイトル、識別領域、三言語見出し、Portal 試験 |
| 狭幅表示の縦配置 | 合格 | 680px Media Query、705 px 正式 Browser 計測 |
| 一覧と編集選択肢の共通表示規則 | 合格 | `IdentityManagementPage.tsx`、Portal 試験 |
| Gateway 回帰 | 合格 | 166 件合格 |
| Builder 回帰 | 合格 | 14 件合格 |
| Portal 回帰 | 合格 | 137 件合格 |
| Production Build | 合格 | 3405 Module、`index-Bgc_Vlqg.js`、`index-DGi4JWCF.css`、正式 Asset と一致 |
| Spring Boot 回帰 | 合格 | 33 件中 26 件合格、条件付き 7 件 Skip |
| 正式 Health | 合格 | `UP`、Upstream `0.9.2`、Online |
| 正式 Portal 配信 | 合格 | HTTPS 200、0.9.2 Asset 配信 |
| 正式 Browser 表示 | 合格 | 三状態及び編集対象識別を正式 HTTPS で確認 |
| Console、Layout、Screenshot | 合格 | warning 0、error 0、705 px の横方向溢れなし、Screenshot 取得済み |

## 現在の判定

配信処理、自動試験、正式 Browser、Console、Layout 及び Screenshot は合格した。Git Commit、Tag 及び Push 後の一致を最終配信で確認する。
