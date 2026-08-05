# 実行コマンド記録

1. `git fetch origin master`
2. `rg` と `Get-Content` で OneOps Gateway、builder worker、Hyper-V 宿主制御、droneci 実装を比較
3. `D:\nginx\runtime\node\pnpm.cmd check`
4. `D:\nginx\runtime\python\python.exe -m unittest builder/oneops_worker_test.py`
5. `D:\nginx\runtime\python\python.exe -m py_compile builder/host_standalone_console.py builder/oneops_worker.py`
6. `build_terminal_action('stop')` で受入用停止操作
7. builder worker のページと `/api/build-terminal/status` を実行
8. `8092`、`8093`、HTTPS の Runtime 健康確認
9. 受入観測区間の Gateway log から関連 502 を検索
10. `build_terminal_action('start')` で復旧操作
11. `build_terminal_status()` で `running` と資源値を確認
