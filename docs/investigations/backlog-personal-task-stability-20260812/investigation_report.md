# 個人タスク Backlog 接続安定化 調査報告

## 目的

個人タスクの Backlog 外部接続で同期が失敗し、画面には汎用エラーだけが表示される事象を解消する。

## 確認した事象

2026 年 8 月 12 日の実行データでは、対象接続の検索条件に Backlog プロジェクト Key `TS2_ITS` が保存されていた。同期処理はこの値を数値型の `projectId[]` として送信し、Backlog API は HTTP 400 を返した。同一の接続情報を使用した `users/myself`、`projects`、担当者 ID のみを指定した `issues` はすべて HTTP 200 だった。

Backlog 公式 API の Issue List 契約では `projectId[]` と `statusId[]` は Number である。現行画面は自由入力欄を提供しており、プロジェクト Key を保存できる状態だった。

## 修正方針

1. Backlog 接続の編集時に実 API からプロジェクト及び状態の選択肢を取得する。
2. 画面は自由入力を廃止し、物理 ID の複数選択を保存する。
3. Gateway はプロジェクト ID と状態 ID が数値であることを保存前に検証する。
4. Backlog のエラー応答本文から安全なメッセージだけを保持し、画面へ具体的な失敗理由を表示する。
5. 既存接続のプロジェクト Key は実 API のプロジェクト一覧で物理 ID へ解決して修正する。

## セキュリティ境界

API Key は暗号化済みの既存値を継続使用する。調査記録、テスト出力、ログ及び画面へ API Key を保存しない。外部エラー本文はメッセージだけを最大 1000 文字の既存安全化処理へ渡す。

## 参照

- Backlog Developer API `Get Issue List`: https://developer.nulab.com/docs/backlog/api/2/get-issue-list/
- Backlog Developer API `Error Response`: https://developer.nulab.com/docs/backlog/error-response/
