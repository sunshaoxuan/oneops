# 実行コマンド記録

## 調査

- `git status --short --branch`
- `git remote -v`
- `git fetch origin master`
- `git rev-parse HEAD`
- `git rev-parse origin/master`
- `rg` による通知、候補、外部 Source、作業 ID、経路、試験の検索
- Gateway 及び Portal の聚焦 Test と全量 Test
- Worker Test 及び運用 Script Test
- Portal TypeScript Build 及び Production Build
- 実 Database の Table 定義及び通知参照集計
- 継続配信 Log、8092 Health、`nginx -t`、HTTPS 及び Asset Hash の確認
- Edge 及び Codex 内蔵 Browser の DOM と認証状態確認

## 2026-08-17 通知選択状態の追加

- `D:\nginx\runtime\node\pnpm.cmd exec vitest run src/personal-tasks.test.ts --maxWorkers=1 --no-file-parallelism`
- `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test -- --maxWorkers=1 --no-file-parallelism`
- `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build`
- `git diff --check`
- 正式配信後に 8092 Health、Nginx 設定、HTTPS、公開 Asset Hash、Browser DOM、Hover、Focus、Console、Screenshot を確認する。

## 実行結果

- 通知関連 Portal Test: 14 件合格
- Portal 全量 Test: 46 Files、274 件合格
- Portal TypeScript 及び Production Build: 3854 Modules 合格
- 初回の既定 Vitest Worker 実行は結果を返さず停止し、単一 Worker と `--no-file-parallelism` へ切り替えて完走した。

## 2026-08-17 配信及び Browser 受入

- `Start-ScheduledTask -TaskName 'OneOps Continuous Delivery'` で常駐監視を起動し、`.continuous-delivery.trigger` を更新した。
- `app/logs/continuous-delivery.log` の `2026-08-17T17:56:02.2343918+09:00 delivery_succeeded reason=.continuous-delivery.trigger` を確認した。
- `Invoke-RestMethod http://127.0.0.1:8092/api/work-center/v1/health` 及び正式 HTTPS Health: `UP`、Version `0.18.23`、`online=true`、`legacyGatewayReady=true`。
- `Invoke-WebRequest https://192.168.20.54/ -SkipCertificateCheck`: HTTP 200。
- `nginx.exe -t`: 成功。443、8092、8093 が Listen、8094 と 8095 は非 Listen。
- 正式 `index.html` が参照する `index-b2yzBoqO.js` と `index-B09bZinB.css` の WebRoot/Dist SHA256 が一致した。
- 正式 CSS 本文へ `.notification-list-item`、`cursor:pointer`、Hover、Focus を確認し、JS 本文へ通知行と Enter/Space 処理を確認した。
- Edge は自動 SSO 中継 `ohr0067:8998` を `ERR_BLOCKED_BY_CLIENT` で遮断した。Codex 内蔵 Browser はログイン頁まで到達したが、認証済み通知 Drawer を開く Session がない。アカウント、パスワード及び Windows 認証操作は実行していない。
- Codex 内蔵 Browser のログイン頁 Console Error/Warning は 0 件。通知 Drawer の実 DOM、Hover、Focus 及び Feature Screenshot は `evidence_missing` とした。

## 2026-08-17 通知カード余白の追加

- `D:\nginx\runtime\node\pnpm.cmd exec vitest run src/personal-tasks.test.ts --maxWorkers=1 --no-file-parallelism`
- `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test -- --maxWorkers=1 --no-file-parallelism`
- `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build`
- `git diff --check`

## 2026-08-17 追加結果

- 通知関連 Portal Test: 14 件合格
- Portal 全量 Test: 46 Files、274 件合格
- Portal TypeScript 及び Production Build: 3854 Modules 合格
- 通知カード CSS: `padding: 14px 16px`、`margin-bottom: 8px`、最終行 `margin-bottom: 0` を確認した。

## 2026-08-17 余白版正式配信

- `app/logs/continuous-delivery.log`: `2026-08-17T18:05:43.9967952+09:00 delivery_succeeded reason=.continuous-delivery.trigger`
- 正式 Health: 8092/HTTPS `UP`、Version `0.18.23`、`online=true`、`legacyGatewayReady=true`
- 公開 Asset: `assets/index-Hhze5zWY.js`、`assets/index-Ch_L3ESH.css`
- Asset Hash: JS `14C52FD3007315C465EB7B98C63E76C725BC288C8ADA14B0D138270EFC1ABE54`、CSS `9215681A63DDF69C78AA5530AE7CFEB3378A14B48BDC5F4565C6D94E87FA198B`。Dist、WebRoot、HTTPS 参照が一致した。
- 公開 CSS 本文: `padding:14px 16px`、`margin-bottom:8px`、`cursor:pointer`、Hover、Focus を確認した。
- Browser: 認証済み OneOps Session がないため、通知 Drawer の文字と背景の実測 Screenshot は `evidence_missing`。
