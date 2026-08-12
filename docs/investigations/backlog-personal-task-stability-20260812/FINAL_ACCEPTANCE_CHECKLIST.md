# 最終受入一覧

| 原要求及び制約 | 成果物 | 検証証拠 | 状態 |
| --- | --- | --- | --- |
| Backlog 設定の不安定さを解消する | 物理 ID 選択 UI、Gateway 検証、既存データ修正 | 実同期 `SUCCESS`、54 件 | 合格 |
| 原因を再発させない | 数値 ID Validator と回帰試験 | Gateway 306 件、Portal 256 件 | 合格 |
| 失敗理由を確認可能にする | 安全な外部エラー抽出と画面表示 | Gateway、Portal 回帰試験 | 合格 |
| 資格情報を保護する | 既存暗号化保存、安全化処理 | ソース及び出力監査 | 合格 |
| UI を実環境で確認する | Backlog 接続編集、同期結果 | Login 後の Browser、Console、Screenshot | `evidence_missing` |
| 正式配信状態を確認する | Build、Health、HTTPS、配信 Hash | HTTPS 200、upstream 8092、Health 500 | 不合格 |

一項目でも不合格の場合は修正後に本一覧の先頭から再実行する。

認証後 UI 証拠と Health 500 が残るため、本タスクを正式な完了又は Release として扱わない。コード、データ及び実同期の修正は配信済みである。
