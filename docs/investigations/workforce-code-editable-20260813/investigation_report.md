# 社内部門及び業務職責 Code 編集 調査記録

## 結論

社内部門及び業務職責は独立した UUID 物理 ID を持ち、利用者所属、職責割当及び検索テンプレート割当は物理 ID の外部キーで参照している。Code は一意な業務識別子であり、物理 ID を更新対象として Code を変更できる契約がデータモデルに一致する。

現行実装では画面が既存レコードの Code 入力を無効化し、backend の更新 SQL が旧 Code を更新条件に含めていた。この二点を修正し、物理 ID のみで対象を特定して Code を更新するよう統一した。

## 動作経路

1. `WorkforcePolicyPages.tsx` の編集 Modal が Code、名称、親部門又は説明を API client へ渡す。
2. API client は URL の `{id}` に物理 ID を設定して PUT を送る。
3. `WorkforcePolicyController` は更新権限と CSRF 境界を適用する。
4. `WorkforcePolicyService` は URL の物理 ID だけでレコードを特定し、Code を含む業務項目を更新する。
5. PostgreSQL の一意制約と形式制約が Code の重複及び不正形式を拒否する。
6. 外部キーは物理 ID を保持するため、Code 変更後も所属及び割当が同じレコードを参照する。

## 証拠表

| Claim | Evidence | Confidence | Limitation |
|---|---|---|---|
| Code 更新は物理 ID で対象を特定する | `WorkforcePolicyService.java` の更新 SQL | high | なし |
| 部門及び職責 Code は編集画面で入力できる | `WorkforcePolicyPages.tsx`、実画面スクリーンショット | high | なし |
| Code 変更後も物理 ID と外部キーを維持する | `WorkforcePolicyDatabaseTest` 実 PostgreSQL 2 件成功 | high | テストは自動ロールバック |
| Code の形式と一意性を維持する | migration の CHECK、UNIQUE、重複例外変換 | high | なし |
| 実画面の Code 入力が有効である | `docs/evidence/workforce-code-editable-20260813.png` | high | なし |
| 実画面コンソールに警告又はエラーがない | Browser console 0 件 | high | 検証時点の対象ページ |
| Browser で保存クリックから一覧更新まで完走する | `TS2` を `TS2_VERIFY` へ変更し、一覧反映後に `TS2` へ復元 | high | 検証データは復元済み |

## リスク

Browser 操作では保存ボタンの可視名称に空白が含まれるため、名称を正確に指定して操作した。`TS2_VERIFY` への変更と一覧反映を確認し、同じ編集経路で `TS2` へ復元した。変更残留はない。
