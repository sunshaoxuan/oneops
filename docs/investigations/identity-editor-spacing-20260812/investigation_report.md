# ユーザー編集画面の間隔調査

## 原要求

Windows SSOバインド操作ボタン群と後続のロール項目が密着している表示を、OneOps UI間隔規約へ適合させる。

## 原因

`windows-identity-editor` は共通の `identity-editor-section` により上側の区切りと内部間隔を持っていたが、区画末尾の下間隔を持っていなかった。ロール見出しは同区画の直後へ描画されるため、操作ボタン群との縦方向間隔が不足した。

## 修正

Windows SSO区画へ `--oneops-space-xl`、24pxの下間隔を追加した。UI間隔規約の既存Tokenを使用し、ボタン、Form及びロール入力の機能契約は変更していない。
