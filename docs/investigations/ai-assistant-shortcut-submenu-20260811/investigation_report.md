# AIアシスタント第二階層 Menu 表示修正報告

更新日: 2026-08-11

## 目的

クイックアシスタントの第一階層 Category Menu から第二階層の助手一覧を確実に表示し、利用者が助手名、説明、開始 Model、推理強度及び速度を選択前に確認できる状態へ修正する。

## 正式環境で確認した原因

第一階層 Menu は Viewport 内に表示されていた。Category Hover 後には第二階層 DOM と3件の助手が生成されたが、Ant Design の自動配置が `x=-5800, y=-6980` の異常座標を設定したため、画面では視認できなかった。

第二階層 Popup を第一階層 Menu 内へ移した初回修正では、Ant Design の `position: relative` によって Popup が第一階層の Layout Size に含まれた。さらに Dropdown が Menu の Semantic Class を内部で上書きし、専用 Class を位置契約として利用できないことを確認した。

最終実装では常時存在する分割 Button Row に `shortcutContainerRef` を設定し、Menu の `getPopupContainer` から同 Row を直接返す。Row 直下の標準 `.ant-dropdown-menu-submenu-popup` を絶対配置することで、Library が生成する異常 Inline Inset と Parent Layout の拡大を同時に解消した。

最初の最終受入では追加の境界不良を検出した。375x667 の完全画面では Popup が `x=-172` となり、1280x720 の浮動 AIアシスタントでは Window が `x=801..1241`、Popup が `x=1234..1546` となった。後者は Window の `overflow: hidden` によって全面裁切され、利用者報告と同じ第一階層だけが見える状態だった。560px 以下と浮動 Window では Popup の右端を Row の右端へ揃え、第一階層上へ重ねる配置へ修正した。

## 修正後の契約

1. 第二階層 Popup Container は分割 Button Row とする。
2. 第二階層 Popup は絶対配置とし、第一階層の寸法へ影響させない。
3. 画面幅が821px以上の場合は第一階層の右側へ表示する。
4. 画面幅が561px以上820px以下の場合は第一階層の左側へ表示する。
5. 560px以下及び浮動 Window では第一階層上へ重ね、Viewport 又は Window の表示領域内へ保持する。
6. 第二階層は第一階層の先頭項目と上端を揃える。
7. Popup の切替中も第一階層を198x168pxで維持する。
8. Popup 幅は最大312pxとし、狭幅では Viewport から32pxを除いた幅を上限とする。

## 正式 Browser 証拠

1. 1280x720 の完全画面では第一階層が `x=182..380`、第二階層が `x=388..700` となり、右方向へ表示された。
2. 652x698 では第一階層が `x=425..623`、第二階層が `x=105..417` となり、左方向へ表示された。
3. 375x667 では第一階層が `x=148..346`、第二階層が `x=34..346` となり、Viewport 内の重ね表示となった。
4. 440px の浮動 Window では Window が `x=801..1241`、第二階層が `x=914..1226` となり、Window 内の重ね表示となった。
5. 全4 Category、計12件の助手に名称、説明、`gpt-5.6-terra`、推理強度「中」及び速度「標準」が表示された。
6. 1280px の第二階層 Y座標と第一階層先頭項目 Y座標はともに231pxだった。第一階層は全Categoryで198x168pxを維持した。
7. Enter、Space、ArrowDown で第一階層を開き、Enter で第二階層を開いた。Escape 後は両階層とも非表示となった。
8. Browser Console の Warning と Error は0件だった。

## 試験、配信及び稼働証拠

1. Gateway 261件、Worker 14件、Portal 33 File 209件、TypeScript、Production Build 及び Spring Backend 40件が合格した。
2. SYSTEM Continuous Delivery は2026-08-11 13:34:28に `delivery_succeeded` を記録した。
3. 正式 Health は HTTP 200、`status=UP`、`version=0.18.13`、`legacyGatewayReady=true` だった。
4. 正式 `index.html` と Build `index.html` の SHA256 はともに `1A4242BE63529D2BDCCE60BE0791FB0ACC0A78561B3054D0D5F45CB7FF686F93` だった。
5. 正式 Asset は JS `index-DeHLaldn.js`、CSS `index-BVEKlJma.css` だった。
6. `nginx -t` は成功し、正式 Upstream は `127.0.0.1:8092`、Gateway は `127.0.0.1:8093` で待受中だった。
