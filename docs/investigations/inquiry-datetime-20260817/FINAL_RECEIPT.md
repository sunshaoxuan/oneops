# 最終調査レシート

## task_type

OneOps 問合支援の日時表示原因調査

## 要求別受入確認

| 初期要求 | 成果物 | 証拠 | 状態 |
|---|---|---|---|
| 更新日時と回答希望日が 00:00 になる理由を調査 | parser、Portal、テストの経路説明 | `investigation_report.md` | 合格 |
| 添付画像と指示文書をユーザー要求から分離 | 調査対象と要求の分離 | `investigation_report.md` 1章 | 合格 |
| 推測を避け、未確認点を明示 | evidence_missing の記録 | `evidence_index.md`、`investigation_report.md` 5章 | 合格 |
| コード変更時のテスト | 今回コード変更なし。既存テストを実行 | `test_results.md` | 合格 |

## 最終判定

原因は OneOps Gateway の日付専用値に対する時刻既定値 `00:00:00` であると、コードおよびテストから確認できた。実サイト原文に時刻が存在するかは未確認であり、修正要否の最終判断は `evidence_missing` の解消後に行う。

## 自己改善候補

再利用候補: 日時表示調査では、入力原文、parser の既定値、Portal formatter、テスト期待値、認証済み実値を分けて確認する手順。

候補 validator: 日付専用フィールドに時刻を推測付与する変更を検出し、表示項目の業務契約と照合する検査。

install_status: candidate only。正式 skill、validator、AGENTS.md は変更していない。

rollback: 本調査成果物ディレクトリを削除すれば調査記録以外のコード状態は変更されない。

evidence_paths: `app/gateway/inquiry-support-source.mjs`, `app/apps/portal-shell/src/InquirySupportPage.tsx`, `app/gateway/inquiry-support.test.mjs`, `docs/investigations/inquiry-datetime-20260817/`。
