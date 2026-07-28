# 実行コマンド

## 調査

```powershell
git fetch origin master --tags
git status --short
git rev-list --left-right --count origin/master...HEAD
rg -n "activeNavigation|pushState|replaceState|popstate|location.pathname" app/apps/portal-shell/src
rg -n "try_files" conf/nginx.conf
```

## 対象テスト

```powershell
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec vitest run src/portal-navigation.test.ts src/layout.test.ts
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell exec tsc -b
```

## 全体検査

```powershell
D:\nginx\runtime\node\pnpm.cmd check
```

## 公開後確認

Chrome で問合支援、システム管理の子機能、別の第 1 階層画面を順に開き、URL、再読み込み、戻る、進む、コンソールを確認する。
