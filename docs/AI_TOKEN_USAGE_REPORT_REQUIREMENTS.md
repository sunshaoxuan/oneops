# AI Token使用量レポート要件

## 目的

管理者が AI Provider の利用量をユーザー単位で把握し、合計 Token 使用量の多い順に確認できることを目的とする。

## 権限

* 第一階層のレポート表示には `reports.read` を要求する。
* AI Token使用量レポートの画面及び API には `reports.ai-token-usage.read` を要求する。
* 新規環境の初期権限種子では `reports.ai-token-usage.read` を `SYSTEM_ADMIN` だけへ付与する。
* 保存済みロールはMigration再実行で変更せず、運用環境への初回導入時に管理者ロールへ一度だけ明示付与する。

## 呼出単位の記録

* AI Provider へ送信した一回の Request を一件として記録する。
* AIアシスタントの意図分析と回答生成は別の呼出として記録する。
* 個人タスクから起動した AIアシスタントも同じ呼出記録へ保存する。
* 問合支援の Model API と Agent Gateway 分析も同じ呼出記録へ保存する。
* 開始、完了、失敗及び取消の終端状態を保存する。
* Provider が Usage を返した場合は入力、出力、Cached入力、推論及び合計 Token を保存する。
* Provider が Usage を返さない場合も呼出件数へ含め、Usage未取得として識別する。
* 利用者との強い関連は `users.id` 外部キーで保持し、通常画面には物理 ID を表示しない。

## 集計と表示

* 初期期間は直近30日とし、直近7日、30日、90日及び全期間を選択できる。
* 合計 Token の降順、同値の場合は呼出回数の降順で順位を決める。
* 順位、表示名、Username、呼出回数、Usage取得件数、入力、出力、Cached、推論、合計 Token 及び最終呼出日時を表示する。
* 画面全体へ横スクロールを発生させず、列が収まらない場合は表内部だけを横スクロールする。

## API

`GET /api/work-center/v1/reports/ai-token-usage?days=7|30|90|all`

不正な期間は `400 AI_TOKEN_USAGE_PERIOD_INVALID`、権限不足は `403 PERMISSION_DENIED` とする。
