# AIアシスタント分割クイックアシスタント入口 改版報告

更新日: 2026-08-11

## 目的

AIアシスタントの新しい話題とクイックアシスタントの入口を整理し、重複した Header 操作と常時目立つ独立 Icon を削除する。履歴ガイド内の主操作へクイックアシスタント入口を統合し、通常時の動きをなくした上で、利用者の操作意図に応じた発光と Menu 表示を提供する。

## 変更前

1. Header に新しい話題の Plus Button と円形クイックアシスタント入口が存在した。
2. 履歴ガイドにも新しい話題 Button と円形クイックアシスタント入口が存在した。
3. 新しい話題へ Hover 又は Focus した時に、円形軌道と Icon を動かしていた。
4. クイックアシスタント入口は新しい話題とは別の円形 Button として見えていた。

## 変更後

1. Header の新しい話題 Button とクイックアシスタント入口を削除した。
2. 履歴ガイドの新しい話題 Button を唯一の主入口とした。
3. 主 Segment の右端へ `DoubleRightOutlined` の Menu Segment を結合した。
4. 主 Segment は新しい通常会話を作成し、Menu Segment はカテゴリ別 Menu だけを開く。
5. 通常時は二重矢印を含む全要素を静止させる。
6. 分割 Button 全体へ Hover 又は Focus がある間だけ二重矢印を発光させる。
7. 二重矢印 Segment へ Hover 又は Click した時だけ Menu を表示する。
8. 旧 Orbit、Pulse、分割軌道 Border、円形 Button Style を削除した。
9. Reduced Motion では発光 Animation を停止し、二重矢印を静的に強調する。
10. クイックアシスタント Menu を分割 Button Row へ配置し、Row 直下の座標を明示して Viewport 内へ固定する。

## 関心事の分離

| 領域 | 操作 | 結果 |
| --- | --- | --- |
| 主 Segment | Click 又は Keyboard 実行 | 通常の新しい話題を作成 |
| 分割 Button 全体 | Hover 又は Focus | 二重矢印だけを発光 |
| Menu Segment | Hover、Click 又は Keyboard 実行 | カテゴリ別 Menu を表示 |
| 通常状態 | 操作なし | Animation なし |

## 検証方針

1. Header に Plus とクイックアシスタント入口が存在しないことを DOM で確認する。
2. 履歴ガイドに一つの新しい話題主 Segment と一つの二重矢印 Segment が存在することを確認する。
3. 通常時の二重矢印 Animation が `none` であることを Computed Style で確認する。
4. 主 Segment Hover 時に二重矢印の Glint Animation が実行されることを確認する。
5. 主 Segment Hover だけでは Menu が開かないことを確認する。
6. 二重矢印 Hover で第1階層 Menu が開くことを確認する。
7. Console、Screenshot、Reduced Motion、自動試験、正式 Runtime を確認する。

## 正式 Browser で検出した修正

初回の正式検証では Menu DOM と4分類が作成された一方、Ant Design の自動配置計算が Popup を Viewport 外へ配置した。Popup Container を分割 Button Row へ限定した後も異常なインライン座標が残ったため、専用 Dropdown に `inset: calc(100% + 8px) 0 auto auto` を適用した。

修正後の Popup 矩形は `x=182, y=227, 198x168` となり、二重矢印の直下かつ 1280x720 Viewport 内で4分類を視認できた。正式 Console は0件、Health は `UP`、version は 0.18.9 である。
