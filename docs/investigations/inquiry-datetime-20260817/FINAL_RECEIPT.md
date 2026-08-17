# 最終調査レシート

## task_type

OneOps 問合支援の日時表示原因調査

## 要求別受入確認

| 初期要求 | 成果物 | 証拠 | 状態 |
|---|---|---|---|
| 更新日時と回答希望日が 00:00 になる理由を調査 | parser、Portal、テストの経路説明 | `investigation_report.md` | 合格 |
| 添付画像と指示文書をユーザー要求から分離 | 調査対象と要求の分離 | `investigation_report.md` 1章 | 合格 |
| 推測を避け、未確認点を明示 | evidence_missing の記録 | `evidence_index.md`、`investigation_report.md` 5章 | 合格 |
| コード変更時のテスト | Gateway 43 件、Portal 274 件、Portal build を実行 | `test_results.md` | 合格 |

## 変更内容

`parseDateFromText` は時刻なしの入力を `YYYY-MM-DD` として保持し、時刻付き入力だけ ISO 日時へ変換するよう修正した。Portal の `dateTime` は日付専用値をローカル日付として表示し、`00:00:00` を表示しない。Gateway と Portal のテスト、Portal build を実行した。

## 最終判定

原因は OneOps Gateway の日付専用値に対する時刻既定値 `00:00:00` であると、コード、テスト、認証済み UPDS 原文から確認できた。修正後は日付専用値の精度を保持する。実データを表示した問合支援ページのブラウザー受入はログイン画面で停止しており、`evidence_missing` である。

## 自己改善候補

再利用候補: 日時表示調査では、入力原文、parser の既定値、Portal formatter、テスト期待値、認証済み実値を分けて確認する手順。

候補 validator: 日付専用フィールドに時刻を推測付与する変更を検出し、表示項目の業務契約と照合する検査。

install_status: candidate only。正式 skill、validator、AGENTS.md は変更していない。

rollback: 本調査成果物ディレクトリを削除すれば調査記録以外のコード状態は変更されない。

evidence_paths: `app/gateway/inquiry-support-source.mjs`, `app/apps/portal-shell/src/InquirySupportPage.tsx`, `app/gateway/inquiry-support.test.mjs`, `docs/investigations/inquiry-datetime-20260817/`。
