# 試験結果

## 合格

- Gateway 個人タスク試験: 26 件合格
- Gateway 全量試験: 317 件合格
- Portal 通知関連試験: 13 件合格
- Portal 全量試験: 46 Files、273 件合格
- Worker 試験: 18 件合格
- 運用 Script 試験: 9 Script 合格
- Portal TypeScript Build 及び Production Build: 3854 Modules 合格
- 利用者修正後 Continuous Delivery: 合格
- 利用者修正後正式 Runtime: 8092 Health `UP`、Nginx Test 合格、HTTPS 200
- 利用者修正後 Production Asset: JS 及び CSS の Dist と Web Root Hash が一致
- 実 Database Migration: `source_system_id`、`source_object_id`、Check 制約、外部 System Foreign Key、Source Index を確認
- 既存候補通知: 1 件中、発生元 System ID 1 件、外部 Object ID 1 件、`candidateId` 付き Action Path 1 件
- 継続配信: `delivery_succeeded`
- 正式 Runtime: 8092 Health `UP`、Legacy Gateway Ready、Upstream Online
- Nginx: `nginx -t` 合格
- HTTPS: HTTP 200
- Production Asset: Dist と Web Root の Hash が一致

## 利用者修正後の再試験

- 通知 API は内部 Resource、Source System、Source Object を公開せず、解決済み Action Path を返す。
- 通知 Drawer は発生元及び対象 ID を表示しない。
- 通知選択時の `candidateId` 解決と対象候補 Drawer 自動表示を維持する。
- Gateway 個人タスク試験: 26 件合格
- Gateway 全量試験: 317 件合格
- Portal 通知関連試験: 13 件合格
- Portal 全量試験: 46 Files、273 件合格
- Portal TypeScript Build 及び Production Build: 3854 Modules 合格

## 実行環境補足

最初の実行では PowerShell の `PATH` に Node.js がなく、試験本体の開始前に終了した。Bundled Runtime を明示して再実行した。Vitest の既定 Worker 起動が長時間化したため、本タスクが開始した Worker を終了し、`maxWorkers` を限定して同じ Test Suite を完走した。

## 未完了項目

- 実 Browser DOM、Console、Screenshot: `evidence_missing`
- Edge は自動 SSO 遷移先を Client Policy で遮断し、`ERR_BLOCKED_BY_CLIENT` を表示した。
- Codex 内蔵 Browser は OneOps Login 画面まで表示できたが、認証済み Session がなかった。Password 又は Login 操作は本タスクの承認範囲に含まれないため実行していない。
- 利用者修正後も新規 Edge Tab は自動 SSO URL へ Redirect され、認証済み OneOps Tab は別 Browser Session が使用中であった。

## 2026-08-17 通知選択状態の追加

- 通知関連 Portal Test: 14 件合格
- Portal 全量 Test: 46 Files、274 件合格
- Portal TypeScript Build 及び Production Build: 3854 Modules 合格
- `git diff --check`: 合格
- 既定 Worker 実行は結果を返さず停止したため停止し、`--maxWorkers=1 --no-file-parallelism` で同じ Test Suite を再実行して合格した。
- Browser の Hover、Focus、Console 及び Screenshot は正式配信後の実画面で確認する。

## 2026-08-17 配信及び Browser 受入

- Continuous Delivery: `delivery_succeeded`、17:56:02 JST
- Runtime Health: 8092 と HTTPS が `UP`、Version `0.18.23`、`online=true`、`legacyGatewayReady=true`
- Nginx: `nginx -t` 合格。443、8092、8093 が Listen、8094 と 8095 は停止。
- Production Asset: `index-b2yzBoqO.js` と `index-B09bZinB.css` の Dist、WebRoot、HTTPS 参照が一致。
- 公開 CSS/JS 本文: 通知行の `cursor:pointer`、Hover、Focus、`role=button`、Enter、Space を確認。
- Edge: SSO 中継 `ohr0067:8998` が `ERR_BLOCKED_BY_CLIENT`。認証済み OneOps Session を取得できなかった。
- Codex 内蔵 Browser: 正式ログイン頁を表示。Console Error/Warning は 0 件。通知 Drawer の認証後 DOM、Hover、Focus、Click/Keyboard 遷移及び Screenshot は `evidence_missing`。

## 2026-08-17 通知カード余白の追加

- 通知関連 Portal Test: 14 件合格
- Portal 全量 Test: 46 Files、274 件合格
- Portal TypeScript Build 及び Production Build: 3854 Modules 合格
- `git diff --check`: 合格
- `.notification-list-item` の上下 14px、左右 16px 内側余白及び 8px カード間隔を静的 Style と Test で確認した。
- 余白変更後の実配信、正式 CSS Hash、Browser Hover、Focus 及び Screenshot は次の配信後に確認する。

## 2026-08-17 余白版正式配信

- Continuous Delivery: `delivery_succeeded`、18:05:43 JST
- Runtime Health: 8092 と HTTPS が `UP`、Version `0.18.23`、`online=true`、`legacyGatewayReady=true`
- Production Asset: `index-Hhze5zWY.js` と `index-Ch_L3ESH.css` の Dist、WebRoot、HTTPS 参照 SHA256 が一致
- CSS 本文: `.notification-list-item` の `padding: 14px 16px`、`margin-bottom: 8px`、`cursor:pointer`、Hover、Focus を確認
- Browser の認証済み通知 Drawer DOM、文字と背景の間隔、Hover、Focus、Console、Screenshot は `evidence_missing`
