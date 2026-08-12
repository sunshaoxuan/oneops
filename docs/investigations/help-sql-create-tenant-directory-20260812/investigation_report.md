# Help SQL 出力時の 1.tenant 作成

## 結論

顧客化構築で Help を選択した場合、SQL 資材を選択していなくても `製品/1.tenant/ohr_help.sql` を生成するよう変更した。Help SQL 書込処理が対象親ディレクトリを作成する。

完全な SQL 資材を選択する経路では、源 `1.tenant` と `2.ohr` の両方を引き続き必須とする。Help 出力のディレクトリ作成によって完全資材の欠落を補完しない。

## 対象経路

| 構築種別 | Help SQL 出力 |
|---|---|
| 顧客化 Help 単独 | `製品/1.tenant/ohr_help.sql` を作成 |
| 顧客化 SQL 資材と Help | 源 SQL 資材をコピーして `ohr_help.sql` を置換 |
| 標準機関封包 | 既存の完全 SQL 資材契約を維持 |
| 標準発版 | 既存契約どおり発版ルートの `ohr_help.sql` を使用 |
| NHO | Help 対象外 |

## 変更範囲

- `app/builder/standalone_packager.py`
- `app/builder/oneops_worker_test.py`
- `docs/PRODUCT_BUILDER_REQUIREMENTS.md`

原始 droneci リポジトリは変更していない。
