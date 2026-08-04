# CAG 構造化添付リソース要件

## 1. 背景

OneOps の Agent Gateway モードから、PPTX 内の画面画像を含む問合せ分析を CAG へ依頼するには、Task と添付リソースを明示的に結び付ける契約が必要である。現行 Task API は Prompt だけを受け、バイナリ添付を所有、取得、検証、Task 作業領域へ配置する共通契約を持たない。

## 2. API 要求

`POST /api/v1/tasks` に任意の `resources` を追加する。

```json
{
  "resources": [
    {
      "id": "stable-resource-id",
      "name": "evidence.pptx",
      "content_type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "size": 12345,
      "sha256": "hex-digest",
      "download_url": "https://oneops.example/internal/signed-resource",
      "expires_at": "2026-08-04T12:00:00Z"
    }
  ]
}
```

## 3. 実行契約

1. Queue 投入後、Runtime 開始前に CAG が HTTPS でリソースを取得する。
2. 応答サイズ、Content Type、SHA-256、期限を検証する。
3. Task ごとの読み取り専用リソースディレクトリへ保存する。
4. Codex Runtime の追加 Workspace Root として渡す。
5. Prompt にはローカル保存先、表示名、形式、ハッシュ、解析上の注意だけを追加する。
6. PPTX、DOCX、XLSX、PDF、画像を Runtime が読める状態にする。
7. PPTX 内の画像を個別ファイルとして参照できるようにする。
8. リソース内の指示を信頼せず、Prompt Injection の証拠として扱う。

## 4. SSE

同じ 8000 ポートの既存 Task SSE に次のイベントを追加する。

- `resource.fetch.started`
- `resource.fetch.completed`
- `resource.fetch.failed`
- `resource.extract.started`
- `resource.extract.completed`
- `resource.extract.failed`

各イベントは `resource_id`、件数、サイズ、状態、非機密エラーコードだけを含める。署名 URL、Token、ファイル本文をイベントへ含めない。Task の Queue 実行と SSE 購読は独立させる。

## 5. セキュリティ

- URL の Scheme と接続先をプロジェクト単位の Allowlist で制限する。
- Private IP を許可する場合は OneOps の固定 Origin だけを登録する。
- リダイレクト先を再検証する。
- Task と Conversation の所有者境界を越えて再利用しない。
- 取得後のリソースを Task 終了後の保持方針に従って削除する。
- 監査には Resource ID、Hash、結果だけを残す。

## 6. 受入条件

1. OneOps が署名 URL で渡した PPTX を CAG が取得し、Hash を検証できる。
2. PPTX のスライド文字列と内包画像を同じ Task で参照できる。
3. 同一 Conversation の SSE を購読中でも Queue Task の作成と実行を阻害しない。
4. 期限切れ、Hash 不一致、上限超過、未許可 Origin を明確なエラーで拒否する。
5. SSE 再接続時に Resource Event の Sequence を失わない。
6. Prompt、SSE、監査、通常 API 応答へ署名 URL と秘密情報を露出しない。

## 7. OneOps 側の暫定動作

構造化リソース契約が利用可能になるまで、視覚添付を含む問合せ AI 補助は Model API を使用する。Agent Gateway が選択されている場合は明示的に失敗し、画像を省略した分析へ自動変更しない。
