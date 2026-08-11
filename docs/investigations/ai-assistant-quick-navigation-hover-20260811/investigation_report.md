# AIアシスタントクイックナビゲーション Hover 調査

## 目的

会話クイックナビゲーションの目盛りへ Pointer を置いた時に Page Scrollbar が短時間描画される現象を解消する。

## 調査結果

1. 正式画面 `0.18.14` で Hover 前後の Page Root は `1280 x 720`、Scroll 範囲も `1280 x 720` であり、Page 自体の寸法増加はなかった。
2. 会話領域は `clientHeight 429`、`scrollHeight 5307` の局所 Scroll Container だった。
3. 目盛りの Preview は Ant Design Tooltip の既定動作により Page Root へ追加され、表示開始時に画面外の初期座標を経由していた。
4. AIアシスタント内部の Hover 操作が Page Root の浮動要素を生成する境界が、Scrollbar 再描画の原因だった。

## 修正

Tooltip の `getPopupContainer` を `.ai-assistant-conversation-shell` へ固定した。会話 Shell は `position: relative` と `overflow: hidden` を持つため、Preview の配置計算と裁切は AIアシスタント内部で完結する。

## 変更境界

会話 API、保存データ、CAG、Message Scroll、高さ計算及び全体 Layout は変更しない。

## 検証状態

Source Test と Build は合格した。正式配信後に Hover 前、表示中、終了後の Page Root 寸法、Popup Parent、Console 及び Screenshot を確認する。
