# 実行コマンド

更新日: 2026-08-03

本調査では読取コマンド、文書検証、既存テスト、既存フロントエンドの本番ビルドを使用しました。秘密情報を表示するコマンドは実行していません。

~~~powershell
git status --short
git branch --show-current
git remote -v
git fetch origin master
git rev-parse HEAD
git rev-parse origin/master
~~~

~~~powershell
rg --files docs
rg -n "^#{1,4} " docs/*.md
rg -n "^export (async )?function " app/packages/api-client/src/index.ts
rg -n "^CREATE TABLE" app/db/migrations
~~~

~~~powershell
rg -n "request\.method|url\.pathname" app/gateway
rg -n "BEGIN|COMMIT|ROLLBACK|FOR UPDATE|advisory|revision" app/gateway
rg -n "setInterval|new Map|new Set" app/gateway
rg -n "encryptSensitiveValue|decryptSensitiveValue" app/gateway
~~~

~~~powershell
Get-Content -Raw app/gateway/builder-worker.mjs
Get-Content app/builder/oneops_worker.py
Get-Content -Raw conf/nginx.conf
Get-Content -Raw app/scripts/publish-portal.ps1
~~~

~~~powershell
D:\nginx\runtime\node\pnpm.cmd test
D:\nginx\runtime\node\pnpm.cmd build
D:\nginx\runtime\node\node.exe --test gateway/project-language.test.mjs
git diff --check
~~~

文書構造の検証では、章数、コードフェンスの対応、Mermaid ブロック数、プロジェクト規約で禁止された定型表現を PowerShell で確認しました。結果は <code>test_results.md</code> に記録します。
