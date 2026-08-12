# AIアシスタント Shortcut メニュー表示調査

## 要求

一般利用者向け Shortcut メニューでは、機能タイトルと説明を表示し、モデル名、推理強度及び速度設定を表示しない。

## 修正

Shortcut メニュー項目から `startingModel.displayName`、推理強度及び速度情報を削除した。管理画面及び現在の会話詳細に表示するモデル情報は変更していない。

## 検証

Portal Test は 35 Files、227 Tests、Production Build は 3850 Modules で合格した。正式 Browser の最新画面と Console、Screenshot は配信後に確認する。
