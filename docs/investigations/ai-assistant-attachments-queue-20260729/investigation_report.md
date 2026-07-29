# AI アシスタント添付ファイルと待機 Task 調査

調査日: 2026-07-29

## 1. 調査範囲

OneOps の AI アシスタントから複数ファイルを CAG へ渡す方法、CAG の待機 Task と SSE の関係、大容量貼り付けの取扱いを調査した。`D:\workspace\cag` のソースコードと稼働中の 8000 ポートは読み取りだけに使用した。

## 2. CAG 公開 API

稼働中 CAG の OpenAPI は `POST /api/v1/tasks` を JSON 要求として定義している。Task 作成項目は Project、Prompt、Conversation、実行 Profile、Knowledge 関連設定であり、multipart または汎用添付ファイル ID は定義されていない。

Task は `queued`、`running`、終端状態を持つ。`GET /api/v1/tasks/{id}/events` と `GET /api/v1/conversations/{id}/events` は Task 実行とは独立した SSE 購読 API である。OneOps は待機 Task が存在することを入力欄全体の利用禁止条件にしない。

## 3. CAG 実行領域

CAG の Task Executor は Task ごとに分離した Git 作業領域を作成する。Codex App Server の実行ルートは Task の作業領域と明示的な追加ルートに限定される。OneOps の `D:\nginx\runtime` を絶対パスとして Prompt に記載する方式では、CAG が安定して読み取れる保証がない。

## 4. 採用方式

OneOps Gateway を Task 用ファイルの提供元とする。

1. 認証済み利用者がファイルを OneOps へアップロードする。
2. OneOps は利用者物理 ID、CAG Conversation ID、ファイル ID、SHA-256 を実行用領域へ保存する。
3. Task 作成時にファイルを Task ID へ関連付ける。
4. CAG Prompt へ、Gateway 内部 URL、有効期限、HMAC 署名、SHA-256 を含む添付境界を追加する。
5. CAG は実行開始後に内部 URL から取得し、ハッシュを照合して解析する。
6. OneOps の履歴表示は添付メタデータだけを復元し、署名 URL をブラウザーへ返さない。

Gateway は `127.0.0.1:8092` で待ち受けるため、CAG 用 URL は同一ホスト内部から利用する。署名の有効期間は 72 時間、実体の保持期間は 7 日とする。

## 5. 大容量貼り付け

閾値は UTF-8 で 32 KiB とする。閾値を超えるプレーンテキストはブラウザーで `.txt` ファイルへ変換し、通常の添付アップロードへ統合する。日本語などの多バイト文字を正しく制御するため、文字数ではなく `TextEncoder` のバイト数を使用する。

## 6. 制約

現行 CAG に汎用添付 API が追加された場合は、OneOps の署名 URL 方式と CAG ネイティブ添付 ID の移行を別途評価する。今回の実装は CAG のコード、設定、実行プロセスを変更しない。
