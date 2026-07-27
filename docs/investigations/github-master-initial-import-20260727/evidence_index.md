# 証跡索引

| 結論 | 証跡 | 信頼度 | 制約 |
|---|---|---:|---|
| GitHub のリモートが存在し、登録前は空だった | `gh repo view`、`git ls-remote` | 高 | 検査日は 2026-07-27 |
| ローカル履歴に一般的な秘密情報パターンがない | 40 件のコミット内容検査 | 高 | 定義済みの一般的なパターンに基づく |
| 正式リリースは master だけを使用する | `AGENTS.md`、`docs/PROJECT_RULES.md` | 高 | ユーザーの明示的な指示で変更可能 |
| プロジェクトバージョンが 0.2.0 に統一されている | `VERSION`、2 件の `package.json`、Portal 画面 | 高 | なし |
| 全自動テストと本番ビルドが成功した | `test_results.md` | 高 | 既存のバンドルサイズ警告あり |
| 本番画面のバージョン表示が正しい | `docs/evidence/github-master-version-20260727.png` | 高 | 部分スクリーンショット |
| 問合レベルのバッジが配信済み画面で動作する | `docs/evidence/inquiry-level-badge-20260727.png` | 高 | 検証サンプルの元値は空 |
