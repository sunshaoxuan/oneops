# テスト結果

## 自動テスト

| 対象 | 結果 |
| --- | --- |
| Portal ナビゲーションとレイアウト | 26 件成功 |
| Node.js | 119 件成功 |
| Builder Python | 4 件成功 |
| Portal 全体 | 80 件成功 |
| TypeScript | 成功 |
| 本番ビルド | 成功 |

Vite の既存チャンクサイズ警告を確認した。ビルドは成功している。

## ブラウザー確認

OneOps v0.2.8 を公開し、ログイン済み Chrome で次の動作を確認した。

| 操作 | URL | 結果 |
| --- | --- | --- |
| 問合支援を開く | `/inquiry-support` | URL と見出しが一致 |
| 問合支援で再読み込み | `/inquiry-support` | 問合支援を維持 |
| システム管理を開く | `/system-management/model-api` | Model API を表示 |
| システム操作監査を開く | `/system-management/audit-logs` | 監査画面を表示 |
| システム操作監査で再読み込み | `/system-management/audit-logs` | 監査画面を維持 |
| 戻る操作 1 回目 | `/system-management/model-api` | Model API を復元 |
| 戻る操作 2 回目 | `/inquiry-support` | 問合支援を復元 |
| 進む操作 1 回目 | `/system-management/model-api` | Model API を復元 |
| 進む操作 2 回目 | `/system-management/audit-logs` | 監査画面を復元 |

ブラウザーコンソールの error、warning、warn は 0 件だった。

## 公開確認

| 項目 | 結果 |
| --- | --- |
| Portal 配置 | 成功 |
| nginx 構文検査 | 成功 |
| 公開 JavaScript の版数 | OneOps v0.2.8 |
| 公開 JavaScript の履歴処理 | `oneOpsPortalRoute` を確認 |
| `/inquiry-support` 直接要求 | HTTP 200、Portal index |
| `/system-management/audit-logs` 直接要求 | HTTP 200、Portal index |
| 画面証跡 | `docs/evidence/portal-navigation-history-20260728.png` |
