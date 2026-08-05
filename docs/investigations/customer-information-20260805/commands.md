# 実行コマンド記録

## 調査

1. `git fetch origin master`
2. `git status --short --branch`
3. `rg` による Portal、API Client、Gateway、Migration、要件文書の追跡
4. `git diff` による主作業区の在途変更確認

## 実装及び検証

1. `git worktree add --detach D:\nginx\.codex-work\customer-information-20260805\repo origin/master`
2. `pnpm.cmd test`
3. `pnpm.cmd build`
4. `mvnw.cmd test`
5. `ONEOPS_DATABASE_INTEGRATION_TEST=true mvnw.cmd test`
6. PostgreSQL 18.4 の独立 Container へ Migration 001 から 028 を適用
7. 顧客契約、VPN、Backlog 対応、有効サービス及び revision 更新を実 Database で確認
8. 隔離 HTTPS Portal と Fixture API を起動し、広幅及び 705 px の狭幅を Browser で確認
9. Browser Console の warning と error を確認
10. `git diff --check`
11. `publish-portal.ps1` による正式ローリング配信
12. 正式 HTTPS Health の 100 ms 間隔連続監視
13. 正式 `/customers` と `/system-management/users` の Browser 受入

資格情報、API Key、Cookie 及び実データ本文は記録していない。

## 顧客一覧の全列ソート及び列幅調整の追加確認

```text
pnpm --dir app test
pnpm --dir app build
publish-portal.ps1 -SkipChecks -SkipRuntimeValidation -SkipGatewayRestart -Reason customer-list-sort-width-mouse
OneHR Operations Compat Gateway を停止及び起動し、8092 と 8093 Health が UP になるまで待機
```

正式 HTTPS の顧客 Code `0220` で、関連タスク及びチケットの 8 列、問合情報の 6 列、件名の初期昇順、状態列切替、列幅手柄及び Console を確認した。手柄のキーボード操作で幅変更を実測し、座標ドラッグは Browser CUA が横スクロールへ解釈したため幅変化の証拠には使用していない。
