# 実行コマンド記録

1. `git fetch origin master`
2. `git status --short --branch`
3. `rg` による Home、個人タスク画面、摘要 API、要件文書の経路確認
4. `D:\nginx\runtime\node\node.exe --test gateway/personal-task.test.mjs`
5. `D:\nginx\runtime\node\pnpm.cmd exec tsc -b --pretty false`
6. `D:\nginx\runtime\node\pnpm.cmd exec vitest run src/personal-tasks.test.ts src/workbench-spacing.test.ts`
7. `D:\nginx\runtime\node\pnpm.cmd check`
8. `D:\nginx\runtime\node\pnpm.cmd test:operations`
9. `D:\nginx\runtime\node\node.exe --env-file=D:\nginx\app\.env.local .codex-work\home-scheduled-count\verify-summary.mjs`
10. Edge と Codex 内蔵 Browser による正式 HTTPS 画面確認
11. `git commit -m "ホームに個人タスクの予定件数を追加する"`
12. `git push origin master`

6 の初回実行は同時実行中の複数 Vitest Worker により Worker 起動待ちが時間切れとなった。資源解放後の再実行で 19 件が合格した。

10 は Edge で正式 OneOps タイトルまで確認した。認証済み DOM、Console、Screenshot の読み取りは時間切れとなり、Codex 内蔵 Browser は HTTPS 遷移を完了できなかった。

11 は Commit `febc379` を作成し、12 は同 Commit を `origin/master` へ送信した。
