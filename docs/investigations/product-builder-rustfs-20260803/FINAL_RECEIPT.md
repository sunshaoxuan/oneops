# 最終受領書

状態：実装、試験、配信完了

2026-08-04 追補：GitHub API の未認証レート制限による空の版数一覧を修正し、RustFS 公式 Download Center と公式 CDN を取得元へ変更した。

追補状態：実装、自動試験、実 ZIP、配信、正式画面、固定ポート、SSO の検証完了

## 変更範囲

- 製品構築の MinIO 右隣に RustFS を追加
- MinIO と RustFS を画面およびサーバー入力検証で排他化
- RustFS の公式 Windows x86_64 固定版 ZIP を取得し、OneHrStandalone へ同梱
- RustFS を NSSM サービス `mid-rustfs` として登録し、既存 MinIO の S3 設定契約を再利用
- 既定版数を Windows 実動作確認済みの `1.0.0-beta.11` に設定
- OneOps を `0.8.5`、構築器を `0.7.4-oneops` へ更新
- 版数取得修正版では OneOps を `0.8.6`、構築器を `0.7.5-oneops` へ更新

## 検証結果

- 自動試験 283 件成功
- 本番ビルド、配信、Gateway health、固定ポート、SSO ログイン状態を確認
- RustFS `1.0.0-beta.11` の API と Console を実起動確認
- 正式 OneHrStandalone 成果物を実生成し、`rustfs.zip` とサービス登録を確認
- Browser の表示、双方向排他、コンソール、スクリーンショットを確認

## 上流版数に関する記録

`1.0.0-beta.12` は Windows 上で rename ロック競合が発生し、API health 以外の要求が 503 となった。版数一覧には保持し、既定値には `1.0.0-beta.11` を使用する。

## 証拠

- `docs/investigations/product-builder-rustfs-20260803/test_results.md`
- `docs/investigations/product-builder-rustfs-20260803/evidence_index.md`
- `docs/evidence/product-builder-rustfs-20260803.png`
- `app/logs/continuous-delivery.log`

本受領書を含む試験済み変更を `origin/master` へ直接プッシュし、ローカル `HEAD` と `origin/master` の一致を完了条件とする。
