# 実行コマンド

```powershell
pnpm --dir apps/portal-shell add react-markdown@10.1.0 remark-gfm@4.0.1 --save-exact
$env:PATH = 'D:\nginx\runtime\node;' + $env:PATH
D:\nginx\runtime\node\pnpm.cmd check
powershell.exe -NoProfile -ExecutionPolicy Bypass -File app/scripts/publish-portal.ps1 -Reason ai-assistant-open-inquiry-v0.6.5-retry2
curl.exe -k -sS -D - https://192.168.20.54/ -o NUL
curl.exe -k -sS https://192.168.20.54/api/work-center/v1/health
```

ブラウザーでは既存のログイン済み OneOps Session を使用し、問合支援の浮動 AI アシスタントと `/ai-assistant` の全画面を確認した。保存済み Conversation の Markdown 表を検証対象にし、CAG へ新しい Task は送信していない。さらに AI アシスタントの No. 94056・Q5 参照から問合支援へ遷移し、検索なしで詳細ドロワーと Q5 を復元した。

最終再検査の最初の `pnpm check` はシステム PATH に Node.js がなく、テスト開始前に終了した。プロジェクト同梱 Node.js を PATH へ追加して同じ検査を再実行し、全件成功した。
