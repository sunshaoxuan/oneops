# 利用者メニュー表示不良の調査報告

## 要求

ヘッダー右上の利用者アイコンを選択した時に、プロフィール、代理ログイン終了及びログアウトのメニューを常に画面内へ表示します。

## 根因

従来の Dropdown はクリック後に Menu DOM を生成していましたが、Popup の動的位置計算が完了しない場合に `left: -1000vw`、`top: -1000vh` の画面外初期座標へ残りました。この状態では項目が DOM に存在しても利用者から見えません。

## 修正

Ant Design Menu は維持し、利用者ボタンと同じヘッダー内の相対配置 Container へ固定表示します。ボタン選択で開閉し、メニュー項目選択、外部 Pointer 選択及び Escape キーで閉じます。ボタンへ `aria-expanded` と `aria-controls` を設定します。

## 検証

- 修正前の実コンポーネント試験で Popup が画面外座標へ残ることを確認しました。
- 修正後の実コンポーネント試験でプロフィール及びログアウト項目の可視状態と Escape 終了を確認しました。
- Portal 全 220 試験と Production Build が合格しました。
- 同じ Production Component と Style を Browser で表示し、メニューの `display: block`、`visibility: visible`、幅 180 px、Viewport 内座標及び Console Error 0 件、Warning 0 件を確認しました。
- Screenshot は `docs/evidence/user-menu-dropdown-repair-20260812.png` へ保存しました。
- 継続配信は Gateway を再起動せず 2026-08-12 07:51:52 JST に成功し、配信先 `index-CJaPp9y8.js` と Production Build の Hash 一致を確認しました。
- 正式 HTTPS 入口の新規 Browser Session は Windows アカウント確認画面から認証済み Portal へ到達しなかったため、その Session での再クリックは未確認です。
