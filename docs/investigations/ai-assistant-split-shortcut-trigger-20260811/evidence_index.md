# 証拠索引

| 確認事項 | 証拠 | 確度 | 制限 |
| --- | --- | --- | --- |
| Header の重複入口を削除した | 正式 DOM の Header 新規話題0件、クイックアシスタント入口0件、`ai-assistant-split-shortcut-default-20260811.png` | 高 | なし |
| 左側へ分割 Button を実装した | 正式 DOM の Row 1件、Button 2件、左右 Radius、`ai-assistant-split-shortcut-default-20260811.png` | 高 | なし |
| 通常時に Animation を実行しない | 正式 Computed Style の `animation-name: none`、`filter: none` | 高 | なし |
| Button Hover 時だけ二重矢印が発光する | Group Hover の静的 `drop-shadow`、CSS Glint、Reduced Motion 検出 | 高 | Browser は Reduced Motion が有効なため Glint Animation 自体は自動試験で確認 |
| Menu Segment だけが Menu を開く | 主 Segment Hover 時 Menu 0件、Menu Segment Hover 時 Menu 1件 | 高 | なし |
| Menu が二重矢印の直下で見える | Popup 矩形 `x=182, y=227, 198x168`、`ai-assistant-split-shortcut-menu-20260811.png` | 高 | なし |
| Keyboard で開閉できる | Escape 後 Menu 0件、Pointer 離脱後 Enter で Menu 1件 | 高 | なし |
| 正式 Console に異常がない | Browser Console Entry 0件 | 高 | なし |
| 正式 Runtime は 0.18.9 である | 2026-08-11 09:53:40 `delivery_succeeded`、Health HTTP 200、`UP`、`legacyGatewayReady=true`、Page HTTP 200、公開 Asset 一致 | 高 | なし |
| 旧 Orbit と Pulse を削除した | CSS と回帰試験の非存在確認 | 高 | なし |
| 要件と変更履歴を更新した | `AI_ASSISTANT_REQUIREMENTS.md`、`AI_ASSISTANT_SHORTCUTS_REQUIREMENTS.md`、`CHANGELOG.md` | 高 | なし |
