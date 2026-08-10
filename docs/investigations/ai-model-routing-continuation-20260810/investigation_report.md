# AI助手 Task Routing と会話内 Task 継続の調査報告

## 結論

AI助手は 1 つの CAG Conversation を維持したまま、Task Attempt ごとに Model と Reasoning Effort を選択できる。OneOps が業務 Task の分類、Task Summary、Fingerprint、Tier と再実行昇格を決定し、CAG が選択結果を監査保存して Codex app-server へ適用する責任分担とした。

## 現行調査

実装前の OneOps AI助手は CAG Task へ Project、Prompt、Conversation ID、Runtime Profile だけを送信していた。`GENERAL` と `SIMPLE` の Model 設定は AI助手の実行経路で参照されていなかった。CAG は Codex app-server の Thread を Conversation ごとに継続していたが、Thread Start、Thread Resume、Turn Start へ Model を指定していなかった。

OpenAI 公式 Documentation は `thread/start` と `thread/resume` が Model 上書きを受け、`turn/start` が Model と Effort を受けることを示している。同じ Thread を再開した時も履歴は維持される。

参照先は [Codex App Server](https://learn.chatgpt.com/docs/app-server) とする。

## 実装した責任境界

| 領域 | OneOps | CAG |
|---|---|---|
| Task 分類 | 実施 | 受信値を監査保存 |
| 会話内 Task Summary | 生成、継続、更新 | Prompt と Task Metadata を保存 |
| Task Fingerprint | SHA-256 で生成 | 受信値を監査保存 |
| Tier 選択 | `SIMPLE` 又は `GENERAL` | 選択済み Model を実行 |
| 再実行昇格 | 同一 Fingerprint の 2 回目に一度だけ昇格 | Attempt と理由を保存 |
| Conversation | 所有関係を検証 | Codex Thread を継続 |
| Runtime | Model 設定物理 ID を選択 | Model と Effort を app-server へ適用 |

## 初期 Routing Policy

| Task Class | 初回 Tier | 自動昇格 |
|---|---|---|
| `TRANSLATION` | `SIMPLE` | 同一 Fingerprint 再実行時に `GENERAL` |
| `SUMMARIZATION` | `SIMPLE` | 同上 |
| `CLASSIFICATION` | `SIMPLE` | 同上 |
| `SIMPLE_ASSIST` | `SIMPLE` | 同上 |
| `COMPLEX_ANALYSIS` | `GENERAL` | 追加昇格なし |
| `INQUIRY_ANALYSIS` | `GENERAL` | 追加昇格なし |
| `AGENT_OPERATION` | `GENERAL` | 追加昇格なし |

## Task Summary 継続

初回の明示指示から Task Class、目的要約、翻訳先言語、制約を生成する。新しい作業が明示されない後続入力は直前 Summary を継続する。翻訳の後に本文だけを入力した場合と「続けて翻訳」と入力した場合の双方で、翻訳先言語と書式制約を維持する。

Task Summary は `[ONEOPS_TASK_STATE_V1]` 境界へ保存する。履歴表示は従来どおり `[USER_MESSAGE]` 以降だけを利用者入力として表示するため、内部 Routing 情報を一般利用者へ表示しない。

## 制約

初期分類器は追加 Model 呼出しを行わない決定的規則である。曖昧な自然言語 Task の分類精度は今後の評価 Dataset で測定する。Model の利用可否は CAG Host の Codex `model/list` と契約する必要がある。現行の正式設定値は `gpt-5.6-luna` と `gpt-5.6-terra` である。
