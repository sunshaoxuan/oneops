# AI ショートカット開始モデル拡張 調査報告

## 調査目的

各ショートカットが開始時に使用する Model と推理強度を明示し、AI助手の汎用 Model を複数管理できる現行契約へ統一する。速度は Model の説明属性として表示する。

## 調査中の論点

1. `SIMPLE` 用途と自動昇格ロジックの完全な削除範囲
2. `GENERAL` の複数 Model 化に必要な物理 ID、外部キー、API 契約
3. ショートカット、Session、Task が保持する開始 Model の関係
4. `INQUIRY` 専用 Model 契約の維持範囲
5. 能力レベルと速度の定義及び表示方法
6. ChatGPT 型の階層設定メニューとクイックアシスタント固有値の保存境界

## 確認結果

1. 現行実装は `SIMPLE` と `GENERAL` を Task 分類と同一入力の再実行回数で切り替えていた。
2. クイックアシスタントの継続指示は Session 作成時にスナップショット化されていたが、開始 Model は Session に保存されていなかった。
3. `ai_model_settings` は用途単位の一意制約を持ち、`GENERAL` を複数登録できなかった。
4. `INQUIRY` は問合支援専用として Agent Gateway への自動切替を禁止する独立契約を持つ。
5. Model 接続試験の `latencyMs` は `GET {Endpoint}/models` の所要時間であり、生成時の Time To First Token 又は Token Throughput ではない。

## 外部公式資料

1. OpenAI の Model Picker は応答速度と推理強度を同時に選択できる構成を採用している。参照: https://help.openai.com/en/articles/6825453-chatgpt-release-notes
2. Microsoft Foundry は Model 比較で品質、Latency、Throughput を別の指標として扱い、用途別評価を推奨している。参照: https://learn.microsoft.com/en-us/azure/foundry/concepts/model-benchmarks

## 採用設計

1. `GENERAL` を複数件登録可能な Model 一覧へ変更する。
2. 各 Model に管理用表示名、推理レベル、速度表示、表示順、有効状態、既定状態を持たせる。
3. 推理レベルは `XHIGH`、`HIGH`、`MEDIUM` とし、CAG Task の `effort` へ渡す。
4. 速度は `FAST`、`MEDIUM`、`SLOW` の管理者設定値として表示する。接続試験時間は別の実測値として表示する。
5. 各クイックアシスタントは有効な `GENERAL` Model の物理 ID を外部キーで保持する。
6. Session は開始 Model の物理 ID、Model ID、推理レベル及び速度をスナップショット化し、全 Task で継続する。
7. `SIMPLE`、Task 分類による Model 切替及び再実行時の自動昇格を削除する。
8. `INQUIRY` は問合支援専用の 1 件として維持する。
9. クイックアシスタントは `starting_reasoning_effort` を Model 設定から独立して保持する。速度は Model の `speed_level` を表示し、Session 作成時にスナップショット化する。
10. Model 選択時は Model 設定の推理強度を既定値として取り込み、管理者がクイックアシスタント単位で変更できる。
11. 管理画面は Model と推理強度の 2 行を持つ階層メニュー、選択済み表示及び現在設定の要約を使用する。
12. Model ID は Endpoint と API Key で取得した `/models` 一覧から選択し、保存時にサーバー側で存在を再確認する。

## 状態

0.17.1 の第 1 実装 commit `a412f92` は origin/master へ反映済みである。推理強度への訂正、標準矢印 1 個への統一、Model discovery、一覧 Select、保存時再確認は自動試験、Migration、正式配信及び Runtime 検証を完了した。正式サイトは Browser で開き、Console warning と error は 0 件だった。Windows アカウント確認が完了せず管理画面へ到達できなかったため、修正後の複合設定メニューと Model 一覧の実画面確認及び Screenshot は `evidence_missing` とする。
