# 証拠一覧

| 主張 | 証拠 | 信頼度 | 制限 |
|---|---|---|---|
| 日付だけの入力は 00:00:00 になる | `app/gateway/inquiry-support-source.mjs:96-105` | high | 実サイト原文は未取得 |
| 一覧の更新日時と回答希望日は同じ parser を通る | `app/gateway/inquiry-support-source.mjs:284-322` | high | なし |
| Portal は ISO 値をローカル日時表示するだけ | `app/apps/portal-shell/src/InquirySupportPage.tsx:722-730` | high | ブラウザー実画面の今回の再確認は未実施 |
| 回答希望日の日付だけを 00:00 とする既存仕様 | `app/gateway/inquiry-support.test.mjs:807-838` | high | テストフィクスチャであり実サイト値ではない |
| 添付画像で両列が 00:00:00 と表示される | ユーザー添付画像 `codex-clipboard-24bc0676-59bd-4bb9-89a5-6dc4831a9ee2.png` | medium | 原文 HTML、認証済み実サイト状態がない |
| 実サイトが時刻を返すか | 認証済み Gateway 経路で取得した先頭 5 行。更新日時と回答希望日は日付だけ | high | 別条件、詳細画面、別契約の形式は未確認 |
| 日付専用値を 00:00 と表示しない修正 | `app/gateway/inquiry-support-source.mjs`、`app/apps/portal-shell/src/InquirySupportPage.tsx` | high | 認証済み対象画面のブラウザー表示は evidence_missing |
