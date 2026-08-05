# 実行コマンド

## 事前調査

1. `git fetch origin master`
2. `D:\nginx\runtime\node\pnpm.cmd view thinking-orbs version peerDependencies license repository dist-tags --json`
3. npm レジストリの `thinking-orbs@0.2.0` metadata 取得
4. npm パッケージの型定義と README 取得

## 実装及び検証

1. `D:\nginx\runtime\node\pnpm.cmd install --offline --frozen-lockfile --filter @one-ops/portal-shell...`
2. `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec vitest run src/ProgressOrb.test.tsx`
3. `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec tsc -b`
4. `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test`
5. `D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell build`
6. `D:\nginx\runtime\node\pnpm.cmd check`
7. `git diff --check`

## 実行環境確認

正式 HTTPS `https://192.168.20.54/` の認証済みワークベンチをブラウザーで確認し、デスクトップと 640px 狭幅画面を再読込した。DOM、コンソール及びスクリーンショットの結果を `test_results.md` に記録した。
