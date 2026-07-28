# OneOps

OneOps は、OneHR の保守運用業務を支援する統合ポータルです。組織機関、製品と版数、顧客環境、権限、問合支援、製品構築などの業務情報を一元管理します。

現行バージョン: `0.2.9`

## 主な機能

- 組織機関と組織区分の台帳
- 製品、版数、機能モジュールの台帳
- 顧客環境、サーバー接続先、認証情報の管理
- ユーザー、ロール、権限、認証監査
- 問合支援と AI 設定
- OneOps 内蔵の製品構築

## プロジェクト構成

- `app/`: Portal、Gateway、データベースマイグレーション、スクリプト、テスト
- `docs/`: 要件、技術説明、調査記録、検証証跡
- `html/`: ローカル配信先。ランタイム成果物のため Git 管理対象外
- `runtime/`: ローカルランタイム依存関係。Git 管理対象外

## ローカルコマンド

```powershell
D:\nginx\start.ps1
D:\nginx\runtime\node\pnpm.cmd --dir D:\nginx\app check
```

## 文書

- [プロジェクト規約](docs/PROJECT_RULES.md)
- [文書索引](docs/README.md)
- [バージョン管理](docs/VERSIONING.md)
- [変更履歴](CHANGELOG.md)

## バージョン管理規約

正式なリモートは `https://github.com/sunshaoxuan/oneops.git`、正式ブランチは `master` です。テスト済みの変更は `origin/master` へ直接コミットします。ユーザーから明示的な指示がある場合に限り、別ブランチまたは Pull Request を作成します。

パスワード、トークン、秘密鍵、ランタイム環境変数、ログ、バックアップはリポジトリへ登録しません。
