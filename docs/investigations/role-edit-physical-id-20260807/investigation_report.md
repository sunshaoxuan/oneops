# ロール編集の物理 ID 境界調査

## 1. 対象

ロール管理画面で Code と Name が編集できず、システムロールの編集操作も無効化されていた原因を調査し、ロール物理 ID と強参照の扱いを確認した。

## 2. 原因

従来の実装には三つの制限が重なっていた。

1. Portal の編集フォームが編集時の Code を無効化していた。
2. Portal がシステムロールの Name と説明を既存値へ戻し、システム管理者ロールの編集ボタンを無効化していた。
3. Spring Backend と Legacy Gateway の更新処理が、システムロールの属性変更を拒否する契約になっていた。Gateway は Code を UPDATE 対象へ含めていなかった。

この制限は、ロールの物理 ID が変更対象を識別し、Code と Name は業務上の識別、検索、表示および一意性を担う値であるというデータモデルと一致していなかった。

## 3. 実装後の契約

ロール API の編集エンドポイントは PUT /api/work-center/v1/auth/roles/{id} であり、パスの id はロールの UUID 物理 ID である。更新処理はこの UUID をロックして Code、Name、説明および権限集合を更新する。Code の一意制約違反は業務エラーとして返す。

利用者ロール割当、ロール権限および問合検索ポリシーのロール対象は、すべて role_id を外部キーとして保持する。Code または Name の変更で同じロールの物理 ID と強参照は変化しない。

新規ユーザー作成時の既定ロール付与は、現行の既定ロール Code を検索条件としてデータベースからロール ID を解決し、INSERT では解決済みの role_id を保存する。この検索条件は初期ロールの業務ルールを選択する入口であり、強参照として保存される値ではない。標準ロール ID はデータベースごとに生成されるため、今回の範囲で固定 UUID や推測による互換層は追加していない。

## 4. 変更した主な箇所

| 層 | ファイル | 内容 |
|---|---|---|
| Portal | app/apps/portal-shell/src/IdentityManagementPage.tsx | 編集時の Code、Name、説明および権限マトリクスを編集可能化。更新対象は editing.id。保存後の表示は DB の値を使用。 |
| Portal 試験 | app/apps/portal-shell/src/auth-ui.test.ts | 編集フォームの無効化が存在しないことと物理 ID 更新契約を検証。 |
| Spring | app/backend/src/main/java/jp/onehr/oneops/identity/application/IdentityService.java | UUID でロックして Code、Name、説明を更新。Code 重複を業務エラー化。 |
| Spring 試験 | app/backend/src/test/java/jp/onehr/oneops/identity/application/IdentityServiceTest.java、RoleCrudDatabaseTest.java | Code 変更後の物理 ID 維持、権限関連の role_id 維持、重複 Code を検証。 |
| Legacy Gateway | app/gateway/identity-database.mjs | UUID を更新対象にして Code、Name、説明を更新。重複 Code を ROLE_CONFLICT として返却。 |
| 文書 | docs/PROJECT_RULES.md、docs/AUTHENTICATION_AND_RBAC_REQUIREMENTS.md | ロール物理 ID と Code、Name の役割を明文化。 |

## 5. 結論

今回の画面で Code と Name が編集できなかった原因は、物理 ID と業務識別値の責務を前端と保存経路で取り違えたことだった。修正後は物理 ID を更新対象および関連テーブルの強参照に使用し、Code、Name、説明は編集可能になっている。

標準ロールの既定付与入口に Code 検索が残る点は、保存される強参照と区別して記録した。標準ロール ID の固定化には既存データの識別キー設計が別途必要であり、本要求の範囲では追加変更していない。
