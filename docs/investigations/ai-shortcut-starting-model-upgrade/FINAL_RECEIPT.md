# 最終受領記録

## 最終受入一覧

| 項目 | 成果物 | 検証証拠 | 状態 |
|---|---|---|---|
| 各ショートカットに開始 Model を設定できる | Migration 039、管理画面、管理 API | 有効 12 件中 12 件が Model 外部キー設定済み | 合格 |
| SIMPLE 用途と自動昇格契約を削除する | Model Repository、Task Routing、API | Gateway 226 件、DB の SIMPLE 0 件 | 合格 |
| 汎用 Model を複数管理できる | Model 設定 CRUD、部分一意制約、管理画面 | Gateway、Portal、Migration | 合格 |
| 推理レベルと速度を表示する | Model 一覧、クイックアシスタント選択肢、会話空状態 | Portal 190 件、Build | 合格 |
| Model と推理強度を個別設定する | Migration 040、管理 API、階層 Dropdown | Gateway 228 件、Portal 195 件、DB 12 件 | 合格 |
| Model 選択時に推理強度の既定値を取り込み個別変更できる | Form 状態更新、クイックアシスタント固有列 | TypeScript、Portal 回帰試験 | 合格 |
| Endpoint と API Key から Model 一覧を取得して選択する | Model discovery API、Select、保存時再確認 | Gateway、Portal 回帰試験 | 合格 |
| Session と後続 Task が開始 Model を継続する | Session Model スナップショット、Routing v2 | Routing 単体試験、Gateway Task 試験 | 合格 |
| INQUIRY 専用契約を維持する | Inquiry Default Model 解決 | 問合支援 Gateway 試験 | 合格 |
| 日文要件文書と CHANGELOG を更新する | AI 設定、AI助手、クイックアシスタント、外部 Task、問合支援、CHANGELOG | 文書言語試験 | 合格 |
| 単体試験、Build、Migration 再実行を確認する | Test、Build、DB、Runtime | `test_results.md` | 合格 |
| 0.17.1 を正式 Runtime へ配信する | SYSTEM Continuous Delivery | Health `UP`、version 0.17.1、HTTPS 200 | 合格 |
| Browser、Console、Screenshot を確認する | 正式 HTTPS UI | サイトと Console 0 件は確認。Windows アカウント確認が完了せず対象画面と Screenshot は未確認 | evidence_missing |
| master へ commit、push し origin/master と一致する | Git | 第 1 実装 commit `a412f92` は push 済み。訂正実装は最終工程で確認 | 確認中 |

## 最終受入結果

対象設定画面と Screenshot の証拠が取得できていないため、初衷級最終受入は未合格とする。自動試験、Build、Migration、0.17.1 正式配信、Runtime、文書及び正式サイトの Console 確認は合格している。
