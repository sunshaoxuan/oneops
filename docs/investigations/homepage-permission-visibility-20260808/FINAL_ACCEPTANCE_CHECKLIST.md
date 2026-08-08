# 最終受入チェックリスト

| No. | 原要求 | 成果物 | 検証証拠 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | 閉じた権限の状態カードをホームに表示しない | `App.tsx` の Workbench 分岐 | Portal テストは合格、Browser は `evidence_missing` | 保留 |
| 2 | 閉じた権限の接続カード及び SSE を停止する | `App.tsx` の `dashboardLiveReadable`、`server.mjs` の個別 SSE | Gateway テストは合格、Browser Network は `evidence_missing` | 保留 |
| 3 | dashboard API から無権限のタスク、リソース、組織データを返さない | `lib.mjs` の `filterSnapshotForProfile` | Gateway 単体テストは合格、代理ログイン API は `evidence_missing` | 保留 |
| 4 | 機能別ショートカットを権限に合わせる | `Workbench` の Quick Tools 分岐 | Portal テストは合格、Browser は `evidence_missing` | 保留 |
| 5 | ロール権限変更後に旧キャッシュを使わない | permission signature Query key と SSE 再接続 | コード検査は合格、代理ログイン再表示は `evidence_missing` | 保留 |
| 6 | 既存機能を壊さない | Portal、Gateway、全量 build/test | `pnpm check`、publish、health、HTTPS は合格 | 合格 |

保留項目が残る間は完了又は正式公開と報告しない。
