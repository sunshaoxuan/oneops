# 顧客情報統合 調査及び実装記録

## 1. 当初目的

第 1 階層の環境情報を顧客情報へ変更し、基本情報、契約情報、サービス情報、ネットワーク環境、問合情報、関連タスク及びチケットを顧客単位で提供する。

## 2. 調査結果

| 確認事項 | 確認結果 | 根拠 |
| --- | --- | --- |
| 顧客主データ | `organizations` が顧客業務組織であり物理 ID を持つ | `database.mjs`、組織機関 API |
| 環境台帳 | 組織機関物理 ID 配下に環境、製品版数、端点及び資格情報が存在する | `EnvironmentPage.tsx`、`environment-database.mjs` |
| 問合検索 | 顧客 Code、顧客名、担当者を独立条件として送信できる | `inquiry-support-routes.mjs`、`inquiry-support-source.mjs` |
| 問合検索上限 | 実 UPDS は検索結果を最大 500 件まで表示し、実件数が上回る場合は省略を通知する | `inquiry-support-source.mjs`、既存の実 UPDS 791 件検証記録 |
| Backlog 共通設定 | システム共通 Backlog レコードと API Key 接続確認が存在する | `inquiry-support-database.mjs`、`external-task-settings.mjs` |
| Backlog 個人タスク | 現行 Connector は `assigneeId[]` に本人 ID を設定する | `personal-task-connectors.mjs` |
| 契約、VPN、顧客別 Backlog 対応 | 現行データテーブルと公開 API は存在しない | Migration 001 から 027、Gateway Route 調査 |

## 3. 設計判断

1. 顧客主データは `organizations` を継続利用する。
2. 契約、VPN、外部顧客 Code、Backlog プロジェクト対応だけを顧客物理 ID 配下へ追加する。
3. サービス情報は契約と既存環境製品を統合した読取モデルとする。
4. 個人タスク用 Backlog Connector の担当者限定契約は変更しない。
5. 顧客チケット用 API はシステム共通 Backlog 設定を使い、担当者条件を付与しない。
6. 原環境情報はネットワーク環境のサーバー詳細情報へ移し、CRUD と資格情報契約を維持する。

## 4. 実装状態

次の実装を隔離 Worktree で完了した。

1. 第 1 階層名称を三言語で顧客情報へ変更し、正式 URL を `/customers` とした。
2. 旧 `/environments` を `/customers` へ正規化した。
3. 基本情報、契約情報、サービス情報、ネットワーク環境、問合情報、関連タスク及びチケットの六頁を実装した。
4. Migration 028 で顧客設定、契約、VPN、Backlog プロジェクト対応を追加した。
5. 契約と既存環境製品から有効サービスを構成し、従来の環境台帳をサーバー詳細情報へ配置した。
6. 問合検索へ顧客 Code を設定し、担当者条件を空にした。取得済み結果を件名昇順又は選択列の順序へ並べ替えてから Portal でページ分割し、UPDS の表示上限を超えた場合は警告する。問合情報の全表示列へ昇順、降順及び列幅調整を追加した。
7. Backlog は顧客対応プロジェクトの物理 ID、`offset`、`count`、件数 API を使用し、担当者条件を送信しない。課題 ID の重複排除後に選択列で並べ替え、ページングする。関連タスク及びチケットの全表示列へ昇順、降順及び列幅調整を追加した。
8. 顧客情報の参照、更新、外部一覧操作を操作監査へ追加した。

## 5. 検証結果

Gateway 166 件、Builder 14 件、Portal 137 件、Spring Backend 33 件が合格した。本番 Build、Migration 028 の独立 PostgreSQL 適用、顧客契約、VPN、Backlog 対応、有効サービス及び revision 更新を確認した。

Browser では広幅と 705 px の狭幅を確認した。六頁、旧 URL 正規化、問合第 2 頁、Backlog 第 3 頁、VPN 状態の日本語表示、サーバー詳細、ページ全体の横方向溢れなし、Console warning 0 件及び error 0 件を確認した。

今回の追加変更では、問合及び Backlog の全表示列をサーバー側の選択列ソートとして扱い、完全な結果集合のソート後にページングする契約を追加した。表頭のドラッグ領域は列ごとの最小幅を適用し、幅をブラウザーストレージへ保存する。

## 6. 制約及び正式配信

UPDS 検索は外部サイトが返した最大 500 件をページ分割する。実件数が取得件数を上回る場合は警告し、未取得範囲を一覧へ含めない。既存 UPDS の実検証では 791 件中 500 件が返る契約を確認済みである。

隔離 Worktree の変更を主作業区の 0.9.2 へ統合し、予備系、Nginx 平滑 Reload、主系復帰の順で正式配信した。正式 HTTPS、Asset Hash、Migration 028、Browser、Console 及び Screenshot を再確認した。
