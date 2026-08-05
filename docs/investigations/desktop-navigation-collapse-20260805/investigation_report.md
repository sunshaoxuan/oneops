# デスクトップ左側ナビゲーション折畳 調査及び実装記録

## 目的

デスクトップの左側ナビゲーションを、必要な時に機能アイコンだけの一覧へ折りたためるようにする。モバイルは既存の Drawer を維持し、デスクトップの折畳状態から分離する。

## 調査結果

変更前の `portal-sider` は 248px 固定であり、`portal-main` も 248px の左余白と幅計算を使用していた。Ant Design の Sider は存在したが、折畳幅が 0px で、利用者が操作する Trigger と保存状態はなかった。

## 実装

1. デスクトップ Sider に 248px と 72px の二状態を定義した。
2. 折畳操作は文字を持たない 40px 四方の橙色円形 Icon Button とし、接続状態及び版番号より後のナビゲーション最下部へ常時表示した。
3. 折畳状態をブラウザーへ保存し、ページ再読込時に復元する。
4. 展開状態では左向き、折畳状態では右向きの二重矢印を表示する。
5. メニュー名、接続状態、完全な版番号を Tooltip で確認できるようにした。
6. `portal-main` の幅と左余白を Sider と同時に切り替える。
7. 991px 以下の既存 Drawer とデスクトップの保存状態を分離した。

## 配信状態

常時配信監視が変更を検出し、Production Build 後に静的ファイルを原子的に置換した。公開 HTML は `index-xotaXx98.js` と `index-CNWCXLc2.css` を参照し、HTTPS Portal と Spring Backend Health は 200 を返した。

## 利用者指摘後の再受入

初版はブランド直下へ操作を配置していた。利用者指摘に基づき、操作名を削除して 40px 四方の Icon Button へ統一し、ナビゲーション最下部へ移動した。最初の Browser 検査では Sider の内容高が 794px、Viewport 高が 720px となり、Icon が表示範囲の 74px 下に位置した。Menu だけを内部 Scroll とし、Footer を Viewport 下端へ固定した。再検査では Sider の Client 高と Scroll 高がともに 720px、Button 下端が 704px、Footer 下端が 720px であり、常時表示を確認した。展開時は Main left 248px、折畳時は Sider 72px、Main left 72px とし、横 Overflow 及び Console error、warning がないことを確認した。

991px 以下は既存 Drawer の回帰範囲であり、Source と単体試験で維持を確認した。今回の原要求であるデスクトップ左側ナビゲーションは公開 Browser と Screenshot で受入済みである。
