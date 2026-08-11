# 試験結果

更新日: 2026-08-11

| 対象 | 結果 | 証拠 |
| --- | --- | --- |
| Portal 全試験 初回 | 1 件失敗 | Header Overlay 数の旧断言を検出 |
| Portal 全試験 返工後 | 合格、32 File、203 件 | Vitest |
| Workspace 全試験 最終 | 合格、Gateway 261件、Worker 14件、Portal 32 File 203件、TypeScript、Production Build | `pnpm check`、CSS `index-DNSPDC4K.css`、JS `index-BzA9tvS-.js` |
| Spring Backend 最終 | 合格、40件中32件実行合格、8件条件付き Skip | `mvnw.cmd test`、BUILD SUCCESS |
| 正式配信 | 合格 | 2026-08-11 09:53:40 `delivery_succeeded` |
| 正式 Health | 合格 | HTTP 200、`UP`、version 0.18.9、`legacyGatewayReady=true`、Page HTTP 200 |
| 正式 Browser DOM と Style | 合格 | Header 入口0件、Row 1件、Button 2件、通常 Animation と Filter は `none` |
| 正式 Browser Hover | 合格 | 主 Segment は Menu 0件、Menu Segment は Menu 1件、Popup `x=182, y=227, 198x168` |
| 正式 Browser Keyboard | 合格 | Escape 後0件、Enter 後1件 |
| 正式 Browser Console | 合格 | Entry 0件 |
| 正式 Screenshot | 合格 | `docs/evidence/ai-assistant-split-shortcut-default-20260811.png`、`docs/evidence/ai-assistant-split-shortcut-menu-20260811.png` |
