# 利用者状態 Select 表示の調査報告

## 要求

利用者管理の状態 Select で値を選択した後も、選択済みの表示名を明瞭に表示します。

## 根因

状態値と React State は保持され、選択済み表示名も DOM に存在していました。Ant Design 6.5.1 の単一選択表示 Container は `.ant-select-content` です。既存画面にはこの Container の可視性を保証する状態項目専用 Style がなく、選択後の表示名が見えない状態になりました。

## 修正

1. 三つの状態値を扱う `UserStatusSelect` を追加しました。
2. 固定選択肢のため検索入力を無効化しました。
3. `.ant-select-content` の本文色、不透明度及び可視性を状態項目専用 Class で明示しました。
4. 値変更後の表示名と計算済み Style を確認する Component Test を追加しました。
5. 利用者編集要件文書へ表示契約を追加しました。

## 実行時確認

実 Browser で状態表示の計算済み Style が `color: rgb(51, 51, 51)`、`opacity: 1`、`visibility: visible` であることを確認しました。Console Error と Warning は 0 件です。

Browser Screenshot は表示消失の解消を確認しています。Browser 自動操作による別状態への変更確認はクリック対象を確定できず、Component Test で `ACTIVE` から `SUSPENDED` への変更後表示を検証しました。
