# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Portal 単体試験 | 157 件成功 | D:\nginx\runtime\node\pnpm.cmd test |
| Gateway 全量試験 | 205 件成功 | D:\nginx\runtime\node\pnpm.cmd test |
| Builder Python 試験 | 14 件成功 | D:\nginx\runtime\node\pnpm.cmd test |
| Spring Backend | 33 件成功、7 件 Skip | ./mvnw.cmd test。DB 統合条件未設定による Skip |
| Spring ロールサービス試験 | 9 件成功 | IdentityService、Role API、Role CRUD 関連試験 |
| Gateway 役割関連試験 | 24 件成功 | Gateway の役割更新関連試験 |
| Portal Production Build | 成功 | Vite production build |
| Spring Production Build | 成功 | Maven build |
| Nginx 設定検査 | 成功 | 配信前設定検査 |
| 本番配信 | 成功 | app/logs/continuous-delivery.log の role-edit-physical-id-20260807 |
| 実ブラウザー | 成功 | 正式 URL の編集ドロワー、Screenshot、Console 0 件 |

## ロール CRUD の確認内容

1. 新規ロールを物理 ID 付きで作成した。
2. Code を変更して更新した。
3. 更新後の応答で物理 ID が同一であることを確認した。
4. 権限集合が同一の role_id に関連付くことを確認した。
5. 重複 Code が一意制約エラーとして扱われることを確認した。

## 未実施事項

Code を実際に変更して本番データへ保存する操作は、既存標準ロールと利用者権限を変更するため実ブラウザーでは実施していない。保存経路は DB 統合試験とソース契約試験で検証した。標準ロールの既定付与入口に残る Code 検索は、保存される role_id 強参照とは別の業務ルール選択である。
