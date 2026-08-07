# 最終受入回执

状態: 実装、公開、最終受入完了

## 結果

AI 補助履歴は生成者のユーザー物理 ID を保持し、画面へ表示名を示す。生成者本人だけが Card 内の確認条から論理削除できる。通常利用者は削除済み履歴を取得できず、`inquiries.deleted.read` を持つシステム管理者は省略記号 Icon、生成者、生成日時、削除日時を含む一行記録として参照できる。

論理削除後も解析結果と返信案を保持し、削除操作は `INQUIRY_AI_RUN_DELETED`、`SOFT_DELETE`、`SUCCESS` として記録された。

## 配信

Version 0.15.7 を正式 8092 Runtime と HTTPS Portal へ公開した。Nginx 設定、Health、公開 Asset、Portal 表示 Version は一致している。

## Rollback

対象 Commit を通常の Git Revert で戻して再公開する。追加列と権限を物理削除する Rollback SQL は実行しない。
