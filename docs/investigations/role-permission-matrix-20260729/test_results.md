# テスト結果

## 自動テスト

| 対象 | 結果 |
| --- | --- |
| Agent Gateway | 121 件成功 |
| Builder Worker | 4 件成功 |
| Portal Shell Vitest | 84 件成功 |
| TypeScript と Vite 本番ビルド | 成功 |
| Nginx 設定検証 | 成功 |
| 正式リリース実行 | 成功 |

## ブラウザー検証

| 確認項目 | 結果 |
| --- | --- |
| 機能ノード、参照、更新、利用の列表示 | 成功 |
| 業務名称と権限 Code の併記 | 成功 |
| 既存ロールの選択値反映 | 成功 |
| `organizations.write` の解除と復元 | `true` から `false`、再び `true` |
| コンソール警告とエラー | 0 件 |
| スクリーンショット | `docs/evidence/role-permission-matrix-20260729.png` |

## 未完了項目

ブラウザー環境の企業ポリシーが旧 HTTP の Windows SSO を遮断したため、実ユーザーの本番認証後画面は未確認です。正式 HTTPS 配信、全量リリース検証、最終ビルドを使用した認証後 UI 受入は完了しています。
