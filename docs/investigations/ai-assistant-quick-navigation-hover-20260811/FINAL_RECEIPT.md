# 最終回执

## 結果

会話クイックナビゲーションの Hover Preview を Document Scroll から分離し、Page Scrollbar の瞬間描画を解消した。

## 根因

Ant Design Tooltip が既定の絶対配置で Page Root に追加され、Hover 開始と終了の画面外初期配置を Page が処理していた。

## 最終方式

Tooltip Root を固定 Viewport Layer にした。会話 Scroll、目盛りの波形、Preview 内容、Mouse、Keyboard Focus の契約は維持した。

## 返工

最初に会話 Shell を Popup Container にした方式は、Page 座標と Shell 座標が混在して異常な負座標を残した。Browser 検証で不合格とし、固定 Viewport 方式へ変更後に最終受入を先頭から再実行した。

## 証拠

1. 統合後 Portal 209 Tests と Production Build 3850 Modules が合格した。
2. 正式 Runtime は 0.18.15、Health UP、Legacy Gateway Ready である。
3. Hover 前、中、後の Page Root は全て 1280 x 720 だった。
4. Console は Error 0、Warning 0 だった。
5. 配信と統合後 Build の主要 JS と CSS の SHA256 は一致した。
6. Hover と離脱の Screenshot を保存した。

## Git

実装は `origin/master` の統合 Commit `9302725d6943c36fb079709ca7eb92573c3cda7f` に含まれる。
