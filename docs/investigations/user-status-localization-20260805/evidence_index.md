# 証拠索引

| ID | 主張 | 証拠 | 確度 | 制約 |
| --- | --- | --- | --- | --- |
| E-01 | 原因は表示層による内部値の直接表示 | `app/apps/portal-shell/src/IdentityManagementPage.tsx` の変更前差分 | 高 | なし |
| E-02 | 日本語表示は承認待ち、有効、停止 | `IdentityManagementPage.tsx`、`auth-ui.test.ts` | 高 | 正式 Browser 表示は検証待ち |
| E-03 | API と DB の内部値を維持 | Select の `value` と状態型、`USER_STATUS_DISPLAY_REQUIREMENTS.md` | 高 | 保存操作の正式 Browser 確認は対象外 |
| E-04 | 自動回帰が合格 | `test_results.md`、2026-08-05 実行結果 | 高 | DB 依存 7 件は条件付き Skip |
| E-05 | 正式 Portal が 0.9.2 Asset を配信 | HTTPS `/` の Asset 名、Build 出力 | 高 | なし |
| E-06 | 正式 Backend が 0.9.2 で稼働 | `/api/work-center/v1/health` | 高 | なし |
| E-07 | 正式 Browser の可視文言、Console、Layout | 検証証拠未取得 | 低 | Browser 制御接続の復旧が必要 |
| E-08 | 編集 Modal で対象利用者を識別できる実装 | 動的 Modal Title、`user-editor-context`、三言語 `editingUser` | 高 | 正式 Browser 表示は検証待ち |
| E-09 | 同名利用者を補助識別情報で区別できる | ユーザー名、メール、Windows Domain Account の参照表示 | 高 | 実データでの正式 Browser 確認は検証待ち |
| E-10 | 狭幅時に識別領域を縦配置する | `styles.css` の 680px Media Query | 高 | 実寸 Browser 計測は検証待ち |
