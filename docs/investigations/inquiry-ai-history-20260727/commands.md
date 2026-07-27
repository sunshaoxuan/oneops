# 実行コマンド

## 単体テストとビルド

```powershell
D:\nginx\runtime\node\node.exe --test gateway/inquiry-support.test.mjs gateway/operation-audit.test.mjs
D:\nginx\runtime\node\pnpm.cmd --filter @one-ops/portal-shell test
D:\nginx\runtime\node\pnpm.cmd check
```

## 公開

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\nginx\app\scripts\publish-portal.ps1 -AppRoot D:\nginx\app -SkipChecks -Reason inquiry-ai-history-v0.2.4-final
```

`publish-portal.ps1` は Nginx 設定、Gateway 再起動後の health、HTTPS 入口を検証する。

## ブラウザー確認

1. 「AI 対応履歴あり」を選択して検索する。
2. 履歴のある問合せを開き、履歴領域が閉じていることを確認する。
3. 履歴領域を展開し、件数、Provider、Model、状態、Token を確認する。
4. 単一履歴を展開し、分析、根拠、返信案を確認する。
5. ブラウザーコンソールを確認する。
