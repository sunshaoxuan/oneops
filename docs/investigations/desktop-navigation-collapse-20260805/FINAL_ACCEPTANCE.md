# 最終受入一覧

| 原要求又は制約 | 成果物 | 検証証跡 | 判定 |
|---|---|---|---|
| 左側ナビゲーションを収縮できる | 72px Sider と折畳操作 | DOM 実測、`test_results.md` | 合格 |
| 収縮可能であることが明確に分かる | 橙色背景と操作名を持つ全幅 Button | 208px × 36px 実測、展開 Screenshot | 合格 |
| 収縮後はアイコン一覧である | Ant Menu の Icon 表示と非表示 Label | 48px Menu Item、Tooltip 実測 | 合格 |
| 展開後は現在の完全ナビゲーションを維持する | 248px Sider | DOM 実測 | 合格 |
| 機能名を確認できる | Menu Tooltip と `title` | 「ワークベンチ」Tooltip 実測 | 合格 |
| 画面遷移を維持する | 既存 Navigation Route | 顧客情報から `/customers` へ遷移 | 合格 |
| 再読込後も状態を維持する | Browser 保存と初期復元 | 新規 Tab の 72px 初期表示 | 合格 |
| モバイル Drawer を維持する | 991px Media Query と Drawer | 単体試験 | 合格 |
| 横方向へ溢れない | Main 幅と余白の同期 | 折畳時 ScrollWidth 1265px、Viewport 1280px | 合格 |
| Console Error と Warning がない | 公開画面 | error 0、warning 0 | 合格 |
| Screenshot で外観を確認する | 展開及び折畳 Screenshot | E-07、E-08 | 合格 |
| HTTPS を停止せず配信する | 常時配信監視と原子的置換 | Portal 200、Health 200 | 合格 |

## 最終判定

原要求、利用者指摘及び明示制約の全項目が合格した。公開 Portal、Health、Console、Screenshot、単体試験、Production Build、Spring Test、運用 Script 及び Nginx 構成を確認済みとする。
