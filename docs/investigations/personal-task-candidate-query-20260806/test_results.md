# 検証結果

## 読取専用データ検証

| 検証 | 結果 |
| --- | --- |
| 保存済み Filter | `status=open`、`assignee=X02851` |
| 最新問合せ同期 | SUCCESS、取得 500、更新 500 |
| Candidate 集計 | PENDING 500、全件 CLOSED / 回答済、U-PDSサポート |
| 外部状態 Options | `open`、`close`、`1` から `10` |
| 外部担当者 Options | 432 件 |
| 保存担当者の有効性 | `X02851` は無効 |
| 本人担当者値 | `113210`、`社内/孫 紹煊` |
| 保存条件の外部検索 | 実件数 75,452、表示 500、全件 CLOSED |
| 解決済み本人条件の外部検索 | 0 件 |
| 採用済み Candidate | 0 件 |

## Browser 検証

内蔵 Browser は `Windows ドメイン認証を確認しています。` の状態から進まなかった。認証済み DOM、Console、追加 Screenshot は未検証である。提示画像では Candidate 500 件、CLOSED、U-PDSサポート担当の表示を確認した。

## 自動テスト

実行 Command:

`D:\nginx\runtime\node\node.exe --test app/gateway/personal-task.test.mjs app/gateway/inquiry-support.test.mjs`

結果: 44 件成功、0 件失敗、0 件取消、0 件 Skip。

この Test は現行 Connector、Source Query 変換、外部 Options 保持、表示上限 Parser、Candidate Sync Service、Owner 物理 ID 境界を確認する。無効な外部担当者値による実サイト退行と条件変更後の Candidate 照合は既存 Unit Test に含まれていないため、読取専用実サイト検証と静的 Repository 確認を証跡とした。
