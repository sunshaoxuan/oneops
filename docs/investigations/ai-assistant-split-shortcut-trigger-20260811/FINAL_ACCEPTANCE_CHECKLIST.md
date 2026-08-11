# AIアシスタント分割クイックアシスタント入口 最終受入一覧

更新日: 2026-08-11

| No. | 原要求または制約 | 確認対象 | 状態 |
| --- | --- | --- | --- |
| 1 | 右上の Plus と Animation Button を削除する | Header DOM 入口0件、Screenshot | 合格 |
| 2 | 左側の新しい話題とクイックアシスタント入口を統合する | Row 1件、Button 2件、正式 Screenshot | 合格 |
| 3 | クイックアシスタント入口を主 Button 右端の二重矢印にする | 左右 Radius、48px Menu Segment、二重矢印 | 合格 |
| 4 | 通常時は完全に Animation を表示しない | `animation-name: none`、`filter: none` | 合格 |
| 5 | Button Hover 時に二重矢印を発光させる | Reduced Motion 環境の静的 `drop-shadow`、通常 Motion CSS Test | 合格 |
| 6 | 二重矢印 Hover 時だけ Menu を表示する | 主 Segment 0件、Menu Segment 1件、Popup Viewport 内、4分類 | 合格 |
| 7 | Keyboard と Reduced Motion を維持する | Escape で0件、Enter で1件、Reduced Motion 静的強調 | 合格 |
| 8 | 旧 Animation と重複入口を直接削除する | Orbit、Pulse、Header Trigger の非存在 | 合格 |
| 9 | 変更を要件と変更履歴へ記録する | 要件、調査文書、CHANGELOG | 合格 |
| 10 | Test、Build、正式 UI、Git を完了する | Test、Build、Browser、Console、Screenshot は合格、Git 反映待ち | 実施中 |
| 11 | 本タスク外の作業を保全する | 明示的 Stage 対象、最終 Status | 合格 |

全項目が合格した場合だけ完了と判定する。失敗項目がある場合は修正後に一覧の先頭から再確認する。
