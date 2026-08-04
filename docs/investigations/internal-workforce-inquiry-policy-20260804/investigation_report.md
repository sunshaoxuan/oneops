# 社内部門及び問合検索方針 調査記録

更新日: 2026-08-04

## 結論

現行 OneOps には利用者、RBAC ロール、権限及びロール割当が存在する。社内所属、業務職責、検索テンプレート及び対象別の既定割当は存在しない。`organizations` は顧客等の業務組織として既に利用されているため、社内部門は独立台帳とする。

認証、利用者及びロール API は Spring Boot の 8092 で原生処理される。問合支援の検索、実サイト選択肢及び工單詳細は 8092 から 8093 の互換サービスへ転送される。社内部門及び検索方針は Spring Boot で管理し、既定条件の適用後も既存問合検索 API を使用する構成が現行境界に一致する。

## 確認事項

| 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- |
| 利用者、ロール、権限及び割当は既存である | `app/db/migrations/009_create_identity_and_rbac.sql`、`IdentityService.java` | 高 | 現行 PostgreSQL の内容は実装後の統合試験で再確認する |
| 社内部門及び職責台帳は存在しない | `app/db/migrations` 全体の固定文字列検索 | 高 | 今回の新規 migration 適用前 |
| 問合支援は実サイトの担当者 value と label を取得する | `app/gateway/inquiry-support-routes.mjs`、`InquirySupportPage.tsx` | 高 | 実サイト選択肢はログイン状態に依存する |
| 問合支援は現在固定初期値を使用する | `InquirySupportPage.tsx` の `initialValues` | 高 | 検索状態の永続復元は未実装 |
| Spring は未移行 API を 8093 へ転送する | `LegacyGatewayController.java`、`application.yaml` | 高 | Runtime で互換サービスが必要 |

## 実装判断

1. 新規強参照には UUID 物理 ID と外部キーを使用する。
2. 管理及び既定解決 API は Spring Boot に実装する。
3. 問合検索実行と実サイト選択肢は既存互換 API を維持する。
4. 同段階同優先順位は条件合成も任意選択も行わず、設定不整合として返す。
5. 画面で使用中の条件は利用者単位の `sessionStorage` に保存し、既定テンプレートより優先する。

## 未確認項目

実サイト担当者の現在値及び TS2 課の初期メンバーは管理者入力が必要である。担当者値を推測して初期データへ登録しない。

## 実装結果

1. `026_create_internal_workforce_and_inquiry_search_policy.sql` に社内部門、利用者所属、業務職責、利用者職責、検索テンプレート及び五種類の割当を追加した。
2. Spring Boot に社内部門・職責管理、テンプレート管理、現在利用者の有効テンプレート解決を追加した。
3. 利用者管理に主所属、兼務所属及び部門別職責を追加し、個人プロフィールへ参照専用で表示した。
4. システム管理へ「業務部門・職責」と「問合検索テンプレート」の独立 URL を追加した。
5. 問合支援は利用者別の画面検索状態を優先し、状態がない場合だけサーバー既定を適用する。`TODAY`、担当者実 value、適用元、「既定に戻す」を実装した。
6. Browser 検証で「既定に戻す」が旧チケット No. を残す問題を検出し、テンプレート有効性を確認した後に Form 全体を初期化してから既定値を設定するよう修正した。
7. Browser Console で検出した Ant Design の非推奨属性を現在の `size`、`orientation`、`title` へ更新した。

## 実行時検証

初回は Spring Boot 8094、内部互換サービス 8095、HTTPS Portal 5183 のタスク専用受入環境で確認した。その後、正式 Portal と正式 8092 へ 0.9.1 を配信し、正式 PostgreSQL 上に名称を固定した一時利用者と一時テンプレートを作成して最終受入を実施した。受入後は利用者、Session、テンプレート、Binding 及び関連割当を削除し、関連九分類の残留件数 0 を確認した。

Browser では次を確認した。

- 社内部門二件と業務職責四件の一覧、追加 Modal
- テンプレート一覧、担当者実 value と表示名、`TODAY`、自動実行、五種類の対象、優先順位の編集器
- 利用者編集の主所属、兼務所属及び部門別職責
- システム既定の適用元表示と当日日付
- チケット No. `94056` の検索状態を更新後に復元する動作
- 「既定に戻す」で旧チケット No. を消去する動作
- 実サイトにない担当者 value の失効表示と検索停止
- 個人プロフィールの主所属、兼務所属及び業務職責の参照専用表示
- 正式 Tab の Console Error 0、Warning 0
- 画面全体及び Card の `clientWidth` と `scrollWidth` の一致

## 配信状態

正式 Portal と正式 8092 への 0.9.1 配信は完了し、72 秒間の 24 回連続確認で同一 PID、HTTP 200、Version 0.9.1 及び上流 Online を確認した。Git 配信は本報告を含む Release Commit、`v0.9.1` Tag、`origin/master` Push の順で実施し、Push 後に Local、Remote、Tag 及び正式成果物の一致を再確認する。

## 再受入記録

正式 Browser 受入中に Login が断続的に 502 となる不具合を検出した。Migration 027 の `INQUIRY` 行が存在する状態で旧 Migration 015 が古い Check 制約を再作成したため、Legacy Gateway 起動が失敗し、Spring Backend が再起動を繰り返していた。Migration 015 に `INQUIRY` を追加し、旧 Migration の再実行回帰試験を追加した。修正後は自動試験、Build、Package、正式配信、正式 Browser、Console、Layout、Screenshot 及び DB Cleanup を最終受入の先頭から再実行した。
