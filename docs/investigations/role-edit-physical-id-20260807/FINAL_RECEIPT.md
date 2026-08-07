# 最終受入受領票

## 原要求対応

| 受入項目 | 成果物 | 検証証拠 | 判定 |
|---|---|---|---|
| 物理 ID を持つロールとして編集対象を識別する | updateRole(editing.id, values)、PUT /roles/{id} | Portal、Spring、API 試験 | 合格 |
| Code を編集できる | 編集フォームの Code Input に disabled がない | auth-ui.test.ts、実ブラウザーの Code 欄 | 合格 |
| Name と説明を編集できる | Name Input と Description TextArea に disabled がない | auth-ui.test.ts、実ブラウザーの入力欄 | 合格 |
| システムロールの編集操作を隠さない | システムロール編集ボタンの disabled を削除 | Portal 試験、実ブラウザーの編集ドロワー | 合格 |
| Code、Name の変更で強参照を壊さない | role_id 外部キー、UUID 更新、権限関連の同一 ID 維持 | DB CRUD 試験、Migration 009、Backend 実装 | 合格 |
| 重複 Code を許可しない | DB unique 制約と業務エラー変換 | Spring、Gateway 試験 | 合格 |
| 本番画面へ反映する | 公開済み Portal と Gateway | 配信ログ、Nginx 検査、正式 URL | 合格 |
| UI の実行時品質を確認する | 編集ドロワー、Console、Screenshot | docs/evidence/role-edit-physical-id-20260807.png、Console 0 件 | 合格 |

## 交付状態

実装、テスト、Production Build、配信、正式ブラウザー、Console および Screenshot の確認が完了した。作業前から存在する並行変更は精密なファイル選択で本変更へ混入させない。

## 既知の境界

新規ユーザーの既定ロール選択は、現行業務ルールにより Code を検索入口としている。INSERT される強参照は解決済みの role_id である。標準ロール ID は DB ごとに生成されるため、固定 UUID を追加していない。標準ロールを Code 変更後も自動的に既定ロールとして解決するには、別途不変の標準ロール識別キーを設計する必要がある。

## 最終結論

本要求の成果物と証拠は揃っており、Code と Name を物理 ID の代わりに不変扱いしていた画面と保存経路の制限を解除した。強参照は role_id に統一され、ロール物理 ID は変更されない。
