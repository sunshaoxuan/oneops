# 試験結果

| 対象 | 結果 | 証拠 |
|---|---|---|
| Portal Auth UI | 対象テスト 6 件成功 | `D:\nginx\runtime\node\pnpm.cmd exec vitest run src/auth-ui.test.ts` |
| Portal パッケージ全量 | 234 件成功、1 件失敗、1 Suite 読み込み失敗 | 並行作業の AI Assistant 変更に起因する失敗。登録停止対象の認証 UI は成功 |
| Gateway Auth Controller | 12 件成功 | `D:\nginx\runtime\node\node.exe --test gateway/auth-controller.test.mjs` |
| Gateway 全量 | 289 件成功、1 件失敗 | `D:\nginx\runtime\node\pnpm.cmd test`。失敗は並行作業の `046_create_ai_token_usage_report.sql` のロール権限種子条件不足 |
| Builder | 14 件成功 | `D:\nginx\runtime\python\python.exe -m unittest builder/oneops_worker_test.py` |
| Spring Backend | 41 件成功、8 件 Skip | `app\backend\mvnw.cmd test`。DB 統合条件による Skip |
| Portal Production Build | 成功 | `D:\nginx\runtime\node\pnpm.cmd build` |
| Spring Production Build | 成功 | 配信スクリプトの rolling package |
| Gateway 公開登録 API | 403、`REGISTRATION_DISABLED` | `http://127.0.0.1:8092/api/work-center/v1/auth/register` |
| 正式 Browser | 合格 | `https://192.168.20.54/`、登録入口なし、Console error/warning 0 件 |
| Screenshot | 保存済み | `docs/evidence/disable-user-registration-20260812.png` |
| 静的 Portal 配信 | 成功 | `delivery_succeeded reason=disable-user-registration-20260812-static` |

## 範囲確認

管理者ユーザー追加 API と Windows SSO 自動作成は変更していない。既存コード経路と対象試験で継続利用の境界を確認した。

## 再検証結果

8092 の Health は HTTP 200、`status: UP`、Backend `0.18.20`、`upstream.online: true` だった。公開登録 API は HTTP 403、Code `REGISTRATION_DISABLED`、Message `Self-registration is temporarily disabled` を返した。

## 配信制限

通常の rolling 配信は Nginx reload 時に `OpenEvent("Global\\ngx_reload_28448") failed (5: Access is denied)` で停止した。Nginx 設定検査、Gateway 健康確認、既存サービスの稼働は正常であり、Gateway の変更は既存の常時配信経路で実行時応答を確認した。静的 Portal は `SkipGatewayRestart` 配信で `delivery_succeeded` を確認し、HTTPS 画面へ反映した。
