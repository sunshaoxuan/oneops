# コマンド記録

## 調査

1. `git fetch origin master --prune`
2. `rg` による Dropdown、Menu、Popup Container、CSS、Test の追跡
3. Ant Design 6.5.1 と `@rc-component/menu` の公開型及び実装確認
4. 正式 Browser の DOM、Computed Style、Popup Rect、Parent、`overflow`、Screenshot 確認
5. 375px と浮動 Window で裁切状態を再現

## 検証

1. Portal 全試験
2. Production Build
3. 1280px、652px、375px及び440px浮動 Window の正式 Browser Responsive 検証
4. 全4 Category の Hover、第二階層内容、Parent、Rect及び第一階層寸法確認
5. Enter、Space、ArrowDown、Escape の Keyboard 確認
6. Browser Console Warning と Error の確認
7. 正式 Screenshot 3件の取得と目視確認

## 全量試験

1. `D:\nginx\runtime\node\pnpm.cmd check`
2. `D:\nginx\app\backend\mvnw.cmd test`

## 配信及び稼働確認

1. SYSTEM Continuous Delivery の `delivery_succeeded` 確認
2. `curl.exe -k -sS https://192.168.20.54/api/work-center/v1/health`
3. `D:\nginx\nginx.exe -t -p D:\nginx -c conf\nginx.conf`
4. 正式及び Build `index.html` の SHA256 と Asset 名比較
5. 443、8092、8093、8094の待受確認
6. `conf/oneops-backend-upstream.conf` の正式 Upstream 確認

## Git

1. タスク対象 Path だけを Stage する。
2. Commit 後に `origin/master` へ Push する。
3. `v0.18.13` を作成して Push する。
4. `HEAD`、`origin/master`、`v0.18.13^{}` の一致を確認する。
