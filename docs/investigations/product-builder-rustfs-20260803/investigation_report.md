# 製品構築 RustFS 統合調査

調査日：2026-08-03

## 目的

OneOps の製品構築画面で RustFS を MinIO と同等の任意オブジェクトストレージとして選択し、正式成果物へ組み込み、Windows サービスとして起動できるようにする。

## 確認結果

1. 現行 MinIO は `OneHrStandalone/software/minio.zip` として成果物へ入り、`util.ps1` が解凍し、`install.ps1` が NSSM サービスを登録し、`suite.install.ps1` がインストール関数を呼び出す。
2. 業務サービスは `INFRA_MINIO_*` を S3 接続契約として使用する。RustFS はこの契約を維持し、既存のオブジェクトストレージ設定を再利用できる。
3. RustFS 公式 Windows ガイドは x86_64 ZIP と `rustfs.exe server` を提供し、API `9000`、コンソール `9001`、`RUSTFS_ACCESS_KEY`、`RUSTFS_SECRET_KEY` を案内している。
4. 2026-08-03 時点の公式 GitHub Releases は `rustfs-windows-x86_64-v<version>.zip` を提供する。バージョン固定 ZIP と `latest` ZIP が同時に存在する。
5. Windows 版は公式資料上、単一ノード単一ディスクの評価、開発、テスト用途である。OneHrStandalone の RustFS も同じ構成とする。
6. 公式 Windows ガイドの `--console-enable true` と、2026-08-03 時点の `1.0.0-beta.12` 実行ファイルには差異がある。実行ファイルの `server --help` では `--console-enable` は値を取らないスイッチであり、`true` を付けると追加ボリュームとして解釈される。構築器は実行ファイルに合う `--console-enable` を使用する。
7. `1.0.0-beta.12` は本機の隔離試験でデータディレクトリ内の rename が Windows エラー 32 となり、API 生存確認だけが 200、業務要求とコンソールは 503 となった。`1.0.0-beta.11` は API 健康確認 200、コンソール `/rustfs/console/index.html` 200 を確認したため、画面初期値は `1.0.0-beta.11` とする。

## 設計

1. 画面は MinIO の右側に RustFS チェックボックスとバージョン一覧を追加する。
2. MinIO と RustFS は同じ API ポートと業務サービス接続先を使用するため、相互排他とする。
3. RustFS は同梱版を持たず、Windows 実行確認済みの `1.0.0-beta.11` を初期選択する。新しい公式版も一覧から手動選択できる。
4. 構築器は公式 Windows x86_64 ZIP を取得し、`rustfs/` ルートへ正規化し、専用 `start.bat` とバージョンメタデータを追加する。
5. 成果物作成時にインストーラスクリプトへ RustFS の解凍、サービス登録、条件分岐を追加する。
6. RustFS 実行環境は既存 `MINIO_*` 設定から生成し、業務サービス側の `INFRA_MINIO_*` 契約を変更しない。

## 公式資料

- [RustFS Windows installation](https://docs.rustfs.com/installation/windows/index.html)
- [rustfs/rustfs Releases](https://github.com/rustfs/rustfs/releases)
- [rustfs/rustfs repository](https://github.com/rustfs/rustfs)

## リスク

1. RustFS は現時点でプレリリースを含む。バージョン固定 ZIP を使用し、構築履歴に選択バージョンを残す。
2. Windows 版は単一ノード単一ディスク用途である。分散構成は本機能の対象外とする。
3. MinIO と RustFS の同時起動はポートと接続先が競合する。画面とサーバー検証の両方で拒否する。
4. RustFS のプレリリースで CLI 契約が変わる可能性がある。公式 ZIP を用いた `--help` と隔離起動試験を継続する。
5. `1.0.0-beta.12` の Windows データディレクトリ rename エラーは上流側挙動であり、本機能では既定値から除外する。利用者が手動選択する場合は構築先で追加検証する。
